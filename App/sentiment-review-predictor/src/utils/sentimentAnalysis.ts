import { toast } from "sonner";

export type RecommendationSource = "backend" | "fallback";

export interface RecommendationResult {
  prediction: 0 | 1;
  confidence?: number;
  source: RecommendationSource;
}

const FALLBACK_POSITIVE_WORDS = [
  "love", "perfect", "amazing", "great", "excellent", "beautiful",
  "fantastic", "highly recommend", "best", "wonderful", "gorgeous"
];

const FALLBACK_NEGATIVE_WORDS = [
  "poor", "terrible", "worst", "disappointing", "awful", "bad",
  "horrible", "waste", "regret", "never", "not recommend"
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const fallbackPrediction = (reviewText: string, rating: number): RecommendationResult => {
  const text = reviewText.toLowerCase();

  let positiveScore = 0;
  let negativeScore = 0;

  FALLBACK_POSITIVE_WORDS.forEach(word => {
    if (text.includes(word)) positiveScore++;
  });

  FALLBACK_NEGATIVE_WORDS.forEach(word => {
    if (text.includes(word)) negativeScore++;
  });

  const ratingWeight = rating >= 4 ? 2 : (rating >= 3 ? 0 : -2);
  const totalScore = positiveScore - negativeScore + ratingWeight;

  return {
    prediction: totalScore > 0 ? 1 : 0,
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
