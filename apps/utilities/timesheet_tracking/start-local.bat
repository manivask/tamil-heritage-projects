@echo off
cd /d "%~dp0"
echo Starting Timewise at http://127.0.0.1:8081/
python -m http.server 8081 --bind 127.0.0.1
