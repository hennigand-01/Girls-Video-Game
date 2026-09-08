@echo off
title Adventure Hill Rescue!
echo ========================================================
echo   Launching Adventure Hill Rescue!
echo ========================================================
echo.

:: Check if python is installed to run a local web server (ensures audio plays everywhere)
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Starting game with local server...
    start "" http://localhost:8080
    python -m http.server 8080
    exit
)

:: Direct browser launch
echo Opening directly in your web browser...
start "" "%~dp0index.html"
exit
