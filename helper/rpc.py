from configparser import ConfigParser
from log import get_logger

logger = get_logger(name=__name__)


def run_rpc(configs: ConfigParser):
    port = configs['api.grpc']['port']
    logger.info(f"starting RPC server: {port}")
    return
