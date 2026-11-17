# API Documentation

Base URL for local development: `http://127.0.0.1:8000`

Interactive OpenAPI/Swagger UI: `http://127.0.0.1:8000/docs`

All request bodies use JSON. The backend validates port and weather values against the allowed literals.

## Shipment request schema

```json
{
  "port_name": "Chennai",
  "vessels_waiting": 25,
  "queue_length": 15,
  "weather_condition": "Storm",
  "historical_avg_delay": 12.5,
  "vessel_arrival_time": "2026-11-16T10:30:00"
}
```

Allowed ports: `Chennai`, `Mumbai`, `Visakhapatnam`, `Kochi`, `Kolkata`.

Allowed weather values: `Normal`, `Rainy`, `Storm`, `Foggy`.

Constraints: vessel count, queue length and historical average delay must be non-negative; queue length cannot exceed vessels waiting.

## Routes

| Method | Path | Description |
|---|---|---|
| GET | `/` | Service metadata and available features |
| GET | `/health` | Backend and model-loaded status |
| POST | `/predict/delay` | Returns predicted delay in hours |
| POST | `/predict/congestion` | Returns congestion class and probabilities |
| POST | `/predict/full` | Returns delay, congestion, probabilities and port details |
| GET | `/analytics/model-performance` | Regression comparison and classifier metrics |
| GET | `/analytics/feature-importance` | Permutation feature importance |
| GET | `/analytics/prediction-analysis` | Held-out predictions, residuals and summary statistics |
| GET | `/analytics/dataset-summary` | Synthetic dataset distributions and averages |

## Example: combined prediction

Request:
```bash
curl -X POST "http://127.0.0.1:8000/predict/full" \
  -H "Content-Type: application/json" \
  -d '{
    "port_name": "Chennai",
    "vessels_waiting": 25,
    "queue_length": 15,
    "weather_condition": "Storm",
    "historical_avg_delay": 12.5,
    "vessel_arrival_time": "2026-11-16T10:30:00"
  }'
```

Response structure (numeric values are illustrative; actual values are produced by the saved models):
```json
{
  "status": "success",
  "port_name": "Chennai",
  "shipment_delay": {
    "predicted_delay_hours": 30.49
  },
  "port_congestion": {
    "predicted_congestion": "High",
    "confidence": 0.92,
    "probabilities": {
      "High": 0.92,
      "Low": 0.01,
      "Medium": 0.07
    }
  },
  "port_details": {
    "port_capacity": 20,
    "vessels_waiting": 25,
    "queue_length": 15,
    "capacity_utilization": 1.25,
    "weather_condition": "Storm"
  }
}
```

The example is from a test run shared during development. It is not a fixed response guaranteed on every environment or model version.

## Validation errors

FastAPI returns HTTP 422 for invalid request values, including invalid port/weather labels, negative values, missing required fields, or queue length greater than vessels waiting.

## CORS

The backend currently allows the local frontend origin `http://localhost:5173`. If the frontend is served from a different origin, update the `allow_origins` list in `backend/main.py`.
