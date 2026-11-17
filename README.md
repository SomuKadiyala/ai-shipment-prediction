# AI-Driven Port Congestion and Shipment Delay Prediction

A proof-of-concept machine-learning application that estimates shipment delay (hours) and classifies port congestion (Low, Medium, High). It provides class probabilities, model evaluation analytics, feature-importance results, input-based indicators and operational recommendations through a React dashboard and FastAPI backend.

> **Important:** This project uses a synthetic dataset of 300 records. The results demonstrate an end-to-end prototype and must not be interpreted as validated forecasts for real port operations.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Repository structure](#repository-structure)
- [How the system works](#how-the-system-works)
- [Dataset and assumptions](#dataset-and-assumptions)
- [Machine-learning approach](#machine-learning-approach)
- [Evaluation results](#evaluation-results)
- [Run the project on Windows](#run-the-project-on-windows)
- [Run the project on macOS or Linux](#run-the-project-on-macos-or-linux)
- [API reference](#api-reference)
- [Prediction explanation](#prediction-explanation)
- [Troubleshooting](#troubleshooting)
- [Limitations and future work](#limitations-and-future-work)

## Features

- Shipment delay prediction in hours.
- Three-level congestion classification: Low, Medium and High.
- Predicted class probability distribution and maximum class probability.
- Rule-based operational prompts based on capacity utilization, queue length and weather.
- Model comparison and evaluation analytics.
- Permutation feature-importance analysis.
- Actual-versus-predicted and residual analysis.
- React + TypeScript dashboard backed by FastAPI.

## Technology stack

| Layer | Technology |
|---|---|
| Backend API | Python 3.12.10, FastAPI, Uvicorn |
| Data processing | Pandas, NumPy |
| Machine learning | Scikit-learn |
| Model persistence | Joblib |
| Evaluation plots | Matplotlib |
| Frontend | React, TypeScript, Vite |
| HTTP client | Axios |
| Charts | Recharts |

## Repository structure

```text
ai-shipment-prediction/
├── backend/
│   ├── __init__.py
│   ├── main.py
│   └── models/
│       ├── best_shipment_delay_model.joblib
│       └── congestion_prediction_model.joblib
├── data/
│   ├── shipment_data.csv
│   └── prepared_shipment_data.csv
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── INSTALLATION_GUIDE.md
│   ├── MACHINE_LEARNING_APPROACH.md
│   ├── MODEL_EVALUATION.md
│   ├── PREDICTION_EXPLANATION.md
│   └── TROUBLESHOOTING.md
├── frontend/
│   ├── public/
│   │   └── shipment_data.csv
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── ml/
│   ├── generate_dataset.py
│   ├── preprocess_data.py
│   ├── train_models.py
│   ├── train_congestion_model.py
│   ├── feature_importance.py
│   ├── model_evaluation.py
│   ├── eda_analysis.py
│   ├── explore_dataset.py
│   ├── test_model_prediction.py
│   └── train_model.py
├── outputs/
│   ├── model_comparison.csv
│   ├── test_predictions.csv
│   ├── feature_importance.csv
│   ├── congestion_model_metrics.json
│   └── evaluation charts
├── reports/
│   └── Aiqon_Port_Congestion_Technical_Report.pdf
├── .gitignore
├── requirements.txt
└── README.md
```

## How the system works

1. The user enters shipment and port conditions in the React dashboard.
2. The frontend sends a JSON request to the FastAPI `/predict/full` endpoint.
3. The backend validates the request and derives port capacity, capacity utilization and arrival-time features.
4. The saved regression pipeline estimates shipment delay.
5. The saved classification pipeline predicts congestion and returns class probabilities.
6. The frontend presents the predictions, input indicators, recommendations and analytics.
7. Analytics endpoints read the saved evaluation artifacts in `outputs/` and the synthetic source dataset in `data/`.

## Dataset and assumptions

The supplied synthetic dataset contains 300 records and represents five configured ports:

| Port | Configured capacity (vessels) |
|---|---:|
| Chennai | 20 |
| Mumbai | 25 |
| Visakhapatnam | 15 |
| Kochi | 12 |
| Kolkata | 18 |

Input features used by the models:

- `port_name`
- `weather_condition`
- `port_capacity`
- `vessels_waiting`
- `queue_length`
- `historical_avg_delay`
- `capacity_utilization`
- `arrival_hour`
- `arrival_day`
- `arrival_month`
- `arrival_day_of_week`

Capacity utilization is calculated as:

`capacity_utilization = vessels_waiting / port_capacity`

Congestion labels are generated using the following project thresholds:

| Class | Capacity utilization |
|---|---:|
| Low | below 0.60 |
| Medium | 0.60 to below 1.00 |
| High | 1.00 or above |

These thresholds and port capacities are assumptions for this exercise, not universal maritime standards or verified current port capacities. The synthetic delay target is generated from historical average delay, queue length, capacity utilization, weather impact and random noise. See [Machine Learning Approach](docs/MACHINE_LEARNING_APPROACH.md).

## Machine-learning approach

### Delay regression

Three regression algorithms are compared:

- Linear Regression
- Random Forest Regressor (100 estimators)
- Gradient Boosting Regressor (100 estimators, learning rate 0.1)

An 80/20 random train/test split with `random_state=42` is used. Categorical features are one-hot encoded; numeric features pass through the preprocessing pipeline. Models are compared using MAE, RMSE and R². The model with the lowest MAE is saved as `backend/models/best_shipment_delay_model.joblib`.

### Congestion classification

A Random Forest Classifier with 100 estimators, `class_weight="balanced"` and `random_state=42` is trained with an 80/20 stratified split. The fitted preprocessing and classifier are saved together as `backend/models/congestion_prediction_model.joblib`.

## Evaluation results

The supplied evaluation artifacts report:

| Regression model | MAE (hours) | RMSE (hours) | R² |
|---|---:|---:|---:|
| Linear Regression | 1.162 | 1.506 | 0.966 |
| Gradient Boosting | 1.660 | 2.087 | 0.936 |
| Random Forest | 2.150 | 2.887 | 0.877 |

Linear Regression has the lowest reported MAE in the supplied model comparison file.

The supplied congestion metrics report 100% accuracy on 60 held-out synthetic test records, with confusion matrix:

```text
                 Predicted
Actual       Low  Medium  High
Low           18       0     0
Medium         0      12     0
High           0       0    30
```

**Interpretation warning:** congestion labels are created directly from the capacity-utilization thresholds. The classifier can learn this generated rule, so the reported 100% score does not establish real-world accuracy. All reported metrics must be regenerated or checked against the final artifacts before submission. More detail: [Model Evaluation](docs/MODEL_EVALUATION.md).

## Run the project on Windows

### Prerequisites

- Python 3.12.10 (recommended to match the supplied model environment).
- Node.js compatible with Vite 8 (Node.js 22.12+ recommended).
- npm, included with Node.js.
- Git.

### 1. Clone the repository

```powershell
git clone https://github.com/SomuKadiyala/ai-shipment-prediction.git
cd ai-shipment-prediction
```

Replace `YOUR-USERNAME` with the GitHub account or organization that owns the repository.

### 2. Create and activate the Python virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation in the current terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

### 3. Install Python dependencies

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip check
```

### 4. Start the backend

From the repository root, with `.venv` activated:

```powershell
python -m uvicorn backend.main:app --reload --port 8000
```

Backend base URL: `http://127.0.0.1:8000`

Health check: `http://127.0.0.1:8000/health`

Interactive API docs: `http://127.0.0.1:8000/docs`

Keep this terminal open.

### 5. Install frontend dependencies

Open a second terminal:

```powershell
cd frontend
npm ci
```

### 6. Start the frontend

```powershell
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173/`.

The frontend's API service currently targets `http://127.0.0.1:8000`. Keep the backend running while using the dashboard.

## Run the project on macOS or Linux

From the repository root:

```bash
git clone https://github.com/SomuKadiyala/ai-shipment-prediction.git
cd ai-shipment-prediction
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip check
python -m uvicorn backend.main:app --reload --port 8000
```

In a second terminal:

```bash
cd ai-shipment-prediction/frontend
npm ci
npm run dev
```

Open the Vite URL printed in the terminal.

## Retrain the models (optional)

The repository includes pre-trained model artifacts, so a user can run the application without retraining. To reproduce the training workflow, activate `.venv` and run commands from the repository root:

```powershell
python ml/generate_dataset.py
python ml/preprocess_data.py
python ml/train_models.py
python ml/train_congestion_model.py
python ml/feature_importance.py
python ml/model_evaluation.py
```

The dataset generation step overwrites the synthetic source dataset. Training scripts regenerate the model and evaluation artifacts. Review the resulting files before committing any regenerated outputs.

## API reference

See [API Documentation](docs/API_DOCUMENTATION.md). Main routes:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Service information |
| GET | `/health` | Backend/model health |
| POST | `/predict/delay` | Delay regression |
| POST | `/predict/congestion` | Congestion classification |
| POST | `/predict/full` | Combined prediction |
| GET | `/analytics/model-performance` | Regression and classification metrics |
| GET | `/analytics/feature-importance` | Permutation importance |
| GET | `/analytics/prediction-analysis` | Held-out predictions and residuals |
| GET | `/analytics/dataset-summary` | Synthetic dataset summary |

## Prediction explanation

The classifier's `confidence` is the highest predicted class probability. It is not a guarantee of correctness and has not been independently calibrated. The dashboard's per-input contributing-factor checks and recommendations are transparent rule-based indicators, not SHAP values or causal explanations. Global feature importance is calculated using permutation importance. See [Prediction Explanation](docs/PREDICTION_EXPLANATION.md).

## Troubleshooting

See [Troubleshooting](docs/TROUBLESHOOTING.md) for environment activation, dependency installation, port conflicts, API connection and model-loading guidance.

## Limitations and future work

- The dataset and target outcomes are synthetic, not live or historical port records.
- Port capacities and congestion thresholds are exercise assumptions.
- The classifier's high score is strongly related to formula-generated labels.
- The delay model's metrics do not demonstrate generalization to real port activity.
- No live AIS, berth occupancy, terminal productivity, labor availability or live weather feed is integrated.
- Future work should use validated operational datasets, chronological/port-aware validation, probability calibration, data-quality monitoring and model-drift checks.

## License

This repository is distributed under the MIT License. See [LICENSE](LICENSE).
