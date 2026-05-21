import tensorflow as tf
import numpy as np
import os

# Hide TensorFlow warnings
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import warnings
warnings.filterwarnings("ignore")

import tensorflow as tf
tf.get_logger().setLevel("ERROR")

from tensorflow.keras.preprocessing import image

import sys
import json

try:

    # =========================
    # Disease List
    # =========================
    diseases = [
        "Atelectasis","Cardiomegaly","Effusion","Infiltration","Mass",
        "Nodule","Pneumonia","Pneumothorax","Consolidation",
        "Edema","Emphysema","Fibrosis","Pleural_Thickening","Hernia"
    ]

    # =========================
    # Load Model
    # =========================
    model_path = os.path.join(os.path.dirname(__file__), "lung_model.h5")

    model = tf.keras.models.load_model(model_path, compile=False)

    # =========================
    # Get Image Path
    # =========================
    img_path = sys.argv[1]

    # =========================
    # Load Image
    # =========================
    img = image.load_img(img_path, target_size=(224,224))

    img_array = image.img_to_array(img) / 255.0

    if img_array.shape[-1] == 1:
        img_array = np.repeat(img_array, 3, axis=-1)

    img_array = np.expand_dims(img_array, axis=0)

    # =========================
    # Prediction
    # =========================
    preds = model.predict(img_array, verbose=0)[0]

    threshold = 0.2

    results = [
        (diseases[i], float(prob))
        for i, prob in enumerate(preds)
        if prob >= threshold
    ]

    results = sorted(results, key=lambda x: x[1], reverse=True)

    # =========================
    # Output
    # =========================
    if len(results) > 0:

        output = [
            f"{disease} → {prob*100:.2f}%"
            for disease, prob in results[:3]
        ]

        result = {
            "status": "Disease Detected",
            "predictions": output
        }

    else:

        max_index = int(np.argmax(preds))

        result = {
            "status": "Normal / Low Risk",
            "top_prediction":
                f"{diseases[max_index]} ({preds[max_index]*100:.2f}%)"
        }

    print(json.dumps(result))

except Exception as e:

    error_result = {
        "status": "Error",
        "message": str(e)
    }

    print(json.dumps(error_result))