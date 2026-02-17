#!/bin/bash

# FFmpeg installation script for ReelForge Agent
# Run this script before starting the agent locally

set -e

echo "🎬 Setting up FFmpeg for ReelForge Agent..."

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if command -v brew &> /dev/null; then
        echo "Installing FFmpeg via Homebrew..."
        brew install ffmpeg
    else
        echo "Homebrew not found. Install from https://brew.sh"
        exit 1
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v apt-get &> /dev/null; then
        echo "Installing FFmpeg via apt..."
        sudo apt-get update
        sudo apt-get install -y ffmpeg
    elif command -v yum &> /dev/null; then
        echo "Installing FFmpeg via yum..."
        sudo yum install -y ffmpeg
    elif command -v dnf &> /dev/null; then
        echo "Installing FFmpeg via dnf..."
        sudo dnf install -y ffmpeg
    else
        echo "Please install FFmpeg manually for your Linux distribution"
        exit 1
    fi
else
    echo "Unsupported OS: $OSTYPE"
    echo "Please install FFmpeg manually from https://ffmpeg.org/download.html"
    exit 1
fi

# Verify installation
if command -v ffmpeg &> /dev/null; then
    VERSION=$(ffmpeg -version | head -n1)
    echo "✅ FFmpeg installed successfully!"
    echo "   $VERSION"
else
    echo "❌ FFmpeg installation failed"
    exit 1
fi

echo ""
echo "✅ Setup complete! You can now start the Shade agent."
