import argparse
import configparser
import os

from log import get_logger

logger = get_logger(name=__name__)


def get_file_path():
    parser = argparse.ArgumentParser(description="Read config file")
    parser.add_argument("-config", type=str,
                        default="config.toml", help="Path to config file")
    args, _ = parser.parse_known_args()
    return args.config


def get_default(parser: configparser.ConfigParser):
    parser['log'] = {'level': 'INFO'}
    parser['http'] = {'port': '8768'}
    parser['chat'] = {
        'token': os.getenv(key='OPENAI_API_KEY', default=''),
        'name': 'gpt-3.5-turbo',  # Model name
        'baseUrl': 'https://api.openai.com/v1',  # Path
    }
    parser['voice'] = {
        'name': 'base-q5_1',  # Model name
        'directory': 'MODELS',  # Path to models directory
    }
    parser['sqlite'] = {
        'path': 'DATA/data.db',  # Path to SQLite database
    }
    parser['vector'] = {
        'path': 'DATA/vector.db',  # Path to vector database
    }
    parser['embeddings'] = {
        'name': 'text-embedding-3-small',  # Model name
        'baseUrl': 'https://api.openai.com/v1',  # Path
        'token': os.getenv(key='OPENAI_API_KEY', default=''),
    }


def read_config():
    path = get_file_path()

    config = configparser.ConfigParser()
    get_default(parser=config)

    if os.path.exists(path):
        logger.info(f"Read config file {path}")

        config.read(path)
    else:
        logger.error(f"Config file {path} not found. Using default values.")

    return config
