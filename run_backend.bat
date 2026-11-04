@echo off
chcp 65001 >nul
title StockAI - Backend Server
cd /d "%~dp0backend"
echo ========================================================
echo Starting StockAI Backend (FastAPI on http://localhost:8000)
echo ========================================================
set PYTHONIOENCODING=utf-8
if exist "..\.venv\Scripts\python.exe" (
    "..\.venv\Scripts\python.exe" -m uvicorn app.main:app --port 8000 --host 0.0.0.0
) else (
    python -m uvicorn app.main:app --port 8000 --host 0.0.0.0
)
pause
