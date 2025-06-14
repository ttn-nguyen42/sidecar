#!/bin/bash

# Generate Go and Node.js code from proto files
# - helper/proto
# - app/proto

set -e # Exit on error

# Get the root directory of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Create output directories if they don't exist
mkdir -p "$ROOT_DIR/helper/proto"
mkdir -p "$ROOT_DIR/app/proto"

echo "Generating protobuf code..."

# Generate Go server code
echo "Generating Go server code..."
protoc \
    --go_out="$ROOT_DIR/helper/proto" \
    --go_opt=paths=source_relative \
    --go-grpc_out="$ROOT_DIR/helper/proto" \
    --go-grpc_opt=paths=source_relative \
    -I="$ROOT_DIR/proto" \
    "$ROOT_DIR/proto"/*.proto

# Generate Node.js client code
echo "Generating Node.js client code..."
grpc_tools_node_protoc \
    --js_out=import_style=commonjs,binary:"$ROOT_DIR/app/proto" \
    --grpc_out=grpc_js:"$ROOT_DIR/app/proto" \
    -I="$ROOT_DIR/proto" \
    "$ROOT_DIR/proto"/*.proto

echo "Protobuf code generation complete!"
echo "Go server code generated in: $ROOT_DIR/helper/proto"
echo "Node.js client code generated in: $ROOT_DIR/app/proto"
