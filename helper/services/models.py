import logging
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import Mapped, mapped_column


Base = declarative_base()

logger = logging.getLogger(__name__)


class Thread(Base):
    __tablename__ = 'threads'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(nullable=False)


def init_models(engine):
    Base.metadata.create_all(engine)
    logger.info("Database tables created successfully.")
