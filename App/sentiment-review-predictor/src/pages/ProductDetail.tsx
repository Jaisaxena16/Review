import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, ThumbsUp, ThumbsDown, ArrowLeft } from "lucide-react";
import { clothingItems, reviews } from "@/data/mockData";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const item = clothingItems.find(i => i.id === Number(id));
  const itemReviews = reviews.filter(r => r.clothingId === Number(id));

  useEffect(() => {
    if (!item) {
      navigate("/");
    }
  }, [item, navigate]);

  if (!item) return null;

  const averageRating = itemReviews.length > 0
    ? itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length
    : 0;

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
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <div>
              <Badge className="mb-3">{item.category}</Badge>
              <h1 className="text-4xl font-bold mb-4">{item.title}</h1>
              
              {averageRating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= averageRating
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({itemReviews.length} {itemReviews.length === 1 ? "review" : "reviews"})
                  </span>
                </div>
              )}

              <p className="text-muted-foreground text-lg">{item.description}</p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Department</h3>
              <p className="text-muted-foreground">{item.departmentName}</p>
            </div>

            <Button size="lg" className="w-full md:w-auto">
              Add to Cart
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Customer Reviews</h2>
            <Button onClick={() => navigate(`/create-review?itemId=${item.id}`)}>
              Write a Review
            </Button>
          </div>

          {itemReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No reviews yet. Be the first to review this item!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {itemReviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{review.title}</CardTitle>
                        <div className="flex items-center gap-4">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? "fill-primary text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          {review.age && (
                            <span className="text-sm text-muted-foreground">
                              Age: {review.age}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={review.recommended === 1 ? "default" : "secondary"}>
                        {review.recommended === 1 ? (
                          <><ThumbsUp className="h-3 w-3 mr-1" /> Recommended</>
                        ) : (
                          <><ThumbsDown className="h-3 w-3 mr-1" /> Not Recommended</>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{review.reviewText}</p>
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
