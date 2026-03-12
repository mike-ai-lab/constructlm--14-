#!/bin/bash

# AI Provider Test Runner for Linux/Mac
# Usage: ./run-tests.sh

echo "========================================"
echo "AI Provider Model Validation Tests"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    echo ""
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "ERROR: .env.local file not found"
    echo "Please create .env.local with your API keys"
    echo "See TEST_GUIDE.md for instructions"
    echo ""
    exit 1
fi

echo "Starting tests..."
echo ""

# Run the test script
node test-ai-providers.mjs

# Capture exit code
EXIT_CODE=$?

echo ""
echo "========================================"
echo "Tests completed"
echo "========================================"
echo ""

exit $EXIT_CODE
