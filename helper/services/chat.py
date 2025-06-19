import asyncio
from datetime import datetime
import logging
from typing import AsyncGenerator
from services.models import History, Thread, new_run_id, role_order
from setup import Registry
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from pydantic import BaseModel
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from services.config import CollectionKey
from langchain_core.messages import HumanMessage, AIMessage
from services.prompts import ps
from util import get_session
from mem0.memory.main import AsyncMemory
from services.embed import embed_service

import sys
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
    is_voice: bool = False

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
    code: int
    content: str

    def __repr__(self):
        return f"ChatResponse(code={self.code}, content={self.content})"

    @staticmethod
    def from_history(history: History) -> 'ChatResponse':
        return ChatResponse(code=200, content=history.content)

    @staticmethod
    def from_chunk(chunk: AIMessage) -> 'ChatResponse':
        return ChatResponse(code=200, content=chunk.content)


class MemZeroBridgeRetriever(BaseRetriever):
    memory: AsyncMemory
    limit: int
    run_id: str

    # Generally discouraged
    def _get_relevant_documents(self, query: str) -> list[Document]:
        logger.warning(
            "MemZeroBridgeRetriever is running in sync mode, this is not recommended")

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            # If already in an event loop (e.g., FastAPI with async endpoint calling sync code)
            # This is tricky: you can't run a new event loop, so you must schedule and wait for the coroutine.
            # This will block the event loop, so use with caution.
            future = asyncio.ensure_future(self.memory.search(
                query=query, limit=self.limit, threshold=0.8, run_id=self.run_id))
            data = loop.run_until_complete(future)
        else:
            # If not in an event loop, safe to run
            data = asyncio.run(self.memory.search(
                query=query, limit=self.limit, threshold=0.8))

        results = data.get('results', [])
        metadata = data.get('metadata', {})
        return [Document(page_content=r['memory'], metadata=metadata) for r in results]

    async def _aget_relevant_documents(self, query: str) -> list[Document]:
        data = await self.memory.search(
            query=query, limit=self.limit, threshold=0.8, run_id=self.run_id)
        results = data.get('results', [])
        metadata = data.get('metadata', {})
        return [Document(page_content=r['memory'], metadata=metadata) for r in results]


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

    async def send_message(self, request: ChatRequest) -> AsyncGenerator[ChatResponse, None]:
        try:
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
            mem_zero_retriever = MemZeroBridgeRetriever(
                memory=self.memory, limit=20, run_id=run_id)

            retriever = self.registry.get_notes_retriever(
                collection=CollectionKey.NOTES_INDEXED)

            retrievers = [mem_zero_retriever, retriever]

            combined = embed_service.combine_retriever(
                retrievers,
                filter=True,
                reorder=True)

            vector_memory = await combined.ainvoke(input=human.content)
            logger.debug(f"Vector memory: {vector_memory}")

            prompts = self._build_prompt(vector_memory, human.content)

            start = datetime.now()

            response = []
            async for chunk in self.chat_model.astream(prompts):
                logger.debug(f"Chunk: {chunk}")
                response.append(chunk)
                yield ChatResponse.from_chunk(chunk)

            end = datetime.now()
            logger.debug(f"Chat response returned after {end - start}ms")

            content = "".join([m.content for m in response])

            ai_history = History.build(content, request.id, turn_id)

            with get_session(self.registry) as session:
                session.add(ai_history)
                self._set_last_updated(session, request.id)
                session.commit()

            asyncio.create_task(self._add_memory(
                thread_id=request.id, run_id=run_id, prompts=prompts, content=content))
        except ValueError as e:
            logger.error(f"ValueError in send_message: {e}")
            yield ChatResponse(code=404, content=str(e))
        except Exception as e:
            logger.error(f"Exception in send_message: {e}")
            yield ChatResponse(code=500, content="Internal server error.")

    async def _add_memory(self, thread_id: int, run_id: str, prompts: list[dict[str, any]], content: str):
        start = datetime.now()

        prompts.append({"role": "assistant", "content": content})
        await self.memory.add(messages=prompts, run_id=run_id)
        end = datetime.now()

        logger.debug(
            f"Memory for thread {thread_id} added after {end - start}ms")

    def _set_last_updated(self, session: Session, thread_id: int):
        session.query(Thread) \
            .filter(Thread.id == thread_id) \
            .update({'updated_at': datetime.now()})

    def _get_thread(self, session: Session, thread_id: int) -> Thread:
        return session.query(Thread) \
            .filter(Thread.id == thread_id) \
            .first()

    def _next_turn_id(self, session: Session, thread_id: int) -> int:
        query = select((func.coalesce(func.max(History.turn_id), 0) + 1)) \
            .where(History.thread_id == thread_id)

        return session.execute(query).scalar_one()

    def _build_prompt(self, memory: list[Document], content: str) -> list[dict[str, any]]:
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
