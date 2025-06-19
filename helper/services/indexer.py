import asyncio
import threading
from typing import Callable
from services.config import CollectionKey
from services.embed import embed_service
from services.models import Note
from services.notes import DocumentMetadata
from setup import Registry
import logging

logger = logging.getLogger(__name__)


class DocumentIndexer:
    def __init__(self, registry: Registry):
        self.registry = registry
        self._thread = None
        self.vect_store = registry.get_notes_vector_db(
            CollectionKey.NOTES_INDEXED)
        self._is_cancel = False
        return

    def start(self):
        self._thread = threading.Thread(
            target=self._loop, name="DocumentIndexer", args=(lambda: self._is_cancel,))
        self._thread.start()

    def _loop(self, is_cancel: Callable[[], bool]):
        asyncio.run(self._run_loop(is_cancel))

    async def _run_loop(self, is_cancel: Callable[[], bool]):
        while True:
            try:
                if is_cancel():
                    break

                await self._fetch_need_delete_notes()
                await self._fetch_need_index_notes()

                if is_cancel():
                    break

                await asyncio.sleep(10)
            except Exception as e:
                logger.error(f"Error in _run_loop: {e}", exc_info=True)
                await asyncio.sleep(10)

    async def _fetch_need_index_notes(self):
        notes = self._find_dirty_notes()
        if len(notes) == 0:
            logger.debug("No dirty notes to index")
            return

        vector_ids = []
        for note in notes:
            vector_ids.extend(note.vector_ids)

        if len(vector_ids) > 0:
            self._clean_dirty_notes(vector_ids=vector_ids)

        tasks = [self._index_note(note) for note in notes]
        if tasks:
            await asyncio.gather(*tasks)

        self._set_completed(notes)

    async def _fetch_need_delete_notes(self):
        vector_ids = []
        note_ids = []

        with self.registry.get_session() as session:
            notes = session.query(Note) \
                .filter(Note.for_removal == True) \
                .all()

            if len(notes) == 0:
                logger.debug("No dirty notes to delete")
                return

            for note in notes:
                vector_ids.extend(note.vector_ids)
                note_ids.append(note.id)

            session.query(Note) \
                .filter(Note.id.in_(note_ids)) \
                .delete(synchronize_session=False)

            session.commit()

        if len(vector_ids) > 0:
            self._clean_dirty_notes(vector_ids=vector_ids)

    def _clean_dirty_notes(self, vector_ids: list[str]):
        self.vect_store.delete(ids=vector_ids)

    def _find_dirty_notes(self):
        with self.registry.get_session() as session:

            return session.query(Note) \
                .filter(Note.is_dirty == True) \
                .all()

    async def _index_note(self, note: Note) -> list[str]:
        logger.debug(f"Indexing note {note.id}")

        parts = embed_service.split_text(text=note.content)
        meta = DocumentMetadata(
            id=note.id,
            title=note.title,
            created_at=note.created_at,
        )

        ids = await self.vect_store.aadd_texts(texts=parts, metadatas=[meta.to_dict()])
        logger.info(f"Indexed note {note.id} with {len(ids)} parts")

        note.vector_ids = ids
        return ids

    async def _delete_notes(self, notes: list[Note]):
        with self.registry.get_session() as session:
            ids = [note.id for note in notes]

            session.query(Note) \
                .filter(Note.id.in_(ids)) \
                .delete(synchronize_session=False)

            logger.info(f"Deleted {len(ids)} notes")
            session.commit()

    def _set_completed(self, notes: list[Note]):
        with self.registry.get_session() as session:
            for note in notes:
                note.is_dirty = False
                session.add(note)
            session.commit()

    def stop(self):
        if self._thread is not None:
            self._is_cancel = True

            self._thread.join()
            self._thread = None
