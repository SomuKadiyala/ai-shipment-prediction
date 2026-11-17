
import json
import joblib
import pandas as pd

from pathlib import Path
from datetime import datetime
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field


# ==========================================
# 1. PROJECT CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
MODEL_DIR = BASE_DIR / "models"
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR = PROJECT_ROOT / "outputs"

DELAY_MODEL_PATH = MODEL_DIR / "best_shipment_delay_model.joblib"
CONGESTION_MODEL_PATH = MODEL_DIR / "congestion_prediction_model.joblib"

MODEL_COMPARISON_PATH = OUTPUT_DIR / "model_comparison.csv"
FEATURE_IMPORTANCE_PATH = OUTPUT_DIR / "feature_importance.csv"
TEST_PREDICTIONS_PATH = OUTPUT_DIR / "test_predictions.csv"
CONGESTION_METRICS_PATH = OUTPUT_DIR / "congestion_model_metrics.json"
DATASET_PATH = DATA_DIR / "shipment_data.csv"

PORT_CAPACITY = {
    "Chennai": 20,
    "Mumbai": 25,
    "Visakhapatnam": 15,
    "Kochi": 12,
    "Kolkata": 18
}


# ==========================================
# 2. INITIALIZE FASTAPI
# ==========================================

app = FastAPI(
    title="Aiqon AI Port Congestion Prediction",
    description=(
        "AI-powered shipment delay and "
        "port congestion prediction and analytics system"
    ),
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 3. LOAD TRAINED MODELS
# ==========================================

try:
    delay_model = joblib.load(DELAY_MODEL_PATH)
    congestion_model = joblib.load(CONGESTION_MODEL_PATH)

    print("Shipment delay model loaded successfully!")
    print("Congestion model loaded successfully!")

except FileNotFoundError as error:
    raise RuntimeError(
        f"Required trained model file not found: {error}"
    )


# ==========================================
# 4. HELPER FUNCTIONS FOR ANALYTICS
# ==========================================

def load_csv(path: Path, description: str):

    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"{description} file not found: {path.name}"
        )

    try:
        return pd.read_csv(path)

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to read {description}: {str(error)}"
        )


def load_json(path: Path, description: str):

    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"{description} file not found: {path.name}"
        )

    try:
        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to read {description}: {str(error)}"
        )


def dataframe_to_records(df: pd.DataFrame):

    # Convert pandas/numpy values into JSON-compatible values.
    return json.loads(
        df.to_json(orient="records")
    )


# ==========================================
# 5. REQUEST DATA VALIDATION
# ==========================================

class ShipmentRequest(BaseModel):

    port_name: Literal[
        "Chennai",
        "Mumbai",
        "Visakhapatnam",
        "Kochi",
        "Kolkata"
    ]

    vessels_waiting: int = Field(ge=0)

    queue_length: int = Field(ge=0)

    weather_condition: Literal[
        "Normal",
        "Rainy",
        "Storm",
        "Foggy"
    ]

    historical_avg_delay: float = Field(ge=0)

    vessel_arrival_time: datetime


# ==========================================
# 6. PREPARE INPUT FEATURES
# ==========================================

def prepare_features(request: ShipmentRequest):

    arrival = request.vessel_arrival_time

    port_capacity = PORT_CAPACITY[request.port_name]

    if request.queue_length > request.vessels_waiting:
        raise HTTPException(
            status_code=422,
            detail=(
                "Queue length cannot exceed "
                "the number of vessels waiting"
            )
        )

    capacity_utilization = (
        request.vessels_waiting / port_capacity
    )

    input_data = pd.DataFrame([{

        "port_name": request.port_name,
        "weather_condition": request.weather_condition,
        "port_capacity": port_capacity,
        "vessels_waiting": request.vessels_waiting,
        "queue_length": request.queue_length,
        "historical_avg_delay": request.historical_avg_delay,
        "capacity_utilization": capacity_utilization,
        "arrival_hour": arrival.hour,
        "arrival_day": arrival.day,
        "arrival_month": arrival.month,
        "arrival_day_of_week": arrival.weekday()

    }])

    return input_data, port_capacity, capacity_utilization


