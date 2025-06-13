package api

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/ttn-nguyen42/sidecar/helper/internal/util"
	"github.com/ttn-nguyen42/sidecar/helper/pkg/config"
	"github.com/ttn-nguyen42/sidecar/helper/proto"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc"
)

// Server encapsulates all networking services.
//
// Not thread safe.
type Server struct {
	c *config.Config

	lis  net.Listener
	sm   *http.ServeMux
	http *http.Server
	serv *grpc.Server

	eg      *errgroup.Group
	started bool
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
	err := s.listen()
	if err != nil {
		return err
	}

	return nil
}

func (s *Server) listen() error {
	var err error

	err = s.initGrpcServer()
	if err != nil {
		return err
	}

	err = s.initHttpServer()
	if err != nil {
		return err
	}

	s.register()

	return nil
}

func (s *Server) initGrpcServer() error {
	var err error

	s.lis, err = net.Listen("tcp", util.Localhost(s.c.Port.Helper))
	if err != nil {
		if !errors.Is(err, net.ErrClosed) {
			return fmt.Errorf("failed to listen to helper port: %w", err)
		}
	}
	s.serv = grpc.NewServer()

	return err
}

func (s *Server) initHttpServer() error {
	var err error

	s.sm = http.NewServeMux()
	s.http = &http.Server{
		Addr:    util.Localhost(s.c.Port.Voice),
		Handler: s.sm,
	}

	return err
}

func (s *Server) register() {
	proto.RegisterHelperServiceServer(s.serv, newHelper())
	proto.RegisterChatServiceServer(s.serv, newChat())

	v := newVoice()
	v.Register(s.sm)
}

// Run starts the networking servers.
//
// User can implement graceful shutdown via the context provided. All services
// stop on context cancelation.
func (s *Server) Run() error {
	if s.started {
		return errors.New("server already started")
	}
	s.started = true

	s.eg = &errgroup.Group{}

	s.startServers()

	err := s.eg.Wait()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if serr := s.stopServers(shutdownCtx); serr != nil && err == nil {
		return fmt.Errorf("shutdown error: %w", serr)
	}

	return err
}

func (s *Server) startServers() {
	s.eg.Go(func() error {
		if err := s.serv.Serve(s.lis); err != nil {
			if !errors.Is(err, grpc.ErrServerStopped) {
				return fmt.Errorf("gRPC server error: %w", err)
			}
		}
		return nil
	})

	s.eg.Go(func() error {
		if err := s.http.ListenAndServe(); err != nil {
			if !errors.Is(err, http.ErrServerClosed) {
				return fmt.Errorf("HTTP server error: %w", err)
			}
		}
		return nil
	})
}

func (s *Server) stopServers(ctx context.Context) error {
	s.serv.GracefulStop()
	if err := s.http.Shutdown(ctx); err != nil {
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	}
	return nil
}

// Shutdown stops the servers gracefully using the given context.
// This can be called manually (outside of Run) to trigger shutdown.
func (s *Server) Shutdown(ctx context.Context) error {
	if !s.started {
		return errors.New("server not running")
	}

	return s.stopServers(ctx)
}
