#!/bin/bash

# Clean up
echo "Cleaning up..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Install dependencies
echo "Installing dependencies..."
npm install --no-package-lock

echo "Build completed successfully!"
