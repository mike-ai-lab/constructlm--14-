@echo off
echo ========================================
echo AI Code Fix Pro V3 - Modular Version
echo ========================================
echo.
echo Starting server with .env.local support...
echo.
echo IMPORTANT: Navigate to http://localhost:8001/
echo (API key will be loaded from .env.local)
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the Node.js server
echo [SUCCESS] Starting Node.js server...
echo.
start http://localhost:8001/
node server.js

:end
