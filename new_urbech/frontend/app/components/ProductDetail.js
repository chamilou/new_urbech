'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import styles from './ProductDetail.module.css';
import { useToast } from '../hooks/useToast';
import { useCart } from '../context/CartContext';

const PLACEHOLDER = '/placeholder-image.jpg';

export default function ProductDetail({ product, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [broken, setBroken] = useState(() => new Set()); // track broken image urls

  const showToast = useToast();
  const { addToCart } = useCart();

  // Normalize image URLs for your current infra:
  // - Prefer same-origin /media/** (Caddy proxies it to backend)
  // - Support filename-only values
  // - Support absolute URLs
  const normalizeImageSrc = (imagePath) => {
    if (!imagePath) return PLACEHOLDER;

    // If already absolute
    if (typeof imagePath === 'string' && imagePath.startsWith('http')) {
      return imagePath;
    }

    // If already a public media path (best)
    if (typeof imagePath === 'string' && imagePath.startsWith('/media/')) {
      return imagePath;
    }

    // If it's a bare filename like "abc.jpg"
    if (typeof imagePath === 'string' && !imagePath.includes('/')) {
      return `/media/products/${imagePath}`;
    }

    // Fallback: if it's some relative path, keep it
    return imagePath;
  };

  const images = useMemo(() => {
    const arr = [];

    if (product?.mainImageUrl) arr.push(normalizeImageSrc(product.mainImageUrl));

    if (Array.isArray(product?.images)) {
      product.images.forEach((img) => {
        const url = typeof img === 'object' ? img?.url : img;
        if (url) arr.push(normalizeImageSrc(url));
      });
    }

    // De-dup while preserving order
    const deduped = [];
    const seen = new Set();
    for (const u of arr) {
      if (!seen.has(u)) {
        seen.add(u);
        deduped.push(u);
      }
    }

    return deduped.length ? deduped : [PLACEHOLDER];
  }, [product]);

  const currentSrc = images[selectedImage] || PLACEHOLDER;
  const displaySrc = broken.has(currentSrc) ? PLACEHOLDER : currentSrc;

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
    const cartProduct = {
      product_id: product.product_id || product.id,
      id: product.id || product.product_id,
      name: product.name,
      price: product.price,
      mainImageUrl: product.mainImageUrl,
      description: product.description,
      currencyCode: product.currencyCode || 'USD',
      stock: product.stock || 0,
      articleNumber: product.articleNumber,
    };

    try {
      addToCart(cartProduct, quantity);
      showToast(`${product.name} добавлен в корзину 🛒`, 'success');
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      showToast('Ошибка при добавлении в корзину', 'error');
    }
  };

  const handleImageClick = (index) => setSelectedImage(index);

  const onImgError = (src) => {
    setBroken((prev) => {
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} type="button">
          ×
        </button>

        <div className={styles.productDetail}>
          <div className={styles.imagesSection}>
            <div className={styles.mainImage}>
              <Image
                src={displaySrc}
                alt={product?.name || 'Product'}
                width={400}
                height={400}
                className={styles.productImage}
                priority
                onError={() => onImgError(currentSrc)}
              />
            </div>

            {images.length > 1 && (
              <div className={styles.thumbnailContainer}>
                {images.map((src, index) => {
                  const thumbSrc = broken.has(src) ? PLACEHOLDER : src;
                  return (
                    <button
                      key={`${src}-${index}`}
                      className={`${styles.thumbnail} ${selectedImage === index ? styles.thumbnailActive : ''}`}
                      onClick={() => handleImageClick(index)}
                      type="button"
                    >
                      <Image
                        src={thumbSrc}
                        alt={`${product?.name || 'Product'} ${index + 1}`}
                        width={60}
                        height={60}
                        className={styles.thumbnailImage}
                        onError={() => onImgError(src)}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.infoSection}>
            <h1 className={styles.productName}>{product?.name}</h1>

            <p className={styles.productPrice}>
              {product?.price != null ? `${product.currencyCode || 'USD'} ${product.price}` : 'Цена не указана'}
            </p>

            {product?.description && (
              <div className={styles.description}>
                <h3>Описание</h3>
                <p>{product.description}</p>
              </div>
            )}

            <div className={styles.stockInfo}>
              <span className={`${styles.stockStatus} ${product?.stock > 0 ? styles.inStock : styles.outOfStock}`}>
                {product?.stock > 0 ? `В наличии: ${product.stock} шт.` : 'Нет в наличии'}
              </span>
            </div>

            <div className={styles.quantitySelector}>
              <label className={styles.quantityLabel}>Количество:</label>
              <div className={styles.quantityControls}>
                <button
                  className={styles.quantityButton}
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  type="button"
                >
                  -
                </button>
                <span className={styles.quantityDisplay}>{quantity}</span>
                <button
                  className={styles.quantityButton}
                  onClick={increaseQuantity}
                  disabled={product?.stock != null && quantity >= product.stock}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>

            <button
              className={styles.addToCartButton}
              onClick={handleAddToCart}
              disabled={product?.stock === 0}
              type="button"
            >
              {product?.stock === 0 ? 'Нет в наличии' : `Добавить в корзину (${quantity})`}
            </button>

            <div className={styles.additionalInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Артикул:</span>
                <span className={styles.infoValue}>{product?.articleNumber || 'Не указан'}</span>
              </div>

              {product?.categories && product.categories.length > 0 && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Категория:</span>
                  <span className={styles.infoValue}>
                    {product.categories
                      .map((cat) => (typeof cat === 'object' ? cat.category?.name || cat.name : cat))
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
