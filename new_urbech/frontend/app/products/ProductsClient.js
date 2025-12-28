'use client';
import { useState, useEffect, useCallback,useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '../components/ProductCard';
import ProductDetail from '../components/ProductDetail';
import styles from './products.module.css';
import Link from 'next/link';


const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000/api';
const ITEMS_PER_PAGE = 12;

export default function ProductsClient({ initialCategory = '', initialScope = 'exact' }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // Add categories state
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Add these states for ProductDetail modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);

  // Filter states from URL
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const featured = searchParams.get('featured') || '';
  const category = searchParams.get('category') || initialCategory || '';
const categoryScope = searchParams.get('category_scope') || (initialCategory ? initialScope : 'exact');


  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
       // const response = await fetch(`${API_BASE}/categories?limit=50`);
        const response = await fetch(`${API_BASE}/categories?includeParent=true&limit=200`);
        
        if (response.ok) {
          const categoriesData = await response.json();
          setCategories(categoriesData);
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);


  const fetchProducts = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      skip: ((currentPage - 1) * ITEMS_PER_PAGE).toString(),
      limit: ITEMS_PER_PAGE.toString(),
      sort_by: sortBy,
    });

    if (searchQuery) params.append('search', searchQuery);

    if (category) {
      params.append('category_slug', category); // Fixed: removed leading slash

      if (categoryScope === 'tree') {
        params.append('include_children', 'true');
      }
    }

    if (minPrice) params.append('min_price', minPrice);
    if (maxPrice) params.append('max_price', maxPrice);
    if (featured) params.append('featured', 'true');

    // FIXED: Use API_BASE instead of /api/products
    const url = `${API_BASE}/products?${params.toString()}`;
    console.log('Fetching from:', url);

    const response = await fetch(url);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData?.detail || `Failed to fetch products: ${response.status}`);
    }

    if (Array.isArray(responseData)) {
      setProducts(responseData);
      setTotalCount(
        responseData.length < ITEMS_PER_PAGE
          ? (currentPage - 1) * ITEMS_PER_PAGE + responseData.length
          : currentPage * ITEMS_PER_PAGE + 1
      );
    } else if (responseData.products) {
      setProducts(responseData.products);
      setTotalCount(responseData.total_count);
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (err) {
    setError(err.message);
    console.error('Error fetching products:', err);
  } finally {
    setLoading(false);
  }
}, [
  currentPage,
  searchQuery,
  category,
  categoryScope,
  sortBy,
  minPrice,
  maxPrice,
  featured,
]);
const treeCounts = useMemo(() => {
  const getParentId = (cat) => cat?.parentId ?? cat?.parent?.id ?? null;

  const childrenByParent = categories.reduce((acc, c) => {
    const pid = getParentId(c) || 'root';
    (acc[pid] ||= []).push(c);
    return acc;
  }, {});

  const memo = new Map();

  const dfs = (cat) => {
    if (memo.has(cat.id)) return memo.get(cat.id);
    const children = childrenByParent[cat.id] || [];
    const total = (cat.productCount || 0) + children.reduce((s, ch) => s + dfs(ch), 0);
    memo.set(cat.id, total);
    return total;
  };

  const out = {};
  for (const c of categories) out[c.id] = dfs(c);
  return out;
}, [categories]);


//Breadcrumb useMemo

