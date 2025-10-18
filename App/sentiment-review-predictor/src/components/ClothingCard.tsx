import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { ProductSummary } from "@/types/clothing";

interface ClothingCardProps {
  item: ProductSummary;
  onClick: () => void;
}

export const ClothingCard = ({ item, onClick }: ClothingCardProps) => {
  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <CardContent className="p-4">
        <Badge variant="secondary" className="mb-2">
          {item.category}
        </Badge>
        <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {item.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {typeof item.averageRating === "number" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium">{item.averageRating.toFixed(1)}</span>
            </span>
            <span aria-hidden>•</span>
            <span>{item.reviewCount} review{item.reviewCount === 1 ? "" : "s"}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No ratings yet</span>
        )}
      </CardFooter>
    </Card>
  );
};
