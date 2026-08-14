@echo off
echo ===================================================
echo     Starting Airbnb Clone (Full-Stack App)
echo ===================================================
echo.
echo 1. Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Airbnb Backend (FastAPI)" cmd /k "cd backend && python seed.py && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 3 /nobreak >nul
echo.
echo 2. Starting Next.js Frontend on http://localhost:3000 ...
start "Airbnb Frontend (Next.js)" cmd /k "cd frontend && npm run dev -- -p 3000"
echo.
echo Both servers started!
echo Frontend: http://localhost:3000
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ===================================================
pause
