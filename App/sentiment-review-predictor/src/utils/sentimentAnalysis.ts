import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

export type RecommendationSource = "backend" | "fallback";

export interface RecommendationResult {
  prediction: 0 | 1;
  confidence?: number;
  source: RecommendationSource;
}

const FALLBACK_POSITIVE_WORDS = new Set([
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
  "wonderful"
]);

const FALLBACK_NEGATIVE_WORDS = new Set([
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
  "worst"
]);

const fallbackPrediction = (reviewText: string, rating: number): RecommendationResult => {
  const tokens = (reviewText.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(Boolean);

  const positiveScore = tokens.filter(token => FALLBACK_POSITIVE_WORDS.has(token)).length;
  const negativeScore = tokens.filter(token => FALLBACK_NEGATIVE_WORDS.has(token)).length;

  const ratingAdjustment = Number.isFinite(rating) ? (rating - 3) / 1.5 : 0;
  const totalScore = positiveScore - negativeScore + ratingAdjustment;
  const probability = 1 / (1 + Math.exp(-totalScore));
  const prediction = probability >= 0.5 ? 1 : 0;
  const confidence = prediction === 1 ? probability : 1 - probability;

  return {
    prediction: prediction as 0 | 1,
    confidence,
    source: "fallback"
  };
};

export const predictRecommendation = async (
  reviewText: string,
  rating: number
): Promise<RecommendationResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reviewText, rating })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Prediction request failed");
    }

    const data = await response.json();
    const prediction = Number(data.prediction);

    if (prediction !== 0 && prediction !== 1) {
      throw new Error("Invalid prediction received from API");
    }

    return {
      prediction: prediction as 0 | 1,
      confidence: typeof data.confidence === "number" ? data.confidence : undefined,
      source: "backend"
    };
  } catch (error) {
    console.error("Falling back to heuristic prediction", error);
    toast.warning("Using offline prediction", {
      description: "Falling back to heuristic sentiment rules because the ML API is unavailable."
    });
    return fallbackPrediction(reviewText, rating);
  }
};
