#!/bin/bash

# Installs Whisper.cpp
PROJECT_ROOT=$(pwd)

brew install libomp

# Clone whisper.cpp repository
git clone https://github.com/ggml-org/whisper.cpp.git --depth 1
cd whisper.cpp

# Download base.en model
sh ./models/download-ggml-model.sh base.en
mkdir -p $PROJECT_ROOT/MODEL
mv models/ggml-base.en.bin $PROJECT_ROOT/MODEL/

# Compile libwhisper.a
cd bindings/go
make whisper

cd $PROJECT_ROOT
# Set C_INCLUDE_PATH, LIBRARY_PATH, GGML_METAL_PATH_RESOURCES
echo "C_INCLUDE_PATH=${PROJECT_ROOT}/whisper.cpp/include:${PROJECT_ROOT}/whisper.cpp/ggml/include" >>.env
echo "LIBRARY_PATH=${PROJECT_ROOT}/whisper.cpp/build_go/src:${PROJECT_ROOT}/whisper.cpp/build_go/ggml/src" >>.env
echo "GGML_METAL_PATH_RESOURCES=${PROJECT_ROOT}/whisper.cpp" >>.env

echo "Whisper.cpp model has been downloaded and built successfully"
