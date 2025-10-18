/**
 * Comprehensive tests for the API client library.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  API_BASE_URL,
  fetchProducts,
  fetchProductDetail,
  fetchProductOptions,
  submitReview,
  type ReviewPayload,
} from '@/lib/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('API_BASE_URL', () => {
    it('should use environment variable or default to localhost', () => {
      expect(API_BASE_URL).toBeDefined();
      expect(typeof API_BASE_URL).toBe('string');
    });
  });

  describe('fetchProducts', () => {
    it('should fetch products with default parameters', async () => {
      const mockResponse = {
        items: [],
        page: 1,
        pageSize: 12,
        totalItems: 0,
        totalPages: 1,
        availableCategories: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchProducts();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0].toString()).toContain('/api/products');
      expect(result).toEqual(mockResponse);
    });

    it('should include pagination parameters in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], page: 2, pageSize: 24, totalItems: 0, totalPages: 1, availableCategories: [] }),
      });

      await fetchProducts({ page: 2, pageSize: 24 });

      const calledUrl = mockFetch.mock.calls[0][0].toString();
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('page_size=24');
    });

    it('should include search parameter when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], page: 1, pageSize: 12, totalItems: 0, totalPages: 1, availableCategories: [] }),
      });

      await fetchProducts({ search: 'dress' });

      const calledUrl = mockFetch.mock.calls[0][0].toString();
      expect(calledUrl).toContain('search=dress');
    });

    it('should include category parameter when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], page: 1, pageSize: 12, totalItems: 0, totalPages: 1, availableCategories: [] }),
      });

      await fetchProducts({ category: 'Dresses' });

      const calledUrl = mockFetch.mock.calls[0][0].toString();
      expect(calledUrl).toContain('category=Dresses');
    });

    it('should not include undefined or null parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], page: 1, pageSize: 12, totalItems: 0, totalPages: 1, availableCategories: [] }),
      });

      await fetchProducts({ search: undefined, category: null });

      const calledUrl = mockFetch.mock.calls[0][0].toString();
      expect(calledUrl).not.toContain('search=');
      expect(calledUrl).not.toContain('category=');
    });

    it('should not include empty string parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], page: 1, pageSize: 12, totalItems: 0, totalPages: 1, availableCategories: [] }),
      });

      await fetchProducts({ search: '' });

      const calledUrl = mockFetch.mock.calls[0][0].toString();
      expect(calledUrl).not.toContain('search=');
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(fetchProducts()).rejects.toThrow();
    });

    it('should throw error with response message', async () => {
      const errorMessage = 'Custom error message';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => errorMessage,
      });

      await expect(fetchProducts()).rejects.toThrow(errorMessage);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchProducts()).rejects.toThrow('Network error');
    });
  });

  describe('fetchProductDetail', () => {
    it('should fetch product detail by ID', async () => {
      const mockProduct = {
        id: 'test-product',
        title: 'Test Product',
        description: 'Description',
        category: 'Category',
        departmentName: 'Department',
        divisionName: 'Division',
        imageUrl: 'http://example.com/image.jpg',
        averageRating: 4.5,
        reviewCount: 10,
        positiveFeedbackCount: 8,
        recommendationRate: 0.8,
        clothingIds: ['1001'],
        reviews: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct,
      });

      const result = await fetchProductDetail('test-product');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0].toString();
      expect(calledUrl).toContain('/api/products/test-product');
      expect(result).toEqual(mockProduct);
    });

    it('should throw error when product not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Product not found',
      });

      await expect(fetchProductDetail('nonexistent')).rejects.toThrow('Product not found');
    });

    it('should handle special characters in product ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-123', reviews: [] }),
      });

      await fetchProductDetail('test-123');

      const calledUrl = mockFetch.mock.calls[0][0].toString();
      expect(calledUrl).toContain('test-123');
    });
  });

  describe('fetchProductOptions', () => {
    it('should fetch product options for dropdown', async () => {
      const mockOptions = [
        { id: 'product-1', title: 'Product 1', category: 'Category 1', imageUrl: 'url1' },
        { id: 'product-2', title: 'Product 2', category: 'Category 2', imageUrl: 'url2' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockOptions }),
      });

      const result = await fetchProductOptions();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0].toString();
      expect(calledUrl).toContain('/api/products/options');
      expect(result).toEqual(mockOptions);
    });

    it('should extract items from response', async () => {
      const mockOptions = [{ id: '1', title: 'Test', category: 'Cat', imageUrl: 'url' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockOptions }),
      });

      const result = await fetchProductOptions();
      expect(result).toEqual(mockOptions);
    });

    it('should handle empty options list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      const result = await fetchProductOptions();
      expect(result).toEqual([]);
    });
  });

  describe('submitReview', () => {
    const validPayload: ReviewPayload = {
      productId: 'test-product',
      title: 'Great product',
      reviewText: 'I really enjoyed this product.',
      rating: 5,
      recommended: 1,
      age: 30,
    };

    it('should submit review with all fields', async () => {
      const mockResponse = {
        review: { id: 'review-1', ...validPayload },
        product: { id: 'test-product', title: 'Test Product' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await submitReview(validPayload);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validPayload),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should submit review without optional age field', async () => {
      const payloadWithoutAge = {
        productId: 'test-product',
        title: 'Good',
        reviewText: 'Nice product',
        rating: 4,
        recommended: 1 as const,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ review: {}, product: {} }),
      });

      await submitReview(payloadWithoutAge);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody).not.toHaveProperty('age');
    });

    it('should handle recommended value of 0', async () => {
      const payload = { ...validPayload, recommended: 0 as const };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ review: {}, product: {} }),
      });

      await submitReview(payload);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.recommended).toBe(0);
    });

    it('should throw error on validation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Validation failed',
      });

      await expect(submitReview(validPayload)).rejects.toThrow('Validation failed');
    });

    it('should throw error when product not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Product not found',
      });

      await expect(submitReview(validPayload)).rejects.toThrow('Product not found');
    });

    it('should use POST method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ review: {}, product: {} }),
      });

      await submitReview(validPayload);

      expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    });

    it('should set correct Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ review: {}, product: {} }),
      });

      await submitReview(validPayload);

      expect(mockFetch.mock.calls[0][1].headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Error handling', () => {
    it('should include status code in error when no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => '',
      });

      await expect(fetchProducts()).rejects.toThrow('500');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(fetchProducts()).rejects.toThrow('Invalid JSON');
    });

    it('should handle response.text() errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => {
          throw new Error('Cannot read response');
        },
      });

      await expect(fetchProducts()).rejects.toThrow();
    });
  });

  describe('URL building', () => {
    it('should construct correct base URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], page: 1, pageSize: 12, totalItems: 0, totalPages: 1, availableCategories: [] }),
      });

      await fetchProducts();

      const calledUrl = mockFetch.mock.calls[0][0].toString();
      expect(calledUrl).toContain(API_BASE_URL);
      expect(calledUrl).toContain('/api/products');
    });

    it('should handle multiple query parameters correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], page: 2, pageSize: 24, totalItems: 0, totalPages: 1, availableCategories: [] }),
      });

      await fetchProducts({ page: 2, pageSize: 24, search: 'test', category: 'Dresses' });

      const calledUrl = mockFetch.mock.calls[0][0].toString();
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('page_size=24');
      expect(calledUrl).toContain('search=test');
      expect(calledUrl).toContain('category=Dresses');
    });
  });
});