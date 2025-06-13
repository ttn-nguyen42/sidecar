package config

import (
	"errors"
	"fmt"
	"strings"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"
)

type Config struct {
	Port *Port `mapstructure:"port"`
}

type Port struct {
	Helper int `mapstructure:"helper"`
	Voice  int `mapstructure:"voice"`
}

// NewDefault creates a new config with default values
func NewDefault() *Config {
	return newDefault()
}

func newDefault() *Config {
	return &Config{
		Port: &Port{
			Helper: 8767,
			Voice:  8768,
		},
	}
}

func setDefaults(v *viper.Viper, d *Config) {
	v.SetDefault("port.helper", d.Port.Helper)
	v.SetDefault("port.voice", d.Port.Voice)
}

// NewSource creates a config by reading from environment variables and config file
// It merges with defaults, with the following precedence (highest to lowest):
//
//  1. Environment variables
//  2. Config file
//  3. Defaults
func NewSource(path string, options ...Option) (*Config, error) {
	o := newOptions(options...)
	v := setupViper()

	setDefaults(v, newDefault())

	if err := loadConfigFile(v, path, o); err != nil {
		return nil, err
	}

	config, err := unmarshalConfig(v)
	if err != nil {
		return nil, err
	}

	if err := validate(config); err != nil {
		return nil, fmt.Errorf("config validation failed: %w", err)
	}

	return config, nil
}

func setupViper() *viper.Viper {
	v := viper.New()
	v.SetEnvPrefix("SIDECAR")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()
	v.AllowEmptyEnv(true)

	return v
}

func loadConfigFile(v *viper.Viper, path string, o *Options) error {
	if len(path) == 0 {
		return nil
	}

	v.SetConfigFile(path)
	v.SetConfigType("json")

	if err := v.ReadInConfig(); err != nil {
		var notFoundErr viper.ConfigFileNotFoundError
		if !errors.As(err, &notFoundErr) {
			return fmt.Errorf("failed to read config file: %w", err)
		}
	}

	setupConfigWatch(v, o.OnChange)

	return nil
}

func unmarshalConfig(v *viper.Viper) (*Config, error) {
	var config Config
	if err := v.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}
	return &config, nil
}

func setupConfigWatch(v *viper.Viper, handler OnChangeHandler) {
	v.OnConfigChange(func(e fsnotify.Event) {
		var config Config
		if err := v.Unmarshal(&config); err != nil {
			return
		}

		if err := validate(&config); err != nil {
			return
		}

		handler(&config)
	})
	v.WatchConfig()
}

func validate(c *Config) error {
	if c.Port == nil {
		return fmt.Errorf("port configuration is required")
	}

	if c.Port.Helper <= 0 || c.Port.Helper > 65535 {
		return fmt.Errorf("invalid helper port: %d (must be between 1-65535)", c.Port.Helper)
	}

	if c.Port.Voice <= 0 || c.Port.Voice > 65535 {
		return fmt.Errorf("invalid voice port: %d (must be between 1-65535)", c.Port.Voice)
	}

	if c.Port.Helper == c.Port.Voice {
		return fmt.Errorf("helper and voice ports cannot be the same: %d", c.Port.Helper)
	}

	return nil
}
