import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const CartProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('avyukt_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          return parsed.map(item => ({
            ...item,
            name: item.name || item.title || 'Delicious Dish',
            title: item.title || item.name || 'Delicious Dish',
            desc: item.desc || item.description || '',
          }));
        }
      } catch (e) {
        console.error('Failed to parse cart from localStorage', e);
      }
    }
    return [];
  });
  const [flyingItem, setFlyingItem] = useState(null);

  // Save cart to localStorage on changes
  useEffect(() => {
    localStorage.setItem('avyukt_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item, sourceRect) => {
    // REQUIRE USER TO BE LOGGED IN BEFORE ADDING ITEMS
    if (!isLoggedIn) {
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
  };

  const triggerFlyAnimation = (item, sourceRect) => {
    const targetElement = document.getElementById('profile-trigger') || document.getElementById('profile-trigger-mobile');
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
