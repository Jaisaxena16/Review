import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ThumbsUp, ThumbsDown, ArrowLeft } from "lucide-react";
import { fetchProductDetail } from "@/lib/api";
import { ProductReview } from "@/types/clothing";

const renderStars = (rating: number) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${
            star <= Math.round(rating)
              ? "fill-primary text-primary"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductDetail(id || ""),
    enabled: Boolean(id),
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      navigate("/");
    }
  }, [isError, navigate]);

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-60 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-6 w-2/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const averageRating = typeof product.averageRating === "number" ? product.averageRating : 0;
  const reviews: ProductReview[] = product.reviews;

  return (
    <div className="min-h-screen bg-background">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <div>
              <Badge className="mb-3">{product.category}</Badge>
              <h1 className="text-4xl font-bold mb-4">{product.title}</h1>

              {product.reviewCount > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  {renderStars(averageRating)}
                  <span className="text-sm text-muted-foreground">
                    ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </div>
              )}

              <p className="text-muted-foreground text-lg">{product.description}</p>
            </div>

            <Separator />

            <div className="grid gap-2">
              <div>
                <h3 className="font-semibold">Department</h3>
                <p className="text-muted-foreground">{product.departmentName}</p>
              </div>
              <div>
                <h3 className="font-semibold">Division</h3>
                <p className="text-muted-foreground">{product.divisionName}</p>
              </div>
              {typeof product.recommendationRate === "number" && (
                <div>
                  <h3 className="font-semibold">Recommendation Rate</h3>
                  <p className="text-muted-foreground">
                    {(product.recommendationRate * 100).toFixed(1)}% of reviewers recommend this item
                  </p>
                </div>
              )}
            </div>

            <Button size="lg" className="w-full md:w-auto">
              Add to Cart
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Customer Reviews</h2>
            <Button onClick={() => navigate(`/create-review?itemId=${product.id}`)}>
              Write a Review
            </Button>
          </div>

          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No reviews yet. Be the first to review this item!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{review.title}</CardTitle>
                        <div className="flex items-center gap-4">
                          {typeof review.rating === "number" ? (
                            renderStars(review.rating)
                          ) : (
                            <span className="text-sm text-muted-foreground">No rating provided</span>
                          )}
                          {review.age && (
                            <span className="text-sm text-muted-foreground">
                              Age: {review.age}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={review.recommended === 1 ? "default" : "secondary"}>
                        {review.recommended === 1 ? (
                          <>
                            <ThumbsUp className="h-3 w-3 mr-1" /> Recommended
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="h-3 w-3 mr-1" /> Not Recommended
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">{review.reviewText}</p>
                    <p className="text-sm text-muted-foreground mt-3">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
