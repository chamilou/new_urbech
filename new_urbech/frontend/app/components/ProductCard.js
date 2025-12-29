'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useState, useEffect, useMemo } from 'react';
import styles from './ProductCard.module.css';

const PLACEHOLDER = '/placeholder-image.jpg';

/**
 * Нормализация URL изображений с бэкенда для загрузки в браузере
 */
function normalizeMedia(src) {
  if (!src) return PLACEHOLDER;

  // Абсолютные URL (http/https)
  if (src.startsWith('http://') || src.startsWith('https://')) return src;

  // Уже проксированные пути /media
  if (src.startsWith('/media/')) return src;

  // Относительные пути типа "media/..." или "uploads/..."
  if (src.startsWith('media/')) return `/${src}`;
  if (src.startsWith('uploads/')) return `/media/${src.replace(/^\/+/, '')}`;

  // Всё остальное считаем медиа-путём
  return `/media/${src.replace(/^\/+/, '')}`;
}

/**
 * Форматирование цены с правильным отображением валюты
 */
function formatPrice(price, currencyCode = 'USD', locale = 'ru-RU') {
  if (price == null || price === '') return 'Цена не указана';
  
  try {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return 'Некорректная цена';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice);
  } catch (error) {
    // Простое форматирование при ошибке
    const fallbackPrice = parseFloat(price);
    return isNaN(fallbackPrice) ? 'Цена не указана' : `${fallbackPrice.toFixed(2)} ${currencyCode || 'USD'}`;
  }
}

/**
 * Получение даты создания продукта из различных возможных полей
 */
function getProductDate(product) {
  if (!product) return null;
  const dateFields = ['createdAt', 'created_at', 'date_created', 'created', 'timestamp'];
  for (const f of dateFields) {
    if (product[f]) {
      try {
        return new Date(product[f]);
      } catch {
        continue;
      }
    }
  }
  return null;
}