const breadcrumbs = useMemo(() => {
  const getParentIdLocal = (cat) => cat?.parentId ?? cat?.parent?.id ?? null;

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
  ];

  if (!category) return crumbs;

  const selected = categories.find((c) => c.slug === category);
  if (!selected) return crumbs;

  const byId = new Map(categories.map((c) => [c.id, c]));
  const chain = [];

  let current = selected;
  while (current) {
    chain.push(current);
    const pid = getParentIdLocal(current);
    current = pid ? byId.get(pid) : null;
  }

  chain.reverse();

  chain.forEach((cat, idx) => {
    const isLast = idx === chain.length - 1;
    const hasParent = !!getParentIdLocal(cat);

    const scope = isLast ? (hasParent ? 'exact' : 'tree') : 'tree';

    crumbs.push({
      label: cat.name,
     href: `/category${cat.slug}`,

    });
  });

  return crumbs;
}, [categories, category]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update URL with new filters
  const updateFilters = useCallback((newFilters) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // Reset to page 1 when filters change
    if (!newFilters.page) {
      params.set('page', '1');
    }
    
    router.push(`/products?${params.toString()}`);
  }, [router, searchParams]);

  // Handler functions
  const handleSearch = (query) => {
    updateFilters({ search: query });
  };

  const handleCategoryChange = (categorySlug, scope = 'exact') => {
  updateFilters({ category: categorySlug, category_scope: categorySlug ? scope : '' });
};

  const handleSortChange = (sort) => {
    updateFilters({ sort });
  };

  const handlePriceFilter = (min, max) => {
    updateFilters({ 
      min_price: min || '', 
      max_price: max || '' 
    });
  };

  const handleFeaturedFilter = (isFeatured) => {
    updateFilters({ featured: isFeatured ? 'true' : '' });
  };

  const handlePageChange = (page) => {
    updateFilters({ page: page.toString() });
  };

  const clearFilters = () => {
    router.push('/products');
  };

  // Add to Cart handler for ProductDetail
  const handleAddToCart = (product, quantity) => {
    console.log(`Added ${quantity} of ${product.name} to cart`);
    // You can integrate with your cart context here
    // addToCart(product, quantity);
  };

  // Open ProductDetail modal
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  // Close ProductDetail modal
  const handleCloseProductDetail = () => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  };

  // Get category icon based on category name or slug
  const getCategoryIcon = (category) => {
    const name = category.name?.toLowerCase() || '';
    const slug = category.slug?.toLowerCase() || '';
    
    if (name.includes('electron') || slug.includes('electron')) return '📱';
    if (name.includes('cloth') || slug.includes('cloth') || name.includes('fashion')) return '👕';
    if (name.includes('home') || slug.includes('home') || name.includes('garden')) return '🏠';
    if (name.includes('book') || slug.includes('book')) return '📚';
    if (name.includes('sport') || slug.includes('sport')) return '⚽';
    if (name.includes('beauty') || slug.includes('beauty') || name.includes('cosmetic')) return '💄';
    if (name.includes('food') || slug.includes('food') || name.includes('grocery')) return '🍎';
    if (name.includes('toy') || slug.includes('toy')) return '🧸';
    if (name.includes('health') || slug.includes('health')) return '💊';
    if (name.includes('auto') || slug.includes('auto') || name.includes('car')) return '🚗';
    
    return '📦'; // Default icon
  };

  // Find selected category object by slug (from URL)
const selectedCategoryObj = categories.find((c) => c.slug === category) || null;

// Normalize parent id (some APIs return parentId, some return parent?.id)
const getParentId = (cat) => cat?.parentId ?? cat?.parent?.id ?? null;

// Children of a category
const getChildren = (parentId) => categories.filter((c) => getParentId(c) === parentId);

// Top-level categories
const topLevelCategories = categories.filter((c) => !getParentId(c));

// Sidebar categories to show:
let sidebarCategories = topLevelCategories;

// If a category is selected, show subcategories/siblings instead of top-level
let sidebarTitle = "Categories";
let parentForBack = null;

if (selectedCategoryObj) {
  const parentId = getParentId(selectedCategoryObj);

  if (!parentId) {
    // Selected is top-level (e.g. Honey) → show its children only
    const children = getChildren(selectedCategoryObj.id);
    sidebarCategories = children;
    sidebarTitle = selectedCategoryObj.name; // optional: show "Honey" as title
  } else {
    // Selected is a child → show siblings, plus allow going back to parent
    const siblings = getChildren(parentId);
    sidebarCategories = siblings;

    parentForBack = categories.find((c) => c.id === parentId) || null;
    sidebarTitle = parentForBack?.name || "Categories";
  }
}

