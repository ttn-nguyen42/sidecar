#!/bin/bash

set -e # Exit on error

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get installed Go version
get_go_version() {
    if command_exists go; then
        go version | cut -d' ' -f3 | sed 's/go//'
    else
        echo "0.0.0"
    fi
}

# Function to add GOPATH/bin to PATH if not present
add_gopath_to_path() {
    # Get GOPATH
    if ! command_exists go; then
        echo "Go is not installed. Cannot determine GOPATH."
        return
    fi

    # Get GOPATH using 'go env'
    GOPATH=$(go env GOPATH)
    GOPATH_BIN="$GOPATH/bin"

    # Check if GOPATH/bin is already in PATH
    if [[ ":$PATH:" != *":$GOPATH_BIN:"* ]]; then
        echo "Adding $GOPATH_BIN to PATH..."
        # Add to both current session and .bashrc
        export PATH="$PATH:$GOPATH_BIN"
        if ! grep -q "export PATH.*$GOPATH_BIN" ~/.bashrc; then
            echo "export PATH=\"\$PATH:$GOPATH_BIN\"" >> ~/.bashrc
        fi
    else
        echo "$GOPATH_BIN is already in PATH"
    fi
}

# Function to install Go on macOS
install_go_macos() {
    if command_exists brew; then
        echo "Installing Go using Homebrew..."
        brew install go
    else
        echo "Homebrew not found. Please install Homebrew first:"
        echo "/bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
}

# Function to install Go on Linux
install_go_linux() {
    local GO_VERSION="1.24.2" # Latest stable version
    local ARCH=""

    # Detect architecture
    if [[ "$(uname -m)" == "x86_64" ]]; then
        ARCH="amd64"
    elif [[ "$(uname -m)" == "aarch64" ]]; then
        ARCH="arm64"
    else
        echo "Unsupported architecture: $(uname -m)"
        exit 1
    fi

    echo "Installing Go $GO_VERSION for $ARCH..."
    curl -OL "https://go.dev/dl/go${GO_VERSION}.linux-${ARCH}.tar.gz"
    sudo rm -rf /usr/local/go
    sudo tar -C /usr/local -xzf "go${GO_VERSION}.linux-${ARCH}.tar.gz"
    rm "go${GO_VERSION}.linux-${ARCH}.tar.gz"

    # Add Go to PATH if not already there
    if ! grep -q "/usr/local/go/bin" ~/.bashrc; then
        echo 'export PATH=$PATH:/usr/local/go/bin' >>~/.bashrc
        source ~/.bashrc
    fi
}

# Main installation logic
if ! command_exists go; then
    echo "Go is not installed. Installing..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        install_go_macos
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        install_go_linux
    else
        echo "Unsupported operating system: $OSTYPE"
        exit 1
    fi
else
    CURRENT_VERSION=$(get_go_version)
    echo "Go is already installed (version $CURRENT_VERSION)"
fi

# Add GOPATH/bin to PATH
add_gopath_to_path

# Verify installation
echo "Verifying Go installation..."
go version
