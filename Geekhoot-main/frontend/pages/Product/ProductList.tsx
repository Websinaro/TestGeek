import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Filter, ChevronLeft, ChevronRight, Search, SearchX, Star, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/src/services/api';
import ProductCard from '@/src/components/product/ProductCard';
import LazyProductImage from '@/src/components/product/LazyProductImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Product } from '@/src/types';

export default function ProductList() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState(queryParams.get('category') || 'all');
  const [search, setSearch] = useState(queryParams.get('search') || '');
  const [searchTerm, setSearchTerm] = useState(search); // local state for typing and suggestions query
  const [sort, setSort] = useState('newest');
  
  // Custom price range fields
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  // Infinite Scroll State and Ref
  const [loadedProducts, setLoadedProducts] = useState<Product[]>([]);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Reset cumulative list whenever filters/sorting changes
  useEffect(() => {
    setPage(1);
    setLoadedProducts([]);
  }, [category, search, sort, minPrice, maxPrice, minRating]);

  // Debounced search logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchTerm);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', page, category, search, sort, minPrice, maxPrice, minRating],
    queryFn: async () => {
      const params = {
        page,
        limit: 12,
        category: category === 'all' ? undefined : category,
        search: search || undefined,
        sort,
        minPrice,
        maxPrice,
        minRating,
      };
      const { data } = await api.get('/products', { params });
      return data;
    },
  });

  // Accumulate new products loaded via infinite scroll
  useEffect(() => {
    if (data?.products) {
      if (page === 1) {
        setLoadedProducts(data.products);
      } else {
        setLoadedProducts((prev) => {
          const prevIds = new Set(prev.map(p => p.id));
          const uniques = data.products.filter((p: Product) => !prevIds.has(p.id));
          return [...prev, ...uniques];
        });
      }
    }
  }, [data?.products, page]);

  // Search Suggestions Endpoint hook
  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return null;
      const { data } = await api.get('/products/suggestions', { params: { q: searchTerm } });
      return data as { products: any[], categories: string[], queries: string[] };
    },
    enabled: searchTerm.length >= 2,
  });

  const total = data?.total || 0;
  const totalPages = data?.pages || 1;

  // Infinite Scroll IntersectionObserver effect
  useEffect(() => {
    const currentRef = loadMoreTriggerRef.current;
    if (!currentRef || page >= totalPages || isFetching || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => {
            if (prevPage < totalPages) {
              return prevPage + 1;
            }
            return prevPage;
          });
        }
      },
      {
        threshold: 0.1,
        rootMargin: '250px', // Fetch early before the user hits the exact bottom
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [page, totalPages, isFetching, isLoading]);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const s = q.get('search') || '';
    setCategory(q.get('category') || 'all');
    setSearch(s);
    setSearchTerm(s);
  }, [location.search]);

  // Click outside to close suggestion popup
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearAll = () => {
    setCategory('all');
    setSearch('');
    setSearchTerm('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinRating(undefined);
    setPage(1);
  };

  const isFiltered = category !== 'all' || search !== '' || minPrice !== undefined || maxPrice !== undefined || minRating !== undefined;

  const renderFilters = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-lg text-gray-950">Filter Products</h3>
          {isFiltered && (
            <button
              onClick={handleClearAll}
              className="text-xs font-semibold text-[#ff5200] hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Categories Section */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</p>
          {['all', 'Custom T-Shirts', 'Name Slips', 'Printed Bottles', 'Custom Cups', 'Photo Frames', 'Keychain', 'Stationery', 'Tech Gadgets'].map((cat) => (
            <button 
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={cn(
                "w-full text-left py-2 px-3 rounded-md text-sm transition-colors",
                category === cat 
                ? "bg-orange-50 text-[#ff5200] font-bold" 
                : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {/* Pricing Range Filters */}
        <div className="border-t pt-4 space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Price Range</p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
              <Input
                type="number"
                placeholder="Min"
                value={minPrice !== undefined ? minPrice : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setMinPrice(val === '' ? undefined : Number(val));
                  setPage(1);
                }}
                className="pl-6 h-9 text-xs rounded border-gray-200 bg-gray-50 focus:bg-white text-black"
              />
            </div>
            <span className="text-gray-400 text-xs">to</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
              <Input
                type="number"
                placeholder="Max"
                value={maxPrice !== undefined ? maxPrice : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setMaxPrice(val === '' ? undefined : Number(val));
                  setPage(1);
                }}
                className="pl-6 h-9 text-xs rounded border-gray-200 bg-gray-50 focus:bg-white text-black"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5 mt-2">
            <button
              onClick={() => { setMinPrice(undefined); setMaxPrice(250); setPage(1); }}
              className={cn(
                "text-xs px-2.5 py-1 rounded border transition-colors",
                minPrice === undefined && maxPrice === 250
                  ? "border-[#ff5200] bg-orange-50 text-[#ff5200] font-semibold"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600"
              )}
            >
              Under ₹250
            </button>
            <button
              onClick={() => { setMinPrice(250); setMaxPrice(500); setPage(1); }}
              className={cn(
                "text-xs px-2.5 py-1 rounded border transition-colors",
                minPrice === 250 && maxPrice === 500
                  ? "border-[#ff5200] bg-orange-50 text-[#ff5200] font-semibold"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600"
              )}
            >
              ₹250 - ₹500
            </button>
            <button
              onClick={() => { setMinPrice(500); setMaxPrice(undefined); setPage(1); }}
              className={cn(
                "text-xs px-2.5 py-1 rounded border transition-colors",
                minPrice === 500 && maxPrice === undefined
                  ? "border-[#ff5200] bg-orange-50 text-[#ff5200] font-semibold"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600"
              )}
            >
              Over ₹500
            </button>
          </div>
        </div>

        {/* Rating Filters */}
        <div className="border-t pt-4 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Rating</p>
          <div className="flex flex-col gap-1.5">
            {[4, 3, 2].map((stars) => {
              const active = minRating === stars;
              return (
                <button
                  key={stars}
                  onClick={() => {
                    setMinRating(active ? undefined : stars);
                    setPage(1);
                  }}
                  className={cn(
                    "flex items-center gap-2 py-1.5 px-2 rounded text-xs transition-colors text-left w-full",
                    active
                      ? "bg-amber-50 text-amber-700 font-bold"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-3.5 h-3.5",
                          i < stars ? "fill-amber-500 text-amber-500" : "text-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <span>& up</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#f1f3f6] min-h-screen text-black">
      <div className="max-w-[1440px] mx-auto px-4 py-8 lg:py-12">
        {/* Header & Filters */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {category !== 'all' ? category : 'Store Catalog'}
                <span className="text-gray-400 text-sm font-normal ml-3">({total} items)</span>
              </h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Home</span>
                <ChevronRight className="w-3 h-3" />
                <span className="font-semibold text-gray-900">{category !== 'all' ? category : 'Store'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 text-black">
              {/* Smart Search Input with Suggestions */}
              <div ref={suggestionsRef} className="relative w-full sm:w-80">
                <div className="relative">
                  <Input 
                    placeholder="Search products..." 
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-10 pr-8 h-10 rounded-md border-gray-200 bg-gray-50 focus:bg-white text-sm text-black"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  {searchTerm && (
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setSearch('');
                        setPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown panel */}
                {showSuggestions && suggestionsData && (
                  (suggestionsData.products?.length > 0 || 
                   suggestionsData.categories?.length > 0 || 
                   suggestionsData.queries?.length > 0)
                ) && (
                  <div className="absolute top-11 left-0 right-0 z-50 bg-white rounded-lg shadow-xl border border-gray-150 overflow-hidden text-left max-h-[380px] overflow-y-auto">
                    {/* Categories recommendations */}
                    {suggestionsData.categories?.length > 0 && (
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Category Suggestions</p>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestionsData.categories.map((cat, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setCategory(cat);
                                setSearchTerm('');
                                setSearch('');
                                setShowSuggestions(false);
                                setPage(1);
                              }}
                              className="text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-[#ff5200] px-3 py-1 rounded-full transition-all"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Queries matching */}
                    {suggestionsData.queries?.length > 0 && (
                      <div className="p-2 border-b border-gray-100">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-2 mb-1">Search Keywords</p>
                        <div className="space-y-0.5">
                          {suggestionsData.queries.map((qText, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSearchTerm(qText);
                                setSearch(qText);
                                setShowSuggestions(false);
                                setPage(1);
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
                            >
                              <Search className="w-3.5 h-3.5 text-gray-400" />
                              <span>{qText}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Products matches matching */}
                    {suggestionsData.products?.length > 0 && (
                      <div className="p-2">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-2 mb-1">Products</p>
                        <div className="space-y-0.5">
                          {suggestionsData.products.map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setShowSuggestions(false);
                                navigate(`/product/${p.id}`);
                              }}
                              className="w-full flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded-md text-left transition-all"
                            >
                              <LazyProductImage
                                src={p.images?.[0]}
                                alt={p.name}
                                className="rounded bg-gray-100"
                                containerClassName="w-8 h-8 rounded bg-gray-100 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                                <p className="text-[10px] text-gray-400 font-medium">{p.category}</p>
                              </div>
                              <p className="text-xs font-bold text-[#ff5200] shrink-0 pr-1">₹{p.price}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[180px] h-10 rounded-md border-gray-200 bg-gray-50 text-sm focus:ring-1 focus:ring-orange-500">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Customer Rating</SelectItem>
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger className={cn(buttonVariants({ variant: "outline" }), "rounded-md h-10 px-4 border-gray-200 bg-gray-50 md:hidden text-sm")}>
                  <Filter className="w-4 h-4 mr-2" /> Filter
                </SheetTrigger>
                <SheetContent side="right" className="bg-white w-full sm:max-w-xs p-6 overflow-y-auto">
                  <SheetHeader className="mb-4">
                    <SheetTitle className="text-xl font-bold flex items-center justify-between">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 text-black">
                    {renderFilters()}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
 
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar Filters */}
          <div className="hidden lg:block w-64 shrink-0 h-fit sticky top-24">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              {renderFilters()}
            </div>
          </div>

          <div className="flex-1">
            {isLoading && loadedProducts.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-square bg-white rounded-lg border border-gray-100 p-4 animate-pulse flex flex-col justify-between">
                    <div className="aspect-square bg-gray-100 rounded w-full h-2/3 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : loadedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {loadedProducts.map((product: Product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Infinite scroll loader trigger & tracker */}
                <div ref={loadMoreTriggerRef} className="mt-8 py-6 flex flex-col items-center justify-center min-h-[80px] w-full">
                  {isFetching && page < totalPages && (
                    <div className="w-full mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="aspect-square bg-white rounded-lg border border-gray-100 p-4 animate-pulse flex flex-col justify-between">
                            <div className="aspect-square bg-gray-100 rounded w-full h-2/3 mb-2 animate-pulse"></div>
                            <div className="h-4 bg-gray-100 rounded w-3/4 mb-1 animate-pulse"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-450 font-bold text-center mt-6 animate-pulse">Loading more premium products...</p>
                    </div>
                  )}
                  {!isFetching && page < totalPages && (
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => p + 1)}
                      className="text-xs font-bold border-gray-200 text-gray-500 hover:text-black hover:border-gray-400 bg-white"
                    >
                      Load More Products
                    </Button>
                  )}
                  {page >= totalPages && total > 0 && (
                    <span className="text-xs text-gray-400 font-medium">
                      You've viewed all {total} products
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-20 text-center">
                <SearchX className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500 mb-8">Try adjusting your filters or search keywords</p>
                <Button 
                  onClick={handleClearAll}
                  className="bg-[#ff5200] hover:bg-orange-600 text-white rounded-full px-8"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
