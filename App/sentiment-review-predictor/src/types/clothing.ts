export interface ProductSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  departmentName: string;
  divisionName: string;
  imageUrl: string;
  averageRating: number | null;
  reviewCount: number;
  positiveFeedbackCount: number;
  recommendationRate: number | null;
}

export interface ProductReview {
  id: string;
  title: string;
  reviewText: string;
  rating: number | null;
  recommended: 0 | 1;
  age?: number | null;
  positiveFeedbackCount: number;
  clothingId: string | null;
  divisionName: string;
  departmentName: string;
  category: string;
  createdAt: string;
}

export interface ProductDetail extends ProductSummary {
  clothingIds: string[];
  reviews: ProductReview[];
}

export interface ProductsResponse {
  items: ProductSummary[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  availableCategories: string[];
}

export interface ProductOption {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
}
