'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import ProductForm from '../components/ProductForm';
import { withAuth } from '../../lib/authFetch';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingProduct, setUpdatingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  
  const itemsPerPage = 50;

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const skip = (page - 1) * itemsPerPage;
      const res = await fetch(
        `${API_BASE}/products?limit=${itemsPerPage}&skip=${skip}`,
        { cache: 'no-store' }
      );
      
      if (!res.ok) throw new Error(`Не удалось загрузить товары: ${res.status}`);
      
      const data = await res.json();
      
      // Handle both response formats
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        setTotalPages(Math.ceil((data.total_count || data.products.length) / itemsPerPage));
      } else if (Array.isArray(data)) {
        setProducts(data);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
      } else {
        throw new Error('Неожиданный формат ответа от API');
      }
    } catch (e) {
      console.error('Ошибка загрузки товаров:', e);
      setProducts([]);
      setError(e.message || 'Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, fetchProducts]);

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        product.name?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.slug?.toLowerCase().includes(term) ||
        product.categorySlugs?.some(slug => slug.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      // Handle numeric sorting for price and stock
      if (sortField === 'price' || sortField === 'stock') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.')) return;
    
    setDeletingProduct(productId);
    try {
      const res = await fetch(
        `${API_BASE}/products/${productId}`,
        withAuth({
          method: 'DELETE'
        })
      );
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || 'Не удалось удалить товар');
      
      // Remove from local state immediately
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (e) {
          alert(e.message || 'Ошибка при удалении товара');
    } finally {
      setDeletingProduct(null);
    }
  };

  const handleQuickStockUpdate = async (productId, newStock) => {
    try {
      const stockValue = parseInt(newStock);
      if (isNaN(stockValue) || stockValue < 0) {
        // Revert to original value
        fetchProducts(currentPage);
        return;
      }
      
      setUpdatingProduct(productId);
      
      // Debounce rapid updates
      clearTimeout(window.stockUpdateTimeout);
      window.stockUpdateTimeout = setTimeout(async () => {
        try {
          const updateData = {
            stock: stockValue
          };
          
          const res = await fetch(
            `${API_BASE}/products/${productId}`,
            withAuth({
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updateData)
            })
          );
          
          const data = await res.json().catch(() => ({}));
          
          if (!res.ok) {
            throw new Error(data?.detail || `Не удалось обновить остаток: ${res.status}`);
          }
          
          // Update local state immediately for better UX
          setProducts(prev => prev.map(p => 
            p.id === productId ? { ...p, stock: stockValue } : p
          ));
        } catch (e) {
          console.error('Ошибка обновления остатка:', e);
          alert(e.message || 'Ошибка при обновлении остатка');
          fetchProducts(currentPage);
        } finally {
          setUpdatingProduct(null);
        }
      }, 500);
    } catch (e) {
      console.error('Ошибка обновления остатка:', e);
      setUpdatingProduct(null);
    }
  };

  const handleCsvUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('Файл не выбран');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой. Максимальный размер 10 МБ');
      event.target.value = ''; // Clear file input
      return;
    }
    
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setCsvFile(file);
      setError('');
    } else {
      setError('Выберите корректный CSV файл');
      event.target.value = ''; // Clear file input
    }
  };
