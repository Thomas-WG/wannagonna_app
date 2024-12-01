import tensorflow as tf
from tensorflow.keras import models, layers
from sklearn.model_selection import train_test_split

# Split the data into training and validation sets
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

# Define a simple model
model = models.Sequential([
    layers.Input(shape=(X_train.shape[1],)),  # Adjust shape based on your data
    layers.Dense(64, activation="relu"),
    layers.Dense(32, activation="relu"),
    layers.Dense(1, activation="sigmoid")  # Use 'softmax' for multi-class classification
])

# Compile the model
model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])

# Train the model
history = model.fit(X_train, y_train, epochs=10, batch_size=32, validation_data=(X_val, y_val))

# Save the model
model.save(r"C:\Users\OPT2\wannagonna_app\src\app\SkillBotML\models\trained_model.h5")
