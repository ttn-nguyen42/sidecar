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
    parser['api.grpc'] = {'port': '8768'}
    parser['api.ws'] = {'port': '8778'}
    parser['model'] = {
        'token': os.getenv(key='OPENAI_API_KEY', default=''),
        'chat': '',  # Model name
        'instruct': '',  # Model name
        'transcribe': '',  # Path
        'cus': ''  # Path
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
