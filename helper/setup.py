from configparser import ConfigParser
import logging
import os
from browser_use import Agent
from langchain_openai import OpenAI, OpenAIEmbeddings, ChatOpenAI
from pydantic import SecretStr
from pywhispercpp.model import Model
from langchain_chroma import Chroma
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy import event
from sqlalchemy.orm import sessionmaker, Session
from config import read_config
from log import setup_logger
import webrtcvad
from mem0 import AsyncMemory
from mem0.configs.base import MemoryConfig
from langchain_core.vectorstores import VectorStoreRetriever

logger = logging.getLogger(__name__)


def init_model(configs: ConfigParser) -> OpenAI:
    chat_model = configs['chat']['name']
    logger.info(f"Using chat model: {chat_model}")
    return OpenAI(
        api_key=SecretStr(configs['chat']['token']),
        base_url=configs['chat']['baseUrl'],
        model=chat_model,
        temperature=0.0,
        max_retries=3)


def init_chat_model(configs: ConfigParser, tools: list[any] = []) -> ChatOpenAI:
    chat_model = configs['chat']['name']
    logger.info(f"Using chat model: {chat_model}")
    m = ChatOpenAI(
        api_key=SecretStr(configs['chat']['token']),
        base_url=configs['chat']['baseUrl'],
        model=chat_model,
        temperature=0.0,
        max_retries=3,
    )
    if len(tools) > 0:
        m.bind_tools(tools)
    return m


def init_whisper_model(configs: ConfigParser) -> Model:
    model = configs['voice']['name']
    dir = configs['voice']['directory']

    logger.info(f"Using Whisper voice-to-text model: {model}")
    return Model(
        model=model,
        models_dir=dir,
        n_threads=4
    )


def init_embeddings(configs: ConfigParser) -> OpenAIEmbeddings:
    embeddings_model = configs['embeddings']['name']
    logger.info(f"Using embeddings model: {embeddings_model}")
    return OpenAIEmbeddings(
        api_key=SecretStr(configs['embeddings']['token']),
        base_url=configs['embeddings']['baseUrl'],
        model=embeddings_model,
        max_retries=3
    )


def init_vector_db(configs: ConfigParser, path: str, embeddings: OpenAIEmbeddings, collection: str) -> Chroma:
    logger.info(f"Using vector database at: {path}")
    return Chroma(
        persist_directory=path,
        embedding_function=embeddings,
        collection_name=collection
    )


def sqlite_pragmas() -> list[str]:
    return [
        "PRAGMA foreign_keys=ON;",
        "PRAGMA journal_mode=WAL;",
        "PRAGMA synchronous=NORMAL;"
    ]


def init_sqlite(configs: ConfigParser) -> sqlite3.Connection:
    sqlite_path = configs['sqlite']['path']
    pragmed = sqlite_pragmas()
    logger.info(f"Using SQLite database at: {sqlite_path}")
    if os.path.exists(sqlite_path):
        logger.info(f"SQLite database file found at: {sqlite_path}")
    else:
        logger.warning(
            f"SQLite database file not found at: {sqlite_path}. It will be created.")
        if not os.path.exists(os.path.dirname(sqlite_path)):
            os.makedirs(os.path.dirname(sqlite_path))
            logger.info(
                f"Created directory for SQLite database: {os.path.dirname(sqlite_path)}")

    conn = sqlite3.connect(sqlite_path)
    cursor = conn.cursor()
    for pragma in pragmed:
        cursor.execute(pragma)
    return conn


