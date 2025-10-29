@echo off
echo Starting EPA OID Planning and Management Tool Application...
echo.
echo Starting both backend and frontend servers...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3001
echo.

echo Installing dependencies...
call npm install

cd client
call npm install
cd ..

echo.
echo Starting backend server...
start "Backend Server" cmd /k "node server.js"

echo Starting frontend server...
cd client
start "Frontend Server" cmd /k "npm start"

echo.
echo Both servers are starting in separate windows...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3001
echo.
pause
