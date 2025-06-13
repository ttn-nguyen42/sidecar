from concurrent.futures import ThreadPoolExecutor
from configparser import ConfigParser

import grpc
from log import get_logger
from proto.helper_pb2_grpc import add_HelperServiceServicer_to_server
from proto.chat_pb2_grpc import add_ChatServiceServicer_to_server
from service.helper import HelperServiceServicer
from service.chat import ChatServiceServicer
logger = get_logger(name=__name__)


def init_server(configs: ConfigParser, addr: str) -> grpc.Server:
    s = grpc.server(thread_pool=ThreadPoolExecutor(max_workers=2))
    s.add_insecure_port(address=addr)

    helper_service = HelperServiceServicer(configs=configs)
    chat_service = ChatServiceServicer(configs=configs)

    add_HelperServiceServicer_to_server(server=s, servicer=helper_service)
    add_ChatServiceServicer_to_server(server=s, servicer=chat_service)
    return s


def run_rpc(configs: ConfigParser):
    port = configs['api.grpc']['port']
    s = init_server(configs=configs, addr=f"localhost:{port}")

    logger.info(f"starting RPC server: {port}")
    s.start()
    s.wait_for_termination()

    logger.info("RPC server stopped")

