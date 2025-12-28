
  'use client';
import Image from 'next/image';
import styles from './ProductGrid.module.css';

export default function ProductGrid({ products, onProductClick, onQuickAdd }) {
  return (
    <div className={styles.productsGrid}>
      {products.map((product) => (
        <div 
          key={product.id} 
          className={styles.productCard}
          onClick={() => onProductClick(product)}
        >
          <div className={styles.imageContainer}>
            <Image
              src={product.mainImageUrl || '/media/product_pictures/pic1.jpg'}
              alt={product.name}
              width={200}
              height={200}
              className={styles.productImage}
              priority={false}
            />
            <button 
              className={styles.quickAddButton}
              onClick={(e) => onQuickAdd(product, e)}
              disabled={product.stock === 0}
            >
              🛒
            </button>
          </div>
          
          <div className={styles.productInfo}>
            <h3 className={styles.productName}>{product.name}</h3>
            <p className={styles.productDescription}>
              {product.description ? 
                (product.description.length > 100 
                  ? `${product.description.substring(0, 100)}...` 
                  : product.description)
                : 'No description available'
              }
            </p>
            <div className={styles.priceSection}>
              <span className={styles.price}>
                {product.price ? `$${product.price}` : 'Price not set'}
              </span>
              <span className={`${styles.stock} ${product.stock === 0 ? styles.outOfStock : styles.inStock}`}>
                {product.stock === 0 ? 'Out of stock' : `In stock: ${product.stock}`}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}