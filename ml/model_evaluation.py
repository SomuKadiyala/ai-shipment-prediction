
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
MODEL_DIR = PROJECT_ROOT / "backend" / "models"
OUTPUT_DIR = PROJECT_ROOT / "outputs"


# =====================================
# 1. LOAD MODEL PREDICTIONS
# =====================================

predictions = pd.read_csv(OUTPUT_DIR / "test_predictions.csv")

actual = predictions["Actual_Delay"]
predicted = predictions["Predicted_Delay"]

# Calculate residuals
residuals = actual - predicted

print("\n========== MODEL EVALUATION ==========")

print("Total test records:", len(predictions))

print("Average Actual Delay:",
      round(actual.mean(), 2), "hours")

print("Average Predicted Delay:",
      round(predicted.mean(), 2), "hours")

print("Mean Absolute Error:",
      round(np.abs(residuals).mean(), 3))

print("Maximum Absolute Error:",
      round(np.abs(residuals).max(), 3))

print("Minimum Absolute Error:",
      round(np.abs(residuals).min(), 3))

# =====================================
# 2. ACTUAL VS PREDICTED VALUES
# =====================================

plt.figure(figsize=(7, 5))

plt.scatter(
    actual,
    predicted,
    alpha=0.7
)

# Ideal prediction line
minimum = min(actual.min(), predicted.min())
maximum = max(actual.max(), predicted.max())

plt.plot(
    [minimum, maximum],
    [minimum, maximum],
    linestyle="--",
    label="Ideal Prediction"
)

plt.title("Actual vs Predicted Shipment Delay")
plt.xlabel("Actual Delay (Hours)")
plt.ylabel("Predicted Delay (Hours)")
plt.legend()
plt.tight_layout()

# =====================================
# 3. RESIDUAL ANALYSIS
# =====================================

plt.figure(figsize=(7, 5))

plt.scatter(
    predicted,
    residuals,
    alpha=0.7
)

plt.axhline(y=0, linestyle="--")

plt.title("Residuals vs Predicted Delay")
plt.xlabel("Predicted Delay (Hours)")
plt.ylabel("Residual (Hours)")
plt.tight_layout()

# =====================================
# 4. ERROR DISTRIBUTION
# =====================================

plt.figure(figsize=(7, 5))

plt.hist(
    residuals,
    bins=15
)

plt.axvline(x=0, linestyle="--")

plt.title("Prediction Error Distribution")
plt.xlabel("Prediction Error (Hours)")
plt.ylabel("Number of Shipments")
plt.tight_layout()

# =====================================
# 5. MODEL PERFORMANCE COMPARISON
# =====================================

results = pd.read_csv(OUTPUT_DIR / "model_comparison.csv")

plt.figure(figsize=(8, 5))

plt.bar(
    results["Model"],
    results["MAE"]
)

plt.title("Model Comparison - MAE")
plt.xlabel("Machine Learning Model")
plt.ylabel("Mean Absolute Error (Hours)")
plt.xticks(rotation=15)
plt.tight_layout()

# =====================================
# 6. DISPLAY ALL CHARTS
# =====================================

plt.show()

print("\nMODEL EVALUATION COMPLETED SUCCESSFULLY!")