# ==========================================
# 7. HOME ENDPOINT
# ==========================================

@app.get("/")
def home():

    return {
        "application": "Aiqon AI Prediction System",
        "message": "Application is running successfully",
        "available_predictions": [
            "Shipment Delay Prediction",
            "Port Congestion Prediction"
        ],
        "available_analytics": [
            "Model Performance",
            "Feature Importance",
            "Prediction Analysis",
            "Dataset Summary"
        ],
        "status": "success"
    }


# ==========================================
# 8. HEALTH CHECK
# ==========================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "delay_model_loaded": delay_model is not None,
        "congestion_model_loaded": congestion_model is not None
    }


# ==========================================
# 9. SHIPMENT DELAY PREDICTION
# ==========================================

@app.post("/predict/delay")
def predict_delay(request: ShipmentRequest):

    input_data, port_capacity, utilization = prepare_features(request)

    prediction = delay_model.predict(input_data)[0]

    predicted_delay = max(0.0, float(prediction))

    return {
        "status": "success",
        "prediction_type": "Shipment Delay",
        "port_name": request.port_name,
        "predicted_delay_hours": round(predicted_delay, 2),
        "port_capacity": port_capacity,
        "capacity_utilization": round(utilization, 2)
    }


# ==========================================
# 10. PORT CONGESTION PREDICTION
# ==========================================

@app.post("/predict/congestion")
def predict_congestion(request: ShipmentRequest):

    input_data, port_capacity, utilization = prepare_features(request)

    prediction = congestion_model.predict(input_data)[0]

    probabilities = congestion_model.predict_proba(input_data)[0]

    classes = congestion_model.named_steps[
        "classifier"
    ].classes_

    probability_details = {
        str(label): round(float(probability), 4)
        for label, probability in zip(classes, probabilities)
    }

    return {
        "status": "success",
        "prediction_type": "Port Congestion",
        "port_name": request.port_name,
        "predicted_congestion": str(prediction),
        "confidence": round(float(max(probabilities)), 4),
        "congestion_probabilities": probability_details,
        "port_capacity": port_capacity,
        "capacity_utilization": round(utilization, 2)
    }


# ==========================================
# 11. COMPLETE SHIPMENT PREDICTION
# ==========================================

@app.post("/predict/full")
def predict_full(request: ShipmentRequest):

    input_data, port_capacity, utilization = prepare_features(request)

    delay_prediction = delay_model.predict(input_data)[0]

    predicted_delay = max(0.0, float(delay_prediction))

    congestion_prediction = congestion_model.predict(input_data)[0]

    probabilities = congestion_model.predict_proba(input_data)[0]

    classes = congestion_model.named_steps[
        "classifier"
    ].classes_

    probability_details = {
        str(label): round(float(probability), 4)
        for label, probability in zip(classes, probabilities)
    }

    return {
        "status": "success",
        "port_name": request.port_name,

        "shipment_delay": {
            "predicted_delay_hours": round(predicted_delay, 2)
        },

        "port_congestion": {
            "predicted_congestion": str(congestion_prediction),
            "confidence": round(float(max(probabilities)), 4),
            "probabilities": probability_details
        },

        "port_details": {
            "port_capacity": port_capacity,
            "vessels_waiting": request.vessels_waiting,
            "queue_length": request.queue_length,
            "capacity_utilization": round(utilization, 2),
            "weather_condition": request.weather_condition
        }
    }


# ==========================================
# 12. REGRESSION + CLASSIFICATION METRICS
# ==========================================

