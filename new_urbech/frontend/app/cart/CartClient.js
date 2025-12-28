'use client';

import Image from 'next/image';
import { useCart } from '../context/CartContext';
import styles from './cart.module.css';

import Link from 'next/link';

export default function CartClient() {
  
  const { cart, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();

  // Safe price formatting function
  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return '0.00';
    }
    return parseFloat(price).toFixed(2);
  };

  // Safe calculation function
  const calculateItemTotal = (price, quantity) => {
    const itemPrice = parseFloat(price) || 0;
    const itemQuantity = parseInt(quantity) || 0;
    return (itemPrice * itemQuantity).toFixed(2);
  };

  // Image URL handling that works with your Next.js rewrites
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return '/placeholder-image.jpg';
    }

    // Use relative paths - Next.js rewrites will handle the conversion
    if (imagePath.startsWith('/media/')) {
      return imagePath;
    }

    // If it's already a full URL, use it directly
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // If it's just a filename, construct the relative path
    if (!imagePath.includes('/')) {
      return `/media/product_pictures/${imagePath}`;
    }

    return '/placeholder-image.jpg';
  };

  const handleCheckout = async () => {
    try {
      const checkoutData = {
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price || 0
        })),
        customer_id: 'temp-customer-id'
      };

      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData)
      });
      
      if (response.ok) {
        const order = await response.json();
        clearCart();
        window.location.href = `/orders/${order.id}`;
      } else {
        alert('Checkout failed. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Shopping Cart</h1>
      
      {cart.length === 0 ? (
        <div className={styles.emptyCart}>
          <h2>Your cart is empty</h2>
          <p>Add some products to get started!</p>
          <Link href="/" className={styles.continueShopping}>Continue Shopping</Link>
        </div>
      ) : (
        <>
          <div className={styles.cartItems}>
            {cart.map(item => {
              // Try multiple image fields in priority order
              const imageUrl = getImageUrl(
                item.mainImageUrl || // This should now work
                item.mainImage || 
                item.image
              );

              return (
                <div key={item.product_id} className={styles.cartItem}>
                  <div className={styles.imageWrapper}>
                    <Image
                      alt={item.name || 'Product image'}
                      src={imageUrl}
                      width={80}
                      height={80}
                      className={styles.itemImage}
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                  <div className={styles.itemDetails}>
                    <h2>{item.name || 'Unnamed Product'}</h2>
                    {item.description && (
                      <p className={styles.itemDescription}>
                        {item.description.length > 100 
                          ? `${item.description.substring(0, 100)}...` 
                          : item.description
                        }
                      </p>
                    )}
                    <p className={styles.itemPrice}>
                      {item.currencyCode || '$'} {formatPrice(item.price)}
                    </p>
                    
                    <div className={styles.quantityControl}>
                      <button 
                        onClick={() => updateQuantity(item.product_id, Math.max(0, item.quantity - 1))}
                        className={styles.quantityBtn}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className={styles.quantity}>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className={styles.quantityBtn}
                      >
                        +
                      </button>
                    </div>
                    
                    <p className={styles.itemTotal}>
                      Total: {item.currencyCode || '$'} {calculateItemTotal(item.price, item.quantity)}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.product_id)}
                    className={styles.removeBtn}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <div className={styles.cartSummary}>
            <div className={styles.summaryCard}>
              <h2>Order Summary</h2>
              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <span>${formatPrice(getTotal())}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping:</span>
                <span>$0.00</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Tax:</span>
                <span>${formatPrice(getTotal() * 0.1)}</span>
              </div>
              <div className={styles.summaryRow + ' ' + styles.total}>
                <span>Total:</span>
                <span>${formatPrice(getTotal() * 1.1)}</span>
              </div>
              
              <button 
                onClick={handleCheckout}
                className={styles.checkoutBtn}
              >
                Proceed to Checkout
              </button>
              
              <button 
                onClick={clearCart}
                className={styles.clearCartBtn}
              >
                Clear Cart
              </button>
              
              <Link href="/products" className={styles.continueShopping}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}