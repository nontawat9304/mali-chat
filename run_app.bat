@echo off
echo Starting AI Personal Assistant...

start cmd /k "title AI Backend && cd backend && venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 5
start cmd /k "title AI Frontend && cd frontend && npm start"

echo Servers started.
echo Backend: http://localhost:8000/docs
echo Frontend: http://localhost:4200
