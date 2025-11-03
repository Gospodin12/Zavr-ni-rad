@echo off
echo =====================================
echo 🚀 Starting full development environment...
echo =====================================

REM Start backend (Node.js)
start cmd /k "cd back && node index.js"

REM Start frontend (React)
start cmd /k "cd front && npm run dev"

REM Open Visual Studio Code
start code .

REM Wait a few seconds, then open the app in Chrome
timeout /t 5 /nobreak >nul
start chrome --new-window http://localhost:5173

echo ✅ All systems running!
exit
