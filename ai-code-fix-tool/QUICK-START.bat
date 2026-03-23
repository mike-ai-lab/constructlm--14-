@echo off
echo ========================================
echo AI Code Fix Pro V3 - Quick Start
echo ========================================
echo.
echo Opening standalone version (no server needed)...
echo.

cd /d "%~dp0"

REM Open the standalone HTML file
start "" "standalone.html"

echo.
echo If the file doesn't open, manually open:
echo %~dp0standalone.html
echo.
pause
