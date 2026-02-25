"""
Flask API for Crop Doctor CNN: binary prediction (Healthy / Diseased).
Loads model from model/saved_model.h5, accepts image via POST /predict.
"""
import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import tensorflow as tf

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "saved_model.h5")
model = None


def load_model():
    global model
    if not os.path.isfile(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    model = tf.keras.models.load_model(MODEL_PATH)
    return model


def preprocess_image(image: Image.Image) -> np.ndarray:
    """Resize to (224, 224), RGB, normalize to [0, 1], shape (1, 224, 224, 3)."""
    image = image.convert("RGB")
    image = image.resize((224, 224))
    arr = np.array(image, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)
    return arr


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"detail": "Model not loaded."}), 503

    if "file" not in request.files:
        return jsonify({"detail": "No file provided. Use form field 'file'."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"detail": "No file selected."}), 400

    try:
        image = Image.open(file)
    except Exception as e:
        return jsonify({"detail": f"Invalid image: {str(e)}"}), 400

    try:
        x = preprocess_image(image)
        pred = model.predict(x, verbose=0)
        prob = float(pred[0][0]) if pred.shape[-1] == 1 else float(pred[0][1])
        # Clamp to [0, 1] in case of numerical noise
        prob = max(0.0, min(1.0, prob))
    except Exception as e:
        return jsonify({"detail": f"Prediction failed: {str(e)}"}), 500

    # Threshold: >= 0.6 → Diseased (affected), < 0.6 → Healthy
    if prob >= 0.6:
        status = "affected"
        disease_name = "Disease Detected"
        recommendation = "Disease signs detected. Isolate the plant and consult an agronomist immediately."
        confidence = prob
    else:
        status = "healthy"
        disease_name = "Healthy"
        recommendation = "Your crop looks healthy. Keep monitoring regularly."
        confidence = 1.0 - prob  # confidence in "healthy"

    return jsonify({
        "status": status,
        "confidence": round(confidence, 4),
        "disease_name": disease_name,
        "recommendation": recommendation,
    })


if __name__ == "__main__":
    load_model()
    app.run(host="0.0.0.0", port=5000, debug=False)
