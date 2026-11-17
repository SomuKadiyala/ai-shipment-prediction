
import pandas as pd
import matplotlib.pyplot as plt

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

print("\n========== DATASET OVERVIEW ==========")

print("Total Records:", len(df))
print("Total Columns:", len(df.columns))

print("\nColumn Names:")
print(df.columns.tolist())

# =====================================
# 2. DATA QUALITY CHECKS
# =====================================

print("\n========== DATA QUALITY ==========")

print("Missing Values:")
print(df.isnull().sum())

print("\nDuplicate Shipment IDs:")
print(df["shipment_id"].duplicated().sum())

print("\nData Types:")
print(df.dtypes)

# =====================================
# 3. STATISTICAL ANALYSIS
# =====================================

print("\n========== STATISTICAL SUMMARY ==========")

print(df.describe())

print("\nAverage Shipment Delay:")
print(round(df["actual_delay_hours"].mean(), 2))

print("\nMaximum Shipment Delay:")
print(round(df["actual_delay_hours"].max(), 2))

print("\nMinimum Shipment Delay:")
print(round(df["actual_delay_hours"].min(), 2))

# =====================================
# 4. PORT-WISE DELAY ANALYSIS
# =====================================

print("\n========== PORT-WISE ANALYSIS ==========")

port_analysis = df.groupby("port_name").agg(
    total_shipments=("shipment_id", "count"),
    average_delay=("actual_delay_hours", "mean"),
    maximum_delay=("actual_delay_hours", "max")
).round(2)

print(port_analysis)

# =====================================
# 5. WEATHER-WISE DELAY ANALYSIS
# =====================================

print("\n========== WEATHER ANALYSIS ==========")

weather_analysis = df.groupby(
    "weather_condition"
)["actual_delay_hours"].mean().round(2)

print(weather_analysis)

# =====================================
# 6. CONGESTION ANALYSIS
# =====================================

print("\n========== CONGESTION ANALYSIS ==========")

congestion_analysis = df.groupby(
    "congestion_level"
)["actual_delay_hours"].mean().round(2)

print(congestion_analysis)

# =====================================
# 7. FEATURE RELATIONSHIP ANALYSIS
# =====================================

print("\n========== CORRELATION ANALYSIS ==========")

numeric_columns = [
    "port_capacity",
    "vessels_waiting",
    "queue_length",
    "historical_avg_delay",
    "actual_delay_hours"
]

correlation = df[numeric_columns].corr()

print(correlation.round(2))

# =====================================
# 8. VISUALIZATION 1: PORT-WISE DELAY
# =====================================

plt.figure(figsize=(9, 5))

port_analysis["average_delay"].plot(
    kind="bar"
)

plt.title("Average Shipment Delay by Port")
plt.xlabel("Port Name")
plt.ylabel("Average Delay (Hours)")
plt.xticks(rotation=30)
plt.tight_layout()

plt.savefig(OUTPUT_DIR / "port_delay_analysis.png")
plt.show()

# =====================================
# 9. VISUALIZATION 2: WEATHER IMPACT
# =====================================

plt.figure(figsize=(8, 5))

weather_analysis.plot(
    kind="bar"
)

plt.title("Weather Impact on Shipment Delays")
plt.xlabel("Weather Condition")
plt.ylabel("Average Delay (Hours)")
plt.xticks(rotation=0)
plt.tight_layout()

plt.savefig(OUTPUT_DIR / "weather_delay_analysis.png")
plt.show()

# =====================================
# 10. VISUALIZATION 3: QUEUE VS DELAY
# =====================================

plt.figure(figsize=(8, 5))

plt.scatter(
    df["queue_length"],
    df["actual_delay_hours"]
)

plt.title("Queue Length vs Shipment Delay")
plt.xlabel("Queue Length")
plt.ylabel("Actual Delay (Hours)")
plt.tight_layout()

plt.savefig(OUTPUT_DIR / "queue_delay_analysis.png")
plt.show()

# =====================================
# 11. VISUALIZATION 4: DELAY DISTRIBUTION
# =====================================

plt.figure(figsize=(8, 5))

plt.hist(
    df["actual_delay_hours"],
    bins=20
)

plt.title("Shipment Delay Distribution")
plt.xlabel("Actual Delay (Hours)")
plt.ylabel("Number of Shipments")
plt.tight_layout()

plt.savefig(OUTPUT_DIR / "delay_distribution.png")
plt.show()

print("\nEDA ANALYSIS COMPLETED SUCCESSFULLY!")
