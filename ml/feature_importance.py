
import pandas as pd
import joblib
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.inspection import permutation_importance

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
MODEL_DIR = PROJECT_ROOT / "backend" / "models"
OUTPUT_DIR = PROJECT_ROOT / "outputs"


# =====================================
# 1. LOAD PREPARED DATA
# =====================================

df = pd.read_csv(DATA_DIR / "prepared_shipment_data.csv")

# =====================================
# 2. DEFINE FEATURES AND TARGET
# =====================================

categorical_features = [
    "port_name",
    "weather_condition"
]

numerical_features = [
    "port_capacity",
    "vessels_waiting",
    "queue_length",
    "historical_avg_delay",
    "capacity_utilization",
    "arrival_hour",
    "arrival_day",
    "arrival_month",
    "arrival_day_of_week"
]

feature_columns = (
    categorical_features + numerical_features
)

X = df[feature_columns]

y = df["actual_delay_hours"]

# =====================================
# 3. SPLIT DATA
# =====================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

# =====================================
# 4. LOAD TRAINED MODEL
# =====================================

model = joblib.load(
    MODEL_DIR / "best_shipment_delay_model.joblib"
)

print("Trained model loaded successfully!")

# =====================================
# 5. CALCULATE FEATURE IMPORTANCE
# =====================================

importance = permutation_importance(
    model,
    X_test,
    y_test,
    n_repeats=20,
    random_state=42,
    scoring="neg_mean_absolute_error"
)

# =====================================
# 6. CREATE IMPORTANCE TABLE
# =====================================

importance_df = pd.DataFrame({
    "Feature": feature_columns,
    "Importance": importance.importances_mean,
    "Std_Deviation": importance.importances_std
})

importance_df = importance_df.sort_values(
    by="Importance",
    ascending=False
)

print("\n========== FEATURE IMPORTANCE ==========")

print(importance_df.round(4).to_string(index=False))

# =====================================
# 7. SAVE RESULTS
# =====================================

importance_df.to_csv(
    OUTPUT_DIR / "feature_importance.csv",
    index=False
)

# =====================================
# 8. VISUALIZE RESULTS
# =====================================

plt.figure(figsize=(10, 6))

plt.barh(
    importance_df["Feature"],
    importance_df["Importance"],
    xerr=importance_df["Std_Deviation"]
)

plt.title("Shipment Delay Feature Importance")
plt.xlabel("Decrease in Model Performance (MAE)")
plt.ylabel("Features")

plt.gca().invert_yaxis()

plt.tight_layout()

plt.savefig(OUTPUT_DIR / "feature_importance.png")

plt.show()

print("\nFeature importance analysis completed!")
