import logging
import uuid
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Case, DateTime, case, func
from datetime import datetime
from langchain_core.messages import AIMessage


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


def init_models(engine):
    Base.metadata.create_all(engine)
    logger.info("Database tables created successfully.")


def new_run_id() -> str:
    return str(uuid.uuid4())


def role_order() -> Case:
    return case(
        (History.role == 'system', 1),
        (History.role == 'user', 2),
        (History.role == 'assistant', 3),
        else_=4
    )
