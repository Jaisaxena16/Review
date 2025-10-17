export interface ClothingItem {
  id: number;
  title: string;
  description: string;
  category: string;
  departmentName: string;
  imageUrl: string;
  rating?: number;
}

export interface Review {
  id: number;
  clothingId: number;
  title: string;
  reviewText: string;
  rating: number;
  recommended: 0 | 1;
  age?: number;
  createdAt: string;
}
