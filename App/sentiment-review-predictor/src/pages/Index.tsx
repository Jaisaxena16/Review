import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ClothingCard } from "@/components/ClothingCard";
import { clothingItems } from "@/data/mockData";

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(clothingItems.map(item => item.category)));
    return cats.sort();
  }, []);

  const filteredItems = useMemo(() => {
    let items = clothingItems;

    // Category filter
    if (selectedCategory !== "All") {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Search filter with plural/singular support
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const queryWithoutS = query.endsWith('s') ? query.slice(0, -1) : query;
      const queryWithS = query.endsWith('s') ? query : query + 's';

      items = items.filter(item => {
        const searchText = `${item.title} ${item.description} ${item.category}`.toLowerCase();
        return searchText.includes(query) || 
               searchText.includes(queryWithoutS) || 
               searchText.includes(queryWithS);
      });
    }

    return items;
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {selectedCategory === "All" ? "All Products" : selectedCategory}
          </h1>
          {searchQuery && (
            <p className="text-muted-foreground">
              Found {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} matching "{searchQuery}"
            </p>
          )}
          {!searchQuery && (
            <p className="text-muted-foreground">
              {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} available
            </p>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              No items found matching your search.
            </p>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search or browse all categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <ClothingCard
                key={item.id}
                item={item}
                onClick={() => navigate(`/product/${item.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
