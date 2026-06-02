@echo off
setlocal

echo ============================================
echo  MemoraX Setup
echo ============================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Node.js...
node --version
if errorlevel 1 (
    echo.
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js 20 or newer from https://nodejs.org/
    echo.
    goto :error
)
echo.

echo [2/4] Checking pnpm...
call pnpm --version >nul 2>&1
if errorlevel 1 (
    echo pnpm not found. Installing pnpm@9.0.0 globally...
    call npm.cmd install -g pnpm@9.0.0
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install pnpm via npm.
        echo Check your internet connection and try again.
        echo.
        goto :error
    )
    call pnpm --version >nul 2>&1
    if errorlevel 1 (
        echo.
        echo ERROR: pnpm was installed but is still not in PATH.
        echo Close this window, open a new terminal, and run setup.bat again.
        echo.
        goto :error
    )
    echo pnpm installed successfully.
) else (
    call pnpm --version
)
echo.

echo [3/4] Installing root dependencies (this may take a minute)...
call pnpm install
if errorlevel 1 (
    echo.
    echo ERROR: Root pnpm install failed.
    echo.
    goto :error
)
echo.

echo [4/4] Installing workspace dependencies...
call pnpm install
if errorlevel 1 (
    echo.
    echo ERROR: Workspace pnpm install failed.
    echo.
    goto :error
)
echo.

echo ============================================
echo  Setup completed successfully!
echo  Run start-dev.bat to launch the app.
echo ============================================
pause
exit /b 0

:error
echo ============================================
echo  Setup failed. See errors above.
echo ============================================
pause
exit /b 1
