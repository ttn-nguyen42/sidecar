#!/bin/bash

set -e # Exit on error

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get installed protoc version
get_protoc_version() {
    if command_exists protoc; then
        protoc --version | cut -d' ' -f2
    else
        echo "0.0.0"
    fi
}

# Detect OS and architecture
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if [[ "$(uname -m)" == "arm64" ]]; then
        # Apple Silicon
        PLATFORM="osx-aarch_64"
    else
        # Intel Mac
        PLATFORM="osx-x86_64"
    fi
    INSTALL_DIR="/usr/local"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    PLATFORM="linux-x86_64"
    INSTALL_DIR="/usr/local"
else
    echo "Unsupported operating system: $OSTYPE"
    exit 1
fi

# Install protoc compiler
PROTOC_VERSION=31.1
CURRENT_VERSION=$(get_protoc_version)

if [[ "$CURRENT_VERSION" != "$PROTOC_VERSION" ]]; then
    echo "Installing/Updating protoc to version $PROTOC_VERSION..."
    PROTOC_ZIP=protoc-${PROTOC_VERSION}-${PLATFORM}.zip
    curl -OL https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOC_VERSION}/$PROTOC_ZIP
    sudo unzip -o $PROTOC_ZIP -d $INSTALL_DIR bin/protoc
    sudo unzip -o $PROTOC_ZIP -d $INSTALL_DIR 'include/*'
    rm -f $PROTOC_ZIP
else
    echo "protoc version $PROTOC_VERSION is already installed"
fi

# Install Node.js plugins for protoc
echo "Installing/Updating Node.js plugins..."
npm install -g grpc-tools

# Install Python plugins for protoc
echo "Installing/Updating Python plugins..."
pip3 install --upgrade grpcio grpcio-tools

# Verify installations
echo "Verifying installations..."
protoc --version
which grpc_tools_node_protoc
