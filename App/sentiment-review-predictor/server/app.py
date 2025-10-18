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
    TFIDF_VECTORIZER_PATH,
    ModelNotReadyError,
    predict_recommendation,
)
from .data_store import get_store

LOGGER = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
DATA_STORE = get_store()


@app.route("/api/health", methods=["GET"])
def healthcheck() -> Any:
    """Simple endpoint to confirm the API is reachable."""
    return jsonify({
        "status": "ok",
        "models": {
            "fasttext": FASTTEXT_MODEL_PATH.exists(),
            "classifier": CLASSIFIER_MODEL_PATH.exists(),
            "tfidf_vectorizer": TFIDF_VECTORIZER_PATH.exists(),
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
        "source": result.get("source", "backend"),
    }
    return jsonify(response)


@app.route("/api/products", methods=["GET"])
def list_products() -> Any:
    """Return a paginated list of clothing items sourced from the dataset."""
    page = request.args.get("page", default=1, type=int)
    page_size = request.args.get("page_size", default=12, type=int)
    search = request.args.get("search", default=None, type=str)
    category = request.args.get("category", default=None, type=str)

    payload = DATA_STORE.list_products(
        page=page,
        page_size=page_size,
        search=search,
        category=category,
    )
    return jsonify(payload)


@app.route("/api/products/options", methods=["GET"])
def list_product_options() -> Any:
    """Return a lightweight list of products for dropdown selectors."""
    items = []
    for product_id, record in DATA_STORE.products.items():
        public = record.to_public_dict()
        items.append(
            {
                "id": product_id,
                "title": public["title"],
                "category": public["category"],
                "imageUrl": public["imageUrl"],
            }
        )
    items.sort(key=lambda item: item["title"].lower())
    return jsonify({"items": items})


@app.route("/api/products/<product_id>", methods=["GET"])
def get_product(product_id: str) -> Any:
    """Return details and reviews for a single product."""
    try:
        payload = DATA_STORE.get_product(product_id)
    except KeyError:
        return jsonify({"error": "Product not found"}), HTTPStatus.NOT_FOUND
    return jsonify(payload)


@app.route("/api/reviews", methods=["POST"])
def create_review() -> Any:
    """Create a new review and attach it to the specified product."""
    payload: Dict[str, Any] = request.get_json(silent=True) or {}

    product_id = (payload.get("productId") or "").strip()
    title = (payload.get("title") or "").strip()
    review_text = (payload.get("reviewText") or "").strip()
    rating_value = payload.get("rating")
    recommended_value = payload.get("recommended")
    age_value = payload.get("age")

    if not product_id:
        return jsonify({"error": "productId is required"}), HTTPStatus.BAD_REQUEST
    if not title:
        return jsonify({"error": "title is required"}), HTTPStatus.BAD_REQUEST
    if not review_text:
        return jsonify({"error": "reviewText is required"}), HTTPStatus.BAD_REQUEST

    try:
        rating = float(rating_value)
    except (TypeError, ValueError):
        return jsonify({"error": "rating must be a number"}), HTTPStatus.BAD_REQUEST

    if recommended_value not in (0, 1, "0", "1"):
        return jsonify({"error": "recommended must be 0 or 1"}), HTTPStatus.BAD_REQUEST
    recommended_int = int(recommended_value)

    age = None
    if age_value not in (None, ""):
        try:
            age = int(age_value)
        except (TypeError, ValueError):
            return jsonify({"error": "age must be an integer"}), HTTPStatus.BAD_REQUEST

    try:
        review_payload = DATA_STORE.add_review(
            product_id=product_id,
            title=title,
            review_text=review_text,
            rating=rating,
            recommended=recommended_int,
            age=age,
        )
        product_payload = DATA_STORE.get_product(product_id)
    except KeyError:
        return jsonify({"error": "Product not found"}), HTTPStatus.NOT_FOUND

    return (
        jsonify({
            "review": review_payload,
            "product": product_payload,
        }),
        HTTPStatus.CREATED,
    )
    return jsonify(response)


if __name__ == "__main__":  # pragma: no cover - CLI entry-point
    app.run(host="0.0.0.0", port=5000, debug=True)
