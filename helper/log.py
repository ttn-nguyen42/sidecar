from configparser import ConfigParser
import logging

fmt = "%(asctime)s %(levelname)s %(message)s"
datefmt = "%Y-%m-%d %H:%M:%S"


def get_uvicorn_log_config(configs: ConfigParser) -> dict:
    log_level = configs["log"]["level"]
    return {
        'version': 1,
        'disable_existing_loggers': True,
        'formatters': {
            'standard': {
                'format': fmt,
                'datefmt': datefmt,
            },
            'custom_formatter': {
                'format': fmt,
                'datefmt': datefmt,
            },
        },
        'handlers': {
            'default': {
                'formatter': 'standard',
                'class': 'logging.StreamHandler',
                'stream': 'ext://sys.stdout',  # Default is stderr
            },
            'stream_handler': {
                'formatter': 'custom_formatter',
                'class': 'logging.StreamHandler',
                'stream': 'ext://sys.stdout',  # Default is stderr
            }
        },
        'loggers': {
            'uvicorn': {
                'handlers': ['default'],
                'level': log_level,
                'propagate': False
            },
        },
    }


def setup_logger(configs: ConfigParser):
    level: str = configs["log"]["level"]
    logging.basicConfig(level=level, format=fmt, datefmt=datefmt)

    return


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name=name)
