@echo off
chcp 65001 >nul
title Nur - Build ^& Preview (PWA / Offline)
cd /d "%~dp0"

echo ============================================
echo    Nur - Build ^& Preview (PWA, Offline)
echo ============================================
echo.

if not exist "node_modules" (
  echo [*] Installing dependencies ^(first run only^)...
  call npm install
  echo.
)

echo [*] Building production app...
call npm run build
echo.
echo [*] Starting PWA preview (installable + works offline)...
echo [*] Browser opens automatically. Use this build to test offline mode.
echo.
call npm run preview -- --open --host

echo.
pause
