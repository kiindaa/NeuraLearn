@echo off
REM NeuraLearn Setup Script for Windows
REM This script sets up the complete NeuraLearn AI e-learning platform

echo 🚀 Setting up NeuraLearn AI E-Learning Platform...

REM Check if required tools are installed
echo [INFO] Checking requirements...

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.9+ from https://python.org/
    pause
    exit /b 1
)

REM Check PostgreSQL
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL is not installed. Please install PostgreSQL 13+ from https://postgresql.org/
    pause
    exit /b 1
)

echo [SUCCESS] All requirements are met!

REM Setup backend
echo [INFO] Setting up backend...
cd backend

REM Create virtual environment
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo [INFO] Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Setup environment variables
if not exist ".env" (
    echo [INFO] Creating environment file...
    copy env.example .env
    echo [WARNING] Please edit backend\.env with your configuration
)

REM Setup database
echo [INFO] Setting up database...
createdb neuralearn 2>nul || echo [WARNING] Database 'neuralearn' might already exist

REM Run migrations
echo [INFO] Running database migrations...
flask db upgrade

REM Seed sample data
echo [INFO] Seeding sample data...
python seed_data.py

cd ..
echo [SUCCESS] Backend setup complete!

REM Setup frontend
echo [INFO] Setting up frontend...
cd frontend

REM Install dependencies
echo [INFO] Installing Node.js dependencies...
npm install

REM Setup environment variables
if not exist ".env.local" (
    echo [INFO] Creating environment file...
    copy env.example .env.local
    echo [WARNING] Please edit frontend\.env.local with your configuration
)

cd ..
echo [SUCCESS] Frontend setup complete!

echo.
echo [SUCCESS] 🎉 Setup complete!
echo.
echo 📋 Next steps:
echo 1. Edit backend\.env with your database and API keys
echo 2. Edit frontend\.env.local with your API URL
echo 3. Start the backend: cd backend ^&^& venv\Scripts\activate ^&^& flask run
echo 4. Start the frontend: cd frontend ^&^& npm start
echo 5. Visit http://localhost:3000 to see your app!
echo.
echo 🔑 Default login credentials:
echo    Student: student@neuralearn.com / password123
echo    Instructor: instructor@neuralearn.com / password123
echo    Admin: admin@neuralearn.com / password123
echo.
echo 📚 For more information, see README.md and SETUP.md

pause
