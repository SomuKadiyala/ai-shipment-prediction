
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
MODEL_DIR = PROJECT_ROOT / "backend" / "models"
OUTPUT_DIR = PROJECT_ROOT / "outputs"


# Reproducibility: generate the same dataset each time
np.random.seed(42)

# Number of shipment records
TOTAL_RECORDS = 300

# Sample ports and their daily capacities
ports = {
    "Chennai": 20,
    "Mumbai": 25,
    "Visakhapatnam": 15,
    "Kochi": 12,
    "Kolkata": 18
}

weather_conditions = [
    "Normal",
    "Rainy",
    "Storm",
    "Foggy"
]

weather_impact = {
    "Normal": 0,
    "Rainy": 3,
    "Storm": 8,
    "Foggy": 5
}

# Starting date for synthetic vessel arrivals
start_date = datetime(2026, 1, 1)

records = []

for i in range(TOTAL_RECORDS):

    # Select port
    port_name = np.random.choice(list(ports.keys()))

    # Get port capacity
    port_capacity = ports[port_name]

    # Generate vessel arrival time
    arrival_time = start_date + timedelta(
        days=int(np.random.randint(0, 90)),
        hours=int(np.random.randint(0, 24)),
        minutes=int(np.random.randint(0, 60))
    )

    # Generate vessels waiting
    vessels_waiting = int(
        np.random.randint(1, 35)
    )

    # Generate queue length
    queue_length = int(
        np.random.randint(
            0,
            vessels_waiting + 1
        )
    )

    # Generate weather
    weather = np.random.choice(
        weather_conditions,
        p=[0.55, 0.25, 0.10, 0.10]
    )

    # Historical average delay
    historical_avg_delay = round(
        np.random.uniform(1, 18), 2
    )

    # Calculate congestion ratio
    congestion_ratio = vessels_waiting / port_capacity

    # Calculate delay using synthetic business rules
    actual_delay = (
        historical_avg_delay
        + (queue_length * 0.35)
        + (congestion_ratio * 4)
        + weather_impact[weather]
        + np.random.normal(0, 1.5)
    )

    actual_delay = max(0, actual_delay)

    # Classify congestion
    if congestion_ratio >= 1:
        congestion_level = "High"
    elif congestion_ratio >= 0.6:
        congestion_level = "Medium"
    else:
        congestion_level = "Low"

    # Store record
    records.append({
        "shipment_id": f"SHP{i + 1:04d}",
        "port_name": port_name,
        "vessel_arrival_time": arrival_time,
        "port_capacity": port_capacity,
        "vessels_waiting": vessels_waiting,
        "queue_length": queue_length,
        "weather_condition": weather,
        "historical_avg_delay": historical_avg_delay,
        "actual_delay_hours": round(actual_delay, 2),
        "congestion_level": congestion_level
    })

# Convert records into DataFrame
df = pd.DataFrame(records)

# Save dataset
df.to_csv(DATA_DIR / "shipment_data.csv", index=False)

print("Dataset generated successfully!")
print("Total records:", len(df))
print("Total columns:", len(df.columns))

print("\nDataset Preview:")
print(df.head(10))

print("\nDataset Information:")
print(df.info())

print("\nMissing Values:")
print(df.isnull().sum())

print("\nCongestion Distribution:")
print(df["congestion_level"].value_counts())

print("\nDataset saved as shipment_data.csv")


