from configparser import ConfigParser
import proto.chat_pb2_grpc as pb_chat_grpc
import proto.chat_pb2 as pb_chat
from google.protobuf.timestamp_pb2 import Timestamp


class ChatServiceServicer(pb_chat_grpc.ChatServiceServicer):
    def __init__(self, configs: ConfigParser) -> None:
        super().__init__()
        self.configs = configs

    def SendMessage(self, request, context):
        ts = Timestamp()
        ts.GetCurrentTime()
        return pb_chat.SendMessageResponse(timestamp=ts, message=f"Received: {request.message}, at {ts.ToJsonString()}")
