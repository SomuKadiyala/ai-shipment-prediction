# Troubleshooting

## `ModuleNotFoundError: No module named 'fastapi'`

Activate the project virtual environment from the repository root:
```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```
Check which Python is active:
```powershell
where.exe python
```
The first path should point to `.venv\Scripts\python.exe`.

## PowerShell blocks virtual-environment activation

For the current terminal only:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## Model file not found

Run Uvicorn from the repository root:
```powershell
python -m uvicorn backend.main:app --reload --port 8000
```
Confirm both model files exist in `backend/models/`.

## Analytics endpoint returns 404 for a missing file

Confirm the expected CSV/JSON files exist in `outputs/` and the dataset exists in `data/`. If you retrain or regenerate data, run the full training and evaluation sequence in the README.

## Frontend cannot connect to backend

1. Confirm the backend is running on port 8000.
2. Open `http://127.0.0.1:8000/health`.
3. Confirm the frontend API base URL in `frontend/src/services/api.ts` is `http://127.0.0.1:8000`.
4. Confirm the frontend runs at `http://localhost:5173`; this is the CORS origin allowed by the backend.

## Port 8000 is already in use

Stop the previous backend process or start the API on another port. If you change the port, update the frontend API base URL to match.

## Frontend dependencies or build errors

Use a supported Node.js version (Node 22.12+ recommended for Vite 8) and run:
```powershell
cd frontend
npm ci
npm run build
```

## HTTP 422 validation error

Check that:
- `port_name` is one of Chennai, Mumbai, Visakhapatnam, Kochi or Kolkata.
- `weather_condition` is Normal, Rainy, Storm or Foggy.
- numeric inputs are non-negative.
- `queue_length` is not greater than `vessels_waiting`.
- `vessel_arrival_time` is a valid ISO date-time string.
