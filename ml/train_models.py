
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import (
    RandomForestRegressor,
    GradientBoostingRegressor
)

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
MODEL_DIR = PROJECT_ROOT / "backend" / "models"
OUTPUT_DIR = PROJECT_ROOT / "outputs"


# =========================================
# 1. LOAD PREPARED DATASET
# =========================================

df = pd.read_csv(DATA_DIR / "prepared_shipment_data.csv")

print("\nDataset loaded successfully!")
print("Dataset shape:", df.shape)

# =========================================
# 2. DEFINE FEATURES AND TARGET
# =========================================

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

X = df[categorical_features + numerical_features]

y = df["actual_delay_hours"]

print("\nInput feature shape:", X.shape)
print("Target shape:", y.shape)

# =========================================
# 3. SPLIT TRAINING AND TEST DATA
# =========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print("\n========== DATA SPLIT ==========")

print("Training records:", len(X_train))
print("Testing records:", len(X_test))

# =========================================
# 4. PREPROCESS CATEGORICAL FEATURES
# =========================================

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

# =========================================
# 5. DEFINE MACHINE LEARNING MODELS
# =========================================

models = {
    "Linear Regression": LinearRegression(),

    "Random Forest": RandomForestRegressor(
        n_estimators=100,
        random_state=42
    ),

    "Gradient Boosting": GradientBoostingRegressor(
        n_estimators=100,
        learning_rate=0.1,
        random_state=42
    )
}

results = []

trained_models = {}

# =========================================
# 6. TRAIN AND EVALUATE EACH MODEL
# =========================================

for model_name, model in models.items():

    print("\n=================================")
    print("Training:", model_name)
    print("=================================")

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model)
        ]
    )

    # Train model
    pipeline.fit(X_train, y_train)

    # Predict test data
    predictions = pipeline.predict(X_test)

    # Calculate evaluation metrics
    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = np.sqrt(
        mean_squared_error(y_test, predictions)
    )

    r2 = r2_score(
        y_test,
        predictions
    )

    print("MAE:", round(mae, 3))
    print("RMSE:", round(rmse, 3))
    print("R2 Score:", round(r2, 3))

    results.append({
        "Model": model_name,
        "MAE": mae,
        "RMSE": rmse,
        "R2 Score": r2
    })

    trained_models[model_name] = pipeline

# =========================================
# 7. COMPARE MODEL PERFORMANCE
# =========================================

results_df = pd.DataFrame(results)

results_df = results_df.sort_values(
    by="MAE"
)

print("\n========== MODEL COMPARISON ==========")

print(results_df.round(3).to_string(index=False))

# =========================================
# 8. SELECT BEST MODEL
# =========================================

best_model_name = results_df.iloc[0]["Model"]

best_model = trained_models[best_model_name]

print("\nBest Model:", best_model_name)

# =========================================
# 9. SAVE BEST MODEL
# =========================================

joblib.dump(
    best_model,
    "best_shipment_delay_model.joblib"
)

print("\nBest model saved successfully!")

# Save model comparison results
results_df.to_csv(
    OUTPUT_DIR / "model_comparison.csv",
    index=False
)

# =========================================
# 10. SAVE TEST PREDICTIONS
# =========================================

best_predictions = best_model.predict(X_test)

prediction_results = pd.DataFrame({
    "Actual_Delay": y_test.to_numpy(),
    "Predicted_Delay": best_predictions
})

prediction_results.to_csv(
    OUTPUT_DIR / "test_predictions.csv",
    index=False
)

print("Model comparison saved!")
print("Test predictions saved!")

print("\nMODEL TRAINING COMPLETED SUCCESSFULLY!")
