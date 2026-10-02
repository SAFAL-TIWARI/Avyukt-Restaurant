import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Info, 
  UtensilsCrossed, 
  Image, 
  PhoneCall, 
  ChefHat, 
  ShieldCheck, 
  HelpCircle,
  MessageSquare,
  ShoppingBag, 
  ClipboardList, 
  Bell, 
  User 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Helper to determine the dynamic first slot item based on current page
// Switches for: Home, About, Menu, Gallery, Contact, Admin (if admin), Recipe, Help, Feedback
const getMainSlotItem = (pathname, isAdmin) => {
  if (pathname === '/about') {
    return { id: 'about', name: 'About', path: '/about', icon: Info };
  }
  if (pathname === '/menu') {
    return { id: 'menu', name: 'Menu', path: '/menu', icon: UtensilsCrossed };
  }
  if (pathname === '/gallery') {
    return { id: 'gallery', name: 'Gallery', path: '/gallery', icon: Image };
  }
  if (pathname === '/contact') {
    return { id: 'contact', name: 'Contact', path: '/contact', icon: PhoneCall };
  }
  if (pathname === '/recipes') {
    return { id: 'recipes', name: 'Recipe', path: '/recipes', icon: ChefHat };
  }
  if (pathname === '/help') {
    return { id: 'help', name: 'Help', path: '/help', icon: HelpCircle };
  }
  if (pathname === '/feedback') {
    return { id: 'feedback', name: 'Feedback', path: '/feedback', icon: MessageSquare };
  }
  if (pathname.startsWith('/admin') && isAdmin) {
    return { id: 'admin', name: 'Admin', path: '/admin', icon: ShieldCheck };
  }
  // Default to Home for '/', or when on any other pages (Cart, Orders, Alerts, Profile, etc.)
  return { id: 'home', name: 'Home', path: '/', icon: Home };
};

const MobileBottomNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const { isAdmin } = useAuth();

  // Determine active index based on route
  const getActiveIndex = (pathname) => {
    if (pathname === '/cart') return 1;
    if (pathname.startsWith('/orders') || pathname.startsWith('/track-order')) return 2;
    if (pathname === '/notifications') return 3;
    if (pathname === '/profile' || pathname === '/login' || pathname === '/signup' || pathname === '/register') return 4;
    return 0; // Default to main slot for '/', '/about', '/menu', '/gallery', '/contact', '/recipes', '/admin', '/help', '/feedback'
  };

  const activeIndex = getActiveIndex(location.pathname);
  const mainSlotItem = getMainSlotItem(location.pathname, isAdmin);

  const navItems = [
    mainSlotItem,
    { id: 'cart', name: 'Cart', path: '/cart', icon: ShoppingBag },
    { id: 'orders', name: 'Orders', path: '/orders', icon: ClipboardList },
    { id: 'notifications', name: 'Alerts', path: '/notifications', icon: Bell },
    { id: 'profile', name: 'Profile', path: '/profile', icon: User },
  ];

  const activeItem = navItems[activeIndex];
  const ActiveIcon = activeItem.icon;

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden pb-[env(safe-area-inset-bottom,0px)] bg-gradient-to-r from-[#6b0000] via-primary to-[#5a0000] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 shadow-[0_-8px_25px_rgba(0,0,0,0.18)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.6)] select-none border-t border-white/10 dark:border-white/5"
    >
      <div className="relative w-full max-w-lg mx-auto">
        {/* Smooth Moving Notch & Elevated Active Button Container */}
        <motion.div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20"
          animate={{ left: `${activeIndex * 20 + 10}%` }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        >
          {/* Curved Notch Cutout that dips into the navbar */}
          <div className="absolute -top-[1px] w-[88px] h-[34px] overflow-hidden pointer-events-none">
            <svg 
              viewBox="0 0 88 34" 
              className="w-full h-full fill-[#FFFDD0] dark:fill-zinc-950 transition-colors duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
            >
              <path d="M 0 0 C 18 0, 24 30, 44 30 C 64 30, 70 0, 88 0 Z" />
            </svg>
          </div>

          {/* Elevated Circular Action Button (like the '+' button in reference layout) */}
          <Link
            to={activeItem.path}
            id={activeItem.id === 'cart' ? 'mobile-cart-target' : undefined}
            className="relative -top-6 w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-primary via-[#950000] to-amber-600 dark:from-primary dark:via-[#700000] dark:to-amber-500 shadow-[0_8px_22px_rgba(128,0,0,0.5)] dark:shadow-[0_8px_22px_rgba(0,0,0,0.7)] ring-4 ring-[#FFFDD0] dark:ring-zinc-950 flex items-center justify-center text-white pointer-events-auto transition-transform active:scale-95"
            aria-label={`Active page: ${activeItem.name}`}
          >
            <motion.div
              key={activeItem.id}
              initial={{ scale: 0.5, y: 8, rotate: -15 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className="relative flex items-center justify-center text-white"
            >
              <ActiveIcon size={24} strokeWidth={2.4} />

              {/* Badge for Cart in active state */}
              {activeItem.id === 'cart' && totalItems > 0 && (
                <span className="absolute -top-2.5 -right-2.5 bg-amber-400 text-black text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-primary shadow-md">
                  {totalItems}
                </span>
              )}
            </motion.div>
          </Link>
        </motion.div>

        {/* 5 Bottom Nav Item Slots */}
        <div className="relative w-full grid grid-cols-5 h-[64px] items-center">
          {navItems.map((item, index) => {
            const isActive = activeIndex === index;
            const ItemIcon = item.icon;
            const isCart = item.id === 'cart';

            return (
              <Link
                key={item.id}
                to={item.path}
                id={isCart ? 'mobile-cart-slot-target' : undefined}
                className="flex flex-col items-center justify-center h-full relative cursor-pointer group active:opacity-80"
                aria-label={item.name}
              >
                {isActive ? (
                  // Active item: icon is elevated above, show highlighted text below
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center mt-5"
                  >
                    <span className="text-[10px] font-bold text-amber-300 dark:text-amber-400 tracking-wider uppercase">
                      {item.name}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5 shadow-sm" />
                  </motion.div>
                ) : (
                  // Inactive item: normal icon + label
                  <div className="flex flex-col items-center justify-center transition-all duration-200 group-hover:scale-105">
                    <div className="relative text-white/75 group-hover:text-white transition-colors">
                      <ItemIcon size={21} strokeWidth={1.8} />

                      {/* Badge for Cart in inactive state */}
                      {isCart && totalItems > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-amber-400 text-black text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-1 ring-primary shadow-sm">
                          {totalItems}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-medium text-white/75 group-hover:text-white mt-1 tracking-wider uppercase transition-colors">
                      {item.name}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
