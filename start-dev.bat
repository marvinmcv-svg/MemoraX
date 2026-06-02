@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo  MemoraX Dev Server
echo ============================================
echo.
echo Starting backend (3001), web (3000), and other services in a new window.
echo Close the new window or press Ctrl+C there to stop the dev server.
echo.

start "MemoraX" cmd /k "pnpm dev"

exit /b 0
