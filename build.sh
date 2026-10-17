#!/usr/bin/env bash
# Cloud build script for Render / Railway / Cloud hosts
set -e

echo "=== Building Frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Installing Backend Dependencies ==="
pip install -r backend/requirements.txt

echo "=== Build Completed Successfully ==="
