# Model Evaluation

The repository contains saved evaluation artifacts in `outputs/`.

## Regression metrics

- MAE: average absolute prediction error, in hours. Lower is better.
- RMSE: square root of mean squared error, in hours; larger errors receive more weight. Lower is better.
- R²: coefficient of determination on the test split. Higher is generally better, with 1 representing a perfect fit on that evaluation set.

Reported model comparison:

| Model | MAE (hours) | RMSE (hours) | R² |
|---|---:|---:|---:|
| Linear Regression | 1.162 | 1.506 | 0.966 |
| Gradient Boosting | 1.660 | 2.087 | 0.936 |
| Random Forest | 2.150 | 2.887 | 0.877 |

The supplied comparison selects Linear Regression by lowest MAE. These metrics are measured on 60 held-out records from synthetic data.

## Congestion classifier metrics

The supplied metrics report accuracy 1.00 and a confusion matrix with 18 Low, 12 Medium and 30 High records all classified correctly. Precision, recall and F1 are reported as 1.00 for each class.

This perfect score is not evidence of perfect real-world forecasting. Congestion labels were generated from the capacity-utilization threshold rule and the classifier is trained against those labels. The evaluation therefore primarily tests whether the model learned the synthetic label-generation process.

## Feature importance

Permutation importance shuffles one feature at a time and measures the effect on the selected model's score. A positive value indicates that shuffling worsened the score in that run. Small or negative values do not prove that a feature has no operational value. Importance is not causal.

## Reproducibility note

The report numbers should be rechecked after any retraining. Use `outputs/model_comparison.csv`, `outputs/test_predictions.csv`, `outputs/feature_importance.csv` and `outputs/congestion_model_metrics.json` as the machine-readable artifacts. Keep the model files and evaluation artifacts from the same training run.
