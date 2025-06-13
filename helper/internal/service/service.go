package service

import (
	"context"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/ttn-nguyen42/sidecar/helper/pkg/api"
	"github.com/ttn-nguyen42/sidecar/helper/pkg/config"
)

func Run() error {
	configPath := flag.String("config", "config.json", "Path to config file")
	flag.Parse()

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
		if err := api.Run(); err != nil {
			log.Printf("api server run failure: %s", err)
		}
	}()

	<-signalCh
	if err := api.Shutdown(context.Background()); err != nil {
		return err
	}

	return nil
}
