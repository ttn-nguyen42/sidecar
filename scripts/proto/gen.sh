#!/bin/bash

set -e # Exit on error

# Get the root directory of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

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

# Create package.json if it doesn't exist
if [ ! -f "$ROOT_DIR/app/proto/package.json" ]; then
    echo "Creating package.json for proto files..."
    cat > "$ROOT_DIR/app/proto/package.json" << EOF
{
  "name": "sidecar-proto",
  "version": "1.0.0",
  "description": "Generated gRPC code for Sidecar",
  "main": "index.js",
  "dependencies": {
    "@grpc/grpc-js": "^1.10.0",
    "google-protobuf": "^3.21.0"
  }
}
EOF
fi

echo "Protobuf code generation complete!"
echo "Go server code generated in: $ROOT_DIR/helper/proto"
echo "Node.js client code generated in: $ROOT_DIR/app/proto"
echo ""
echo "To use the generated code in your Node.js application:"
echo "1. Install dependencies: cd $ROOT_DIR/app/proto && npm install"
echo "2. Import the services in your code:"
echo "   const grpc = require('@grpc/grpc-js');"
echo "   const protoLoader = require('@grpc/proto-loader');"
echo "   const proto = grpc.loadPackageDefinition(protoLoader.loadSync('chat.proto'));" 