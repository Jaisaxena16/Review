import { ProductDetail, ProductOption, ProductsResponse } from "@/types/clothing";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const buildUrl = (path: string, params?: Record<string, string | number | undefined | null>) => {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const fetchProducts = async (
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
  } = {}
): Promise<ProductsResponse> => {
  const url = buildUrl("/api/products", {
    page: params.page,
    page_size: params.pageSize,
    search: params.search,
    category: params.category,
  });

  const response = await fetch(url);
  return handleResponse<ProductsResponse>(response);
};

export const fetchProductDetail = async (productId: string): Promise<ProductDetail> => {
  const url = buildUrl(`/api/products/${productId}`);
  const response = await fetch(url);
  return handleResponse<ProductDetail>(response);
};

export interface ReviewPayload {
  productId: string;
  title: string;
  reviewText: string;
  rating: number;
  recommended: 0 | 1;
  age?: number;
}

export const submitReview = async (payload: ReviewPayload) => {
  const url = buildUrl("/api/reviews");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<{ review: unknown; product: ProductDetail }>(response);
};

export const fetchProductOptions = async (): Promise<ProductOption[]> => {
  const url = buildUrl("/api/products/options");
  const response = await fetch(url);
  const data = await handleResponse<{ items: ProductOption[] }>(response);
  return data.items;
};
