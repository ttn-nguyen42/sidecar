from configparser import ConfigParser
import proto.helper_pb2_grpc as pb_helper_grpc
import proto.helper_pb2 as pb_helper
from google.protobuf.timestamp_pb2 import Timestamp


class HelperServiceServicer(pb_helper_grpc.HelperServiceServicer):
    def __init__(self, configs: ConfigParser) -> None:
        super().__init__()
        self.configs = configs

    def Ping(self, request, context):
        ts = Timestamp()
        ts.GetCurrentTime()
        return pb_helper.PingResponse(timestamp=ts)
