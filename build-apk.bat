@echo off
REM ============================================================
REM  Nur - one-click APK builder
REM  Double-click this file after making any code changes.
REM  It builds the web app, syncs Android, assembles the APK,
REM  and copies it to your Downloads and Desktop.
REM ============================================================
setlocal EnableExtensions
cd /d "%~dp0"
title Nur - Building APK

REM --- Java (Android needs JDK 21). Edit this path if Java moves. ---
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
if not exist "%JAVA_HOME%\bin\java.exe" (
  echo.
  echo  !! Java not found at:
  echo     %JAVA_HOME%
  echo     Open build-apk.bat and fix the JAVA_HOME line, then run again.
  echo.
  pause
  exit /b 1
)

echo.
echo  [1/4] Building the web app  (npm run build) ...
call npm run build || goto :failed

echo.
echo  [2/4] Syncing Android  (npx cap sync) ...
call npx cap sync android || goto :failed

echo.
echo  [3/4] Assembling the SIGNED RELEASE APK  (gradlew assembleRelease) ...
pushd android
call gradlew.bat assembleRelease || (popd & goto :failed)
popd

echo.
echo  [4/4] Copying the APK ...
set "APK=android\app\build\outputs\apk\release\app-release.apk"
if not exist "%APK%" goto :failed
copy /Y "%APK%" "D:\UserData\Downloads\Nur-Quran-Azkar.apk" >nul
copy /Y "%APK%" "%USERPROFILE%\Desktop\Nur-Quran-Azkar.apk" >nul
copy /Y "%APK%" "Nur-Quran-Azkar.apk" >nul

echo.
echo  ============================================================
echo   DONE ^!  Nur-Quran-Azkar.apk is in:
echo     - D:\UserData\Downloads
echo     - your Desktop
echo     - this app folder
echo  ============================================================
echo.
pause
exit /b 0

:failed
echo.
echo  *** BUILD FAILED - scroll up to read the error message. ***
echo.
pause
exit /b 1
