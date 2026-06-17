# Startup script for BMH Hospital Operations Management System
echo "Starting Backend Server..."
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; python seed.py; uvicorn app.main:app --reload --port 8001"

echo "Starting Frontend Server..."
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

echo "Both servers are starting up!"
