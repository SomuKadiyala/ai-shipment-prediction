# Machine Learning Approach

## Task definition

The prototype solves two supervised-learning tasks:

1. Regression: estimate `actual_delay_hours`.
2. Classification: predict `congestion_level` as Low, Medium or High.

## Synthetic data generation

`ml/generate_dataset.py` creates 300 synthetic records using NumPy random generation with seed 42. Five ports are assigned exercise capacities: Chennai 20, Mumbai 25, Visakhapatnam 15, Kochi 12 and Kolkata 18. Weather values are Normal, Rainy, Storm and Foggy, with configured weather impacts.

The synthetic delay is generated from historical average delay, queue length, capacity utilization, weather impact and random noise. The data is illustrative and is not sourced from AIS, port authorities or live terminal systems.

## Feature engineering

`ml/preprocess_data.py` extracts arrival hour, day, month and weekday from `vessel_arrival_time`, and calculates capacity utilization as vessels waiting divided by port capacity. The prepared features are saved to `data/prepared_shipment_data.csv`.

## Congestion labels

- Low: utilization < 0.60
- Medium: 0.60 <= utilization < 1.00
- High: utilization >= 1.00

These are transparent project thresholds. They are not asserted as official industry standards. Since the target label is constructed from this utilization rule, the classifier is learning the synthetic rule by design.

## Regression models

`ml/train_models.py` trains:
- Linear Regression
- Random Forest Regressor (`n_estimators=100`)
- Gradient Boosting Regressor (`n_estimators=100`, `learning_rate=0.1`)

It uses an 80/20 split with `random_state=42`. The preprocessing pipeline applies OneHotEncoder to port and weather; numeric fields pass through. Models are evaluated using MAE, RMSE and R². The lowest-MAE pipeline is persisted to `backend/models/best_shipment_delay_model.joblib`.

## Classification model

`ml/train_congestion_model.py` trains a RandomForestClassifier with 100 estimators, balanced class weights and random state 42. It uses an 80/20 stratified split. The pipeline is saved to `backend/models/congestion_prediction_model.joblib`; classification metrics and confusion matrix are saved to `outputs/congestion_model_metrics.json`.

## Feature importance

`ml/feature_importance.py` calculates permutation importance for the selected delay regression pipeline using 20 repeats, random state 42 and negative MAE scoring. This is a global model diagnostic. It is not causal and is not a per-prediction explanation.

## Reproduce training

Run from the repository root after installing dependencies:
```powershell
python ml/generate_dataset.py
python ml/preprocess_data.py
python ml/train_models.py
python ml/train_congestion_model.py
python ml/feature_importance.py
python ml/model_evaluation.py
```
Training regenerates model and evaluation files. Because the dataset is synthetic and seeded, generation is reproducible for the same library behavior and code version.
