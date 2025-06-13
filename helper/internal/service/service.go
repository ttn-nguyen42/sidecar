package service

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/ttn-nguyen42/sidecar/helper/internal/core/provider"
	"github.com/ttn-nguyen42/sidecar/helper/pkg/api"
	"github.com/ttn-nguyen42/sidecar/helper/pkg/config"
)

func Run() error {
	configPath := flag.String("config", "", "Path to config file")
	level := flag.String("level", "info", "Log level (debug, info, warn, error)")
	flag.Parse()

	logger, err := initZapLogger(*level)
	if err != nil {
		return fmt.Errorf("failed to init logger: %w", err)
	}
	defer logger.Sync()

	zap.ReplaceGlobals(logger)

	logger.Info("logger level", zap.String("level", *level))

	cfg, err := config.NewSource(*configPath)
	if err != nil {
		logger.Error("failed to load config", zap.Error(err))
		return err
	}

	apiServer, err := api.NewServer(cfg)
	if err != nil {
		logger.Error("failed to create api server", zap.Error(err))
		return err
	}

	prov, err := initProvider(cfg)
	if err != nil {
		logger.Error("failed to initialize provider", zap.Error(err))
		return err
	}
	_ = prov

	signalCh := make(chan os.Signal, 1)
	signal.Notify(signalCh, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logger.Info("starting api servers", zap.Any("ports", cfg.Port))
		if err := apiServer.Run(); err != nil {
			logger.Error("api server run failure", zap.Error(err))
		}
	}()

	<-signalCh

	logger.Info("api servers stopping")
	if err := apiServer.Shutdown(context.Background()); err != nil {
		logger.Error("api server shutdown failure", zap.Error(err))
		return err
	}

	logger.Debug("api servers shutdown")

	return nil
}

func initZapLogger(level string) (*zap.Logger, error) {
	var zapLevel zapcore.Level
	switch level {
	case "debug":
		zapLevel = zapcore.DebugLevel
	case "info":
		zapLevel = zapcore.InfoLevel
	case "warn":
		zapLevel = zapcore.WarnLevel
	case "error":
		zapLevel = zapcore.ErrorLevel
	default:
		zapLevel = zapcore.InfoLevel
	}

	cfg := zap.NewProductionConfig()
	cfg.Level = zap.NewAtomicLevelAt(zapLevel)
	cfg.EncoderConfig.TimeKey = "time"
	cfg.Encoding = "console"
	cfg.EncoderConfig.EncodeTime = zapcore.RFC3339TimeEncoder

	logger, err := cfg.Build()
	if err != nil {
		return nil, err
	}
	return logger, nil
}

func initProvider(c *config.Config) (*provider.Provider, error) {
	p := provider.NewProvider(c)

	if err := p.Load(); err != nil {
		return nil, err
	}

	return p, nil
}
