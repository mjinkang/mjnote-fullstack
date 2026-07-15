@echo off
echo ============================================
echo   MJNote Deploy - Railway
echo ============================================
echo.

cd /d "%~dp0"

REM 1) Check Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org
  pause
  exit /b 1
)

REM 2) Check Railway CLI - install if missing
where railway >nul 2>nul
if errorlevel 1 (
  echo [INFO] Railway CLI not found - installing...
  call npm install -g @railway/cli
  if errorlevel 1 (
    echo [ERROR] Failed to install Railway CLI.
    pause
    exit /b 1
  )
)

REM 3) Check login
railway whoami >nul 2>nul
if errorlevel 1 (
  echo [INFO] Railway login required. A browser window will open...
  call railway login
  if errorlevel 1 (
    echo [ERROR] Login failed.
    pause
    exit /b 1
  )
)

REM 4) Check project link - create new one if first run
railway status >nul 2>nul
if errorlevel 1 (
  echo.
  echo [INFO] This folder is not linked to a Railway project yet.
  echo        Creating a new project...
  call railway init -n "mjnote-fullstack"
  echo.
  echo ============================================
  echo   ONE-TIME SETUP - do this once for the first deploy:
  echo ============================================
  echo   1. Go to https://railway.app, open the project you just created
  echo   2. In the Variables tab, add:
  echo        GEMINI_API_KEY = your Gemini API key
  echo        LAW_OC         = 7788
  echo   3. Settings then Networking then Generate Domain to get a URL
  echo   4. When done, press Enter here to continue.
  echo ============================================
  echo.
  pause
)

REM 5) Deploy
echo.
echo Deploying... this can take a few minutes.
echo.
call railway up

echo.
echo ============================================
echo   Deploy complete! Run "railway open" to view
echo   the dashboard and find your deployed URL.
echo ============================================
echo.
pause
