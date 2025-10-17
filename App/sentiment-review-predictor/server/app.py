"""Flask application that exposes the ML models via a REST API."""
from __future__ import annotations

import logging
from http import HTTPStatus
from typing import Any, Dict

from flask import Flask, jsonify, request
from flask_cors import CORS

from .model_utils import (
    CLASSIFIER_MODEL_PATH,
    FASTTEXT_MODEL_PATH,
    ModelNotReadyError,
    predict_recommendation,
)

LOGGER = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.route("/api/health", methods=["GET"])
def healthcheck() -> Any:
    """Simple endpoint to confirm the API is reachable."""
    return jsonify({
        "status": "ok",
        "models": {
            "fasttext": FASTTEXT_MODEL_PATH.exists(),
            "classifier": CLASSIFIER_MODEL_PATH.exists(),
        },
    })


@app.route("/api/predict", methods=["POST"])
def api_predict() -> Any:
    """Generate a recommendation label for a review."""
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    review_text = (payload.get("reviewText") or "").strip()
    rating = payload.get("rating")

    if not review_text:
        return jsonify({"error": "reviewText is required"}), HTTPStatus.BAD_REQUEST

    numeric_rating = None
    if rating is not None:
        try:
            numeric_rating = float(rating)
        except (TypeError, ValueError):
            LOGGER.warning("Invalid rating received: %r", rating)

    try:
        result = predict_recommendation(review_text=review_text, rating=numeric_rating)
    except ModelNotReadyError as exc:
        LOGGER.error("Model is not ready: %s", exc)
        return jsonify({"error": str(exc)}), HTTPStatus.SERVICE_UNAVAILABLE
    except Exception:  # pragma: no cover - defensive logging
        LOGGER.exception("Prediction failed")
        return jsonify({"error": "Prediction failed"}), HTTPStatus.INTERNAL_SERVER_ERROR

    response = {
        "prediction": int(result["prediction"]),
        "confidence": result.get("confidence"),
        "source": "fasttext-logistic",
    }
    return jsonify(response)


if __name__ == "__main__":  # pragma: no cover - CLI entry-point
    app.run(host="0.0.0.0", port=5000, debug=True)
