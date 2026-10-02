import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import FlyingItemOverlay from '../components/FlyingItemOverlay';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Helper to determine the user-specific storage key
const getCartStorageKey = (currentUser) => {
  if (!currentUser) return null;
  const identifier = currentUser.uid || currentUser.id || (currentUser.email ? currentUser.email.toLowerCase().trim() : null) || (currentUser.phone ? currentUser.phone.trim() : null);
  return identifier ? `avyukt_cart_${identifier}` : null;
};

// Helper to safely load items from localStorage for a specific user
const loadUserCart = (currentUser) => {
  if (!currentUser) return [];
  const key = getCartStorageKey(currentUser);
  if (!key) return [];

  try {
    const savedCart = localStorage.getItem(key);
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          ...item,
          name: item.name || item.title || 'Delicious Dish',
          title: item.title || item.name || 'Delicious Dish',
          desc: item.desc || item.description || '',
        }));
      }
    }
  } catch (e) {
    console.error('Failed to parse user cart from localStorage', e);
  }
  return [];
};

export const CartProvider = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();

  const currentStorageKey = getCartStorageKey(user);
  const activeKeyRef = useRef(currentStorageKey);

  const [cartItems, setCartItems] = useState(() => loadUserCart(user));
  const [flyingItem, setFlyingItem] = useState(null);

  // One-time cleanup of legacy un-scoped cart so it never leaks between accounts
  useEffect(() => {
    try {
      if (localStorage.getItem('avyukt_cart')) {
        localStorage.removeItem('avyukt_cart');
      }
    } catch {}
  }, []);

  // When user changes (login, logout, or account switch)
  useEffect(() => {
    const newKey = getCartStorageKey(user);

    if (activeKeyRef.current !== newKey) {
      activeKeyRef.current = newKey;
      if (newKey && isLoggedIn) {
        // Load the new user's isolated cart
        setCartItems(loadUserCart(user));
      } else {
        // User logged out: clear cart immediately from state
        setCartItems([]);
      }
    }
  }, [user, isLoggedIn]);

  // Save cart to the currently authenticated user's isolated storage key
  useEffect(() => {
    if (currentStorageKey && isLoggedIn && user && activeKeyRef.current === currentStorageKey) {
      try {
        localStorage.setItem(currentStorageKey, JSON.stringify(cartItems));
      } catch (e) {
        console.error('Failed to save cart to localStorage', e);
      }
    }
  }, [cartItems, currentStorageKey, isLoggedIn, user]);

  const addToCart = (item, sourceRect) => {
    // REQUIRE USER TO BE LOGGED IN BEFORE ADDING ITEMS
    if (!isLoggedIn || !user) {
      toast.warning('Please sign in or create an account to add items to your cart.', 'Sign In Required');
      return false;
    }

    const normalizedItem = {
      ...item,
      name: item.name || item.title || 'Delicious Dish',
      title: item.title || item.name || 'Delicious Dish',
      desc: item.desc || item.description || '',
    };

    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === normalizedItem.id);
      if (existingItem) {
        return prevItems.map(i => 
          i.id === normalizedItem.id ? { ...i, ...normalizedItem, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevItems, { ...normalizedItem, quantity: 1 }];
    });

    toast.success(`Added ${normalizedItem.name} to your cart!`, 'Item Added');

    if (sourceRect) {
      triggerFlyAnimation(normalizedItem, sourceRect);
    }
    return true;
  };

  const removeFromCart = (itemId) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevItems.map(i => 
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prevItems.filter(i => i.id !== itemId);
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(prevItems => 
      prevItems.map(i => i.id === itemId ? { ...i, quantity } : i)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    if (currentStorageKey) {
      try {
        localStorage.removeItem(currentStorageKey);
      } catch {}
    }
  };

  const triggerFlyAnimation = (item, sourceRect) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    let targetElement = null;
    if (isMobile) {
      targetElement = document.getElementById('mobile-cart-target') || 
                      document.getElementById('mobile-cart-slot-target');
    }

    if (!targetElement) {
      targetElement = document.getElementById('profile-trigger') || 
                      document.getElementById('profile-trigger-mobile');
    }

    if (!targetElement) return;

    const targetRect = targetElement.getBoundingClientRect();
    
    setFlyingItem({
      id: Date.now(),
      image: item.image,
      start: {
        x: sourceRect.left + sourceRect.width / 2,
        y: sourceRect.top + sourceRect.height / 2
      },
      end: {
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height / 2
      }
    });

    setTimeout(() => {
      setFlyingItem(null);
    }, 1000);
  };

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => {
    const priceStr = String(item.price);
    const price = parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
    return total + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      totalItems, 
      totalPrice,
      flyingItem
    }}>
      {children}
      <FlyingItemOverlay item={flyingItem} />
    </CartContext.Provider>
  );
};
