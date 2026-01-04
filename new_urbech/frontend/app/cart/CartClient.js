'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import styles from './cart.module.css';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

export default function CartClient() {
  const { cart, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Logged-in user
  const [userLoading, setUserLoading] = useState(true);
  const [user, setUser] = useState(null); // { email, name, address? }

  // Guest / checkout inputs
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');

  // Shipping address fields
  const [shipping, setShipping] = useState({
    fullName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    postalCode: '',
    region: '',
    country: 'Switzerland',
  });

  // --- Helpers ---
  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) return '0.00';
    return parseFloat(price).toFixed(2);
  };

  const calculateItemTotal = (price, quantity) => {
    const itemPrice = parseFloat(price) || 0;
    const itemQuantity = parseInt(quantity) || 0;
    return (itemPrice * itemQuantity).toFixed(2);
  };

  const calculateTax = (amount) => (parseFloat(amount || 0) * 0.1).toFixed(2);

  const calculateTotalWithTax = (amount) => {
    const subtotal = parseFloat(amount) || 0;
    const tax = subtotal * 0.1;
    return (subtotal + tax).toFixed(2);
  };

  // Use same-origin /media/** (best for prod behind Caddy)
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-image.jpg';
    if (imagePath.startsWith('/media/')) return imagePath;
    if (imagePath.startsWith('http')) return imagePath;
    if (!imagePath.includes('/')) return `/media/products/${imagePath}`;
    return '/placeholder-image.jpg';
  };

  // Currency display
  const displayCurrency = useMemo(() => {
    if (cart.length > 0 && cart[0].currencyCode) return cart[0].currencyCode;
    return 'USD';
  }, [cart]);

  const subtotal = getTotal();
  const tax = calculateTax(subtotal);
  const total = calculateTotalWithTax(subtotal);

  // --- Load logged-in user (best-effort) ---
  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      setUserLoading(true);
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include', // if you use cookies
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          if (!ignore) setUser(null);
          return;
        }

        const me = await res.json();
        if (ignore) return;

        // Normalize possible shapes
        const name = me?.name || me?.fullName || '';
        const email = me?.email || '';
        const addr = me?.shippingAddress || me?.address || null;

        setUser(me);

        // Autofill email/name fields for checkout
        setGuestName((prev) => prev || name);
        setGuestEmail((prev) => prev || email);

        // Autofill shipping fields if available
        setShipping((prev) => ({
          ...prev,
          fullName: prev.fullName || name,
          email: prev.email || email,
          phone: prev.phone || (addr?.phone || ''),
          address1: prev.address1 || (addr?.address1 || addr?.line1 || ''),
          address2: prev.address2 || (addr?.address2 || addr?.line2 || ''),
          city: prev.city || (addr?.city || ''),
          postalCode: prev.postalCode || (addr?.postalCode || addr?.zip || ''),
          region: prev.region || (addr?.region || addr?.state || ''),
          country: prev.country || (addr?.country || 'Switzerland'),
        }));
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setUserLoading(false);
      }
    }

    loadUser();
    return () => {
      ignore = true;
    };
  }, []);

  // Keep shipping email/name synced with guest inputs
  useEffect(() => {
    setShipping((prev) => ({
      ...prev,
      fullName: guestName || prev.fullName,
      email: guestEmail || prev.email,
    }));
  }, [guestName, guestEmail]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
  };

  const validateCheckout = () => {
    const email = (guestEmail || shipping.email || '').trim();
    const name = (guestName || shipping.fullName || '').trim();

    if (!email || !email.includes('@')) {
      setCheckoutError('Please enter a valid email for checkout.');
      return false;
    }
    if (!name) {
      setCheckoutError('Please enter your name for checkout.');
      return false;
    }

    // Address required
    if (!shipping.address1.trim()) {
      setCheckoutError('Please enter your street address.');
      return false;
    }
    if (!shipping.city.trim()) {
      setCheckoutError('Please enter your city.');
      return false;
    }
    if (!shipping.postalCode.trim()) {
      setCheckoutError('Please enter your postal code.');
      return false;
    }
    if (!shipping.country.trim()) {
      setCheckoutError('Please enter your country.');
      return false;
    }

    return true;
  };

  const handleCheckout = async () => {
    setCheckoutError('');

    if (cart.length === 0) {
      setCheckoutError('Your cart is empty');
      return;
    }

    if (!validateCheckout()) return;

    const email = (guestEmail || shipping.email || '').trim();
    const name = (guestName || shipping.fullName || '').trim();

    try {
      setCheckoutLoading(true);

      const checkoutData = {
        items: cart.map((item) => ({
          product_id: String(item.product_id),
          quantity: Number(item.quantity),
        })),
        customer_email: email,
        customer_name: name,

        // NEW: shipping address payload
        shipping_address: {
          fullName: name,
          email,
          phone: shipping.phone?.trim() || null,
          address1: shipping.address1.trim(),
          address2: shipping.address2?.trim() || null,
          city: shipping.city.trim(),
          postalCode: shipping.postalCode.trim(),
          region: shipping.region?.trim() || null,
          country: shipping.country.trim(),
        },
      };

      console.log('Sending checkout data:', checkoutData);

      const response = await fetch(`${API_BASE}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.detail || `Checkout failed: ${response.status}`);
      }

      clearCart();

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

  return (
    <div className={styles.container}>
      <h1>Shopping Cart</h1>

      {checkoutError && (
        <div className={styles.errorBanner}>
          {checkoutError}
          <button onClick={() => setCheckoutError('')} className={styles.closeError} type="button">
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
            {cart.map((item) => {
              const imageUrl = getImageUrl(item.mainImageUrl || item.mainImage || item.image);

              return (
                <div key={item.product_id} className={styles.cartItem}>
                  <div className={styles.imageWrapper}>
                    <Image
                      alt={item.name || 'Product image'}
                      src={imageUrl}
                      width={80}
                      height={80}
                      className={styles.itemImage}
                      unoptimized
                    />
                  </div>

                  <div className={styles.itemDetails}>
                    <h2>{item.name || 'Unnamed Product'}</h2>

                    {item.description && (
                      <p className={styles.itemDescription}>
                        {item.description.length > 100
                          ? `${item.description.substring(0, 100)}...`
                          : item.description}
                      </p>
                    )}

                    <p className={styles.itemPrice}>
                      {(item.currencyCode || displayCurrency)} {formatPrice(item.price)}
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
                      Total: {(item.currencyCode || displayCurrency)} {calculateItemTotal(item.price, item.quantity)}
                    </p>
                  </div>

                  <button onClick={() => removeFromCart(item.product_id)} className={styles.removeBtn} type="button">
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

              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total:</span>
                <span>{displayCurrency} {total}</span>
              </div>

              {/* Guest details */}
              <div className={styles.guestCard}>
                <h3 className={styles.guestTitle}>
                  {userLoading ? 'Checking account…' : user ? 'Your details (from account)' : 'Guest details'}
                </h3>

                <label className={styles.fieldLabel}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />

                <label className={styles.fieldLabel}>Name</label>
                <input
                  className={styles.input}
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>

              {/* Shipping address */}
              <div className={styles.guestCard}>
                <h3 className={styles.guestTitle}>Shipping address</h3>

                <label className={styles.fieldLabel}>Phone (optional)</label>
                <input
                  className={styles.input}
                  type="tel"
                  name="phone"
                  value={shipping.phone}
                  onChange={handleShippingChange}
                  placeholder="+41 ..."
                  autoComplete="tel"
                />

                <label className={styles.fieldLabel}>Address line 1 *</label>
                <input
                  className={styles.input}
                  type="text"
                  name="address1"
                  value={shipping.address1}
                  onChange={handleShippingChange}
                  placeholder="Street and house number"
                  autoComplete="address-line1"
                />

                <label className={styles.fieldLabel}>Address line 2 (optional)</label>
                <input
                  className={styles.input}
                  type="text"
                  name="address2"
                  value={shipping.address2}
                  onChange={handleShippingChange}
                  placeholder="Apartment, floor, etc."
                  autoComplete="address-line2"
                />

                <label className={styles.fieldLabel}>City *</label>
                <input
                  className={styles.input}
                  type="text"
                  name="city"
                  value={shipping.city}
                  onChange={handleShippingChange}
                  placeholder="City"
                  autoComplete="address-level2"
                />

                <label className={styles.fieldLabel}>Postal code *</label>
                <input
                  className={styles.input}
                  type="text"
                  name="postalCode"
                  value={shipping.postalCode}
                  onChange={handleShippingChange}
                  placeholder="ZIP / Postal code"
                  autoComplete="postal-code"
                />

                <label className={styles.fieldLabel}>Region/State (optional)</label>
                <input
                  className={styles.input}
                  type="text"
                  name="region"
                  value={shipping.region}
                  onChange={handleShippingChange}
                  placeholder="Region / State"
                  autoComplete="address-level1"
                />

                <label className={styles.fieldLabel}>Country *</label>
                <input
                  className={styles.input}
                  type="text"
                  name="country"
                  value={shipping.country}
                  onChange={handleShippingChange}
                  placeholder="Country"
                  autoComplete="country-name"
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

              <button onClick={clearCart} className={styles.clearCartBtn} type="button">
                Clear Cart
              </button>

              <Link href="/products" className={styles.continueShopping}>
                Continue Shopping
              </Link>

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
