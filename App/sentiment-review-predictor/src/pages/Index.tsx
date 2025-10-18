import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ClothingCard } from "@/components/ClothingCard";
import { fetchProducts } from "@/lib/api";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductSummary } from "@/types/clothing";

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", { page, pageSize, searchQuery, selectedCategory }],
    queryFn: () =>
      fetchProducts({
        page,
        pageSize,
        search: searchQuery.trim() || undefined,
        category: selectedCategory === "All" ? undefined : selectedCategory,
      }),
    keepPreviousData: true,
  });

  const categories = useMemo(() => {
    return data?.availableCategories ?? [];
  }, [data?.availableCategories]);

  const items: ProductSummary[] = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const isLoadingItems = isLoading && !data;

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
      />
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={(category) => {
          setSelectedCategory(category);
          setPage(1);
        }}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {selectedCategory === "All" ? "All Products" : selectedCategory}
          </h1>
          {searchQuery && (
            <p className="text-muted-foreground">
              Found {totalItems} {totalItems === 1 ? "item" : "items"} matching "{searchQuery}"
            </p>
          )}
          {!searchQuery && (
            <p className="text-muted-foreground">
              {totalItems} {totalItems === 1 ? "item" : "items"} available
            </p>
          )}
        </div>

        {isLoadingItems ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: pageSize }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              No items found matching your search.
            </p>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search or browse all categories.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/product/${item.id}`)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        className={page === 1 ? "pointer-events-none opacity-50" : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          if (page > 1) {
                            setPage(page - 1);
                          }
                        }}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            isActive={pageNumber === page}
                            onClick={(event) => {
                              event.preventDefault();
                              setPage(pageNumber);
                            }}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          if (page < totalPages) {
                            setPage(page + 1);
                          }
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        {isFetching && !isLoadingItems && (
          <p className="mt-4 text-sm text-muted-foreground">Updating results…</p>
        )}
      </main>
    </div>
  );
};

export default Index;
