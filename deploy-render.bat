@echo off
echo ============================================
echo   MJNote Deploy Prep - Push to GitHub for Render
echo ============================================
echo.

cd /d "%~dp0"

REM 1) Check Git
where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git is not installed.
  echo Please install it from https://git-scm.com/downloads and run this again.
  echo After installing, close this window and open a new one.
  pause
  exit /b 1
)

REM 2) Init repo if needed
if not exist ".git" (
  echo [INFO] Initializing this folder as a Git repository...
  call git init
  call git branch -M main
)

REM 3) Commit changes
REM NOTE: set /p and its variable must NOT be read inside the same
REM parenthesized IF block, or the value freezes at the old value
REM (classic batch "delayed expansion" trap). Using goto instead.
call git add .
git diff --cached --quiet
if errorlevel 1 goto haschanges
echo [INFO] No changes to commit.
goto aftercommit

:haschanges
set "COMMIT_MSG="
set /p COMMIT_MSG=Enter a commit message, or just press Enter for default: 
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=MJNote update"
call git commit -m "%COMMIT_MSG%"

:aftercommit

REM 4) Check remote - GitHub - connection
REM Capture the actual URL text (not just whether "origin" exists as a name) -
REM a broken earlier run can leave an origin entry with an empty/invalid URL,
REM which would pass a simple existence check but still fail on push.
set "CURRENT_REMOTE="
for /f "delims=" %%i in ('git remote get-url origin 2^>nul') do set "CURRENT_REMOTE=%%i"
if "%CURRENT_REMOTE%"=="" goto needremote
goto haveremote

:needremote
git remote remove origin >nul 2>nul
echo.
echo ============================================
echo   ONE-TIME SETUP - Connect a GitHub repository
echo ============================================
echo   1. Go to https://github.com/new and create a new repository
echo      name example: mjnote-fullstack, Public or Private is fine
echo   2. Copy the repository URL shown
echo      example: https://github.com/yourname/mjnote-fullstack.git
echo ============================================
echo.
set "REPO_URL="
set /p REPO_URL=Paste the repository URL here and press Enter: 
if "%REPO_URL%"=="" (
  echo [ERROR] No URL entered. Run deploy-render.bat again and paste the repository URL.
  pause
  exit /b 1
)
call git remote add origin "%REPO_URL%"

:haveremote

REM 5) Push
echo.
echo Uploading to GitHub...
call git push -u origin main
if errorlevel 1 (
  echo.
  echo [ERROR] Push failed. See the error message above for details.
  echo Common causes: wrong repository URL, or you need to log in to GitHub
  echo when the browser/credential window pops up.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Upload complete!
echo ============================================
echo   ONE-TIME SETUP - Connect Render:
echo   1. Sign up at https://render.com - no card required
echo   2. New + then Blueprint, select the GitHub repo you just pushed
echo      render.yaml will be detected automatically
echo   3. Enter GEMINI_API_KEY and LAW_OC values, then click Apply
echo   4. Visit the deployed address - something.onrender.com
echo.
echo   Next time, just run deploy-render.bat again -
echo   it will push to GitHub and Render will auto-redeploy.
echo ============================================
echo.
pause
