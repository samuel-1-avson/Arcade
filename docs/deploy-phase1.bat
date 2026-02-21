@echo off
chcp 65001 >nul
cls

echo ╔════════════════════════════════════════════════════════════════╗
echo ║           PHASE 1 - TERMINAL DEPLOYMENT SCRIPT                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM ============================================
REM STEP 1: Deploy Frontend to Vercel
REM ============================================
echo [1/3] Deploying Frontend to Vercel...
echo.
echo This will deploy the current branch to Vercel.
echo Make sure you are logged in: vercel login
echo.

vercel --prod

if %ERRORLEVEL% neq 0 (
    echo ❌ Vercel deployment failed!
    echo.
    echo If not logged in, run: vercel login
    pause
    exit /b 1
)

echo ✅ Frontend deployed to Vercel!
echo.

REM ============================================
REM STEP 2: Deploy Firestore Security Rules
REM ============================================
echo [2/3] Deploying Firestore Security Rules...
echo.
echo This will update your Firestore security rules.
echo Make sure you are logged in to Firebase: firebase login
echo.

firebase deploy --only firestore:rules

if %ERRORLEVEL% neq 0 (
    echo ❌ Firestore rules deployment failed!
    echo.
    echo If not logged in, run: firebase login
    pause
    exit /b 1
)

echo ✅ Firestore security rules deployed!
echo.

REM ============================================
REM STEP 3: Deploy Cloud Functions
REM ============================================
echo [3/3] Deploying Cloud Functions...
echo.
echo This will deploy the migration functions.
echo.

cd functions
npm install
cd ..

firebase deploy --only functions

if %ERRORLEVEL% neq 0 (
    echo ❌ Cloud Functions deployment failed!
    pause
    exit /b 1
)

echo ✅ Cloud Functions deployed!
echo.

REM ============================================
REM COMPLETION
REM ============================================
cls
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                   DEPLOYMENT COMPLETE! ✅                      ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Phase 1 Security Hardening has been deployed:
echo.
echo   ✅ Frontend on Vercelecho   ✅ Firestore Security Rulesecho   ✅ Cloud Functions (Migration)echo.
echo NEXT STEPS:
echo 1. Test the deployed application
echo 2. Run data migration for existing users
echo 3. Monitor for any errors
echo.
pause
