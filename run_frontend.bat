@echo off
title StockAI - Frontend Server
cd /d "%~dp0frontend"
echo ========================================================
echo Starting StockAI Frontend (React + Vite on http://localhost:5173)
echo ========================================================
where npm >nul 2>nul
if %ERRORLEVEL% equ 0 (
    call npm run dev -- --host
) else if exist "%ProgramFiles%\nodejs\npm.cmd" (
    call "%ProgramFiles%\nodejs\npm.cmd" run dev -- --host
) else (
    echo [ERROR] Node.js / npm not found!
    echo Please install Node.js from https://nodejs.org/
)
pause
