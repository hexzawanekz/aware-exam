@echo off
setlocal enabledelayedexpansion

REM N8N Exam Proctoring System - Quick Start Script (Windows)
REM This script will set up and run the entire system

echo 🚀 N8N Exam Proctoring System - Quick Start
echo =============================================

REM Check if required tools are installed
echo [INFO] Checking system requirements...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm and try again.
    pause
    exit /b 1
)

echo [SUCCESS] All requirements satisfied!

REM Setup configuration
echo [INFO] Setting up configuration...

if not exist "config.env" (
    copy "config.env.example" "config.env" >nul
    echo [WARNING] Created config.env from template. Please edit it with your actual values:
    echo [WARNING] - GOOGLE_AI_API_KEY (required)
    echo [WARNING] - SMTP_USER and SMTP_PASSWORD (for email notifications)
    echo.
    echo Press Enter to continue after editing config.env...
    pause >nul
) else (
    echo [SUCCESS] config.env already exists
)

REM Setup backend
echo [INFO] Setting up backend...

cd backend

REM Create virtual environment if it doesn't exist
if not exist ".venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call .venv\Scripts\activate.bat

REM Install requirements
echo [INFO] Installing Python dependencies...
pip install -r requirements.txt

echo [SUCCESS] Backend setup complete!
cd ..

REM Setup frontend
echo [INFO] Setting up frontend...

cd frontend

REM Install npm dependencies
if not exist "node_modules" (
    echo [INFO] Installing Node.js dependencies...
    npm install
) else (
    echo [INFO] Node.js dependencies already installed
)

echo [SUCCESS] Frontend setup complete!
cd ..

REM Install N8N globally
echo [INFO] Setting up N8N...

REM Check if N8N is already installed
n8n --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing N8N globally...
    npm install -g n8n
) else (
    echo [SUCCESS] N8N is already installed
)

REM Create log directory
if not exist "logs" mkdir logs

REM Create stop script
echo [INFO] Creating stop script...
(
echo @echo off
echo echo 🛑 Stopping N8N Exam Proctoring System services...
echo.
echo REM Stop processes by reading PID files
echo if exist "logs\backend.pid" ^(
echo     set /p BACKEND_PID=^<logs\backend.pid
echo     taskkill /PID %%BACKEND_PID%% /F ^>nul 2^>^&1
echo     del logs\backend.pid
echo     echo Stopped backend server
echo ^)
echo.
echo if exist "logs\frontend.pid" ^(
echo     set /p FRONTEND_PID=^<logs\frontend.pid
echo     taskkill /PID %%FRONTEND_PID%% /F ^>nul 2^>^&1
echo     del logs\frontend.pid
echo     echo Stopped frontend server
echo ^)
echo.
echo if exist "logs\n8n.pid" ^(
echo     set /p N8N_PID=^<logs\n8n.pid
echo     taskkill /PID %%N8N_PID%% /F ^>nul 2^>^&1
echo     del logs\n8n.pid
echo     echo Stopped N8N server
echo ^)
echo.
echo REM Also kill by process name as backup
echo taskkill /IM "python.exe" /F ^>nul 2^>^&1
echo taskkill /IM "node.exe" /F ^>nul 2^>^&1
echo.
echo echo ✅ All services stopped!
echo pause
) > stop-services.bat

REM Start all services
echo [INFO] Starting all services...

REM Start backend
echo [INFO] Starting backend server...
cd backend
start /B cmd /c "call .venv\Scripts\activate.bat && python main.py > ..\logs\backend.log 2>&1"
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo [INFO] Starting frontend server...
cd frontend
start /B cmd /c "npm start > ..\logs\frontend.log 2>&1"
cd ..

REM Wait a moment for frontend to start
timeout /t 3 /nobreak >nul

REM Start N8N
echo [INFO] Starting N8N server...
start /B cmd /c "n8n start > logs\n8n.log 2>&1"

echo [SUCCESS] All services started!

REM Display service URLs
echo.
echo 🎉 Setup Complete! Services are running:
echo ========================================
echo 📱 Frontend:    http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo ⚙️  N8N:        http://localhost:5678
echo.
echo 📝 Logs are available in the 'logs' directory
echo.
echo To stop all services, run: stop-services.bat
echo.

echo [INFO] Quick start completed successfully!
echo [WARNING] Remember to configure your API keys in config.env
echo [WARNING] Import N8N workflows from the workflows/ directory

echo.
echo Press any key to open the frontend in your browser...
pause >nul

REM Open frontend in default browser
start http://localhost:3000

echo.
echo Services are running in the background.
echo Use stop-services.bat to stop all services when done.
pause 