def init_sqlalchemy(configs: ConfigParser) -> Engine:
    sqlite_path = configs['sqlite']['path']
    engine = create_engine(
        f'sqlite:///{sqlite_path}', connect_args={"check_same_thread": False})
    logger.info(f"SQLAlchemy engine created for SQLite at: {sqlite_path}")

    # Set SQLite PRAGMAs on connect
    @event.listens_for(engine, "connect")
    def set_sqlite_pragmas(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        for pragma in sqlite_pragmas():
            cursor.execute(pragma)
        cursor.close()

    return engine


class MemZeroConfigurer:
    def __init__(self, configs: ConfigParser):
        self.configs = configs

    def get_memory(self) -> AsyncMemory:
        mc = self._get_configs()
        return AsyncMemory(config=mc)

    def _get_configs(self) -> MemoryConfig:
        return MemoryConfig(
            vector_store=self._get_vector_store(),
            llm=self._get_llm(),
            embedder=self._get_embeddings(),
            history_db_path=self.configs['memory']['history']
        )

    def _get_vector_store(self) -> dict[str, any]:
        return {
            "provider": "chroma",
            "config": {
                "collection_name": "chat",
                "path": self.configs['memory']['vector']
            }
        }

    def _get_llm(self) -> dict[str, any]:
        return {
            "provider": "openai",
            "config": {
                "model": self.configs['chat']['name'],
                "api_key": self.configs['chat']['token'],
                "openai_base_url": self.configs['chat']['baseUrl'],
                "temperature": 0.0,
                "max_tokens": 3000,
            }
        }

    def _get_embeddings(self) -> dict[str, any]:
        return {
            "provider": "openai",
            "config": {
                "model": self.configs['embeddings']['name'],
                "api_key": self.configs['embeddings']['token'],
                "openai_base_url": self.configs['embeddings']['baseUrl'],
            }
        }


m0c = MemZeroConfigurer(read_config())


def init_memory(configs: ConfigParser) -> AsyncMemory:
    return m0c.get_memory()


class Registry:
    def __init__(self):
        configs = read_config()
        setup_logger(configs=configs)
        self.chat = init_chat_model(configs)
        self.model = init_model(configs)
        self.embeddings = init_embeddings(configs)
        self.voice = init_whisper_model(configs)
        self.note_vector_by_collection = {}
        self.task_vector_by_collection = {}
        self.sqlite = init_sqlite(configs)
        self.alchemy = init_sqlalchemy(configs)
        self.memory = init_memory(configs)
        logger.info("Registry initialized with all services")
        self.configs = configs

    def get_model(self) -> OpenAI:
        return self.model

    def get_chat(self) -> ChatOpenAI:
        return self.chat

    def get_new_chat(self, tools: list[any] = []) -> ChatOpenAI:
        return init_chat_model(self.configs, tools)

    def get_voice(self) -> Model:
        return self.voice

    def get_configs(self) -> ConfigParser:
        return self.configs

    def get_embeddings(self) -> OpenAIEmbeddings:
        return self.embeddings

    def get_notes_vector_db(self, collection: str) -> Chroma:
        if collection not in self.note_vector_by_collection:
            self.note_vector_by_collection[collection] = init_vector_db(
                configs=self.configs,
                path=self.configs['notes']['vector'],
                embeddings=self.embeddings,
                collection=collection
            )

        return self.note_vector_by_collection[collection]

    def get_tasks_vector_db(self, collection: str) -> Chroma:
        if collection not in self.task_vector_by_collection:
            self.task_vector_by_collection[collection] = init_vector_db(
                configs=self.configs,
                path=self.configs['tasks']['vector'],
                embeddings=self.embeddings,
                collection=collection
            )

        return self.task_vector_by_collection[collection]

    def get_notes_retriever(self, collection: str) -> VectorStoreRetriever:
        db = self.get_notes_vector_db(collection)
        return db.as_retriever(search_type="similarity", search_kwargs={"k": 5})

    def get_tasks_retriever(self, collection: str) -> VectorStoreRetriever:
        db = self.get_tasks_vector_db(collection)
        return db.as_retriever(search_type="similarity", search_kwargs={"k": 5})

    def get_memory(self) -> AsyncMemory:
        return self.memory

    def get_sqlite(self) -> sqlite3.Connection:
        return self.sqlite

    def get_alchemy(self):
        return self.alchemy

    def get_session(self) -> Session:
        Session = sessionmaker(bind=self.alchemy, expire_on_commit=False)
        return Session()

    def get_webrtc_vad(self):
        return webrtcvad.Vad(1)

    def get_web_agent(self, task: str):
        return Agent(
            task=task,
            llm=self.model)

    def close(self):
        self.sqlite.close()
        self.alchemy.dispose()


registry = Registry()
