#!/usr/bin/env bash
# Render / Cloud Production Start Script
set -e

PORT="${PORT:-10000}"
export PYTHONUNBUFFERED=1
export PYTHONPATH="backend:$PYTHONPATH"

echo "=== AIHire Cloud Service Starting ==="
echo "Binding to 0.0.0.0:$PORT"

exec python -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --app-dir backend
