@echo off
title Voice AI Copilot Launcher
cd /d "c:\Users\maniv\all_ide_code_ws"

:: Check if port 8085 is listening
netstat -ano | findstr :8085 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting Voice AI Copilot Server...
    start /min "" python -m http.server 8085
    timeout /t 1 /nobreak >nul
)

:: Try opening with Edge in clean app window mode
where msedge >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start msedge --app="http://localhost:8085/apps/chatbot/index.html"
    exit /b
)

:: Fallback to Chrome in app window mode
where chrome >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start chrome --app="http://localhost:8085/apps/chatbot/index.html"
    exit /b
)

:: Fallback to default browser
start http://localhost:8085/apps/chatbot/index.html
exit /b