const handleCsvImport = async () => {
  if (!csvFile) {
    setError('Сначала выберите CSV файл');
    return;
  }
  
  if (!confirm(
    `Импортировать товары из ${csvFile.name}?\n` +
    `Будут созданы новые товары и обновлены существующие по slug.`
  )) return;
  
  setImportLoading(true);
  setImportProgress(0);
  setError('');
  
  try {
    const formData = new FormData();
    formData.append('csv_file', csvFile);

    // First, get existing categories to validate slugs
    setImportProgress(10);
    let existingCategories = [];
    try {
      const categoriesRes = await fetch(`${API_BASE}/categories?limit=1000`);
      if (categoriesRes.ok) {
        existingCategories = await categoriesRes.json();
      }
    } catch (e) {
      console.warn('Не удалось загрузить категории для проверки:', e);
    }

    // Create a map of slug to ID for validation
    const slugToIdMap = {};
    existingCategories.forEach(cat => {
      if (cat.slug) {
        slugToIdMap[cat.slug.toLowerCase()] = cat.id;
      }
    });

    setImportProgress(20);

    const res = await fetch(
      `${API_BASE}/products/import`,
      withAuth({
        method: 'POST',
        body: formData,
      })
    );

    setImportProgress(90);

    const result = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      // Check if error is about unknown category slugs
      if (result.detail?.includes('categorySlugs') || result.errors?.some(e => e.includes('categorySlugs'))) {
        const missingSlugs = [];
        result.errors?.forEach(error => {
          const match = error.match(/categorySlugs:\s*([^,)]+)/);
          if (match) {
            missingSlugs.push(match[1].trim());
          }
        });
        
        const uniqueSlugs = [...new Set(missingSlugs)];
        
        if (uniqueSlugs.length > 0) {
          throw new Error(
            `Неизвестные slugs категорий: ${uniqueSlugs.join(', ')}\n\n` +
            `Сначала создайте эти категории или удалите их из CSV.\n` +
            `Существующие категории: ${existingCategories.slice(0, 10).map(c => c.slug).join(', ')}${existingCategories.length > 10 ? '...' : ''}`
          );
        }
      }
      throw new Error(result?.detail || `Импорт не удался: ${res.status}`);
    }

    setImportProgress(100);
    
    // Show success message
    const successMessage = `Успешно импортировано ${result.imported || 0}/${result.total || 0} товаров`;
    const errorsMessage = result.errors?.length > 0 
      ? `\n\n${result.errors.length} ошибок:\n${result.errors.slice(0, 5).join('\n')}${result.errors.length > 5 ? '\n... и еще' : ''}`
      : '';
    
    setTimeout(() => {
      alert(successMessage + errorsMessage);
      setShowCsvImport(false);
      setCsvFile(null);
      fetchProducts(currentPage);
    }, 500);
  } catch (e) {
    console.error('Ошибка импорта CSV:', e);
    setError(e.message || 'Ошибка импорта товаров. Проверьте формат CSV.');
  } finally {
    setImportLoading(false);
    setImportProgress(0);
  }
};



 const downloadCsvTemplate = async () => {
  // Fetch existing categories first
  let existingCategories = [];
  try {
    const res = await fetch(`${API_BASE}/categories?limit=50`);
    if (res.ok) {
      existingCategories = await res.json();
    }
  } catch (error) {
    console.warn('Не удалось загрузить категории:', error);
  }

  // Get first 5 category slugs as example
  const exampleSlugs = existingCategories
    .slice(0, 5)
    .map(cat => cat.slug)
    .filter(Boolean)
    .join(', ');

  const template = `name,slug,description,price,currencyCode,stock,categorySlugs,mainImageUrl,images,minStock,featured,tags
"Премиальный миндальный урбеч","premium-almond-urbech","Нежная паста из отборного миндаля",1290,RUB,50,"${exampleSlugs || 'orehi,urbech'}",https://example.com/almond.jpg,"https://example.com/almond-1.jpg,https://example.com/almond-2.jpg",10,true,"миндаль,урбеч,натуральный"
"Органический кунжутный урбеч","organic-sesame-urbech","Классическая паста из светлого кунжута",850,RUB,25,"${exampleSlugs || 'orehi'}",https://example.com/sesame.jpg,,5,true,"кунжут,урбеч,органик"
"Горный цветочный мед","mountain-flower-honey","Натуральный мед с высокогорных пасек",1575,RUB,30,"",https://example.com/honey.jpg,,8,false,"мед,натуральный,дагестан"

# ВАЖНО:
# 1. Обязательная колонка: name
# 2. categorySlugs: slugs существующих категорий через запятую
# 3. Оставьте categorySlugs пустым, если категория не нужна
# 4. Доступные категории (первые 20): ${existingCategories.slice(0, 20).map(c => c.slug).join(', ')}${existingCategories.length > 20 ? '...' : ''}
# 5. При необходимости сначала создайте категории в админ-панели`;

  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products_import_template.csv';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
  const getStockStatus = (product) => {
    const stock = product.stock || 0;
    const minStock = product.minStock || 5;
    
    if (stock === 0) return 'outOfStock';
    if (stock < minStock) return 'lowStock';
    return 'inStock';
  };

  const getStatusText = (product) => {
    const stock = product.stock || 0;
    const minStock = product.minStock || 5;
    
    if (stock === 0) return 'Нет в наличии';
    if (stock < minStock) return `Мало на складе (${stock}/${minStock})`;
    return 'В наличии';
  };

  const getFeaturedBadge = (product) => {
    return product.featured ? (
      <span className={styles.featuredBadge} title="Избранный товар">★</span>
    ) : null;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    // First page
    if (start > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={styles.pageButton}
        >
          1
        </button>
      );
      if (start > 2) {
        pages.push(<span key="start-ellipsis" className={styles.ellipsis}>...</span>);
      }
    }
    
    // Middle pages
    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`${styles.pageButton} ${
            currentPage === i ? styles.activePage : ''
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Last page
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(<span key="end-ellipsis" className={styles.ellipsis}>...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={styles.pageButton}
        >
          {totalPages}
        </button>
      );
    }
    
    return pages;
  };

  return (
    <div className={styles.container}>
      {/* Header with Stats */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerTitle}>
            <h1>Управление товарами</h1>
            <p>Управляйте ассортиментом и карточками товаров</p>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{products.length}</span>
              <span className={styles.statLabel}>Всего товаров</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} ${styles.statWarning}`}>
                {products.filter(p => (p.stock || 0) < (p.minStock || 5) && (p.stock || 0) > 0).length}
              </span>
              <span className={styles.statLabel}>Мало на складе</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} ${styles.statDanger}`}>
                {products.filter(p => (p.stock || 0) === 0).length}
              </span>
              <span className={styles.statLabel}>Нет в наличии</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} ${styles.statSuccess}`}>
                {products.filter(p => p.featured).length}
              </span>
              <span className={styles.statLabel}>Избранные</span>
            </div>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Поиск по названию, описанию, slug или категории..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button 
                className={styles.clearSearch}
                onClick={() => setSearchTerm('')}
                title="Очистить поиск"
                type="button"
              >
                ×
              </button>
            )}
          </div>
          <div className={styles.actionButtons}>
            <button 
              className={`${styles.btn} ${styles.btnSecondary}`} 
              onClick={() => setShowCsvImport(true)}
              disabled={importLoading}
              type="button"
            >
              📥 Импорт CSV
            </button>
            <button 
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => {
                setEditingProduct(null);
                setShowForm(true);
              }}
              type="button"
            >
              ➕ Добавить товар
            </button>
          </div>
        </div>
      </div>

      {error && !showCsvImport && (
        <div className={styles.error}>
          <strong>Ошибка:</strong> {error}
          <button onClick={() => fetchProducts(currentPage)} className={styles.retryBtn}>
            Повторить
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка товаров...</p>
        </div>
      )}

      {/* Products Table */}
      {!loading && (
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.tableInfo}>
              Показано {filteredProducts.length} из {products.length} товаров
              {searchTerm && ` по запросу "${searchTerm}"`}
              {totalPages > 1 && ` (Страница ${currentPage} из ${totalPages})`}
            </div>
            <div className={styles.tableControls}>
              <button 
                className={styles.refreshBtn}
                onClick={() => fetchProducts(currentPage)}
                title="Обновить товары"
                type="button"
              >
                🔄 Обновить
              </button>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.productsTable}>
              <thead>
                <tr>
                  <th className={`${styles.imageCol} ${styles.sortable}`}>Изображение</th>
                  <th 
                    className={`${styles.nameCol} ${styles.sortable}`}
                    onClick={() => handleSort('name')}
                  >
                    Название 
                    {sortField === 'name' && (
                      <span className={styles.sortIndicator}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`${styles.priceCol} ${styles.sortable}`}
                    onClick={() => handleSort('price')}
                  >
                    Цена 
                    {sortField === 'price' && (
                      <span className={styles.sortIndicator}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`${styles.stockCol} ${styles.sortable}`}
                    onClick={() => handleSort('stock')}
                  >
                    Остаток 
                    {sortField === 'stock' && (
                      <span className={styles.sortIndicator}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className={styles.statusCol}>Статус</th>
                  <th className={styles.actionsCol}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className={styles.productRow}>
                    <td className={styles.imageCell}>
                      <div className={styles.productImage}>
                        {product.mainImageUrl ? (
                          <Image
                            src={product.mainImageUrl}
                            alt={product.name || 'Изображение товара'}
                            width={60}
                            height={60}
                            className={styles.image}
                            unoptimized={true}
                            onError={(e) => {
                              e.target.src = '/placeholder-image.jpg';
                              e.target.onerror = null;
                            }}
                          />
                        ) : (
                          <div className={styles.placeholderImage}>📦</div>
                        )}
                      </div>
                    </td>
                    <td className={styles.nameCell}>
                      <div className={styles.productInfo}>
                        <div className={styles.productName}>
                          {getFeaturedBadge(product)}
                          {product.name || 'Без названия'}
                          {product.categorySlugs?.length > 0 && (
                            <div className={styles.categoryTags}>
                              {product.categorySlugs.slice(0, 2).map((slug, idx) => (
                                <span key={idx} className={styles.categoryTag}>
                                  {slug}
                                </span>
                              ))}
                              {product.categorySlugs.length > 2 && (
                                <span className={styles.moreTags}>+{product.categorySlugs.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={styles.productMeta}>
                          <span className={styles.productSlug}>/{product.slug || 'без-slug'}</span>
                          {product.description && (
                            <div className={styles.productDescription}>
                              {product.description.length > 60 
                                ? `${product.description.substring(0, 60)}...` 
                                : product.description
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={styles.priceCell}>
                      <div className={styles.price}>
                        <span className={styles.currency}>{product.currencyCode || 'USD'}</span>
                        <span className={styles.amount}>{parseFloat(product.price || 0).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className={styles.stockCell}>
                      <div className={styles.stockControl}>
                        <input
                          type="number"
                          value={product.stock || 0}
                          onChange={(e) => handleQuickStockUpdate(product.id, e.target.value)}
                          className={styles.stockInput}
                          min="0"
                          disabled={updatingProduct === product.id}
                        />
                        <span className={styles.stockLabel}>
                          {updatingProduct === product.id ? 'Обновление...' : 'шт.'}
                        </span>
                      </div>
                    </td>
                    <td className={styles.statusCell}>
                      <div className={`${styles.status} ${styles[getStockStatus(product)]}`}>
                        {getStatusText(product)}
                      </div>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionButtons}>
                        <button 
                          className={`${styles.btn} ${styles.btnSmall} ${styles.btnWarning}`}
                          onClick={() => {
                            setEditingProduct(product);
                            setShowForm(true);
                          }}
                          title="Редактировать товар"
                          type="button"
                        >
                          Редактировать
                        </button>
                        <button 
                          className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                          onClick={() => handleDelete(product.id)}
                          title="Удалить товар"
                          disabled={deletingProduct === product.id}
                          type="button"
                        >
                          {deletingProduct === product.id ? 'Удаление...' : 'Удалить'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className={styles.emptyState}>
                {searchTerm ? (
                  <>
                    <h3>Товары не найдены</h3>
                    <p>Нет товаров по запросу &quot;{searchTerm}&quot;</p>
                    <button 
                      className={styles.clearSearchBtn}
                      onClick={() => setSearchTerm('')}
                      type="button"
                    >
                      Очистить поиск
                    </button>
                  </>
                ) : (
                  <>
                    <h3>Товаров пока нет</h3>
                    <p>Начните с добавления первого товара или импорта из CSV</p>
                    <div className={styles.emptyStateActions}>
                      <button 
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={() => setShowForm(true)}
                        type="button"
                      >
                        ➕ Добавить первый товар
                      </button>
                      <button 
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={() => setShowCsvImport(true)}
                        type="button"
                      >
                        📥 Импорт CSV
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && filteredProducts.length > 0 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className={styles.paginationButton}
                  type="button"
                >
                  ← Назад
                </button>
                
                <div className={styles.pageNumbers}>
                  {renderPagination()}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className={styles.paginationButton}
                  type="button"
                >
                  Вперед →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvImport && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Импорт товаров из CSV</h2>
              <button
                className={styles.closeButton}
                onClick={() => {
                  if (!importLoading) {
                    setShowCsvImport(false);
                    setCsvFile(null);
                    setImportProgress(0);
                    setError('');
                  }
                }}
                disabled={importLoading}
                type="button"
              >
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              {error && (
                <div className={styles.modalError}>
                  <strong>Ошибка:</strong> {error}
                </div>
              )}
              <div className={styles.csvInstructions}>
  <h3>Требования к формату CSV:</h3>
  <ul>
    <li><strong>Обязательная колонка:</strong> name</li>
    <li><strong>categorySlugs:</strong> <span className={styles.important}>используйте существующие slug категорий, через запятую (например &quot;orehi,urbech&quot;)</span></li>
    <li><strong>Важно:</strong> категории должны существовать до импорта. Создайте их в разделе управления категориями.</li>
    <li><strong>images:</strong> URL дополнительных изображений через запятую</li>
    <li><strong>featured:</strong> true/false</li>
    <li><strong>tags:</strong> теги через запятую</li>
    <li>Первая строка — заголовки</li>
    <li>Максимальный размер файла: 10 МБ</li>
  </ul>

  {/* Category validation warning */}
  <div className={styles.categoryWarning}>
    ⚠️ <strong>Важно:</strong> колонка &quot;categorySlugs&quot; должна содержать slugs (не ID) существующих категорий.
    Оставьте пустым, если категория не нужна.
  </div>

  {/* Quick category check */}
  <div className={styles.categoryCheck}>
    <button 
      type="button"
      onClick={async () => {
            try {
              const res = await fetch(`${API_BASE}/categories?limit=10`);
              if (res.ok) {
                const cats = await res.json();
                const slugs = cats.map(c => c.slug).filter(Boolean);
                if (slugs.length > 0) {
                  alert(`Первые 10 доступных slug категорий:\n${slugs.join('\n')}`);
                } else {
                  alert('Категории не найдены. Сначала создайте категории.');
                }
              }
            } catch (error) {
              console.error('Error fetching categories:', error);
              alert('Не удалось загрузить категории');
            }
          }}
          className={styles.checkCategoriesBtn}
          disabled={importLoading}
        >
          🔍 Проверить доступные slug категорий
        </button>
      </div>

  <button 
    className={styles.templateButton} 
    onClick={downloadCsvTemplate}
    disabled={importLoading}
    type="button"
  >
    📋 Скачать шаблон CSV
  </button>
</div>
              <div className={styles.fileUpload}>
                <label className={styles.fileInputLabel}>
                  <span>📁 Выбрать CSV файл</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvUpload}
                    className={styles.fileInput}
                    disabled={importLoading}
                  />
                </label>
                {csvFile && (
                  <div className={styles.fileInfo}>
                    <div className={styles.fileInfoRow}>
                      <span className={styles.fileSuccess}>✅ Выбрано:</span>
                      <strong>{csvFile.name}</strong>
                    </div>
                    <div className={styles.fileInfoRow}>
                      <span>Размер:</span> {(csvFile.size / 1024).toFixed(1)} KB
                    </div>
                    <div className={styles.fileInfoRow}>
                      <span>Тип:</span> {csvFile.type || 'text/csv'}
                    </div>
                  </div>
                )}
              </div>

              {importLoading && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${importProgress}%` }} 
                    />
                  </div>
                  <span className={styles.progressText}>
                    {importProgress < 100 ? `Импорт... ${importProgress}%` : 'Обработка...'}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => {
                  setShowCsvImport(false);
                  setCsvFile(null);
                  setError('');
                }}
                disabled={importLoading}
                type="button"
              >
                Отмена
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleCsvImport}
                disabled={!csvFile || importLoading}
                type="button"
              >
                {importLoading ? '🔄 Импорт...' : '🚀 Импортировать товары'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingProduct(null);
            fetchProducts(currentPage);
          }}
        />
      )}
    </div>
  );
}
