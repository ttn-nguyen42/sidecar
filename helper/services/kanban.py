from collections import defaultdict
from datetime import datetime
import logging
from typing import Union

from pydantic import BaseModel
from setup import Registry
from services.models import KanbanBoards, Task, TaskPriority
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class CreateKanbanRequest(BaseModel):
    title: str
    description: str
    board: KanbanBoards
    due_date: Union[datetime, None]
    priority: TaskPriority

    def to_model(self) -> Task:
        return Task.build(
            title=self.title,
            description=self.description,
            board=self.board.value,
            due_date=self.due_date,
            priority=self.priority.value,
            position=0)


class UpdateKanbanRequest(BaseModel):
    title: str
    description: str
    due_date: Union[datetime, None]
    priority: TaskPriority


class MoveKanbanRequest(BaseModel):
    task_id: int
    board: KanbanBoards
    before_task_id: Union[int, None]
    after_task_id: Union[int, None]


class KanbanService():
    def __init__(self, registry: Registry):
        self.registry = registry

    def create(self, request: CreateKanbanRequest) -> int:
        with self.registry.get_session() as session:
            task = request.to_model()
            last_task = self._last_task(session, task.board)

            task.insert_between(before=last_task)

            session.add(task)
            session.commit()
            return task.id

    def _get_task(self, session: Session, task_id: int) -> Task:
        return session.query(Task) \
            .filter(Task.id == task_id) \
            .first()

    def _last_task(self, session: Session, board: KanbanBoards) -> Task:
        return session.query(Task) \
            .filter(Task.board == board.value) \
            .order_by(Task.position.desc()) \
            .first()

    def _before_task(self, session: Session, board: KanbanBoards, task_id: int) -> Task:
        return session.query(Task) \
            .filter(Task.board == board.value) \
            .filter(Task.id < task_id) \
            .order_by(Task.position.desc()) \
            .first()

    def _after_task(self, session: Session, board: KanbanBoards, task_id: int) -> Task:
        return session.query(Task) \
            .filter(Task.board == board.value) \
            .filter(Task.id > task_id) \
            .order_by(Task.position.asc()) \
            .first()

    def update(self, req: UpdateKanbanRequest):
        with self.registry.get_session() as session:
            task = self._get_task(session, req.task_id)
            if not task:
                raise ValueError(f"Task {req.task_id} not found")

            task.title = req.title
            task.description = req.description
            task.due_date = req.due_date
            task.priority = req.priority.value
            session.commit()

    def move(self, req: MoveKanbanRequest):
        with self.registry.get_session() as session:
            task = self._get_task(session, req.task_id)
            if not task:
                raise ValueError(f"Task {req.task_id} not found")

            task.board = req.board.value
            before = self._before_task(session, req.board, task.id)
            after = self._after_task(session, req.board, task.id)
            task.insert_between(before=before, after=after)
            session.commit()

    def delete(self, task_id: int):
        with self.registry.get_session() as session:
            task = self._get_task(session, task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            self._delete_task(session, task)
            session.commit()

    def _delete_task(self, session: Session, task_id: int):
        session.query(Task) \
            .filter(Task.id == task_id) \
            .delete()

    def list_by_board(self) -> list[Task]:
        boards = [KanbanBoards.TO_DO, KanbanBoards.IN_PROGRESS,
                  KanbanBoards.IN_REVIEW, KanbanBoards.DONE]
        tasks = defaultdict(list)
        with self.registry.get_session() as session:
            for board in boards:
                tasks[board] = session.query(Task) \
                    .filter(Task.board == board.value) \
                    .order_by(Task.position.asc()) \
                    .all()
        return tasks
