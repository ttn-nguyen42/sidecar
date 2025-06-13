package api

import (
	"context"

	"github.com/ttn-nguyen42/sidecar/helper/pkg/config"
)

type Server struct {
	c *config.Config
}

func NewServer(c *config.Config) (*Server, error) {
	s := newServer(c)
	err := s.bootstrap()
	if err != nil {
		return nil, err
	}
	return s, nil
}

func newServer(c *config.Config) *Server {
	return &Server{
		c: c,
	}
}

func (s *Server) bootstrap() error {
	return nil
}

func (s *Server) Run(ctx context.Context) error {
	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	return nil
}