@app.get("/analytics/model-performance")
def model_performance():

    regression_df = load_csv(
        MODEL_COMPARISON_PATH,
        "Model comparison"
    )

    congestion_metrics = load_json(
        CONGESTION_METRICS_PATH,
        "Congestion evaluation metrics"
    )

    return {
        "status": "success",

        "regression_models": dataframe_to_records(
            regression_df
        ),

        "congestion_model": congestion_metrics
    }


# ==========================================
# 13. FEATURE IMPORTANCE
# ==========================================

@app.get("/analytics/feature-importance")
def feature_importance():

    importance_df = load_csv(
        FEATURE_IMPORTANCE_PATH,
        "Feature importance"
    )

    required_columns = [
        "Feature",
        "Importance",
        "Std_Deviation"
    ]

    if not all(
        column in importance_df.columns
        for column in required_columns
    ):
        raise HTTPException(
            status_code=500,
            detail="Feature importance CSV has an unexpected format."
        )

    importance_df = importance_df.sort_values(
        by="Importance",
        ascending=False
    )

    return {
        "status": "success",
        "method": "Permutation Importance",
        "description": (
            "Importance measures the change in model performance "
            "when an individual feature is shuffled."
        ),
        "features": dataframe_to_records(importance_df)
    }


# ==========================================
# 14. ACTUAL VS PREDICTED AND RESIDUAL DATA
# ==========================================

@app.get("/analytics/prediction-analysis")
def prediction_analysis():

    predictions_df = load_csv(
        TEST_PREDICTIONS_PATH,
        "Test predictions"
    )

    required_columns = [
        "Actual_Delay",
        "Predicted_Delay"
    ]

    if not all(
        column in predictions_df.columns
        for column in required_columns
    ):
        raise HTTPException(
            status_code=500,
            detail="Test predictions CSV has an unexpected format."
        )

    predictions_df["Residual"] = (
        predictions_df["Actual_Delay"]
        - predictions_df["Predicted_Delay"]
    )

    predictions_df["Absolute_Error"] = (
        predictions_df["Residual"].abs()
    )

    return {
        "status": "success",
        "total_test_records": int(len(predictions_df)),
        "mean_absolute_error": round(
            float(predictions_df["Absolute_Error"].mean()), 4
        ),
        "maximum_absolute_error": round(
            float(predictions_df["Absolute_Error"].max()), 4
        ),
        "average_actual_delay": round(
            float(predictions_df["Actual_Delay"].mean()), 4
        ),
        "average_predicted_delay": round(
            float(predictions_df["Predicted_Delay"].mean()), 4
        ),
        "predictions": dataframe_to_records(predictions_df)
    }


# ==========================================
# 15. DATASET SUMMARY
# ==========================================

@app.get("/analytics/dataset-summary")
def dataset_summary():

    df = load_csv(DATASET_PATH, "Shipment dataset")

    required_columns = [
        "port_name",
        "weather_condition",
        "vessels_waiting",
        "port_capacity",
        "actual_delay_hours",
        "congestion_level"
    ]

    missing_columns = [
        column for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise HTTPException(
            status_code=500,
            detail=f"Missing dataset columns: {missing_columns}"
        )

    port_distribution = (
        df["port_name"].value_counts().to_dict()
    )

    weather_distribution = (
        df["weather_condition"].value_counts().to_dict()
    )

    congestion_distribution = (
        df["congestion_level"].value_counts().to_dict()
    )

    return {
        "status": "success",
        "dataset_type": "Synthetic",
        "total_records": int(len(df)),
        "average_delay_hours": round(
            float(df["actual_delay_hours"].mean()), 2
        ),
        "average_vessels_waiting": round(
            float(df["vessels_waiting"].mean()), 2
        ),
        "port_distribution": port_distribution,
        "weather_distribution": weather_distribution,
        "congestion_distribution": congestion_distribution,
        "data_note": (
            "Statistics are based on the generated synthetic dataset, "
            "not live port activity."
        )
    }


# ==========================================
# END OF APPLICATION
# ==========================================
