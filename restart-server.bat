@echo off

echo ===== Stopping all Node.js servers =====
taskkill /F /IM node.exe /T > nul

echo ===== Waiting for 5 seconds =====
timeout /t 5 /nobreak > nul

echo ===== Starting the server =====
call npm run dev

echo ===== Server restarted successfully =====
