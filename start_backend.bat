@echo off
cd /d "%~dp0backend"
python seed.py
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
