from datetime import datetime
import logging
from pydantic import BaseModel
from requests import Session
from services.models import Note
from setup import Registry

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
