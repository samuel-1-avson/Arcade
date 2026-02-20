@echo off
chcp 65001 >nul
echo 🔥 Arcade Hub Backend Deployment Helper
echo =========================================
echo.

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI not found.
    echo Install with: npm install -g firebase-tools
    exit /b 1
)

echo ✅ Firebase CLI found
echo.

REM Show current project
echo 📋 Current Firebase Project:
firebase use
echo.

REM Menu
echo 🚀 Deployment Options:
echo.
echo 1. Deploy Firestore Rules ONLY
echo 2. Deploy Cloud Functions ONLY
echo 3. Deploy Hosting ONLY
echo 4. Deploy Everything
echo 5. Test Firestore Rules (emulator)
echo 6. Test Functions Locally (emulator)
echo 7. Open Firebase Console
echo 8. Check Connection Status
echo 9. Exit
echo.

set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" (
    echo.
    echo Deploying Firestore Rules...
    firebase deploy --only firestore:rules
    goto end
)

if "%choice%"=="2" (
    echo.
    echo Deploying Cloud Functions...
    cd functions
    call npm install
    cd ..
    firebase deploy --only functions
    goto end
)

if "%choice%"=="3" (
    echo.
    echo Deploying Hosting...
    firebase deploy --only hosting
    goto end
)

if "%choice%"=="4" (
    echo.
    echo Deploying Everything...
    cd functions
    call npm install
    cd ..
    firebase deploy
    goto end
)

if "%choice%"=="5" (
    echo.
    echo Starting Firestore Emulator...
    firebase emulators:start --only firestore
    goto end
)

if "%choice%"=="6" (
    echo.
    echo Starting Functions Emulator...
    cd functions
    call npm install
    cd ..
    firebase emulators:start --only functions
    goto end
)

if "%choice%"=="7" (
    start https://console.firebase.google.com/
    goto end
)

if "%choice%"=="8" (
    echo.
    echo Checking Firebase connection...
    firebase projects:list
    goto end
)

if "%choice%"=="9" (
    exit /b 0
)

echo Invalid choice
goto end

:end
echo.
pause
