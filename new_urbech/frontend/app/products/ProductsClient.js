'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '../components/ProductCard';
import ProductDetail from '../components/ProductDetail';
import styles from './products.module.css';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';
const ITEMS_PER_PAGE = 12;

export default function ProductsClient({ initialCategory = '', initialScope = 'exact' }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Состояние
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Состояние для модального окна деталей продукта
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);

  // Фильтры из URL
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const featured = searchParams.get('featured') || '';
  const category = searchParams.get('category') || initialCategory || '';
  const categoryScope = searchParams.get('category_scope') || (initialCategory ? initialScope : 'exact');

  // Получение категорий с бэкенда
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch(`${API_BASE}/categories?includeParent=true&limit=200`);
        
        if (response.ok) {
          const categoriesData = await response.json();
          setCategories(categoriesData);
        } else {
          console.error('Не удалось загрузить категории');
        }
      } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
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
        params.append('category_slug', category);

        if (categoryScope === 'tree') {
          params.append('include_children', 'true');
        }
      }

      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (featured) params.append('featured', 'true');

      const url = `${API_BASE}/products?${params.toString()}`;
      console.log('Загрузка с:', url);

      const response = await fetch(url);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.detail || `Ошибка загрузки товаров: ${response.status}`);
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
        throw new Error('Неожиданный формат ответа');
      }
    } catch (err) {
      setError(err.message);
      console.error('Ошибка при загрузке товаров:', err);
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

  // Оптимизация для подсчета товаров в дереве категорий
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

  // Хлебные крошки
  const breadcrumbs = useMemo(() => {
    const getParentIdLocal = (cat) => cat?.parentId ?? cat?.parent?.id ?? null;

    const crumbs = [
      { label: 'Главная', href: '/' },
      { label: 'Товары', href: '/products' },
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

  // Загрузка товаров при изменении фильтров
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Обновление фильтров в URL
  const updateFilters = useCallback((newFilters) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // Сброс на страницу 1 при изменении фильтров
    if (!newFilters.page) {
      params.set('page', '1');
    }
    
    router.push(`/products?${params.toString()}`);
  }, [router, searchParams]);

  // Обработчики
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

  // Обработчик добавления в корзину
  const handleAddToCart = (product, quantity) => {
    console.log(`Добавлено ${quantity} шт. ${product.name} в корзину`);
  };

  // Открытие модального окна с деталями товара
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  // Закрытие модального окна
  const handleCloseProductDetail = () => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  };

  // Получение иконки для категории
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
    
    return '📦'; // Иконка по умолчанию
  };

  // Поиск выбранной категории
  const selectedCategoryObj = categories.find((c) => c.slug === category) || null;

  const getParentId = (cat) => cat?.parentId ?? cat?.parent?.id ?? null;
  const getChildren = (parentId) => categories.filter((c) => getParentId(c) === parentId);
  const topLevelCategories = categories.filter((c) => !getParentId(c));

  // Категории для боковой панели
  let sidebarCategories = topLevelCategories;
  let sidebarTitle = "Категории";
  let parentForBack = null;

  if (selectedCategoryObj) {
    const parentId = getParentId(selectedCategoryObj);

    if (!parentId) {
      // Выбрана родительская категория → показываем её детей
      const children = getChildren(selectedCategoryObj.id);
      sidebarCategories = children;
      sidebarTitle = selectedCategoryObj.name;
    } else {
      // Выбрана дочерняя категория → показываем соседей и возможность вернуться
      const siblings = getChildren(parentId);
      sidebarCategories = siblings;
      parentForBack = categories.find((c) => c.id === parentId) || null;
      sidebarTitle = parentForBack?.name || "Категории";
    }
  }

  sidebarCategories = sidebarCategories.slice(0, 20);

  // Пагинация
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasProducts = products.length > 0;

  const goToCategory = (slug) => {
    const params = new URLSearchParams(searchParams);
    params.delete("category");
    params.delete("category_scope");
    params.set("page", "1");
    const qs = params.toString();
    router.push(qs ? `/category/${slug}?${qs}` : `category${slug}`);
  };

  return (
    <div>
      <div className={styles.layout}>
        {/* Боковая панель фильтров */}
        <aside className={styles.sidebar}>
          <div className={styles.filterSection}>
            <h3>Фильтры</h3>
            <button 
              onClick={clearFilters}
              className={styles.clearFilters}
            >
              Очистить все фильтры
            </button>
          </div>

          {/* Поиск */}
          <div className={styles.filterGroup}>
            <label htmlFor="search" className={styles.filterLabel}>
              Поиск товаров
            </label>
            <input
              id="search"
              type="text"
              placeholder="Поиск по названию или описанию..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Фильтр по избранному */}
          <div className={styles.filterGroup}>
            <label className={styles.filterCheckbox}>
              <input
                type="checkbox"
                checked={!!featured}
                onChange={(e) => handleFeaturedFilter(e.target.checked)}
              />
              <span>Только избранные товары</span>
            </label>
          </div>

          {/* Фильтр по цене */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Ценовой диапазон</label>
            <div className={styles.priceInputs}>
              <input
                type="number"
                placeholder="Мин"
                value={minPrice}
                onChange={(e) => handlePriceFilter(e.target.value, maxPrice)}
                className={styles.priceInput}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Макс"
                value={maxPrice}
                onChange={(e) => handlePriceFilter(minPrice, e.target.value)}
                className={styles.priceInput}
              />
            </div>
          </div>

          {/* Категории */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{sidebarTitle}</label>

            <div className={styles.categoryList}>
              {/* Все категории */}
              <button
                onClick={() => router.push('/products')}
                className={`${styles.categoryButton} ${!category ? styles.active : ''}`}
              >
                📦 Все категории
              </button>

              {/* Кнопка "Назад" */}
              {parentForBack && (
                <button
                  onClick={() => goToCategory(parentForBack.slug)}
                  className={styles.categoryButton}
                >
                  ← Назад к {parentForBack.name}
                </button>
              )}

              {/* Список категорий */}
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

        {/* Основной контент */}
        <main className={styles.main}>
          {/* Хлебные крошки */}
          <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
            {breadcrumbs.map((c, i) => (
              <span key={c.href}>
                <Link href={c.href} className={styles.breadcrumbLink}>
                  {c.label}
                </Link>
                {i < breadcrumbs.length - 1 && <span className={styles.breadcrumbSep}>›</span>}
              </span>
            ))}
          </nav>

          {/* Панель инструментов */}
          <div className={styles.toolbar}>
            <div className={styles.resultsInfo}>
              {loading ? (
                <span>Загрузка товаров...</span>
              ) : (
                <span>
                  Показано {products.length} из {totalCount} товаров
                  {category && ` в категории "${categories.find(c => c.slug === category)?.name || category}"`}
                  {searchQuery && ` по запросу "${searchQuery}"`}
                </span>
              )}
            </div>
            
            <div className={styles.sortContainer}>
              <label htmlFor="sort" className={styles.sortLabel}>
                Сортировать по:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="newest">Сначала новые</option>
                <option value="price_asc">Цена: по возрастанию</option>
                <option value="price_desc">Цена: по убыванию</option>
                <option value="name">Название: А-Я</option>
              </select>
            </div>
          </div>

          {/* Сетка товаров */}
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Загрузка товаров...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <h3>Ошибка загрузки товаров</h3>
              <p>{error}</p>
              <button onClick={fetchProducts} className={styles.retryButton}>
                Попробовать снова
              </button>
            </div>
          ) : !hasProducts ? (
            <div className={styles.emptyState}>
              <h3>Товары не найдены</h3>
              <p>Попробуйте изменить фильтры или поисковый запрос</p>
              <button onClick={clearFilters} className={styles.retryButton}>
                Очистить фильтры
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

              {/* Пагинация */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className={styles.paginationButton}
                  >
                    Назад
                  </button>
                  
                  <div className={styles.pageNumbers}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        Math.abs(page - currentPage) <= 1
                      )
                      .map((page, index, array) => {
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
                    Вперед
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Модальное окно деталей товара */}
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