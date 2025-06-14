from services.models import Thread
from setup import Registry
from pydantic import BaseModel
import sys
sys.path.append("..")


class CreateThreadRequest(BaseModel):
    title: str

    def __repr__(self):
        return f"CreateThreadRequest(title={self.title})"

    def to_model(self) -> Thread:
        return Thread(title=self.title)


class ChatService():
    def __init__(self, registry: Registry):
        self.registry = registry
        self.chat_model = registry.get_chat()
        self.s = registry.get_session()

    def create_thread(self, request: CreateThreadRequest) -> int:
        t = request.to_model()
        with self.s.begin():
            self.s.add(t)
            self.s.flush()  # Ensures t.id is populated if autoincrement
        return t.id

    def get_thread(self, id: str) -> Thread:
        return self.s.query(Thread).filter_by(id=id).first()
