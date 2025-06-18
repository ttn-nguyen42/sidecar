from requests import Session
from services.models import Note
from setup import Registry


class NotesService():
    def __init__(self, registry: Registry):
        self.registry = registry
        return

    def create(self, title: str, content: str) -> int:
        with self.registry.get_session() as session:
            note = Note.build(title, content)
            session.add(note)
            session.commit()
        return note.id

    def delete(self, id: int):
        with self.registry.get_session() as session:
            note = self._get(session, id)
            if note is None:
                raise ValueError(f"Note {id} not found")
            session.delete(note)
            session.commit()
        return

    def list(self) -> list[Note]:
        with self.registry.get_session() as session:
            return session.query(Note) \
                .order_by(Note.created_at.desc()) \
                .all()

    def get(self, id: int) -> Note:
        with self.registry.get_session() as session:
            note = self._get(session, id)
            if note is None:
                raise ValueError(f"Note {id} not found")
            return note

    def update(self, id: int, title: str, content: str):
        with self.registry.get_session() as session:
            note = self._get(session, id)
            if note is None:
                raise ValueError(f"Note {id} not found")
            note.title = title
            note.content = content
            session.commit()
        return

    def _get(self, session: Session, id: int) -> Note:
        return session.query(Note) \
            .filter(Note.id == id) \
            .first()

    def _save_vector(self, note: Note):
        return
