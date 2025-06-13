package provider

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/ggerganov/whisper.cpp/bindings/go/pkg/whisper"
	"github.com/ttn-nguyen42/sidecar/helper/pkg/config"
	"go.uber.org/zap"
)

type TranscriberProvider interface {
	GetTranscriber() whisper.Model
}

func (p *Provider) GetTranscriber() whisper.Model {
	return p.whisper
}

func (p *Provider) loadTranscriber() error {
	path, ok := isLocalWhisperExists(p.c)
	if !ok {
		return fmt.Errorf("local whisper.cpp model does not exist")
	}

	var err error
	p.whisper, err = whisper.New(path)
	if err != nil {
		return fmt.Errorf("failed to load whisper.cpp model")
	}

	logger.Info("loaded whisper.cpp transcriber", zap.String("path", path))

	return nil
}

func isLocalWhisperExists(c *config.Config) (path string, yes bool) {
	f := filepath.Join(c.Model.LocalPath, c.Model.Transcribe)
	info, err := os.Stat(f)

	if os.IsNotExist(err) {
		return "", false
	}

	if err != nil {
		logger.Error("failed to stat whisper.cpp model: %w", zap.Error(err))
		return "", false
	}

	logger.Info("local whisper.cpp model loaded", zap.Int64("size", info.Size()))
	return f, true
}
