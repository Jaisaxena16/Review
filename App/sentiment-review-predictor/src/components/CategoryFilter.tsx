import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="border-b bg-muted/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant={selectedCategory === "All" ? "default" : "ghost"}
            onClick={() => onCategoryChange("All")}
            className="whitespace-nowrap"
          >
            All Items
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "ghost"}
              onClick={() => onCategoryChange(category)}
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
