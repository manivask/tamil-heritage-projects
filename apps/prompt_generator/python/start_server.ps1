# Start Prompt Generator Server
Write-Host "Starting AI App Prompt Generator Server on Port 5006..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
python server.py
