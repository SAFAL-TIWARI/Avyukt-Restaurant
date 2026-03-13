import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6"
        >
          <ShoppingBag size={48} />
        </motion.div>
        <h2 className="text-3xl font-title font-bold text-title dark:text-white mb-4">Your cart is empty</h2>
        <p className="text-text/60 dark:text-white/60 max-w-md mb-8">
          Looks like you haven't added anything to your cart yet. Explore our delicious menu and find something you love!
        </p>
        <Link
          to="/menu"
          className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 flex items-center gap-2 group"
        >
          Browse Menu
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items List */}
          <div className="lg:w-2/3">
            <h1 className="text-4xl font-title font-bold text-title dark:text-white mb-8">Shopping Cart</h1>
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              <AnimatePresence mode='popLayout'>
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    variants={itemVariants}
                    exit={{ x: -100, opacity: 0 }}
                    className="bg-white dark:bg-zinc-900/50 backdrop-blur-md p-4 rounded-3xl border border-black/5 dark:border-white/10 flex items-center gap-4 shadow-sm"
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-zinc-800">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-title dark:text-white">{item.name}</h3>
                      <p className="text-sm text-text/60 dark:text-white/60 mb-2 line-clamp-1">{item.description}</p>
                      <p className="text-primary font-bold">₹{item.price}</p>
                    </div>

                    <div className="flex flex-col items-end gap-3 pr-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-colors text-text dark:text-white"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-title dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-colors text-text dark:text-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="sticky top-32">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-xl"
              >
                <h2 className="text-2xl font-title font-bold text-title dark:text-white mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-text/60 dark:text-white/60">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-text/60 dark:text-white/60">
                    <span>Delivery Fee</span>
                    <span>₹40</span>
                  </div>
                  <div className="flex justify-between text-text/60 dark:text-white/60">
                    <span>Taxes & Charges</span>
                    <span>₹{Math.round(totalPrice * 0.05)}</span>
                  </div>
                  <div className="h-px bg-black/5 dark:bg-white/10 my-4" />
                  <div className="flex justify-between text-xl font-bold text-title dark:text-white">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{totalPrice + 40 + Math.round(totalPrice * 0.05)}</span>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="relative mb-8">
                  <input
                    type="text"
                    placeholder="Apply Coupon Code"
                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-2xl py-4 px-6 outline-none focus:border-primary transition-colors dark:text-white"
                  />
                  <button className="absolute right-2 top-2 bottom-2 bg-primary/10 text-primary px-4 rounded-xl font-bold text-sm hover:bg-primary/20 transition-colors">
                    Apply
                  </button>
                </div>

                <button className="w-full bg-primary text-white py-5 rounded-[2rem] font-bold text-lg hover:bg-primary-dark transition-all shadow-xl shadow-primary/25 mb-4 active:scale-[0.98]">
                  Proceed to Checkout
                </button>
                
                <p className="text-[10px] text-center text-text/40 dark:text-white/40">
                  By proceeding, you agree to our Terms of Service & Privacy Policy
                </p>
              </motion.div>

              {/* Benefits */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-green-500/5 p-4 rounded-2xl border border-green-500/10 text-center">
                  <p className="text-green-600 dark:text-green-400 font-bold text-xs">Safe Delivery</p>
                </div>
                <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 text-center">
                  <p className="text-amber-600 dark:text-amber-400 font-bold text-xs">Fresh Food</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
