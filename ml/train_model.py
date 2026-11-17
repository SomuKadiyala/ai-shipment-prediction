
import numpy as np
from sklearn.linear_model import LinearRegression

# Training dataset
X = np.array([[5], [10], [15], [20], [25], [30]])

# Actual shipment delay hours
y = np.array([2, 4, 6, 8, 10, 12])

# Initialize model
model = LinearRegression()

# Train model
model.fit(X, y)

# Make prediction
vessels = np.array([[18]])

prediction = model.predict(vessels)

print("Shipment Delay Prediction")
print("-------------------------")
print("Number of vessels:", 18)
print("Predicted delay:", round(prediction[0], 2), "hours")
