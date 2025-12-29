'use client';
import { useState } from 'react';
import { useToast } from '../hooks/useToast';
import Image from 'next/image';
import styles from './ProductDetail.module.css';
import { useCart } from '../context/CartContext';

export default function ProductDetail({ product, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const showToast = useToast();
  const { addToCart } = useCart();

  // Обработка URL изображений
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-image.jpg';
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('/media/')) {
      return `http://localhost:8000${imagePath}`;
    }
    
    if (!imagePath.includes('/')) {
      return `http://localhost:8000/media/products/${imagePath}`;
    }
    
    return imagePath;
  };

  // Формирование массива изображений
  const getImagesArray = () => {
    const images = [];
    
    if (product.mainImageUrl) {
      images.push(getImageUrl(product.mainImageUrl));
    }
    
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        const imageUrl = typeof img === 'object' ? img.url : img;
        if (imageUrl) {
          images.push(getImageUrl(imageUrl));
        }
      });
    }
    
    if (images.length === 0) {
      images.push('/placeholder-image.jpg');
    }
    
    return images;
  };

  const images = getImagesArray();

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => prev > 1 ? prev - 1 : 1);
  };

  const handleAddToCart = () => {
    const cartProduct = {
      product_id: product.product_id || product.id,
      id: product.id || product.product_id,
      name: product.name,
      price: product.price,
      mainImageUrl: product.mainImageUrl,
      mainImage: product.mainImage,
      image: product.image,
      description: product.description,
      currencyCode: product.currencyCode || 'USD',
      stock: product.stock || 0
    };

    console.log("Добавление в корзину:", {
      cartProduct,
      quantity,
      hasProductId: !!cartProduct.product_id
    });

    try {
      addToCart(cartProduct, quantity);
      showToast(`${product.name} добавлен в корзину 🛒`, 'success');
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      showToast('Ошибка при добавлении в корзину', 'error');
    }
  };

  const handleImageClick = (index) => {
    setSelectedImage(index);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>

        <div className={styles.productDetail}>
          <div className={styles.imagesSection}>
            <div className={styles.mainImage}>
              <Image
                src={images[selectedImage]}
                alt={product.name}
                width={400}
                height={400}
                className={styles.productImage}
                priority
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg';
                }}
              />
            </div>
            
            {images.length > 1 && (
              <div className={styles.thumbnailContainer}>
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={`${styles.thumbnail} ${selectedImage === index ? styles.thumbnailActive : ''}`}
                    onClick={() => handleImageClick(index)}
                    type="button"
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={60}
                      height={60}
                      className={styles.thumbnailImage}
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.infoSection}>
            <h1 className={styles.productName}>{product.name}</h1>
            
            <p className={styles.productPrice}>
              {product.price ? `$${product.price}` : 'Цена не указана'}
            </p>

            {product.description && (
              <div className={styles.description}>
                <h3>Описание</h3>
                <p>{product.description}</p>
              </div>
            )}

            <div className={styles.stockInfo}>
              <span className={`${styles.stockStatus} ${product.stock > 0 ? styles.inStock : styles.outOfStock}`}>
                {product.stock > 0 ? `В наличии: ${product.stock} шт.` : 'Нет в наличии'}
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
                  disabled={product.stock !== null && quantity >= product.stock}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>

            <button
              className={styles.addToCartButton}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              type="button"
            >
              {product.stock === 0 ? 'Нет в наличии' : `Добавить в корзину (${quantity})`}
            </button>

            <div className={styles.additionalInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Артикул:</span>
                <span className={styles.infoValue}>{product.articleNumber || 'Не указан'}</span>
              </div>
              {product.categories && product.categories.length > 0 && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Категория:</span>
                  <span className={styles.infoValue}>
                    {product.categories.map(cat => 
                      typeof cat === 'object' ? cat.category?.name || cat.name : cat
                    ).join(', ')}
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