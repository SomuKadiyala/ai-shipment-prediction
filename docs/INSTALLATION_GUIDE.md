# Installation Guide

This guide assumes Windows PowerShell and Python 3.12.10. Use Node.js 22.12+ for the Vite 8 frontend.

## Prerequisites
1. Install Python 3.12.10.
2. Install Node.js 22.12+ and npm.
3. Install Git.
4. Confirm commands are available:
   ```powershell
   python --version
   node --version
   npm --version
   git --version
   ```

## Clone
```powershell
git clone https://github.com/YOUR-USERNAME/ai-shipment-prediction.git
cd ai-shipment-prediction
```

## Backend environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip check
```

If activation is blocked:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Start backend from repository root:
```powershell
python -m uvicorn backend.main:app --reload --port 8000
```

Verify:
- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`

## Frontend
Open a second terminal:
```powershell
cd ai-shipment-prediction\frontend
npm ci
npm run dev
```
Open `http://localhost:5173/` (or the URL Vite prints).

## macOS/Linux backend
```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```
In a second terminal:
```bash
cd frontend
npm ci
npm run dev
```

## Important
The pre-trained model artifacts are included under `backend/models/`. A normal application run does not require model retraining. Keep the backend terminal running while using the frontend.
