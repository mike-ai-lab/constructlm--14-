@echo off
echo Setting up Python environment...

REM Check if venv exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo Running streaming test...
echo.
python streaming_cerebras_test.py

pause
