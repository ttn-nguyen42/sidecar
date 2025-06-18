import asyncio
from datetime import datetime
import logging
import threading
from typing import Callable
from pydantic import BaseModel
from requests import Session
from services.config import CollectionKey
from services.models import Note
from setup import Registry
from services.embed import embed_service

logger = logging.getLogger(__name__)


class CreateNoteRequest(BaseModel):
    title: str
    content: str

    def to_model(self) -> Note:
        return Note.build(self.title, self.content)


class UpdateNoteRequest(BaseModel):
    title: str
    content: str

    def to_model(self) -> Note:
        return Note.build(self.title, self.content)


class NotesService():
    def __init__(self, registry: Registry):
        self.registry = registry
        return

    def create(self, request: CreateNoteRequest) -> int:
        with self.registry.get_session() as session:
            note = request.to_model()
            note.is_dirty = True

            session.add(note)
            session.commit()
        return note.id

    def delete(self, id: int):
        with self.registry.get_session() as session:
            note = self._get(session, id)
            if note is None or note.for_removal:
                raise ValueError(f"Note {id} not found")
            note.for_removal = True
            session.commit()
        return

    def list(self) -> list[Note]:
        with self.registry.get_session() as session:
            return session.query(Note) \
                .filter(Note.for_removal == False) \
                .order_by(Note.created_at.desc()) \
                .all()

    def get(self, id: int) -> Note:
        with self.registry.get_session() as session:
            note = self._get(session, id)
            if note is None or note.for_removal:
                raise ValueError(f"Note {id} not found")
            return note

    def update(self, id: int, request: UpdateNoteRequest):
        with self.registry.get_session() as session:
            note = self._get(session, id)
            if note is None or note.for_removal:
                raise ValueError(f"Note {id} not found")

            note.title = request.title
            note.content = request.content

            note.is_dirty = True
            session.commit()
        return

    def _get(self, session: Session, id: int) -> Note:
        return session.query(Note) \
            .filter(Note.id == id) \
            .first()


class DocumentMetadata(BaseModel):
    id: int
    title: str
    created_at: datetime

    def to_dict(self) -> dict[str, any]:
        return {
            "id": self.id,
            "title": self.title,
            "created_at": self.created_at.isoformat(),
        }

    def from_dict(self, data: dict[str, any]) -> 'DocumentMetadata':
        return DocumentMetadata(
            id=data["id"],
            title=data["title"],
            created_at=datetime.fromisoformat(data["created_at"]),
        )


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

        self._clean_dirty_notes([note.id for note in notes])

        tasks = [self._index_note(note) for note in notes]
        if tasks:
            await asyncio.gather(*tasks)
        self._set_completed(notes)

    async def _fetch_need_delete_notes(self):
        ids = []

        with self.registry.get_session() as session:
            notes = session.query(Note) \
                .filter(Note.is_dirty == True) \
                .all()
            if len(notes) == 0:
                logger.debug("No dirty notes to delete")
                return

            ids = [note.id for note in notes]

            session.query(Note) \
                .filter(Note.id.in_(ids)) \
                .delete(synchronize_session=False)

            session.commit()

        self._clean_dirty_notes(ids)

    def _clean_dirty_notes(self, notes: list[Note]):
        self.vect_store.delete(ids=[note.id for note in notes])

    def _find_dirty_notes(self):
        with self.registry.get_session() as session:

            return session.query(Note) \
                .filter(Note.is_dirty == True) \
                .all()

    async def _index_note(self, note: Note):
        logger.debug(f"Indexing note {note.id}")

        parts = embed_service.split_text(text=note.content)
        meta = DocumentMetadata(
            id=note.id,
            title=note.title,
            created_at=note.created_at,
        )

        ids = await self.vect_store.aadd_texts(texts=parts, metadatas=[meta.to_dict()])
        logger.info(f"Indexed note {note.id} with {len(ids)} parts")

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
            session.commit()

    def stop(self):
        if self._thread is not None:
            self._is_cancel = True

            self._thread.join()
            self._thread = None
