import pandas as pd
import numpy as np

# Define the file path
data_path = r"C:\Users\OPT2\wannagonna_app\src\app\SkillBotML\data\SkillBotML.training.data.v1.0.csv"

# Load the data
data = pd.read_csv(data_path)

# Display the first few rows to understand the structure
print("Data Preview:")
print(data.head())

# Example: Separate features (X) and target labels (y)
# Assuming 'label' is the target column
X = data.drop(columns=["label"])  # Replace 'label' with your actual target column name
y = data["label"]

# Convert to NumPy arrays for TensorFlow compatibility
X = np.array(X)
y = np.array(y)

print("Features shape:", X.shape)
print("Labels shape:", y.shape)
