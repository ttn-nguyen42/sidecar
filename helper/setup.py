from configparser import ConfigParser
import logging
import os
from typing import Callable
from langchain_openai import OpenAI, OpenAIEmbeddings, ChatOpenAI
from pydantic import SecretStr
from pywhispercpp.model import Model
from silero_vad import load_silero_vad
from langchain_chroma import Chroma
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy import event
from sqlalchemy.orm import sessionmaker, Session
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.checkpoint.base import BaseCheckpointSaver
from config import read_config
from log import setup_logger

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


def init_chat_model(configs: ConfigParser) -> ChatOpenAI:
    chat_model = configs['chat']['name']
    logger.info(f"Using chat model: {chat_model}")
    return ChatOpenAI(
        api_key=SecretStr(configs['chat']['token']),
        base_url=configs['chat']['baseUrl'],
        model=chat_model,
        temperature=0.0,
        max_retries=3
    )


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


def init_vector_db(configs: ConfigParser, embeddings: OpenAIEmbeddings, collection: str) -> Chroma:
    vector_db_path = configs['vector']['path']
    logger.info(f"Using vector database at: {vector_db_path}")
    return Chroma(
        persist_directory=vector_db_path,
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


def init_sqlite_saver(configs: ConfigParser, conn: sqlite3.Connection) -> BaseCheckpointSaver:
    sqlite_path = configs['sqlite']['path']
    saver = SqliteSaver(conn=conn)
    logger.info(f"SQLite graph database created at: {sqlite_path}")
    return saver


class Registry:
    def __init__(self):
        configs = read_config()
        setup_logger(configs=configs)
        self.chat = init_chat_model(configs)
        self.model = init_model(configs)
        self.embeddings = init_embeddings(configs)
        self.voice = init_whisper_model(configs)
        self.vector_cols = {}
        self.sqlite = init_sqlite(configs)
        self.alchemy = init_sqlalchemy(configs)
        self.saver = init_sqlite_saver(configs, self.sqlite)
        logger.info("Registry initialized with all services")
        self.configs = configs

    def get_model(self) -> OpenAI:
        return self.model

    def get_chat(self) -> ChatOpenAI:
        return self.chat

    def get_voice(self) -> Model:
        return self.voice

    def get_configs(self) -> ConfigParser:
        return self.configs

    def get_embeddings(self) -> OpenAIEmbeddings:
        return self.embeddings

    def get_vector_db(self, collection: str) -> Chroma:
        if collection not in self.vector_cols:
            self.vector_cols[collection] = init_vector_db(
                self.configs, self.embeddings, collection)
        return self.vector_cols[collection]

    def get_sqlite(self) -> sqlite3.Connection:
        return self.sqlite

    def get_alchemy(self):
        return self.alchemy

    def get_session(self) -> Session:
        Session = sessionmaker(bind=self.alchemy)
        return Session()

    def get_saver(self) -> BaseCheckpointSaver:
        return self.saver

    def get_vad(self):
        return load_silero_vad(onnx=True)


registry = Registry()
