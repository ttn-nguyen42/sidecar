#!/bin/bash

# Generate Go and Node.js code from proto files
# - helper/proto
# - app/proto

set -e # Exit on error

# Get the root directory of the project
ROOT_DIR="$(pwd)"

# Create output directories if they don't exist
mkdir -p "$ROOT_DIR/helper/proto"
mkdir -p "$ROOT_DIR/app/proto"

echo "Generating protobuf code..."

# Generate Python server/client code
echo "Generating Python code..."
python_out_dir="$ROOT_DIR/helper/proto"
python -m grpc_tools.protoc \
    --python_out="$python_out_dir" \
    --grpc_python_out="$python_out_dir" \
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
echo "Python code generated in: $ROOT_DIR/helper/proto"
echo "Node.js client code generated in: $ROOT_DIR/app/proto"
