from collections import defaultdict
from datetime import datetime, timedelta
import logging
from typing import Union

from pydantic import BaseModel
from setup import Registry
from services.models import KanbanBoards, Task, TaskPriority
from sqlalchemy.orm import Session
from setup import registry
from util import end_of_this_week, end_of_this_month, datetime_from

logger = logging.getLogger(__name__)


class CreateKanbanRequest(BaseModel):
    title: str
    description: str
    board: str
    due_date: Union[datetime, None]
    priority: int

    def to_model(self) -> Task:
        return Task.build(
            title=self.title,
            description=self.description,
            board=KanbanBoards(self.board).value,
            due_date=self.due_date,
            priority=TaskPriority(self.priority).value,
            position=0)


class UpdateKanbanRequest(BaseModel):
    title: str
    description: str
    due_date: Union[datetime, None]
    priority: int

    def update_model(self, task: Task):
        task.title = self.title
        task.description = self.description
        task.due_date = self.due_date
        task.priority = TaskPriority(self.priority).value


class MoveKanbanRequest(BaseModel):
    task_id: int
    board: KanbanBoards
    before_task_id: Union[int, None]
    after_task_id: Union[int, None]

    def update_model(self, task: Task):
        task.board = KanbanBoards(self.board).value


class KanbanService():
    def __init__(self, registry: Registry):
        self.registry = registry

    def create(self, request: CreateKanbanRequest) -> int:
        with self.registry.get_session() as session:
            task = request.to_model()
            task.is_dirty = True

            last_task = self._last_task(session, task.board)

            task.insert_between(before=last_task)

            session.add(task)
            session.commit()
            return task.id

    def _get_task(self, session: Session, task_id: int) -> Task:
        return session.query(Task) \
            .filter(Task.id == task_id) \
            .filter(Task.for_removal == False) \
            .first()

    def _last_task(self, session: Session, board: str) -> Task:
        return session.query(Task) \
            .filter(Task.board == board) \
            .filter(Task.for_removal == False) \
            .order_by(Task.position.desc()) \
            .first()

    def _before_task(self, session: Session, board: str, task_id: int) -> Task:
        return session.query(Task) \
            .filter(Task.board == board) \
            .filter(Task.id < task_id) \
            .filter(Task.for_removal == False) \
            .order_by(Task.position.desc()) \
            .first()

    def _after_task(self, session: Session, board: str, task_id: int) -> Task:
        return session.query(Task) \
            .filter(Task.board == board) \
            .filter(Task.id > task_id) \
            .filter(Task.for_removal == False) \
            .order_by(Task.position.asc()) \
            .first()

    def update(self, req: UpdateKanbanRequest):
        with self.registry.get_session() as session:
            task = self._get_task(session, req.task_id)
            if not task:
                raise ValueError(f"Task {req.task_id} not found")

            req.update_model(task)
            task.is_dirty = True

            session.commit()

    def move(self, req: MoveKanbanRequest):
        with self.registry.get_session() as session:
            task = self._get_task(session, req.task_id)
            if not task:
                raise ValueError(f"Task {req.task_id} not found")

            req.update_model(task)

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
            .update({"for_removal": True})

    def list_by_board(self) -> list[Task]:
        boards = [KanbanBoards.TO_DO, KanbanBoards.IN_PROGRESS,
                  KanbanBoards.IN_REVIEW, KanbanBoards.DONE]
        tasks = defaultdict(list)
        with self.registry.get_session() as session:
            for board in boards:
                tasks[board] = session.query(Task) \
                    .filter(Task.board == board.value) \
                    .filter(Task.for_removal == False) \
                    .order_by(Task.position.asc()) \
                    .all()
        return tasks

    def list_by_duedate_within(self, days: int) -> list[Task]:
        with self.registry.get_session() as session:
            return session.query(Task) \
                .filter(Task.due_date.between(datetime.now(), datetime.now() + timedelta(days=days))) \
                .filter(Task.for_removal == False) \
                .order_by(Task.due_date.asc(), Task.priority.desc(), Task.created_at.desc()) \
                .all()

    def list_by_duedate_today(self) -> list[Task]:
        end = datetime_from(datetime.now(), days=1)

        with self.registry.get_session() as session:
            return session.query(Task) \
                .filter(Task.due_date.between(datetime.now(), end)) \
                .filter(Task.for_removal == False) \
                .order_by(Task.due_date.asc(), Task.priority.desc(), Task.created_at.desc()) \
                .all()

    def list_by_duedate_tomorrow(self) -> list[Task]:
        end = datetime_from(datetime.now(),  days=1)

        with self.registry.get_session() as session:
            return session.query(Task) \
                .filter(Task.due_date.between(datetime.now(), end)) \
                .filter(Task.for_removal == False) \
                .order_by(Task.due_date.asc(), Task.priority.desc(), Task.created_at.desc()) \
                .all()

    def list_by_duedate_this_week(self) -> list[Task]:
        end = end_of_this_week(datetime.now())

        with self.registry.get_session() as session:
            return session.query(Task) \
                .filter(Task.due_date.between(datetime.now(), end)) \
                .filter(Task.for_removal == False) \
                .order_by(Task.due_date.asc(), Task.priority.desc(), Task.created_at.desc()) \
                .all()

    def list_by_duedate_this_month(self) -> list[Task]:
        end = end_of_this_month(datetime.now())

        with self.registry.get_session() as session:
            return session.query(Task) \
                .filter(Task.due_date.between(datetime.now(), end)) \
                .filter(Task.for_removal == False) \



class TaskMetadata(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime
    priority: TaskPriority
    board: KanbanBoards
    due_date: Union[datetime, None]

    def to_dict(self) -> dict[str, any]:
        return {
            "type": "task",
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "priority": self.priority.value,
            "board": self.board.value,
            "due_date": self.due_date.isoformat() if self.due_date else None,
        }

    @staticmethod
    def from_dict(data: dict[str, any]) -> 'TaskMetadata':
        return TaskMetadata(
            id=data["id"],
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            priority=TaskPriority(data["priority"]),
            board=KanbanBoards(data["board"]),
            due_date=datetime.fromisoformat(
                data["due_date"]) if "due_date" in data and data["due_date"] else None,
        )

    @staticmethod
    def from_model(task: Task) -> 'TaskMetadata':
        return TaskMetadata(
            id=task.id,
            created_at=task.created_at,
            updated_at=task.updated_at,
            priority=TaskPriority(task.priority),
            board=KanbanBoards(task.board),
            due_date=task.due_date,
        )

    @staticmethod
    def is_task(data: dict[str, any]) -> bool:
        return "type" in data and data["type"] == "task"


kb_service = KanbanService(registry)
