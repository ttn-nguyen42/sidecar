package service

import (
	"log/slog"
	"os"
	"time"
)

func initLogger(level string) *slog.Logger {
	var logLevel slog.Level
	switch level {
	case "debug":
		logLevel = slog.LevelDebug
	case "info":
		logLevel = slog.LevelInfo
	case "warn":
		logLevel = slog.LevelWarn
	case "error":
		logLevel = slog.LevelError
	default:
		logLevel = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{
		Level:       logLevel,
		ReplaceAttr: replaceAttr,
	}

	handler := slog.NewTextHandler(os.Stdout, opts)
	return slog.New(handler)
}

func replaceAttr(groups []string, a slog.Attr) slog.Attr {
	if a.Key == slog.TimeKey {
		if t, ok := a.Value.Any().(time.Time); ok {
			a.Value = slog.StringValue(t.Format("2006-01-02T15:04:05"))
		}
	}
	return a
}
