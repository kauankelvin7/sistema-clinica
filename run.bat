@echo off
echo ==================================================
echo Iniciando o Sistema Clinica - NOVA Atestados
echo ==================================================
echo.

echo Iniciando o Backend (FastAPI)...
start cmd /k "cd backend && uvicorn main:app --reload --port 8000"

echo Iniciando o Frontend (React + Vite)...
start cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Servidores inicializados em novas janelas!
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000
echo ==================================================
pause
