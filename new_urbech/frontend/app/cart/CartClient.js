'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import styles from './cart.module.css';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

export default function CartClient() {
  const { cart, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [guestEmail, setGuestEmail] = useState("");
const [guestName, setGuestName] = useState("");


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

  // Calculate tax (10%)
  const calculateTax = (amount) => {
    return (parseFloat(amount) * 0.1).toFixed(2);
  };

  // Calculate total with tax
  const calculateTotalWithTax = (amount) => {
    const subtotal = parseFloat(amount) || 0;
    const tax = subtotal * 0.1;
    return (subtotal + tax).toFixed(2);
  };

  // Image URL handling
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return '/placeholder-image.jpg';
    }

    if (imagePath.startsWith('/media/')) {
      return imagePath;
    }

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    if (!imagePath.includes('/')) {
      return `/media/product_pictures/${imagePath}`;
    }

    return '/placeholder-image.jpg';
  };

  const handleCheckout = async () => {
    const email = guestEmail.trim();
const name = guestName.trim();

if (!email || !email.includes("@")) {
  setCheckoutError("Please enter a valid email for checkout.");
  return;
}
if (!name) {
  setCheckoutError("Please enter your name for checkout.");
  return;
}

    try {
      setCheckoutLoading(true);
      setCheckoutError('');

      // Validate cart
      if (cart.length === 0) {
        setCheckoutError('Your cart is empty');
        return;
      }

      const subtotal = getTotal();
      const tax = parseFloat(calculateTax(subtotal));
      const total = parseFloat(calculateTotalWithTax(subtotal));

     const checkoutData = {
  items: cart.map(item => ({
    product_id: String(item.product_id),  // ensure string UUID
    quantity: Number(item.quantity),
  })),
  customer_email: email,
  customer_name: name,
  
};

      console.log('Sending checkout data:', checkoutData);

      const response = await fetch(`${API_BASE}/orders/checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData)
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || `Checkout failed: ${response.status}`);
      }

      console.log('Checkout successful:', responseData);
      
      // Clear cart and redirect to order confirmation
      clearCart();
      
      // Use router.push for better navigation
      if (responseData.id) {
        window.location.href = `/orders/${responseData.id}`;
      } else {
        window.location.href = `/orders/success`;
      }

    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Format currency display based on first item's currency or default
  const getDisplayCurrency = () => {
    if (cart.length > 0 && cart[0].currencyCode) {
      return cart[0].currencyCode;
    }
    return '$'; // Default to USD
  };

  const displayCurrency = getDisplayCurrency();
  const subtotal = getTotal();
  const tax = calculateTax(subtotal);
  const total = calculateTotalWithTax(subtotal);

  return (
    <div className={styles.container}>
      <h1>Shopping Cart</h1>
      
      {checkoutError && (
        <div className={styles.errorBanner}>
          {checkoutError}
          <button 
            onClick={() => setCheckoutError('')}
            className={styles.closeError}
          >
            ×
          </button>
        </div>
      )}
      
      {cart.length === 0 ? (
        <div className={styles.emptyCart}>
          <h2>Your cart is empty</h2>
          <p>Add some products to get started!</p>
          <Link href="/products" className={styles.continueShopping}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.cartItems}>
            {cart.map(item => {
              const imageUrl = getImageUrl(
                item.mainImageUrl || 
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
                      unoptimized={true} // For external images
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
                      {item.currencyCode || displayCurrency} {formatPrice(item.price)}
                    </p>
                    
                    <div className={styles.quantityControl}>
                      <button 
                        onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                        className={styles.quantityBtn}
                        disabled={item.quantity <= 1}
                        type="button"
                      >
                        -
                      </button>
                      <span className={styles.quantity}>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className={styles.quantityBtn}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    
                    <p className={styles.itemTotal}>
                      Total: {item.currencyCode || displayCurrency} {calculateItemTotal(item.price, item.quantity)}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.product_id)}
                    className={styles.removeBtn}
                    type="button"
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
                <span>Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                <span>{displayCurrency} {formatPrice(subtotal)}</span>
              </div>
              
              <div className={styles.summaryRow}>
                <span>Shipping:</span>
                <span className={styles.freeShipping}>FREE</span>
              </div>
              
              <div className={styles.summaryRow}>
                <span>Tax (10%):</span>
                <span>{displayCurrency} {tax}</span>
              </div>
              
              <div className={styles.summaryRow + ' ' + styles.total}>
                <span>Total:</span>
                <span>{displayCurrency} {total}</span>
              </div>
              
<div className={styles.guestCard}>
  <h3 className={styles.guestTitle}>Guest details</h3>

  <label className={styles.fieldLabel}>Email</label>
  <input
    className={styles.input}
    type="email"
    value={guestEmail}
    onChange={(e) => setGuestEmail(e.target.value)}
    placeholder="you@example.com"
  />

  <label className={styles.fieldLabel}>Name</label>
  <input
    className={styles.input}
    type="text"
    value={guestName}
    onChange={(e) => setGuestName(e.target.value)}
    placeholder="Your name"
  />
</div>


              <button 
                onClick={handleCheckout}
                className={styles.checkoutBtn}
                disabled={checkoutLoading || cart.length === 0}
                type="button"
              >
                {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
              
              <button 
                onClick={clearCart}
                className={styles.clearCartBtn}
                type="button"
              >
                Clear Cart
              </button>
              
              <Link href="/products" className={styles.continueShopping}>
                Continue Shopping
              </Link>
              
              {/* Optional: Add payment method icons */}
              <div className={styles.paymentMethods}>
                <span>We accept:</span>
                <div className={styles.paymentIcons}>
                  <span>💳</span>
                  <span>💰</span>
                  <span>📱</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}