import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';

const AddToCartButton = ({ item, size = 'large' }) => {
  const { cartItems, addToCart, removeFromCart } = useCart();
  const buttonRef = useRef(null);
  
  const cartItem = cartItems.find(i => i.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    const rect = buttonRef.current.getBoundingClientRect();
    addToCart(item, rect);
  };

  const handleRemove = () => {
    removeFromCart(item.id);
  };

  const isSmall = size === 'small';

  return (
    <div className={`relative ${isSmall ? 'w-24 h-8' : 'w-full h-12'}`} ref={buttonRef}>
      <AnimatePresence mode="wait">
        {quantity === 0 ? (
          <motion.button
            key="add-btn"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={handleAdd}
            className={`w-full h-full bg-white dark:bg-zinc-100 text-secondary font-bold rounded-lg shadow border border-secondary/10 hover:shadow-md transition-all duration-300 ${isSmall ? 'text-sm' : 'text-lg'}`}
          >
            ADD
          </motion.button>
        ) : (
          <motion.div
            key="quantity-btn"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`w-full h-full bg-white dark:bg-zinc-100 flex items-center justify-between rounded-lg shadow border border-secondary/10 ${isSmall ? 'px-2' : 'px-4'}`}
          >
            <button 
              onClick={handleRemove}
              className="p-1 text-secondary hover:bg-secondary/10 rounded-md transition-colors"
            >
              <Minus size={isSmall ? 14 : 20} strokeWidth={3} />
            </button>
            <span className={`text-secondary font-bold text-center min-w-[12px] ${isSmall ? 'text-sm' : 'text-xl'}`}>
              {quantity}
            </span>
            <button 
              onClick={handleAdd}
              className="p-1 text-secondary hover:bg-secondary/10 rounded-md transition-colors"
            >
              <Plus size={isSmall ? 14 : 20} strokeWidth={3} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddToCartButton;
