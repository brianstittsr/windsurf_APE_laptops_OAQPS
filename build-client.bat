@echo off
echo ===== Building EPA Invoice Analytics Client =====

echo Installing client dependencies...
cd client
call npm install

echo Building client application...
call npm run build

echo Client build complete!
cd ..
