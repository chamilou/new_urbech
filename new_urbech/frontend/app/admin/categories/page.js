'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import CategoryForm from '../components/CategoryForm';
import { withAuth } from '../../lib/authFetch';

export default function AdminCategoriesTable() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedProducts, setExpandedProducts] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setError('');
      const res = await fetch('/api/categories?includeProducts=true', {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
      });

      let data = null;
      try { data = await res.json(); } catch (_) {}

      if (!res.ok) {
        const msg = (data && (data.detail || data.error || JSON.stringify(data))) || res.statusText;
        throw new Error(`Ошибка запроса: ${res.status} ${msg}`);
      }

      const list = Array.isArray(data) ? data : [];
      setCategories(list);
    } catch (e) {
      console.error(e);
      setCategories([]);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const toggleProductsExpansion = (categoryId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Вы уверены, что хотите удалить категорию "${category.name}"? Это действие нельзя отменить.`)) {
      return;
    }

    try {
      const res = await fetch(
        `/api/categories/${category.id}`,
        withAuth({
          method: 'DELETE',
        })
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Не удалось удалить категорию');
      }

      await fetchCategories();
      setError('');
    } catch (e) {
      setError(e.message || 'Не удалось удалить категорию');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const safeCategories = Array.isArray(categories) ? categories : [];

  const renderProductInline = (product) => {
    const stockStatus = product.stock === 0 ? 'outOfStock' : 
                       product.stock < (product.minStock || 5) ? 'lowStock' : 'inStock';
    
    const stockText = product.stock === 0 ? 'Нет в наличии' : 
                     product.stock < (product.minStock || 5) ? `Мало (${product.stock})` : `В наличии (${product.stock})`;

    return (
      <div key={product.id} className={styles.productInlineItem}>
        <div className={styles.productImageSmall}>
          {product.mainImageUrl ? (
            <Image
              src={product.mainImageUrl}
              alt={product.name}
              width={40}
              height={40}
              className={styles.productThumbnail}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className={styles.noImageSmall}>📦</div>
          )}
        </div>
        <div className={styles.productDetailsSmall}>
          <h5 className={styles.productNameSmall} title={product.name}>
            {product.name}
          </h5>
          <div className={styles.productMetaSmall}>
            <span className={styles.productPriceSmall}>
              {product.price != null ? `$${product.price}` : '—'}
            </span>
            <span className={styles[stockStatus]}>
              {stockText}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderProductsPreview = (category) => {
    const products = category.products || [];
    const isExpanded = expandedProducts[category.id];
    const displayProducts = isExpanded ? products : products.slice(0, 3);
    const hasMore = products.length > 3 && !isExpanded;

    if (products.length === 0) {
      return (
        <div className={styles.productsInline}>
          <div className={styles.noProducts}>Нет товаров</div>
        </div>
      );
    }

    return (
      <div className={styles.productsInline}>
        <div className={styles.productsPreviewCompact}>
          {displayProducts.map(renderProductInline)}
        </div>
        {hasMore && (
          <div 
            className={styles.moreProductsCompact}
            onClick={() => toggleProductsExpansion(category.id)}
          >
            +{products.length - 3} ещё товаров
          </div>
        )}
        {isExpanded && products.length > 3 && (
          <div 
            className={styles.moreProductsCompact}
            onClick={() => toggleProductsExpansion(category.id)}
          >
            Показать меньше
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Категории и Товары</h1>
        <div className={styles.headerActions}>
          <button 
            className={styles.createBtn}
            onClick={handleAddCategory}
          >
            + Добавить категорию
          </button>
        </div>
        {error && <div className={styles.error}>⚠️ {error}</div>}
      </div>

      {showForm && (
        <CategoryForm
          category={editingCategory}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      <div className={styles.categoriesTable}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Название категории</th>
              <th>URL (слаг)</th>
              <th>Количество товаров</th>
              <th>Товары</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {safeCategories.map(category => (
              <tr key={category.id} className={styles.tableRow}>
                <td className={styles.categoryName}>
                  <strong>{category.name}</strong>
                  {category.parent && (
                    <small> (Подкатегория {category.parent.name})</small>
                  )}
                </td>
                <td className={styles.categorySlug}>
                  <code>{category.slug}</code>
                </td>
                <td className={styles.productCount}>
                  {category.productCount ?? (category.products?.length || 0)}
                </td>
                <td className={styles.productsList}>
                  {renderProductsPreview(category)}
                </td>
                <td className={styles.actions}>
                  <div className={styles.actionButtons}>
                    <button
                      className={styles.editBtn}
                      onClick={() => handleEditCategory(category)}
                    >
                      Редактировать
                    </button>
                    <button
                      className={styles.viewBtn}
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory?.id === category.id ? null : category
                        )
                      }
                    >
                      {selectedCategory?.id === category.id ? 'Скрыть' : 'Подробнее'}
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteCategory(category)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!safeCategories.length && !error && (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  Категории не найдены. <button onClick={handleAddCategory} className={styles.textButton}>Создайте первую категорию</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Модальное окно с товарами */}
      {selectedCategory && (
        <div className={styles.productsModal}>
          <div className={styles.modalHeader}>
            <h2>Товары в категории {selectedCategory.name}</h2>
            <button className={styles.closeBtn} onClick={() => setSelectedCategory(null)}>×</button>
          </div>
          <div className={styles.productsGrid}>
            {selectedCategory.products?.map(product => (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productImage}>
                  {product.mainImageUrl ? (
                    <Image
                      src={product.mainImageUrl}
                      alt={product.name}
                      width={100}
                      height={50}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className={styles.noImage}>📦</div>
                  )}
                </div>
                <div className={styles.productInfo}>
                  <h4>{product.name}</h4>
                  <p className={styles.productPrice}>
                    {product.price != null ? `$${product.price}` : '—'}
                  </p>
                  <p className={styles.productStock}>Количество: {product.stock ?? 0}</p>
                  <p className={styles.productDescription}>
                    {(product.description ?? '').substring(0, 100)}...
                  </p>
                </div>
              </div>
            ))}
            {selectedCategory.products?.length === 0 && (
              <div className={styles.noProducts}>
                В этой категории пока нет товаров.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
