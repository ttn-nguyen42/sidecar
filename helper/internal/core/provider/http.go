package provider

import (
	"net/http"
	"time"

	"github.com/ttn-nguyen42/sidecar/helper/pkg/config"
	"go.uber.org/zap"
)

var logger = zap.L()

type HttpProvider interface {
	GetHttpClient() (*http.Client, error)
}

func (p *Provider) GetHttpClient() (*http.Client, error) {
	return getHttpClient(p.c), nil
}

func (p *Provider) initHttpClient() {
	p.client = getHttpClient(p.c)
}

type loggingRoundTripper struct {
	base http.RoundTripper
}

func (lrt *loggingRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	start := time.Now()

	resp, err := lrt.base.RoundTrip(req)

	logger.Debug("http request",
		zap.String("method", req.Method),
		zap.String("path", req.URL.Path),
		zap.Int64("ms", time.Since(start).Milliseconds()),
		zap.Int64("reqsize", req.ContentLength),
		zap.Int64("respsize", resp.ContentLength),
	)

	return resp, err
}

func getLoggedRoundTripper() http.RoundTripper {
	return &loggingRoundTripper{base: http.DefaultTransport}
}

func getHttpClient(c *config.Config) *http.Client {
	return &http.Client{
		Timeout:   time.Second * 15,
		Transport: getLoggedRoundTripper(),
	}
}
