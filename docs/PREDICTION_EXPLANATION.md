# Prediction, Confidence and Explanation

## Prediction flow

1. The API receives a `ShipmentRequest`.
2. Pydantic validates required values and allowed port/weather labels.
3. The backend obtains configured port capacity from its port-capacity mapping.
4. It checks that queue length does not exceed vessels waiting.
5. It derives capacity utilization and arrival-time components.
6. The delay pipeline predicts a numeric delay; negative output is clamped to zero.
7. The congestion pipeline predicts a class and class probabilities.
8. The API returns the prediction and relevant input details.

## Capacity utilization

`capacity_utilization = vessels_waiting / port_capacity`

Example: 25 vessels waiting / configured capacity of 20 = 1.25, or 125%.

The project maps utilization to Low, Medium and High using the thresholds documented in the README.

## Confidence and probabilities

The API's congestion confidence is the maximum value returned by the classifier's `predict_proba` output. The probability map contains the estimated probability for each learned class.

A confidence of 0.92 means the classifier assigned 0.92 probability to its selected class. It is not a 92% guarantee of correctness. Probability calibration has not been independently evaluated, and the classifier is trained on synthetic labels.

## Three different explanation concepts

1. **Input-based indicators in the dashboard:** transparent checks such as utilization at or above 100%, non-zero queue, adverse weather, and positive historical average delay.
2. **Operational recommendation rules:** suggestions such as reviewing berth availability when utilization reaches/exceeds capacity, monitoring a large queue, and monitoring adverse weather. These are prompts for human review, not automated decisions.
3. **Permutation feature importance:** a global model diagnostic that measures score change when a feature is shuffled.

The dashboard's rule-based indicators are not SHAP values and do not prove causal contribution. Permutation importance is also not causal.

## Example

For Chennai, configured capacity 20 and 25 vessels waiting:
- utilization = 25 / 20 = 1.25 (125%)
- the project threshold maps this to High congestion
- the trained classifier supplies a predicted class and probability distribution
- the delay regressor supplies a delay estimate in hours

The model outputs are based on synthetic training data and require validation against real operations before practical use.
