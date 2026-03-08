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
    country: 'Россия',
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
    return 'RUB';
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
          country: prev.country || (addr?.country || 'Россия'),
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
      setCheckoutError('Введите корректный email для оформления заказа.');
      return false;
    }
    if (!name) {
      setCheckoutError('Введите имя для оформления заказа.');
      return false;
    }

    // Address required
    if (!shipping.address1.trim()) {
      setCheckoutError('Введите адрес доставки.');
      return false;
    }
    if (!shipping.city.trim()) {
      setCheckoutError('Введите город.');
      return false;
    }
    if (!shipping.postalCode.trim()) {
      setCheckoutError('Введите почтовый индекс.');
      return false;
    }
    if (!shipping.country.trim()) {
      setCheckoutError('Введите страну.');
      return false;
    }

    return true;
  };

  const handleCheckout = async () => {
    setCheckoutError('');

    if (cart.length === 0) {
      setCheckoutError('Корзина пуста');
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

      const response = await fetch(`${API_BASE}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.detail || `Не удалось оформить заказ: ${response.status}`);
      }

      clearCart();

      if (responseData.id) {
        window.location.href = `/orders/${responseData.id}`;
      } else {
        window.location.href = `/orders/success`;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error.message || 'Не удалось оформить заказ. Попробуйте ещё раз.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Корзина</h1>

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
          <h2>Ваша корзина пуста</h2>
          <p>Добавьте товары, чтобы оформить заказ.</p>
          <Link href="/products" className={styles.continueShopping}>
            Перейти к покупкам
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
                      alt={item.name || 'Изображение товара'}
                      src={imageUrl}
                      width={80}
                      height={80}
                      className={styles.itemImage}
                      unoptimized
                    />
                  </div>

                  <div className={styles.itemDetails}>
                    <h2>{item.name || 'Товар без названия'}</h2>

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
                      Итого: {(item.currencyCode || displayCurrency)} {calculateItemTotal(item.price, item.quantity)}
                    </p>
                  </div>

                  <button onClick={() => removeFromCart(item.product_id)} className={styles.removeBtn} type="button">
                    Удалить
                  </button>
                </div>
              );
            })}
          </div>

          <div className={styles.cartSummary}>
            <div className={styles.summaryCard}>
              <h2>Сводка заказа</h2>

              <div className={styles.summaryRow}>
                <span>Товары ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                <span>{displayCurrency} {formatPrice(subtotal)}</span>
              </div>

              <div className={styles.summaryRow}>
                <span>Доставка:</span>
                <span className={styles.freeShipping}>БЕСПЛАТНО</span>
              </div>

              <div className={styles.summaryRow}>
                <span>Налог (10%):</span>
                <span>{displayCurrency} {tax}</span>
              </div>

              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Итого:</span>
                <span>{displayCurrency} {total}</span>
              </div>

              {/* Guest details */}
              <div className={styles.guestCard}>
                <h3 className={styles.guestTitle}>
                  {userLoading ? 'Проверяем аккаунт…' : user ? 'Ваши данные из аккаунта' : 'Данные покупателя'}
                </h3>

                <label className={styles.fieldLabel}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="example@mail.ru"
                  autoComplete="email"
                />

                <label className={styles.fieldLabel}>Имя</label>
                <input
                  className={styles.input}
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Ваше имя"
                  autoComplete="name"
                />
              </div>

              {/* Shipping address */}
              <div className={styles.guestCard}>
                <h3 className={styles.guestTitle}>Адрес доставки</h3>

                <label className={styles.fieldLabel}>Телефон (необязательно)</label>
                <input
                  className={styles.input}
                  type="tel"
                  name="phone"
                  value={shipping.phone}
                  onChange={handleShippingChange}
                  placeholder="+41 ..."
                  autoComplete="tel"
                />

                <label className={styles.fieldLabel}>Адрес, строка 1 *</label>
                <input
                  className={styles.input}
                  type="text"
                  name="address1"
                  value={shipping.address1}
                  onChange={handleShippingChange}
                  placeholder="Улица и номер дома"
                  autoComplete="address-line1"
                />

                <label className={styles.fieldLabel}>Адрес, строка 2 (необязательно)</label>
                <input
                  className={styles.input}
                  type="text"
                  name="address2"
                  value={shipping.address2}
                  onChange={handleShippingChange}
                  placeholder="Квартира, этаж и т.д."
                  autoComplete="address-line2"
                />

                <label className={styles.fieldLabel}>Город *</label>
                <input
                  className={styles.input}
                  type="text"
                  name="city"
                  value={shipping.city}
                  onChange={handleShippingChange}
                  placeholder="Город"
                  autoComplete="address-level2"
                />

                <label className={styles.fieldLabel}>Почтовый индекс *</label>
                <input
                  className={styles.input}
                  type="text"
                  name="postalCode"
                  value={shipping.postalCode}
                  onChange={handleShippingChange}
                  placeholder="Индекс"
                  autoComplete="postal-code"
                />

                <label className={styles.fieldLabel}>Регион / область (необязательно)</label>
                <input
                  className={styles.input}
                  type="text"
                  name="region"
                  value={shipping.region}
                  onChange={handleShippingChange}
                  placeholder="Регион / область"
                  autoComplete="address-level1"
                />

                <label className={styles.fieldLabel}>Страна *</label>
                <input
                  className={styles.input}
                  type="text"
                  name="country"
                  value={shipping.country}
                  onChange={handleShippingChange}
                  placeholder="Страна"
                  autoComplete="country-name"
                />
              </div>

              <button
                onClick={handleCheckout}
                className={styles.checkoutBtn}
                disabled={checkoutLoading || cart.length === 0}
                type="button"
              >
                {checkoutLoading ? 'Оформляем...' : 'Оформить заказ'}
              </button>

              <button onClick={clearCart} className={styles.clearCartBtn} type="button">
                Очистить корзину
              </button>

              <Link href="/products" className={styles.continueShopping}>
                Продолжить покупки
              </Link>

              <div className={styles.paymentMethods}>
                <span>Принимаем:</span>
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
