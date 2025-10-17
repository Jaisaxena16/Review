"""Utility helpers for loading NLP models and generating predictions."""
from __future__ import annotations

import logging
import math
import pickle
import re
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np

LOGGER = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = (BASE_DIR.parent / "models").resolve()
FASTTEXT_MODEL_PATH = MODEL_DIR / "fasttext_model.bin"
CLASSIFIER_MODEL_PATH = MODEL_DIR / "logistic_regression_model.pkl"
TFIDF_VECTORIZER_PATH = MODEL_DIR / "tfidf_vectorizer.pkl"

POSITIVE_KEYWORDS = {
    "amazing",
    "beautiful",
    "best",
    "comfortable",
    "excellent",
    "favorite",
    "great",
    "love",
    "perfect",
    "recommend",
    "stylish",
    "wonderful",
}

NEGATIVE_KEYWORDS = {
    "awful",
    "bad",
    "cheap",
    "disappointing",
    "horrible",
    "poor",
    "return",
    "terrible",
    "uncomfortable",
    "waste",
    "worst",
}


class ModelNotReadyError(RuntimeError):
    """Raised when the required NLP models are not available."""


def _normalise_text(text: str) -> List[str]:
    """Lowercase, strip punctuation and split into tokens."""
    cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
    tokens = [token for token in cleaned.split() if token]
    return tokens


def _fallback_prediction(review_text: str, rating: Optional[float]) -> Dict[str, float]:
    """Deterministic keyword-based heuristic used when ML models are unavailable."""
    tokens = _normalise_text(review_text)

    positive = sum(1 for token in tokens if token in POSITIVE_KEYWORDS)
    negative = sum(1 for token in tokens if token in NEGATIVE_KEYWORDS)

    rating_adjustment = 0.0
    if rating is not None:
        rating_adjustment = (float(rating) - 3.0) / 1.5  # favour positive ratings

    score = positive - negative + rating_adjustment
    probability = 1.0 / (1.0 + math.exp(-score))
    prediction = 1 if probability >= 0.5 else 0
    confidence = probability if prediction == 1 else 1.0 - probability

    return {
        "prediction": prediction,
        "confidence": float(confidence),
        "source": "fallback",
    }


@lru_cache(maxsize=1)
def _load_classifier():
    """Lazily load the logistic regression classifier."""
    if not CLASSIFIER_MODEL_PATH.exists():
        raise ModelNotReadyError(
            f"Classifier model is missing. Expected at: {CLASSIFIER_MODEL_PATH}"
        )

    try:
        with CLASSIFIER_MODEL_PATH.open("rb") as handle:
            classifier = pickle.load(handle)
    except ModuleNotFoundError as exc:  # pragma: no cover - optional dependency
        raise ModelNotReadyError(
            "scikit-learn is required to load the classifier. Install the backend dependencies"
        ) from exc
    except Exception as exc:  # pragma: no cover - defensive logging
        raise ModelNotReadyError(f"Unable to load classifier: {exc}") from exc

    LOGGER.info("Classifier loaded successfully from %s", CLASSIFIER_MODEL_PATH)
    return classifier


@lru_cache(maxsize=1)
def _load_vectorizer():
    """Lazily load the TF-IDF vectorizer used during training."""
    if not TFIDF_VECTORIZER_PATH.exists():
        raise ModelNotReadyError(
            f"Vectorizer model is missing. Expected at: {TFIDF_VECTORIZER_PATH}"
        )

    try:
        with TFIDF_VECTORIZER_PATH.open("rb") as handle:
            vectorizer = pickle.load(handle)
    except ModuleNotFoundError as exc:  # pragma: no cover - optional dependency
        raise ModelNotReadyError(
            "scikit-learn is required to load the vectorizer. Install the backend dependencies"
        ) from exc
    except Exception as exc:  # pragma: no cover - defensive logging
        raise ModelNotReadyError(f"Unable to load vectorizer: {exc}") from exc

    LOGGER.info("Vectorizer loaded successfully from %s", TFIDF_VECTORIZER_PATH)
    return vectorizer


def predict_recommendation(
    *,
    review_text: str,
    rating: Optional[float] = None,
) -> Dict[str, float]:
    """Generate a recommendation label for the provided review text."""
    if not review_text or not review_text.strip():
        raise ValueError("review_text must be a non-empty string")

    try:
        classifier = _load_classifier()
    except ModelNotReadyError as exc:
        LOGGER.warning("Classifier unavailable, using fallback heuristic: %s", exc)
        return _fallback_prediction(review_text, rating)

    # Try to predict directly first. Some submissions pickle a pipeline that
    # already handles text vectorisation internally.
    try:
        proba = classifier.predict_proba([review_text])[0]
    except Exception:  # pragma: no cover - depends on training pipeline
        LOGGER.debug("Classifier requires manual vectorisation, loading TF-IDF model")
        try:
            vectorizer = _load_vectorizer()
        except ModelNotReadyError as exc:
            LOGGER.warning("Vectorizer unavailable, falling back to heuristic: %s", exc)
            return _fallback_prediction(review_text, rating)

        try:
            features = vectorizer.transform([review_text])
            proba = classifier.predict_proba(features)[0]
        except Exception as exc:  # pragma: no cover - defensive logging
            LOGGER.error("Prediction using trained model failed: %s", exc)
            return _fallback_prediction(review_text, rating)

    proba = np.asarray(proba, dtype=np.float32)
    prediction = int(np.argmax(proba))
    confidence = float(proba[prediction]) if proba.size else 0.5

    return {
        "prediction": prediction,
        "confidence": confidence,
        "source": "backend",
    }


__all__ = [
    "predict_recommendation",
    "ModelNotReadyError",
    "FASTTEXT_MODEL_PATH",
    "CLASSIFIER_MODEL_PATH",
    "TFIDF_VECTORIZER_PATH",
]
