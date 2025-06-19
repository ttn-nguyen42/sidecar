from configparser import ConfigParser
import logging

from hypercorn.config import Config

fmt = "%(asctime)s %(levelname)s %(message)s"
datefmt = "%Y-%m-%d %H:%M:%S"


def setup_logger(configs: ConfigParser):
    level: str = configs["log"]["level"]
    logging.basicConfig(level=level, format=fmt, datefmt=datefmt)

    return


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name=name)


def get_hypercorn_config(configs: ConfigParser) -> Config:
    c = Config()
    c.bind = f"0.0.0.0:{configs['http'].getint('port', 8768)}"
    c.accesslog = get_logger("hypercorn.access")
    c.access_log_format = '%(h)s %(l)s %(l)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
    return c
