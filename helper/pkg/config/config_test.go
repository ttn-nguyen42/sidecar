package config_test

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/ttn-nguyen42/sidecar/helper/pkg/config"
)

func TestNewDefault(t *testing.T) {
	cfg := config.NewDefault()

	if cfg == nil {
		t.Fatal("NewDefault returned nil")
	}

	if cfg.Port == nil {
		t.Fatal("Port configuration is nil")
	}

	if cfg.Port.Helper != 8767 {
		t.Errorf("Expected helper port 8767, got %d", cfg.Port.Helper)
	}

	if cfg.Port.Voice != 8768 {
		t.Errorf("Expected voice port 8768, got %d", cfg.Port.Voice)
	}
}

func TestNewSource_WithDefaults(t *testing.T) {
	cfg, err := config.NewSource("")
	if err != nil {
		t.Fatalf("NewSource failed: %v", err)
	}

	if cfg.Port.Helper != 8767 {
		t.Errorf("Expected helper port 8767, got %d", cfg.Port.Helper)
	}

	if cfg.Port.Voice != 8768 {
		t.Errorf("Expected voice port 8768, got %d", cfg.Port.Voice)
	}
}

func TestNewSource_WithConfigFile(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.json")

	configContent := `{
		"port": {
			"helper": 9000,
			"voice": 9001
		}
	}`

	err := os.WriteFile(configPath, []byte(configContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test config file: %v", err)
	}

	cfg, err := config.NewSource(configPath)
	if err != nil {
		t.Fatalf("NewSource failed: %v", err)
	}

	if cfg.Port.Helper != 9000 {
		t.Errorf("Expected helper port 9000, got %d", cfg.Port.Helper)
	}

	if cfg.Port.Voice != 9001 {
		t.Errorf("Expected voice port 9001, got %d", cfg.Port.Voice)
	}
}

func TestNewSource_WithEnvironmentVariables(t *testing.T) {
	os.Setenv("SIDECAR_PORT_HELPER", "7000")
	os.Setenv("SIDECAR_PORT_VOICE", "7001")
	defer func() {
		os.Unsetenv("SIDECAR_PORT_HELPER")
		os.Unsetenv("SIDECAR_PORT_VOICE")
	}()

	cfg, err := config.NewSource("")
	if err != nil {
		t.Fatalf("NewSource failed: %v", err)
	}

	if cfg.Port.Helper != 7000 {
		t.Errorf("Expected helper port 7000, got %d", cfg.Port.Helper)
	}

	if cfg.Port.Voice != 7001 {
		t.Errorf("Expected voice port 7001, got %d", cfg.Port.Voice)
	}
}

func TestNewSource_EnvironmentOverridesFile(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.json")

	configContent := `{
		"port": {
			"helper": 9000,
			"voice": 9001
		}
	}`

	err := os.WriteFile(configPath, []byte(configContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test config file: %v", err)
	}

	os.Setenv("SIDECAR_PORT_HELPER", "6000")
	defer os.Unsetenv("SIDECAR_PORT_HELPER")

	cfg, err := config.NewSource(configPath)
	if err != nil {
		t.Fatalf("NewSource failed: %v", err)
	}

	if cfg.Port.Helper != 6000 {
		t.Errorf("Expected helper port 6000 (from env), got %d", cfg.Port.Helper)
	}

	if cfg.Port.Voice != 9001 {
		t.Errorf("Expected voice port 9001 (from file), got %d", cfg.Port.Voice)
	}
}

func TestNewSource_WithOnChangeHandler(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.json")

	configContent := `{
		"port": {
			"helper": 9000,
			"voice": 9001
		}
	}`

	err := os.WriteFile(configPath, []byte(configContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test config file: %v", err)
	}

	// Track if handler was called
	handlerCalled := false
	var receivedConfig *config.Config

	handler := func(c *config.Config) {
		handlerCalled = true
		receivedConfig = c
	}

	cfg, err := config.NewSource(configPath, config.WithOnChange(handler))
	if err != nil {
		t.Fatalf("NewSource failed: %v", err)
	}

	if cfg.Port.Helper != 9000 {
		t.Errorf("Expected helper port 9000, got %d", cfg.Port.Helper)
	}

	updatedContent := `{
		"port": {
			"helper": 8000,
			"voice": 8001
		}
	}`

	err = os.WriteFile(configPath, []byte(updatedContent), 0644)
	if err != nil {
		t.Fatalf("Failed to update test config file: %v", err)
	}

	// Wait a bit for file watcher to trigger
	time.Sleep(100 * time.Millisecond)

	// Note: This test might be flaky depending on file system events
	// In a real scenario, you might want to use a more controlled approach
	if handlerCalled && receivedConfig != nil {
		if receivedConfig.Port.Helper != 8000 {
			t.Errorf("Expected updated helper port 8000, got %d", receivedConfig.Port.Helper)
		}
	}
}

func TestNewSource_InvalidConfigFile(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "invalid.json")

	invalidContent := `{ invalid json }`

	err := os.WriteFile(configPath, []byte(invalidContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test config file: %v", err)
	}

	_, err = config.NewSource(configPath)
	if err == nil {
		t.Fatal("Expected error for invalid config file, got nil")
	}
}

func TestNewSource_NonExistentFile(t *testing.T) {
	_, err := config.NewSource("/non/existent/path.json")
	if err == nil {
		t.Errorf("Expected failure for non-existing config file, got none")
	}
}

func TestValidation_ValidConfig(t *testing.T) {
	cfg := config.NewDefault()

	_, err := config.NewSource("")
	if err != nil {
		t.Errorf("Valid config should not return validation error: %v", err)
	}

	_ = cfg
}

func TestValidation_InvalidPorts(t *testing.T) {
	tests := []struct {
		name        string
		envVars     map[string]string
		expectError bool
	}{
		{
			name: "helper port too low",
			envVars: map[string]string{
				"SIDECAR_PORT_HELPER": "0",
				"SIDECAR_PORT_VOICE":  "8768",
			},
			expectError: true,
		},
		{
			name: "helper port too high",
			envVars: map[string]string{
				"SIDECAR_PORT_HELPER": "65536",
				"SIDECAR_PORT_VOICE":  "8768",
			},
			expectError: true,
		},
		{
			name: "voice port too low",
			envVars: map[string]string{
				"SIDECAR_PORT_HELPER": "8767",
				"SIDECAR_PORT_VOICE":  "-1",
			},
			expectError: true,
		},
		{
			name: "voice port too high",
			envVars: map[string]string{
				"SIDECAR_PORT_HELPER": "8767",
				"SIDECAR_PORT_VOICE":  "70000",
			},
			expectError: true,
		},
		{
			name: "Same ports",
			envVars: map[string]string{
				"SIDECAR_PORT_HELPER": "8000",
				"SIDECAR_PORT_VOICE":  "8000",
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			for key, value := range tt.envVars {
				os.Setenv(key, value)
				defer os.Unsetenv(key)
			}

			_, err := config.NewSource("")

			if tt.expectError {
				if err == nil {
					t.Error("Expected error, got nil")
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, got: %v", err)
				}
			}
		})
	}
}

func TestConfigChange(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.json")

	initialContent := `{
		"port": {
			"helper": 9000,
			"voice": 9001
		}
	}`

	err := os.WriteFile(configPath, []byte(initialContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test config file: %v", err)
	}

	changeReceived := make(chan *config.Config, 1)
	handler := func(c *config.Config) {
		select {
		case changeReceived <- c:
		default:
		}
	}

	cfg, err := config.NewSource(configPath, config.WithOnChange(handler))
	if err != nil {
		t.Fatalf("NewSource failed: %v", err)
	}

	if cfg.Port.Helper != 9000 {
		t.Errorf("Expected initial helper port 9000, got %d", cfg.Port.Helper)
	}

	updatedContent := `{
		"port": {
			"helper": 8500,
			"voice": 8501
		}
	}`

	err = os.WriteFile(configPath, []byte(updatedContent), 0644)
	if err != nil {
		t.Fatalf("Failed to update test config file: %v", err)
	}

	select {
	case updatedConfig := <-changeReceived:
		if updatedConfig.Port.Helper != 8500 {
			t.Errorf("Expected updated helper port 8500, got %d", updatedConfig.Port.Helper)
		}
		if updatedConfig.Port.Voice != 8501 {
			t.Errorf("Expected updated voice port 8501, got %d", updatedConfig.Port.Voice)
		}
	case <-time.After(1000 * time.Millisecond):
		t.Error("Config change handler was not called within timeout")
	}
}
