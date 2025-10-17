import { ClothingItem, Review } from "@/types/clothing";

export const clothingItems: ClothingItem[] = [
  {
    id: 1,
    title: "Classic Slim Fit Dress",
    description: "Elegant slim-fit dress perfect for any occasion. Made with high-quality fabric that drapes beautifully. Features a flattering silhouette with a knee-length hem.",
    category: "Dresses",
    departmentName: "Dresses",
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
    rating: 4.5
  },
  {
    id: 2,
    title: "Floral Summer Dress",
    description: "Beautiful floral print dress ideal for summer days. Lightweight and breathable material with adjustable straps. Perfect for casual outings or beach vacations.",
    category: "Dresses",
    departmentName: "Dresses",
    imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80",
    rating: 4.8
  },
  {
    id: 3,
    title: "Casual Cotton Tops",
    description: "Comfortable everyday cotton top with modern styling. Versatile piece that pairs well with jeans or skirts. Available in multiple colors with a relaxed fit.",
    category: "Tops",
    departmentName: "Tops",
    imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
    rating: 4.2
  },
  {
    id: 4,
    title: "Elegant Blouse",
    description: "Sophisticated blouse perfect for office wear. Features a professional cut with subtle detailing. Made from wrinkle-resistant fabric for all-day comfort.",
    category: "Tops",
    departmentName: "Tops",
    imageUrl: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&q=80",
    rating: 4.6
  },
  {
    id: 5,
    title: "Denim Jacket",
    description: "Timeless denim jacket that never goes out of style. Classic fit with button closure and multiple pockets. Perfect layering piece for any season.",
    category: "Jackets",
    departmentName: "Jackets",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
    rating: 4.7
  },
  {
    id: 6,
    title: "Cozy Knit Sweater",
    description: "Warm and comfortable knit sweater for cooler days. Soft material with a relaxed fit. Features ribbed cuffs and hem for a snug feel.",
    category: "Sweaters",
    departmentName: "Tops",
    imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80",
    rating: 4.4
  }
];

export const reviews: Review[] = [
  {
    id: 1,
    clothingId: 1,
    title: "Perfect fit!",
    reviewText: "I absolutely love this dress! The fit is perfect and the quality exceeded my expectations. I received so many compliments when I wore it to a wedding.",
    rating: 5,
    recommended: 1,
    age: 32,
    createdAt: "2024-10-15T10:30:00Z"
  },
  {
    id: 2,
    clothingId: 1,
    title: "Nice but runs small",
    reviewText: "Beautiful dress but I had to size up. The material is good quality and it looks elegant. Just be aware of the sizing.",
    rating: 4,
    recommended: 1,
    age: 28,
    createdAt: "2024-10-12T14:20:00Z"
  },
  {
    id: 3,
    clothingId: 2,
    title: "Love the print!",
    reviewText: "This dress is perfect for summer! The floral print is stunning and it's so comfortable to wear all day. Highly recommend!",
    rating: 5,
    recommended: 1,
    age: 25,
    createdAt: "2024-10-10T09:15:00Z"
  },
  {
    id: 4,
    clothingId: 3,
    title: "Great basic top",
    reviewText: "Exactly what I needed for everyday wear. The cotton is soft and it washes well. Will definitely buy more colors.",
    rating: 4,
    recommended: 1,
    age: 35,
    createdAt: "2024-10-08T16:45:00Z"
  }
];
