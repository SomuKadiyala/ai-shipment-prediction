
import json
from pathlib import Path

import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline

from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# =====================================
# 1. PROJECT CONFIGURATION
# =====================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
MODEL_DIR = PROJECT_ROOT / "backend" / "models"
OUTPUT_DIR = PROJECT_ROOT / "outputs"

DATASET_PATH = DATA_DIR / "shipment_data.csv"
MODEL_PATH = MODEL_DIR / "congestion_prediction_model.joblib"
METRICS_PATH = OUTPUT_DIR / "congestion_model_metrics.json"

CONGESTION_LABELS = ["Low", "Medium", "High"]

# =====================================
# 2. LOAD DATASET
# =====================================

df = pd.read_csv(DATASET_PATH)

print("Dataset loaded successfully!")
print("Dataset shape:", df.shape)

# =====================================
# 3. FEATURE ENGINEERING
# =====================================

df["vessel_arrival_time"] = pd.to_datetime(
    df["vessel_arrival_time"]
)

df["capacity_utilization"] = (
    df["vessels_waiting"] / df["port_capacity"]
)

df["arrival_hour"] = (
    df["vessel_arrival_time"].dt.hour
)

df["arrival_day"] = (
    df["vessel_arrival_time"].dt.day
)

df["arrival_month"] = (
    df["vessel_arrival_time"].dt.month
)

df["arrival_day_of_week"] = (
    df["vessel_arrival_time"].dt.dayofweek
)

# =====================================
# 4. DEFINE FEATURES AND TARGET
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

features = categorical_features + numerical_features

X = df[features]
y = df["congestion_level"]

print("\nCongestion distribution:")
print(y.value_counts())

# =====================================
# 5. SPLIT DATASET
# =====================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining records:", len(X_train))
print("Testing records:", len(X_test))

# =====================================
# 6. PREPROCESSING
# =====================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features
        )
    ],
    remainder="passthrough"
)

# =====================================
# 7. CREATE RANDOM FOREST MODEL
# =====================================

classifier = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    class_weight="balanced"
)

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("classifier", classifier)
    ]
)

# =====================================
# 8. TRAIN MODEL
# =====================================

print("\nTraining Random Forest Classifier...")

pipeline.fit(X_train, y_train)

print("Model training completed!")

# =====================================
# 9. PREDICT TEST DATA
# =====================================

predictions = pipeline.predict(X_test)

# =====================================
# 10. EVALUATE MODEL
# =====================================

accuracy = accuracy_score(
    y_test,
    predictions
)

report = classification_report(
    y_test,
    predictions,
    labels=CONGESTION_LABELS,
    output_dict=True,
    zero_division=0
)

matrix = confusion_matrix(
    y_test,
    predictions,
    labels=CONGESTION_LABELS
)

print("\n========== MODEL EVALUATION ==========")

print("Accuracy:", round(accuracy, 4))

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        predictions,
        labels=CONGESTION_LABELS,
        zero_division=0
    )
)

print("\nConfusion Matrix:")
print(matrix)

# =====================================
# 11. SAVE MODEL
# =====================================

joblib.dump(
    pipeline,
    MODEL_PATH
)

print("\nCongestion model saved successfully!")

# =====================================
# 12. SAVE EVALUATION METRICS
# =====================================

metrics = {
    "model_name": "Random Forest Classifier",
    "dataset_type": "Synthetic",
    "total_records": int(len(df)),
    "training_records": int(len(X_train)),
    "testing_records": int(len(X_test)),
    "accuracy": float(accuracy),
    "labels": CONGESTION_LABELS,
    "classification_report": report,
    "confusion_matrix": matrix.tolist(),
    "evaluation_note": (
        "Evaluation on a held-out split of synthetic data. "
        "Results should not be interpreted as real-world validation."
    )
}

with open(METRICS_PATH, "w", encoding="utf-8") as file:
    json.dump(metrics, file, indent=4)

print("\nCongestion evaluation metrics saved!")
print("File:", METRICS_PATH)

print("\nCONGESTION MODEL TRAINING COMPLETED SUCCESSFULLY!")