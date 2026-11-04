@echo off
title StockAI - Launch All
echo ========================================================
echo Launching StockAI Trading System
echo Backend:  http://localhost:8000 (API & Docs: http://localhost:8000/docs)
echo Frontend: http://localhost:5173
echo ========================================================
start "StockAI Backend" cmd /k "run_backend.bat"
timeout /t 3 /nobreak >nul
start "StockAI Frontend" cmd /k "run_frontend.bat"
echo.
echo Both servers are launching in separate windows!
echo Once loaded, open your browser at: http://localhost:5173
pause
