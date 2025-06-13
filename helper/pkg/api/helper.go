package api

import (
	"context"

	"github.com/ttn-nguyen42/sidecar/helper/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var _ proto.HelperServiceServer = (*helper)(nil)

type helper struct {
	proto.UnimplementedHelperServiceServer
}

func newHelper() *helper {
	return &helper{}
}

// Ping returns a current timestamp and additional metadata.
//
// Used by the client to verify that the service is running.
func (h *helper) Ping(context.Context, *proto.PingRequest) (*proto.PingResponse, error) {
	return &proto.PingResponse{Timestamp: timestamppb.Now()}, nil
}
