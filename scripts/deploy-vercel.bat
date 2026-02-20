@echo off
chcp 65001 >nul
echo 🚀 Arcade Hub - Vercel Deployment Script
echo =========================================
echo.

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Vercel CLI not found.
    echo Installing Vercel CLI globally...
    npm install -g vercel
    if errorlevel 1 (
        echo ❌ Failed to install Vercel CLI
        echo Please install manually: npm install -g vercel
        exit /b 1
    )
)

echo ✅ Vercel CLI found
echo.

REM Check if logged in
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo 🔑 Please login to Vercel:
    vercel login
    if errorlevel 1 (
        echo ❌ Login failed
        exit /b 1
    )
)

echo ✅ Logged in to Vercel
echo.

REM Show current project info
echo 📋 Project Information:
vercel list 2>nul | findstr "arcade"
echo.

REM Menu
echo 🚀 Deployment Options:
echo.
echo 1. Deploy to Production
echo 2. Deploy Preview (test before production)
echo 3. Check Deployment Status
echo 4. Open Vercel Dashboard
echo 5. View Production Logs
echo 6. Configure Environment Variables
echo 7. Exit
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Deploying to PRODUCTION...
    echo.
    vercel --prod
    if errorlevel 1 (
        echo ❌ Deployment failed
    ) else (
        echo ✅ Deployment successful!
        echo.
        echo 🌐 Your site is live at:
        vercel ls 2>nul | findstr "Production"
    )
    goto end
)

if "%choice%"=="2" (
    echo.
    echo 🔍 Deploying PREVIEW...
    echo.
    vercel
    if errorlevel 1 (
        echo ❌ Deployment failed
    ) else (
        echo ✅ Preview deployed!
    )
    goto end
)

if "%choice%"=="3" (
    echo.
    echo 📊 Checking deployment status...
    vercel ls
    goto end
)

if "%choice%"=="4" (
    start https://vercel.com/dashboard
    goto end
)

if "%choice%"=="5" (
    echo.
    echo 📜 Opening production logs...
    vercel logs --production
    goto end
)

if "%choice%"=="6" (
    echo.
    echo ⚙️  Environment Variables:
    echo Current environment variables:
    vercel env ls
    echo.
    echo To add a new environment variable:
    echo   vercel env add VARIABLE_NAME
    goto end
)

if "%choice%"=="7" (
    exit /b 0
)

echo Invalid choice

:end
echo.
pause
