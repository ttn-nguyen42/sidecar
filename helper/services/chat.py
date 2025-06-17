from datetime import datetime
import logging
from services.models import History, Thread, new_run_id, role_order
from setup import Registry
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from pydantic import BaseModel
import sys
from langchain_core.messages import HumanMessage
from services.prompts import ps
from util import get_session
sys.path.append("..")

logger = logging.getLogger(__name__)


class CreateThreadRequest(BaseModel):
    title: str

    def __repr__(self):
        return f"CreateThreadRequest(title={self.title})"

    def to_model(self) -> Thread:
        return Thread(title=self.title, run_id=new_run_id())


class ChatRequest(BaseModel):
    id: int
    content: str

    def __repr__(self):
        return f"ChatRequest(id={self.id}, content={self.content})"

    def to_human(self) -> HumanMessage:
        return HumanMessage(content=self.content)

    def to_history(self, thread_id: int, turn_id: int) -> History:
        return History(thread_id=thread_id, turn_id=turn_id, role="user", content=self.content)

    def to_prompt(self) -> dict[str, any]:
        return {
            "role": "user",
            "content": self.content
        }


class ChatResponse(BaseModel):
    msg_id: int
    thread_id: int
    turn_id: int
    content: str
    refusal: bool

    def __repr__(self):
        return f"ChatResponse(id={self.msg_id}, content={self.content}, refusal={self.refusal})"

    @staticmethod
    def from_history(history: History) -> 'ChatResponse':
        return ChatResponse(msg_id=history.id,
                            thread_id=history.thread_id,
                            turn_id=history.turn_id,
                            content=history.content,
                            refusal=False)


class ChatService():
    def __init__(self, registry: Registry):
        self.registry = registry
        self.chat_model = registry.get_chat()
        self.memory = registry.get_memory()

    def create_thread(self, request: CreateThreadRequest) -> int:
        with get_session(self.registry) as session:
            t = request.to_model()
            session.add(t)
            session.commit()  # Ensures t.id is populated if autoincrement
            return t.id

    def get_thread(self, thread_id: int) -> Thread:
        with get_session(self.registry) as session:
            return self._get_thread(session, thread_id)

    def list_threads(self) -> list[Thread]:
        with get_session(self.registry) as session:
            return session.query(Thread).all()

    async def send_message(self, request: ChatRequest) -> ChatResponse:
        run_id = 0

        with get_session(self.registry) as session:
            thread = self._get_thread(session, request.id)
            if thread is None:
                raise ValueError(f"Thread {request.id} does not exist")
            logger.debug(f"Thread {request.id} found")
            run_id = thread.run_id

            turn_id = self._next_turn_id(session, request.id)
            logger.debug(f"Turn ID: {turn_id}")
            history = request.to_history(request.id, turn_id)

            session.add(history)
            session.commit()

        human = request.to_human()
        vector_memory = await self._get_vector_memory(run_id, human.content, limit=5)
        logger.debug(f"Vector memory: {vector_memory}")

        prompts = self._build_prompt(vector_memory, human.content)

        start = datetime.now()
        response = self.chat_model.invoke(prompts)
        end = datetime.now()

        prompts.append({"role": "assistant", "content": response.content})
        await self._add_memory(run_id, prompts)

        logger.info(
            f"Chat sent message to thread {request.id}, timestamp: {datetime.now()}, ms: {end - start}")

        ai_history = History.from_ai(response, request.id, turn_id)

        with get_session(self.registry) as session:
            session.add(ai_history)
            self._set_last_updated(session, request.id)
            session.commit()

            return ChatResponse.from_history(ai_history)

    def _set_last_updated(self, session: Session, thread_id: int):
        session.query(Thread) \
            .filter(Thread.id == thread_id) \
            .update({'updated_at': datetime.now()})

    def _get_thread(self, session: Session, thread_id: int) -> Thread:
        return session.query(Thread) \
            .filter(Thread.id == thread_id) \
            .first()

    async def _get_vector_memory(self, run_id: str, content: str, limit: int = 100) -> any:
        data = await self.memory.search(
            query=content,
            run_id=run_id,
            limit=limit
        )
        return data['results']

    async def _add_memory(self, run_id: str, contents: list[any]):
        result = await self.memory.add(messages=contents, run_id=run_id)
        logger.debug(f"Memory added: {result}")

    def _next_turn_id(self, session: Session, thread_id: int) -> int:
        query = select((func.coalesce(func.max(History.turn_id), 0) + 1)) \
            .where(History.thread_id == thread_id)

        return session.execute(query).scalar_one()

    def _build_prompt(self, memory: list[any], content: str) -> list[dict[str, any]]:
        sys_prompt = ps.build_chat_system_prompt(memory, content)
        return [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": content}
        ]

    def get_messages(self, thread_id: int, page: int, limit: int) -> list[History]:
        with get_session(self.registry) as session:
            return session.query(History) \
                .filter(History.thread_id == thread_id) \
                .order_by(History.turn_id.desc(), role_order().desc()) \
                .offset((page - 1) * limit) \
                .limit(limit) \
                .all()
