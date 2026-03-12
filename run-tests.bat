@echo off
REM AI Provider Test Runner for Windows
REM Double-click this file to run tests

echo ========================================
echo AI Provider Model Validation Tests
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if .env.local exists
if not exist .env.local (
    echo ERROR: .env.local file not found
    echo Please create .env.local with your API keys
    echo See TEST_GUIDE.md for instructions
    echo.
    pause
    exit /b 1
)

echo Starting tests...
echo.

REM Run the test script
node test-ai-providers.mjs

echo.
echo ========================================
echo Tests completed
echo ========================================
echo.
pause
