
import pandas as pd
import joblib

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
MODEL_DIR = PROJECT_ROOT / "backend" / "models"
OUTPUT_DIR = PROJECT_ROOT / "outputs"


model = joblib.load(
    MODEL_DIR / "best_shipment_delay_model.joblib"
)

print("Delay model loaded successfully!")

input_data = pd.DataFrame([{
    "port_name": "Chennai",
    "weather_condition": "Storm",
    "port_capacity": 20,
    "vessels_waiting": 25,
    "queue_length": 15,
    "historical_avg_delay": 12.5,
    "capacity_utilization": 1.25,
    "arrival_hour": 10,
    "arrival_day": 15,
    "arrival_month": 11,
    "arrival_day_of_week": 6
}])

prediction = model.predict(input_data)

print("Prediction successful!")
print("Predicted delay:", prediction[0])


