'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false); // Add this

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setCart([]);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cart, isInitialized]);

  const addToCart = (product, quantity = 1) => {
    const pid = product?.product_id ?? product?.id;
    if (!pid) {
      console.error("addToCart(): product has no id/product_id", product);
      return;
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    setCart(prev => {
      const existing = prev.find(item => item.product_id === pid);

      if (existing) {
        return prev.map(item =>
          item.product_id === pid
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }

      return [
        ...prev,
        {
          product_id: pid,
          id: product.id || pid, // Keep both for compatibility
          name: product.name,
          quantity: qty,
          price: product.price,
          mainImageUrl: product.mainImageUrl,
          mainImage: product.mainImage,
          image: product.image,
          description: product.description,
          currencyCode: product.currencyCode,
          stock: product.stock
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product_id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
  };

  const getTotalItems = () => {
    // Return 0 on server or before initialization
    if (!isInitialized) return 0;
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal,
      getTotalItems
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};