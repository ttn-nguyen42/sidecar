package service

import (
	"context"
	"flag"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/ttn-nguyen42/sidecar/helper/pkg/api"
	"github.com/ttn-nguyen42/sidecar/helper/pkg/config"
)

func Run() error {
	configPath := flag.String("config", "config.json", "Path to config file")
	flag.Parse()

	level := flag.String("level", "info", "Log level (debug, info, warn, error)")
	flag.Parse()

	logger := initLogger(*level)
	slog.SetDefault(logger)

	slog.Info("logger level", slog.String("level", *level))

	cfg, err := config.NewSource(*configPath)
	if err != nil {
		return err
	}

	api, err := api.NewServer(cfg)
	if err != nil {
		return err
	}

	signalCh := make(chan os.Signal, 1)
	signal.Notify(signalCh, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		slog.Debug("starting api servers")
		if err := api.Run(); err != nil {
			slog.Error("api server run failure", slog.String("err", err.Error()))
		}
	}()

	<-signalCh

	slog.Debug("api servers stopping")
	if err := api.Shutdown(context.Background()); err != nil {
		return err
	}

	slog.Debug("api servers shutdowns")

	return nil
}
