package api

import (
	"context"

	"github.com/ttn-nguyen42/sidecar/helper/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var _ proto.ChatServiceServer = (*chat)(nil)

type chat struct {
	proto.UnimplementedChatServiceServer
}

func newChat() *chat {
	return &chat{}
}

func (c *chat) SendMessage(context.Context, *proto.SendMessageRequest) (*proto.SendMessageResponse, error) {
	return &proto.SendMessageResponse{
		Timestamp: timestamppb.Now(),
	}, nil
}
