"""Utility helpers for loading NLP models and generating predictions."""
from __future__ import annotations

import logging
import re
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np

LOGGER = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = "C:\Users\JAY\OneDrive\Desktop\RMIT\AP DS\Assignment\A3 - Part2\App\sentiment-review-predictor\models"
FASTTEXT_MODEL_PATH = MODEL_DIR / "fasttext_model.bin"
CLASSIFIER_MODEL_PATH = MODEL_DIR / "logistic_regression_model.pkl"


class ModelNotReadyError(RuntimeError):
    """Raised when the required NLP models are not available."""


def _normalise_text(text: str) -> List[str]:
    """Lowercase, strip punctuation and split into tokens."""
    cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
    tokens = [token for token in cleaned.split() if token]
    return tokens


@lru_cache(maxsize=1)
def _load_fasttext_model():
    """Lazily load the FastText model from disk."""
    if not FASTTEXT_MODEL_PATH.exists():
        raise ModelNotReadyError(
            f"FastText model is missing. Expected at: {FASTTEXT_MODEL_PATH}"
        )

    try:
        from gensim.models.fasttext import FastText
    except ModuleNotFoundError as exc:  # pragma: no cover - import guard
        raise ModelNotReadyError(
            "gensim is required to load the FastText model. Install the backend "
            "dependencies listed in server/requirements.txt"
        ) from exc

    LOGGER.info("Loading FastText model from %s", FASTTEXT_MODEL_PATH)
    return FastText.load(str(FASTTEXT_MODEL_PATH))


@lru_cache(maxsize=1)
def _load_classifier():
    """Lazily load the logistic regression classifier."""
    if not CLASSIFIER_MODEL_PATH.exists():
        raise ModelNotReadyError(
            f"Classifier model is missing. Expected at: {CLASSIFIER_MODEL_PATH}"
        )

    try:
        import joblib
    except ModuleNotFoundError as exc:  # pragma: no cover - import guard
        raise ModelNotReadyError(
            "joblib is required to load the classifier. Install backend dependencies"
        ) from exc

    LOGGER.info("Loading classifier from %s", CLASSIFIER_MODEL_PATH)
    return joblib.load(str(CLASSIFIER_MODEL_PATH))


def _mean_vector(tokens: List[str], vector_size: int) -> np.ndarray:
    """Return the mean FastText embedding for the provided tokens."""
    if not tokens:
        return np.zeros(vector_size, dtype=np.float32)

    fasttext_model = _load_fasttext_model()
    vectors: List[np.ndarray] = []

    for token in tokens:
        if token in fasttext_model.wv:
            vectors.append(fasttext_model.wv[token])

    if not vectors:
        # Fallback to zeros if none of the tokens exist in the vocabulary
        return np.zeros(vector_size, dtype=np.float32)

    stacked = np.vstack(vectors)
    return stacked.mean(axis=0)


def _compose_feature_vector(
    text: str,
    rating: Optional[float],
) -> np.ndarray:
    """Build the feature vector expected by the classifier."""
    classifier = _load_classifier()
    fasttext_model = _load_fasttext_model()
    tokens = _normalise_text(text)

    base_vector = _mean_vector(tokens, fasttext_model.wv.vector_size)
    expected_size = classifier.coef_.shape[1]
    base_size = base_vector.size

    if base_size == expected_size:
        return base_vector

    # Prepare auxiliary features for classifiers trained with extra metadata
    extras: List[float] = []
    if rating is not None:
        extras.append(float(rating) / 5.0)
    # Provide a couple of deterministic text features so we can adapt to
    # different classifier configurations (length & unique token ratio)
    token_count = len(tokens)
    extras.append(float(token_count))
    unique_ratio = float(len(set(tokens))) / token_count if token_count else 0.0
    extras.append(unique_ratio)

    extras_array = np.array(extras, dtype=np.float32)
    total_size = base_size + extras_array.size

    if total_size >= expected_size:
        combined = np.concatenate([base_vector, extras_array])
        return combined[:expected_size]

    # Pad with zeros if the classifier expects more features than we have
    padding = np.zeros(expected_size - total_size, dtype=np.float32)
    combined = np.concatenate([base_vector, extras_array, padding])
    return combined


def predict_recommendation(
    *,
    review_text: str,
    rating: Optional[float] = None,
) -> Dict[str, float]:
    """Generate a recommendation label for the provided review text."""
    if not review_text or not review_text.strip():
        raise ValueError("review_text must be a non-empty string")

    features = _compose_feature_vector(review_text, rating)
    classifier = _load_classifier()

    proba = classifier.predict_proba([features])[0]
    prediction = int(np.argmax(proba))
    confidence = float(proba[prediction])

    return {
        "prediction": prediction,
        "confidence": confidence,
    }


__all__ = [
    "predict_recommendation",
    "ModelNotReadyError",
    "FASTTEXT_MODEL_PATH",
    "CLASSIFIER_MODEL_PATH",
]
