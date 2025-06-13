from configparser import ConfigParser
from rpc import run_rpc
from log import get_logger

logger = get_logger(name=__name__)


def run_api(configs: ConfigParser):
    logger.info("starting apis")
    run_rpc(configs=configs)
    return