// Optional: limit how many to show
sidebarCategories = sidebarCategories.slice(0, 20);



  // Filter out parent categories (only show top-level or specific categories)
  const displayCategories = categories.filter(category => 
    !category.parent || category.parent === null
  ).slice(0, 10); // Limit to 10 categories for the sidebar

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasProducts = products.length > 0;
const goToCategory = (slug) => {
  const params = new URLSearchParams(searchParams);

  // keep other filters like search/min/max/sort/page if you want
  // but REMOVE these because /category/[slug] already defines category
  params.delete("category");
  params.delete("category_scope");

  // reset page when switching category
  params.set("page", "1");

  const qs = params.toString();
  router.push(qs ? `/category/${slug}?${qs}` : `category${slug}`);
};

  return (
    <div >
      {/* Header */}
       {/* <div className={styles.header}>
        <h1>All Products</h1>
        <p>Discover our complete collection</p>
      </div>*/}

      <div className={styles.layout}>
        {/* Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.filterSection}>
            <h3>Filters</h3>
            <button 
              onClick={clearFilters}
              className={styles.clearFilters}
            >
              Clear All Filters
            </button>
          </div>

          {/* Search */}
          <div className={styles.filterGroup}>
            <label htmlFor="search" className={styles.filterLabel}>
              Search Products
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Featured Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterCheckbox}>
              <input
                type="checkbox"
                checked={!!featured}
                onChange={(e) => handleFeaturedFilter(e.target.checked)}
              />
              <span>Featured Products Only</span>
            </label>
          </div>

          {/* Price Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Price Range</label>
            <div className={styles.priceInputs}>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => handlePriceFilter(e.target.value, maxPrice)}
                className={styles.priceInput}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => handlePriceFilter(minPrice, e.target.value)}
                className={styles.priceInput}
              />
            </div>
          </div>

<div className={styles.filterGroup}>
  <label className={styles.filterLabel}>{sidebarTitle}</label>

  <div className={styles.categoryList}>
    {/* Always available: reset category */}
   
   <button
  onClick={() => router.push('/products')}
  className={`${styles.categoryButton} ${!category ? styles.active : ''}`}
>
  📦 All Categories
</button>

{parentForBack && (
  <button
    onClick={() => goToCategory(parentForBack.slug)}
    className={styles.categoryButton}
  >
    ← Back to {parentForBack.name}
  </button>
)}

{sidebarCategories.map((cat) => {
  const total = treeCounts[cat.id] || 0;

  return (
    <button
      key={cat.id}
      onClick={() => goToCategory(cat.slug)}
      className={`${styles.categoryButton} ${category === cat.slug ? styles.active : ''}`}
    >
      <span className={styles.categoryIcon}>{getCategoryIcon(cat)}</span>
      {cat.name}
      {total > 0 && <span className={styles.categoryCount}>({total})</span>}
    </button>
  );
})}

    
  </div>
</div>



        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          {/*BreadCrumb*/}

          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
  {breadcrumbs.map((c, i) => (
    <span key={c.href}>
      <Link href={c.href} className={styles.breadcrumbLink}>
        {c.label}
      </Link>
      {i < breadcrumbs.length - 1 && <span className={styles.breadcrumbSep}>›</span>}
    </span>
  ))}
</nav>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.resultsInfo}>
              {loading ? (
                <span>Loading products...</span>
              ) : (
                <span>
                  Showing {products.length} of {totalCount} products
                  {category && ` in "${categories.find(c => c.slug === category)?.name || category}"`}
                  {searchQuery && ` matching "${searchQuery}"`}
                </span>
              )}
            </div>
            
            <div className={styles.sortContainer}>
              <label htmlFor="sort" className={styles.sortLabel}>
                Sort by:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading products...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <h3>Error loading products</h3>
              <p>{error}</p>
              <button onClick={fetchProducts} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          ) : !hasProducts ? (
            <div className={styles.emptyState}>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className={styles.retryButton}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className={styles.productsGrid}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={handleProductClick}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className={styles.paginationButton}
                  >
                    Previous
                  </button>
                  
                  <div className={styles.pageNumbers}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        Math.abs(page - currentPage) <= 1
                      )
                      .map((page, index, array) => {
                        // Add ellipsis for gaps
                        const showEllipsis = index > 0 && page - array[index - 1] > 1;
                        return (
                          <div key={page} className={styles.pageGroup}>
                            {showEllipsis && <span className={styles.ellipsis}>...</span>}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`${styles.pageButton} ${
                                currentPage === page ? styles.active : ''
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className={styles.paginationButton}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Product Detail Modal */}
      {showProductDetail && selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={handleCloseProductDetail}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}