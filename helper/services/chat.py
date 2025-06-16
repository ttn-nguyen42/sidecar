from datetime import datetime
import logging
from services.models import Thread
from setup import Registry
from pydantic import BaseModel
import sys
from langchain_core.messages import HumanMessage, AIMessage
from contextlib import contextmanager
from util import get_session
sys.path.append("..")

logger = logging.getLogger(__name__)


class CreateThreadRequest(BaseModel):
    title: str

    def __repr__(self):
        return f"CreateThreadRequest(title={self.title})"

    def to_model(self) -> Thread:
        return Thread(title=self.title)


class ChatRequest(BaseModel):
    id: int
    content: str

    def __repr__(self):
        return f"ChatRequest(id={self.id}, content={self.content})"

    def to_human(self) -> HumanMessage:
        return HumanMessage(content=self.content)


class ChatResponse(BaseModel):
    message_id: str
    content: str
    refusal: bool

    def __repr__(self):
        return f"ChatResponse(id={self.message_id}, content={self.content}, refusal={self.refusal})"

    @staticmethod
    def from_ai(message: AIMessage) -> 'ChatResponse':
        refusal = False
        args = message.additional_kwargs
        if 'refusal' in args and args['refusal']:
            refusal = True
        # TODO: Handle message.context returning list of messages
        return ChatResponse(message_id=message.id or "", content=str(message.content), refusal=refusal)


class ChatService():
    def __init__(self, registry: Registry):
        self.registry = registry
        self.chat_model = registry.get_chat()

    def create_thread(self, request: CreateThreadRequest) -> int:
        with get_session(self.registry) as session:
            t = request.to_model()
            session.add(t)
            session.flush()  # Ensures t.id is populated if autoincrement
            return t.id

    def get_thread(self, id: str) -> Thread:
        with get_session(self.registry) as session:
            return session.query(Thread).filter_by(id=id).first()

    def send_message(self, request: ChatRequest) -> ChatResponse:
        if not self._thread_exists(request.id):
            raise ValueError(f"Thread {request.id} does not exist")

        human = request.to_human()
        start = datetime.now()
        response = self.chat_model.invoke([human])
        end = datetime.now()

        self._set_last_updated(request.id)

        logger.info(
            f"Chat sent message to thread {request.id}, timestamp: {datetime.now()}, ms: {end - start}")
        if isinstance(response, AIMessage):
            return ChatResponse.from_ai(response)
        else:
            logger.warning(f"Unexpected response type: {type(response)}")
            # TODO: Handle unexpected content types
            return ChatResponse(message_id=response.id or "", content=str(response.content), refusal=False)

    def _set_last_updated(self, thread_id: int):
        with get_session(self.registry) as session:
            session.query(Thread).filter_by(id=thread_id).update(
                {'updated_at': datetime.now()})

    def _thread_exists(self, thread_id: int) -> bool:
        with get_session(self.registry) as session:
            return session.query(Thread).filter_by(id=thread_id).first() is not None