export default function ProductCard({ product, onProductClick, onQuickAdd }) {
  const { addToCart } = useCart();
  const [imageSrc, setImageSrc] = useState(PLACEHOLDER);
  const [imageLoading, setImageLoading] = useState(true);

  // Нормализация изображения при изменении продукта
  useEffect(() => {
    if (!product) {
      setImageSrc(PLACEHOLDER);
      setImageLoading(false);
      return;
    }

    const raw = product.mainImageUrl || product.mainImage || '';
    const normalized = normalizeMedia(raw);
    setImageSrc(normalized);
    setImageLoading(true);
  }, [product]);

  const handleImageError = () => {
    console.warn('Ошибка загрузки изображения:', imageSrc);
    if (imageSrc !== PLACEHOLDER) {
      setImageSrc(PLACEHOLDER);
    }
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // ---------- Оптимизированные вычисления ----------
  const isNewProduct = useMemo(() => {
    const created = getProductDate(product);
    if (!created) return false;
    const diffDays = Math.abs(new Date() - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }, [product]);

  const isRecentlyPosted = () => {
    const created = getProductDate(product);
    if (!created) return false;
    const diffHours = Math.abs(new Date() - created) / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  const isTopProduct = !!(product?.isTopProduct || product?.featured || product?.is_popular || product?.top_product);

  const stockStatus = (() => {
    const stock = product?.stock;
    if (stock === undefined || stock === null) return 'unknown';
    if (stock === 0) return 'outOfStock';
    if (stock < (product?.minStock || 5)) return 'lowStock';
    return 'inStock';
  })();

  const displayPrice = formatPrice(product?.price, product?.currencyCode);

  // ---------- Обработчики ----------
  const handleAddToCart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!product) return;
    addToCart(product);
    onQuickAdd?.(product, e);
  };

  const handleCardClick = (e) => {
    // Предотвращаем навигацию при клике на интерактивные элементы
    if (e.target.closest('button') || e.target.closest(`.${styles.quickAddButton}`)) {
      return;
    }
    onProductClick?.(product);
  };

  const handleQuickAddClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    handleAddToCart(e);
  };

  // ---------- Рендер ----------
  if (!product) {
    return (
      <div className={styles.productCard}>
        <div className={styles.imageContainer}>
          <div className={styles.imagePlaceholder}>Продукт недоступен</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productCard} onClick={handleCardClick}>
      {/* Ссылка на продукт для SEO и доступности */}
      <Link 
        href={`/products/${product.id}`} 
        className={styles.productLink}
        onClick={(e) => {
          // Если предоставлен onProductClick, используем его вместо стандартной навигации
          if (onProductClick) {
            e.preventDefault();
            onProductClick(product);
          }
        }}
      >
        <div className={styles.imageContainer}>
          {/* Индикатор загрузки */}
          {imageLoading && (
            <div className={styles.imagePlaceholder}>
              <div className={styles.loadingSpinner}></div>
              Загрузка...
            </div>
          )}

          {/* Всегда рендерим изображение для обработки события onLoad */}
          <Image
            src={imageSrc}
            alt={product.name || 'Изображение продукта'}
            width={200}
            height={200}
            className={styles.productImage}
            onError={handleImageError}
            onLoadingComplete={handleImageLoad}
            unoptimized={process.env.NODE_ENV === 'development'}
            style={{
              opacity: imageLoading ? 0 : 1,
              transition: 'opacity 0.25s ease',
            }}
          />

          {/* Заглушка если изображение не загрузилось */}
          {!imageLoading && imageSrc === PLACEHOLDER && (
            <div className={styles.imagePlaceholder}>📦 Нет изображения</div>
          )}

          {/* Бейджи */}
          <div className={styles.badgesContainer}>
            {isRecentlyPosted() && (
              <span className={`${styles.badge} ${styles.recentBadge}`}>🔥 Только что добавлен</span>
            )}
            {isNewProduct && !isRecentlyPosted() && (
              <span className={`${styles.badge} ${styles.newBadge}`}>✨ Новинка</span>
            )}
            {isTopProduct && (
              <span className={`${styles.badge} ${styles.topBadge}`}>⭐ Популярный</span>
            )}
            {stockStatus === 'lowStock' && product.stock > 0 && (
              <span className={`${styles.badge} ${styles.lowStockBadge}`}>
                ⚡ Заканчивается
              </span>
            )}
          </div>
        </div>

        <div className={styles.productInfo}>
          <h3 className={styles.productName}>{product.name || 'Без названия'}</h3>

          <p className={styles.productDescription}>
            {product.description
              ? product.description.length > 100
                ? `${product.description.substring(0, 100)}...`
                : product.description
              : 'Описание отсутствует'}
          </p>

          <div className={styles.priceSection}>
            <span className={styles.price}>{displayPrice}</span>
            <span className={`${styles.stock} ${styles[stockStatus]}`}>
              {stockStatus === 'outOfStock'
                ? 'Нет в наличии'
                : stockStatus === 'lowStock'
                ? `Осталось ${product.stock} шт.`
                : stockStatus === 'unknown'
                ? 'Неизвестно'
                : `${product.stock} в наличии`}
            </span>
          </div>
        </div>
      </Link>

      {/* Кнопка быстрого добавления - вне ссылки для предотвращения конфликтов */}
      <button
        className={styles.quickAddButton}
        onClick={handleQuickAddClick}
        disabled={!product.stock || product.stock === 0}
        title="Добавить в корзину"
        aria-label={`Добавить ${product.name} в корзину`}
      >
        🛒
      </button>

      {/* Основная кнопка добавления в корзину */}
      <button
        className={styles.addToCartBtn}
        onClick={handleAddToCart}
        disabled={!product.stock || product.stock === 0}
        aria-label={`Добавить ${product.name} в корзину`}
      >
        {!product.stock || product.stock === 0 ? 'Нет в наличии' : 'В корзину'}
      </button>
    </div>
  );
}