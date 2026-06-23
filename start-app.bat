@echo off
chcp 65001 >nul
title Nur - Quran ^& Azkar
cd /d "%~dp0"

echo ============================================
echo    Nur - Quran ^& Azkar
echo    تشغيل التطبيق محلياً
echo ============================================
echo.

REM Install dependencies on first run
if not exist "node_modules" (
  echo [*] Installing dependencies ^(first run only^)...
  call npm install
  echo.
)

echo [*] Starting local server on http://localhost:3000
echo [*] The browser will open automatically.
echo [*] To stop: close this window or press Ctrl+C.
echo.

call npm run dev -- --open --host

echo.
echo Server stopped.
pause
