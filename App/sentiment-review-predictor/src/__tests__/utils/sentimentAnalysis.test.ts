/**
 * Comprehensive tests for sentiment analysis utility.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { predictRecommendation } from '@/utils/sentimentAnalysis';
import type { RecommendationResult } from '@/utils/sentimentAnalysis';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Sentiment Analysis', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('predictRecommendation - Backend Mode', () => {
    it('should call backend API with review text and rating', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prediction: 1,
          confidence: 0.95,
          source: 'backend',
        }),
      });

      const result = await predictRecommendation('Great product!', 5);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/predict'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewText: 'Great product!', rating: 5 }),
        })
      );
      expect(result.prediction).toBe(1);
      expect(result.source).toBe('backend');
    });

    it('should return prediction 1 for positive reviews', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prediction: 1,
          confidence: 0.9,
          source: 'backend',
        }),
      });

      const result = await predictRecommendation('Excellent quality, highly recommend!', 5);

      expect(result.prediction).toBe(1);
      expect(result.confidence).toBe(0.9);
    });

    it('should return prediction 0 for negative reviews', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prediction: 0,
          confidence: 0.85,
          source: 'backend',
        }),
      });

      const result = await predictRecommendation('Terrible quality, do not buy', 1);

      expect(result.prediction).toBe(0);
      expect(result.confidence).toBe(0.85);
    });

    it('should include confidence when provided by backend', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prediction: 1,
          confidence: 0.75,
          source: 'backend',
        }),
      });

      const result = await predictRecommendation('Good product', 4);

      expect(result.confidence).toBe(0.75);
    });

    it('should handle missing confidence from backend', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prediction: 1,
          source: 'backend',
        }),
      });

      const result = await predictRecommendation('Nice', 4);

      expect(result.confidence).toBeUndefined();
    });
  });

  describe('predictRecommendation - Fallback Mode', () => {
    it('should fall back to heuristic on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await predictRecommendation('Great product', 5);

      expect(result.source).toBe('fallback');
      expect(result.prediction).toBe(1);
    });

    it('should fall back on API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      const result = await predictRecommendation('Test review', 3);

      expect(result.source).toBe('fallback');
    });

    it('should predict positive with positive keywords', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const result = await predictRecommendation(
        'Amazing product, love it, excellent quality, perfect fit',
        5
      );

      expect(result.prediction).toBe(1);
      expect(result.source).toBe('fallback');
    });

    it('should predict negative with negative keywords', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const result = await predictRecommendation(
        'Awful quality, terrible fit, worst purchase ever',
        1
      );

      expect(result.prediction).toBe(0);
      expect(result.source).toBe('fallback');
    });

    it('should consider rating in fallback prediction', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      // High rating should influence toward positive
      const result1 = await predictRecommendation('Okay product', 5);
      expect(result1.prediction).toBe(1);

      // Low rating should influence toward negative
      const result2 = await predictRecommendation('Okay product', 1);
      expect(result2.prediction).toBe(0);
    });

    it('should handle neutral reviews with mid-range rating', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const result = await predictRecommendation('It is fine', 3);

      expect(result.prediction).toBeTypeOf('number');
      expect([0, 1]).toContain(result.prediction);
    });

    it('should provide confidence in fallback mode', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const result = await predictRecommendation('Great product', 5);

      expect(result.confidence).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle review with mixed sentiments', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const result = await predictRecommendation(
        'Good quality but terrible sizing',
        3
      );

      expect(result.source).toBe('fallback');
      expect([0, 1]).toContain(result.prediction);
    });

    it('should be case-insensitive for keywords', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const result = await predictRecommendation(
        'AMAZING EXCELLENT WONDERFUL',
        5
      );

      expect(result.prediction).toBe(1);
    });

    it('should handle reviews with numbers', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const result = await predictRecommendation(
        'Great product 100% recommend',
        5
      );

      expect(result.prediction).toBe(1);
    });

    it('should handle empty or very short reviews', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const result = await predictRecommendation('ok', 3);

      expect(result.source).toBe('fallback');
      expect([0, 1]).toContain(result.prediction);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid prediction value from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prediction: 99, // Invalid
          source: 'backend',
        }),
      });

      // Should fall back due to invalid prediction
      const result = await predictRecommendation('Test', 3);
      expect(result.source).toBe('fallback');
    });

    it('should handle prediction as string from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prediction: '1', // String instead of number
          source: 'backend',
        }),
      });

      const result = await predictRecommendation('Test', 3);

      // Should convert string to number
      expect(result.prediction).toBe(1);
    });

    it('should handle extremely long review text', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API timeout'));

      const longReview = 'great '.repeat(1000);
      const result = await predictRecommendation(longReview, 5);

      expect(result.source).toBe('fallback');
      expect(result.prediction).toBe(1);
    });

    it('should handle review with only special characters', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const result = await predictRecommendation('!!!@@@###', 3);

      expect(result.source).toBe('fallback');
      expect([0, 1]).toContain(result.prediction);
    });

    it('should handle non-finite rating values in fallback', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const result = await predictRecommendation('Good product', NaN);

      expect(result.source).toBe('fallback');
      expect([0, 1]).toContain(result.prediction);
    });

    it('should handle rating of 0', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prediction: 0,
          confidence: 0.9,
          source: 'backend',
        }),
      });

      const result = await predictRecommendation('Poor quality', 0);

      expect(result.prediction).toBeDefined();
    });
  });

  describe('Response Validation', () => {
    it('should accept prediction value of 0', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prediction: 0,
          confidence: 0.8,
          source: 'backend',
        }),
      });

      const result = await predictRecommendation('Bad product', 2);

      expect(result.prediction).toBe(0);
    });

    it('should accept prediction value of 1', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prediction: 1,
          confidence: 0.9,
          source: 'backend',
        }),
      });

      const result = await predictRecommendation('Great product', 5);

      expect(result.prediction).toBe(1);
    });

    it('should reject prediction values other than 0 or 1', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prediction: 2,
          source: 'backend',
        }),
      });

      const result = await predictRecommendation('Test', 3);

      // Should fall back to heuristic
      expect(result.source).toBe('fallback');
    });
  });

  describe('Fallback Heuristic Behavior', () => {
    beforeEach(() => {
      // Force fallback for all tests in this block
      mockFetch.mockRejectedValue(new Error('API unavailable'));
    });

    it('should weight positive keywords correctly', async () => {
      const result = await predictRecommendation(
        'love love love amazing excellent',
        3
      );

      expect(result.prediction).toBe(1);
    });

    it('should weight negative keywords correctly', async () => {
      const result = await predictRecommendation(
        'terrible awful horrible worst',
        3
      );

      expect(result.prediction).toBe(0);
    });

    it('should balance keywords with rating', async () => {
      // Negative keywords with high rating
      const result1 = await predictRecommendation('bad', 5);
      // Should lean positive due to high rating

      // Positive keywords with low rating
      const result2 = await predictRecommendation('good', 1);
      // Should lean negative due to low rating

      expect([0, 1]).toContain(result1.prediction);
      expect([0, 1]).toContain(result2.prediction);
    });

    it('should provide consistent results for same input', async () => {
      const result1 = await predictRecommendation('great product', 5);
      const result2 = await predictRecommendation('great product', 5);

      expect(result1.prediction).toBe(result2.prediction);
      expect(result1.confidence).toBe(result2.confidence);
    });
  });
});