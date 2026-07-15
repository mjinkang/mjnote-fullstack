@echo off
echo ============================================
echo   MJNote Server Startup
echo ============================================
echo.

cd /d "%~dp0"

REM 1) Check Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo Please install it from https://nodejs.org - LTS version - and run this again.
  pause
  exit /b 1
)

REM 2) Check .env file
if not exist ".env" (
  echo [INFO] .env file not found. Creating it from .env.example...
  copy ".env.example" ".env" >nul
  echo.
  echo [IMPORTANT] Notepad will open .env - please fill in your real
  echo             GEMINI_API_KEY and LAW_OC values, save, close it,
  echo             then run startup.bat again.
  echo.
  notepad ".env"
  pause
  exit /b 0
)

REM 3) Install dependencies if needed
if not exist "node_modules" (
  echo [INFO] First run detected - installing packages, this may take a few minutes...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Package installation failed.
    pause
    exit /b 1
  )
)

REM 4) Start server
echo.
echo Starting server... open this address in your browser:
echo   http://localhost:3000
echo.
echo Closing this window stops the server. Press Ctrl+C to stop manually.
echo.

start "" "http://localhost:3000"
call npm start

pause
