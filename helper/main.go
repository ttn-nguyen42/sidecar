package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"sync"

	"github.com/ttn-nguyen42/sidecar/helper/pkg/config"
)

var (
	cancel context.CancelFunc
	wg     sync.WaitGroup
	mu     sync.Mutex
	closed bool
)

func Run(ctx context.Context, cfg *config.Config) error {
	mu.Lock()
	if closed {
		mu.Unlock()
		return fmt.Errorf("service is closed")
	}

	ctx, cancel = context.WithCancel(ctx)
	mu.Unlock()

	wg.Add(2)
	go startHelperService(ctx, cfg.Port.Helper)
	go startVoiceService(ctx, cfg.Port.Voice)

	<-ctx.Done()
	wg.Wait()
	return nil
}

func Close() error {
	mu.Lock()
	defer mu.Unlock()

	if closed {
		return nil
	}

	closed = true
	if cancel != nil {
		cancel()
	}
	return nil
}

func startHelperService(ctx context.Context, port int) {
	defer wg.Done()

	addr := fmt.Sprintf(":%d", port)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		log.Printf("Failed to start helper service on %s: %v", addr, err)
		return
	}
	defer listener.Close()

	go func() {
		<-ctx.Done()
		listener.Close()
	}()

	for {
		conn, err := listener.Accept()
		if err != nil {
			select {
			case <-ctx.Done():
				return
			default:
				continue
			}
		}
		go func(c net.Conn) {
			defer c.Close()
		}(conn)
	}
}

func startVoiceService(ctx context.Context, port int) {
	defer wg.Done()

	addr := fmt.Sprintf(":%d", port)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		log.Printf("Failed to start voice service on %s: %v", addr, err)
		return
	}
	defer listener.Close()

	go func() {
		<-ctx.Done()
		listener.Close()
	}()

	for {
		conn, err := listener.Accept()
		if err != nil {
			select {
			case <-ctx.Done():
				return
			default:
				continue
			}
		}
		go func(c net.Conn) {
			defer c.Close()
		}(conn)
	}
}
