'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useState, useEffect, useMemo } from 'react';
import styles from './ProductCard.module.css';

const PLACEHOLDER = '/placeholder-image.jpg';

/**
 * Normalize backend image URLs to something the browser can load
 * and Next.js will accept based on your next.config.js rewrites.
 */
function normalizeMedia(src) {
  if (!src) return PLACEHOLDER;

  // Absolute URLs (http/https)
  if (src.startsWith('http://') || src.startsWith('https://')) return src;

  // Already proxied /media path
  if (src.startsWith('/media/')) return src;

  // Relative like "media/..." or "uploads/..."
  if (src.startsWith('media/')) return `/${src}`;
  if (src.startsWith('uploads/')) return `/media/${src.replace(/^\/+/, '')}`;

  // Anything else, assume media path
  return `/media/${src.replace(/^\/+/, '')}`;
}

/**
 * Format price with proper currency formatting
 */
function formatPrice(price, currencyCode = 'USD', locale = 'en-US') {
  if (price == null || price === '') return 'Price unavailable';
  
  try {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return 'Invalid price';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice);
  } catch (error) {
    // Fallback formatting
    const fallbackPrice = parseFloat(price);
    return isNaN(fallbackPrice) ? 'Price unavailable' : `${currencyCode || '$'} ${fallbackPrice.toFixed(2)}`;
  }
}

/**
 * Get product creation date from various possible fields
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

  // Normalize image source on product change
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
    console.warn('Image failed:', imageSrc);
    if (imageSrc !== PLACEHOLDER) {
      setImageSrc(PLACEHOLDER);
    }
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // ---------- Optimized Calculations ----------
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

  // ---------- Handlers ----------
  const handleAddToCart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!product) return;
    addToCart(product);
    onQuickAdd?.(product, e);
  };

  const handleCardClick = (e) => {
    // Prevent navigation if clicking interactive elements
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

  // ---------- Render ----------
  if (!product) {
    return (
      <div className={styles.productCard}>
        <div className={styles.imageContainer}>
          <div className={styles.imagePlaceholder}>Product not available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productCard} onClick={handleCardClick}>
      {/* Product Link for SEO and accessibility */}
      <Link 
        href={`/products/${product.id}`} 
        className={styles.productLink}
        onClick={(e) => {
          // If onProductClick is provided, use it instead of default navigation
          if (onProductClick) {
            e.preventDefault();
            onProductClick(product);
          }
        }}
      >
        <div className={styles.imageContainer}>
          {/* Spinner overlay while loading */}
          {imageLoading && (
            <div className={styles.imagePlaceholder}>
              <div className={styles.loadingSpinner}></div>
              Loading...
            </div>
          )}

          {/* Always render image to allow onLoad event */}
          <Image
            src={imageSrc}
            alt={product.name || 'Product image'}
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

          {/* Fallback if image truly failed */}
          {!imageLoading && imageSrc === PLACEHOLDER && (
            <div className={styles.imagePlaceholder}>📦 No Image</div>
          )}

          {/* Badges */}
          <div className={styles.badgesContainer}>
            {isRecentlyPosted() && (
              <span className={`${styles.badge} ${styles.recentBadge}`}>🔥 Just Added</span>
            )}
            {isNewProduct && !isRecentlyPosted() && (
              <span className={`${styles.badge} ${styles.newBadge}`}>✨ New</span>
            )}
            {isTopProduct && (
              <span className={`${styles.badge} ${styles.topBadge}`}>⭐ Popular</span>
            )}
            {stockStatus === 'lowStock' && product.stock > 0 && (
              <span className={`${styles.badge} ${styles.lowStockBadge}`}>
                ⚡ Low Stock
              </span>
            )}
          </div>
        </div>

        <div className={styles.productInfo}>
          <h3 className={styles.productName}>{product.name || 'Unnamed Product'}</h3>

          <p className={styles.productDescription}>
            {product.description
              ? product.description.length > 100
                ? `${product.description.substring(0, 100)}...`
                : product.description
              : 'No description available'}
          </p>

          <div className={styles.priceSection}>
            <span className={styles.price}>{displayPrice}</span>
            <span className={`${styles.stock} ${styles[stockStatus]}`}>
              {stockStatus === 'outOfStock'
                ? 'Out of stock'
                : stockStatus === 'lowStock'
                ? `Only ${product.stock} left`
                : stockStatus === 'unknown'
                ? 'Stock unknown'
                : `${product.stock} in stock`}
            </span>
          </div>
        </div>
      </Link>

      {/* Quick Add Button - outside the Link to prevent navigation conflicts */}
      <button
        className={styles.quickAddButton}
        onClick={handleQuickAddClick}
        disabled={!product.stock || product.stock === 0}
        title="Add to Cart"
        aria-label={`Add ${product.name} to cart`}
      >
        🛒
      </button>

      {/* Main Add to Cart Button */}
      <button
        className={styles.addToCartBtn}
        onClick={handleAddToCart}
        disabled={!product.stock || product.stock === 0}
        aria-label={`Add ${product.name} to cart`}
      >
        {!product.stock || product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  );
}