from enum import Enum
import logging
import uuid
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import JSON, Case, DateTime, case, func
from datetime import datetime


Base = declarative_base()

logger = logging.getLogger(__name__)


class Thread(Base):
    __tablename__ = 'threads'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(nullable=False)
    run_id: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now())

    def to_dict(self) -> dict[str, any]:
        return {
            "id": self.id,
            "title": self.title,
            "run_id": self.run_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class History(Base):
    __tablename__ = 'history'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    thread_id: Mapped[int] = mapped_column(nullable=False, index=True)
    turn_id: Mapped[int] = mapped_column(nullable=False, index=True)
    role: Mapped[str] = mapped_column(nullable=False, index=True)
    content: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now())

    @staticmethod
    def build(content: str, thread_id: int, turn_id: int) -> 'History':
        return History(role="assistant",
                       content=content,
                       thread_id=thread_id,
                       turn_id=turn_id)

    def to_dict(self) -> dict[str, any]:
        return {
            "id": self.id,
            "thread_id": self.thread_id,
            "turn_id": self.turn_id,
            "role": self.role,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class Config(Base):
    __tablename__ = 'config'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(nullable=False, index=True)
    value: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now())

    @staticmethod
    def build(key: str, value: str) -> 'Config':
        return Config(key=key, value=value)

    def set_value(self, value: str):
        self.value = value

    def to_dict(self) -> dict[str, str]:
        return {
            "id": self.id,
            "key": self.key,
            "value": self.value,
            "created_at": self.created_at.isoformat(),
        }


class Note(Base):
    __tablename__ = 'notes'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(nullable=False)
    content: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now())
    is_dirty: Mapped[bool] = mapped_column(
        nullable=False, default=True, index=True)
    for_removal: Mapped[bool] = mapped_column(
        nullable=False, default=False, index=True)
    vector_ids: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=[])

    @staticmethod
    def build(title: str, content: str) -> 'Note':
        return Note(title=title, content=content)

    def to_dict(self) -> dict[str, any]:
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "vector_ids": self.vector_ids,
        }


class KanbanBoards(Enum):
    TO_DO = "to_do"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"


class TaskPriority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4


class Task(Base):
    __tablename__ = 'tasks'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now())
    board: Mapped[str] = mapped_column(nullable=False, index=True)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    priority: Mapped[int] = mapped_column(nullable=False, index=True)
    position: Mapped[int] = mapped_column(
        nullable=False, index=True, default=1000)

    @staticmethod
    def build(title: str,
              description: str,
              board: str,
              due_date: datetime,
              priority: int,
              position: int) -> 'Task':
        return Task(title=title,
                    description=description,
                    board=board,
                    due_date=due_date,
                    priority=priority,
                    position=position)

    def to_dict(self) -> dict[str, any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "board": self.board,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "priority": self.priority,
            "position": self.position,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def insert_between(self, before: 'Task' = None, after: 'Task' = None) -> bool:
        MIN_GAP = 1e-5  # Minimum difference to avoid float collision
        """
        Update position when it's moved between two tasks.
        Args:
            before (Task, optional): Task before the current task. Defaults to None.
            after (Task, optional): Task after the current task. Defaults to None.

        Returns:
            bool: True if the position was updated, False if a rebalance is needed.
        """
        MIN_GAP = 1e-5  # Minimum difference to avoid float collision

        if not before and not after:
            self.position = 1000
            return True

        elif before and not after:
            self.position = before.position + 1000
            return True

        elif not before and after:
            self.position = after.position / 2
            return True

        elif before and after:
            gap = after.position - before.position
            if gap <= MIN_GAP:
                # No room to insert between — signal rebalance needed
                return False
            self.position = (before.position + after.position) / 2
            return True


def init_models(engine):
    Base.metadata.create_all(engine)
    logger.info("Database tables created successfully.")


def new_run_id() -> str:
    return str(uuid.uuid4())


def rebalance_tasks(tasks: list[Task]):
    s = 1000
    for task in tasks:
        task.position = s
        s += 1000
    return tasks


def role_order() -> Case:
    return case(
        (History.role == 'system', 1),
        (History.role == 'user', 2),
        (History.role == 'assistant', 3),
        else_=4
    )
