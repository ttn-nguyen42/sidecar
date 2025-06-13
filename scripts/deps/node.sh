#!/bin/bash

set -e # Exit on error

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get installed Node version
get_node_version() {
    if command_exists node; then
        node --version | sed 's/v//'
    else
        echo "0.0.0"
    fi
}

# Function to install Node on macOS
install_node_macos() {
    if command_exists brew; then
        echo "Installing Node.js using Homebrew..."
        brew install node
    else
        echo "Homebrew not found. Please install Homebrew first:"
        echo "/bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
}

# Function to install Node on Linux
install_node_linux() {
    local NODE_VERSION="24.2.0"  # Latest LTS version
    local ARCH=""
    
    # Detect architecture
    if [[ "$(uname -m)" == "x86_64" ]]; then
        ARCH="x64"
    elif [[ "$(uname -m)" == "aarch64" ]]; then
        ARCH="arm64"
    else
        echo "Unsupported architecture: $(uname -m)"
        exit 1
    fi

    echo "Installing Node.js $NODE_VERSION for $ARCH..."
    
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    
    # Install Node.js
    sudo apt-get install -y nodejs

    # Verify installation
    if ! command_exists node; then
        echo "Failed to install Node.js"
        exit 1
    fi
}

# Main installation logic
if ! command_exists node; then
    echo "Node.js is not installed. Installing..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        install_node_macos
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        install_node_linux
    else
        echo "Unsupported operating system: $OSTYPE"
        exit 1
    fi
else
    CURRENT_VERSION=$(get_node_version)
    echo "Node.js is already installed (version $CURRENT_VERSION)"
fi

# Install npm if not present
if ! command_exists npm; then
    echo "npm is not installed. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install npm
    else
        sudo apt-get install -y npm
    fi
fi

# Verify installation
echo "Verifying Node.js installation..."
node --version
npm --version
