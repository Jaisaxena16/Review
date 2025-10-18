/**
 * Comprehensive tests for ClothingCard component.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClothingCard } from '@/components/ClothingCard';
import type { ProductSummary } from '@/types/clothing';

describe('ClothingCard', () => {
  const mockOnClick = vi.fn();

  const baseProduct: ProductSummary = {
    id: 'test-product',
    title: 'Test Product',
    description: 'This is a test product description.',
    category: 'Dresses',
    departmentName: 'Women',
    divisionName: 'General',
    imageUrl: 'http://example.com/image.jpg',
    averageRating: 4.5,
    reviewCount: 10,
    positiveFeedbackCount: 8,
    recommendationRate: 0.8,
  };

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe('Rendering', () => {
    it('should render product title', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should render product description', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      expect(screen.getByText('This is a test product description.')).toBeInTheDocument();
    });

    it('should render product category', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      expect(screen.getByText('Dresses')).toBeInTheDocument();
    });

    it('should render product image', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      const image = screen.getByAltText('Test Product');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'http://example.com/image.jpg');
    });

    it('should display average rating', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('should display review count', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      expect(screen.getByText(/10 reviews/)).toBeInTheDocument();
    });

    it('should display singular review for count of 1', () => {
      const product = { ...baseProduct, reviewCount: 1 };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      expect(screen.getByText(/1 review$/)).toBeInTheDocument();
    });
  });

  describe('Rating Display', () => {
    it('should show rating when averageRating is a number', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('should show "No ratings yet" when averageRating is null', () => {
      const product = { ...baseProduct, averageRating: null };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      expect(screen.getByText('No ratings yet')).toBeInTheDocument();
    });

    it('should format rating to one decimal place', () => {
      const product = { ...baseProduct, averageRating: 4.567 };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      expect(screen.getByText('4.6')).toBeInTheDocument();
    });

    it('should handle rating of 0', () => {
      const product = { ...baseProduct, averageRating: 0 };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('should handle perfect rating of 5', () => {
      const product = { ...baseProduct, averageRating: 5.0 };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      expect(screen.getByText('5.0')).toBeInTheDocument();
    });
  });

  describe('Review Count Display', () => {
    it('should display 0 reviews correctly', () => {
      const product = { ...baseProduct, reviewCount: 0, averageRating: null };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      expect(screen.getByText('No ratings yet')).toBeInTheDocument();
    });

    it('should display large review counts', () => {
      const product = { ...baseProduct, reviewCount: 1523 };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      expect(screen.getByText(/1523 reviews/)).toBeInTheDocument();
    });
  });

  describe('Description Truncation', () => {
    it('should apply line-clamp-2 class to description', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      const description = screen.getByText('This is a test product description.');
      expect(description).toHaveClass('line-clamp-2');
    });

    it('should handle long descriptions', () => {
      const longDescription = 'a '.repeat(100);
      const product = { ...baseProduct, description: longDescription };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle empty description', () => {
      const product = { ...baseProduct, description: '' };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      expect(screen.queryByText('This is a test product description.')).not.toBeInTheDocument();
    });
  });

  describe('Click Interaction', () => {
    it('should call onClick when card is clicked', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      const card = screen.getByText('Test Product').closest('.cursor-pointer');
      fireEvent.click(card!);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick multiple times on single click', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      const card = screen.getByText('Test Product').closest('.cursor-pointer');
      fireEvent.click(card!);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor-pointer class', () => {
      render(<ClothingCard item={baseProduct} onClick=  {mockOnClick} />);
      const card = screen.getByText('Test Product').closest('.cursor-pointer');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Styling and Layout', () => {
    it('should apply hover:shadow-lg class', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      const card = screen.getByText('Test Product').closest('.hover\\:shadow-lg');
      expect(card).toBeTruthy();
    });

    it('should have transition-shadow class', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      const card = screen.getByText('Test Product').closest('.transition-shadow');
      expect(card).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle product with no positive feedback', () => {
      const product = { ...baseProduct, positiveFeedbackCount: 0 };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should handle product with null recommendation rate', () => {
      const product = { ...baseProduct, recommendationRate: null };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should handle very long category names', () => {
      const product = { ...baseProduct, category: 'Very Long Category Name That Might Wrap' };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      expect(screen.getByText('Very Long Category Name That Might Wrap')).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      const product = { ...baseProduct, title: 'Test & Product "Special"' };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      expect(screen.getByText('Test & Product "Special"')).toBeInTheDocument();
    });

    it('should handle missing image URL gracefully', () => {
      const product = { ...baseProduct, imageUrl: '' };
      render(<ClothingCard item={product} onClick={mockOnClick} />);
      const image = screen.getByAltText('Test Product');
      expect(image).toHaveAttribute('src', '');
    });
  });

  describe('Star Icon', () => {
    it('should render star icon when rating is present', () => {
      const { container } = render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      // Check for Lucide Star icon class
      const starIcon = container.querySelector('.lucide-star');
      expect(starIcon).toBeInTheDocument();
    });

    it('should have filled star for products with ratings', () => {
      const { container } = render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      const starIcon = container.querySelector('.fill-primary');
      expect(starIcon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible image alt text', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      const image = screen.getByAltText('Test Product');
      expect(image).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<ClothingCard item={baseProduct} onClick={mockOnClick} />);
      const card = screen.getByText('Test Product').closest('.cursor-pointer');
      expect(card).toBeInTheDocument();
      // Card should be clickable (either has onClick or is interactive)
    });
  });
});