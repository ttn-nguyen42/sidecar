package api_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/ttn-nguyen42/sidecar/helper/pkg/api"
	"github.com/ttn-nguyen42/sidecar/helper/pkg/config"
)

func TestRun_GracefulShutdownOnClose(t *testing.T) {
	cfg := &config.Config{
		Port: &config.Port{
			Helper: 19002,
			Voice:  19003,
		},
	}

	done := make(chan struct{})

	s, err := api.NewServer(cfg)
	assert.NoError(t, err)

	go func() {
		err := s.Run()
		assert.NoError(t, err)
		close(done)
	}()

	time.Sleep(500 * time.Millisecond)
	err = s.Shutdown(context.Background())
	assert.NoError(t, err)

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Error("server did not shut down gracefully on Close()")
	}
}
