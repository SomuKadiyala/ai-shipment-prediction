
import pandas as pd

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
MODEL_DIR = PROJECT_ROOT / "backend" / "models"
OUTPUT_DIR = PROJECT_ROOT / "outputs"


# =====================================
# 1. LOAD DATASET
# =====================================

df = pd.read_csv(
    DATA_DIR / "shipment_data.csv",
    parse_dates=["vessel_arrival_time"]
)

print("Dataset loaded successfully!")

# =====================================
# 2. FEATURE ENGINEERING
# =====================================

# Extract arrival hour
df["arrival_hour"] = (
    df["vessel_arrival_time"].dt.hour
)

# Extract arrival day
df["arrival_day"] = (
    df["vessel_arrival_time"].dt.day
)

# Extract arrival month
df["arrival_month"] = (
    df["vessel_arrival_time"].dt.month
)

# Extract day of week
df["arrival_day_of_week"] = (
    df["vessel_arrival_time"].dt.day_of_week
)

# Calculate capacity utilization ratio
df["capacity_utilization"] = (
    df["vessels_waiting"] / df["port_capacity"]
)

# =====================================
# 3. SELECT INPUT FEATURES
# =====================================

features = [
    "port_name",
    "port_capacity",
    "vessels_waiting",
    "queue_length",
    "weather_condition",
    "historical_avg_delay",
    "capacity_utilization",
    "arrival_hour",
    "arrival_day",
    "arrival_month",
    "arrival_day_of_week"
]

X = df[features]

# Target variable
y = df["actual_delay_hours"]

# =====================================
# 4. DISPLAY PREPARED DATA
# =====================================

print("\n========== FEATURE DATA ==========")

print(X.head())

print("\n========== TARGET DATA ==========")

print(y.head())

print("\n========== FEATURE INFORMATION ==========")

print(X.info())

print("\n========== FEATURE SHAPE ==========")

print(X.shape)

print("\n========== TARGET SHAPE ==========")

print(y.shape)

# =====================================
# 5. CHECK DATA QUALITY
# =====================================

print("\n========== MISSING VALUES ==========")

print(X.isnull().sum())

print("\nDuplicate records:", df.duplicated().sum())

# =====================================
# 6. SAVE PREPARED DATA
# =====================================

prepared_df = X.copy()

prepared_df["actual_delay_hours"] = y

prepared_df.to_csv(
    DATA_DIR / "prepared_shipment_data.csv",
    index=False
)

print("\nFeature engineering completed!")
print("Prepared dataset saved successfully!")
