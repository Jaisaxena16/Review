from gensim.models import FastText
import numpy as np
import pickle
import re

# --- Load pre-trained models ---
ft_model = FastText.load("models/fasttext_model.bin")
with open("models/logistic_regression_model.pkl", "rb") as f:
    lr_model = pickle.load(f)

# --- Text preprocessing (similar to Milestone I regex) ---
def preprocess_text(text):
    text = text.lower()
    tokens = re.findall(r"[a-zA-Z]+(?:[-'][a-zA-Z]+)?", text)
    return tokens

# --- Convert a review into an embedding ---
def vectorize_text(text, model=ft_model):
    tokens = preprocess_text(text)
    if not tokens:
        return np.zeros(model.vector_size)
    vectors = [model.wv[w] for w in tokens if w in model.wv]
    if not vectors:
        return np.zeros(model.vector_size)
    return np.mean(vectors, axis=0)

# --- Predict recommendation label (0/1) ---
def predict_label(text):
    vec = vectorize_text(text).reshape(1, -1)
    proba = lr_model.predict_proba(vec)[0][1]
    return "1" if proba >= 0.5 else "0"
