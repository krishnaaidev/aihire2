#!/usr/bin/env bash

# AIHire Quick Launch Script
echo "========================================================"
echo "AIHire: Autonomous AI Interview & Evaluation Platform"
echo "========================================================"

# Determine workspace root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# 1. Start Backend
echo "[1/2] Starting FastAPI Backend on http://localhost:8000 ..."
PYTHONPATH="$ROOT_DIR/backend" "$ROOT_DIR/venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# 2. Start Frontend
echo "[2/2] Starting React Vite Frontend on http://localhost:5173 ..."
cd "$ROOT_DIR/frontend"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

echo ""
echo "🚀 AIHire is live and ready!"
echo "   - Web Interface:   http://localhost:5173"
echo "   - FastAPI Swagger: http://localhost:8000/docs"
echo "   - Health Check:    http://localhost:8000/api/health"
echo ""
echo "Demo Accounts:"
echo "   - Recruiter: recruiter@aihire.com / password123"
echo "   - Candidate: candidate@aihire.com / password123"
echo ""
echo "Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID; exit 0" SIGINT SIGTERM
wait
