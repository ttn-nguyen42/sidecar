from configparser import ConfigParser
import logging

fmt = "%(name)s %(asctime)s %(levelname)s %(message)s"


def setup_logger(configs: ConfigParser):
    level: str = configs["log"]["level"]
    if level is None:
        level = logging.INFO
    logging.basicConfig(level=level, format=fmt)

    return


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name=name)
