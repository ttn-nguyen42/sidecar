import asyncio
import threading
from typing import Callable
from services.kanban import TaskMetadata
from services.config import CollectionKey
from services.embed import embed_service
from services.models import KanbanBoards, Note, Task, TaskPriority
from services.notes import DocumentMetadata
from setup import Registry
import logging

logger = logging.getLogger(__name__)


class DocumentIndexer:
    def __init__(self, registry: Registry):
        self.registry = registry
        self._thread = None
        self.notes_vect = registry.get_notes_vector_db(
            CollectionKey.NOTES_INDEXED)
        self.tasks_vect = registry.get_tasks_vector_db(
            CollectionKey.TASKS_INDEXED)
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

                await self._fetch_need_delete_tasks()
                await self._fetch_need_index_tasks()

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

    async def _fetch_need_index_tasks(self):
        tasks = self._find_dirty_tasks()
        if len(tasks) == 0:
            logger.debug("No dirty tasks to index")
            return

        vector_ids = []
        for task in tasks:
            vector_ids.extend(task.vector_ids)

        if len(vector_ids) > 0:
            self._clean_dirty_tasks(vector_ids=vector_ids)

        routines = [self._index_task(task) for task in tasks]
        if routines:
            await asyncio.gather(*routines)

        self._set_completed(tasks)

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

    async def _fetch_need_delete_tasks(self):
        vector_ids = []
        task_ids = []

        with self.registry.get_session() as session:
            tasks = session.query(Task) \
                .filter(Task.for_removal == True) \
                .all()

            if len(tasks) == 0:
                logger.debug("No dirty tasks to delete")
                return

            for task in tasks:
                vector_ids.extend(task.vector_ids)
                task_ids.append(task.id)

            session.query(Task) \
                .filter(Task.id.in_(task_ids)) \
                .delete(synchronize_session=False)

            session.commit()

        if len(vector_ids) > 0:
            self._clean_dirty_tasks(vector_ids=vector_ids)

    def _clean_dirty_notes(self, vector_ids: list[str]):
        self.notes_vect.delete(ids=vector_ids)

    def _clean_dirty_tasks(self, vector_ids: list[str]):
        self.tasks_vect.delete(ids=vector_ids)

    def _find_dirty_notes(self):
        with self.registry.get_session() as session:
            return session.query(Note) \
                .filter(Note.is_dirty == True) \
                .all()

    def _find_dirty_tasks(self):
        with self.registry.get_session() as session:
            return session.query(Task) \
                .filter(Task.is_dirty == True) \
                .all()

    async def _index_note(self, note: Note) -> list[str]:
        logger.debug(f"Indexing note {note.id}")

        parts = embed_service.split_text(text=note.content)
        meta = DocumentMetadata.from_model(note=note)

        ids = await self.notes_vect.aadd_texts(texts=parts, metadatas=[meta.to_dict()])
        logger.info(f"Indexed note {note.id} with {len(ids)} parts")

        note.vector_ids = ids
        return ids

    async def _index_task(self, task: Task):
        logger.debug(f"Indexing task {task.id}")

        title_parts = embed_service.split_text(text=task.title)
        description_parts = embed_service.split_text(text=task.description)

        meta = TaskMetadata.from_model(task)

        vector_ids = []
        vector_ids.extend(await self.tasks_vect.aadd_texts(texts=title_parts, metadatas=[meta.to_dict()]))
        vector_ids.extend(await self.tasks_vect.aadd_texts(texts=description_parts, metadatas=[meta.to_dict()]))

        task.vector_ids = vector_ids
        return vector_ids

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
