from configparser import ConfigParser
import logging
import os
from fastapi import APIRouter
from langchain_openai import OpenAI, OpenAIEmbeddings
from pydantic import SecretStr
from pywhispercpp.model import Model
from silero_vad import load_silero_vad
from langchain_chroma import Chroma
import sqlite3

from config import read_config
from log import setup_logger

logger = logging.getLogger(__name__)


def init_chat(configs: ConfigParser) -> OpenAI:
    chat_model = configs['chat']['name']
    logger.info(f"Using chat model: {chat_model}")
    return OpenAI(
        api_key=SecretStr(configs['chat']['token']),
        base_url=configs['chat']['baseUrl'],
        model=chat_model,
        temperature=0.0,
        max_retries=3)


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


def init_sqlite(configs: ConfigParser) -> sqlite3.Connection:
    sqlite_path = configs['sqlite']['path']
    pragmed = ["PRAGMA foreign_keys=ON;",
               "PRAGMA journal_mode=WAL;",
               "PRAGMA synchronous=NORMAL;"]
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


class Registry:
    def __init__(self):
        configs = read_config()
        setup_logger(configs=configs)
        self.chat = init_chat(configs)
        self.embeddings = init_embeddings(configs)
        self.voice = init_whisper_model(configs)
        self.vad = load_silero_vad()
        self.vector_cols = {}
        self.sqlite = init_sqlite(configs)
        logger.info("Registry initialized with all services")
        self.configs = configs

    def get_chat(self) -> OpenAI:
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


registry = Registry()
api_router = APIRouter()
