import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Sun, Moon, User, ShoppingBag, 
  Bell, HelpCircle, MessageSquare, LogOut, 
  LogIn, ClipboardList, ChevronDown, Calendar 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { totalItems, totalPrice } = useCart();
  const { user, isLoggedIn, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    const initCheck = setTimeout(handleScroll, 100);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Close profile menu when clicking outside
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(initCheck);
    };
  }, []);

  const getTextColorClass = () => {
    if (isDarkMode) return 'text-white';
    if (isScrolled) return 'text-title';
    return isHome ? 'text-white' : 'text-title';
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Menu', path: '/menu' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Contact', path: '/contact' },
  ];

  const profileMenuItems = [
    { name: 'Profile', icon: <User size={18} />, path: '/profile' },
    { name: 'Book Table', icon: <Calendar size={18} />, path: '/#reservation' },
    { name: 'Orders', icon: <ClipboardList size={18} />, path: '/orders' },
    { name: 'Cart', icon: <ShoppingBag size={18} />, path: '/cart' },
    { name: 'Notifications', icon: <Bell size={18} />, path: '/notifications' },
    { name: 'Help', icon: <HelpCircle size={18} />, path: '/help' },
    { name: 'Feedback', icon: <MessageSquare size={18} />, path: '/feedback' },
  ];

  const textColorClass = getTextColorClass();

  const ProfileDropdown = ({ isMobile = false }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className={`absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden z-[60] ${
        isMobile ? 'top-full mr-2' : ''
      }`}
    >
      {/* User Info - Only show if logged in */}
      {isLoggedIn && user && (
        <div className="p-4 border-b border-black/5 dark:border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </div>
          <div>
            <p className="font-bold text-title dark:text-white leading-none">{user.name}</p>
            <p className="text-xs text-text/60 dark:text-white/60 mt-1">{user.email}</p>
          </div>
        </div>
      )}
      
      <div className="py-2">
        {profileMenuItems.map((item) => {
          const isCart = item.name === 'Cart';
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => {
                setIsProfileOpen(false);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-primary/5 ${
                item.highlight ? 'text-primary font-bold' : 'text-text dark:text-gray-300'
              }`}
            >
              <div className="relative">
                {item.icon}
                {isCart && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {totalItems}
                  </span>
                )}
              </div>
              <div className="flex-grow flex justify-between items-center">
                <span>{item.name}</span>
                {isCart && totalItems > 0 && (
                  <span className="text-xs font-bold text-primary">₹{totalPrice}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="p-2 border-t border-black/5 dark:border-white/10">
        {isLoggedIn ? (
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            Log Out
          </button>
        ) : (
          <Link
            to="/login"
            onClick={() => {
              setIsProfileOpen(false);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-xl transition-colors"
          >
            <LogIn size={18} />
            Log In / Sign Up
          </Link>
        )}
      </div>
    </motion.div>
  );

  return (
    <header 
      className={`fixed top-0 left-0 right-0 mx-auto z-50 transition-all duration-500 ease-in-out ${
        isScrolled 
          ? 'bg-body/50 dark:bg-zinc-900/50 backdrop-blur-lg shadow-xl py-3 mt-4 w-[95%] lg:w-[90%] max-w-5xl rounded-full' 
          : 'bg-transparent py-6 w-full rounded-none border-transparent'
      }`}
    >
      <nav className={`${isScrolled ? 'px-6 lg:px-10' : 'container'} flex items-center justify-between transition-all duration-500`}>
        {/* Logo */}
        <Link 
          to="/" 
          className={`text-2xl font-title font-bold transition-colors ${textColorClass}`}
        >
          Avyukt
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          <ul className="flex gap-8">
            {navLinks.map((link) => (
              <li key={link.name}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `font-medium transition-colors hover:text-primary ${
                      isActive 
                        ? 'text-primary' 
                        : (isDarkMode ? 'text-gray-300' : textColorClass)
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              </li>
            ))}
          </ul>
          
          <div className="flex items-center gap-4">
            {/* Profile Menu Desktop */}
            <div className="relative" ref={profileRef}>
              <button 
                id="profile-trigger"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`relative flex items-center gap-2 p-1.5 rounded-full transition-all ${
                  isProfileOpen ? 'bg-primary/20 text-primary' : textColorClass
                }`}
              >
                <div className={`p-1.5 rounded-full border-2 transition-colors ${
                  isProfileOpen ? 'border-primary' : 'border-transparent'
                }`}>
                  <User size={20} />
                </div>
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0 right-6 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md z-10"
                  >
                    {totalItems}
                  </motion.span>
                )}
                <ChevronDown size={14} className={`transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isProfileOpen && <ProfileDropdown />}
              </AnimatePresence>
            </div>
            
            {/* Theme Toggle Desktop */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${
                isScrolled || isDarkMode || !isHome
                  ? 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-title dark:text-white' 
                  : 'hover:bg-white/10 text-white'
              }`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Header Items */}
        <div className="flex lg:hidden items-center gap-3">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`transition-colors ${textColorClass}`}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          {/* Profile Menu Mobile */}
          <div className="relative" ref={profileRef}>
            <button 
              id="profile-trigger-mobile"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`relative p-2 rounded-full transition-colors ${textColorClass} ${isProfileOpen ? 'bg-primary/20 text-primary' : ''}`}
            >
              <User size={24} />
              {totalItems > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                >
                  {totalItems}
                </motion.span>
              )}
            </button>
            <AnimatePresence>
              {isProfileOpen && <ProfileDropdown isMobile={true} />}
            </AnimatePresence>
          </div>
          
          {/* Theme Toggle Mobile */}
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${textColorClass}`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav Links Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className={`absolute top-[calc(100%+0.75rem)] left-0 right-0 mx-auto bg-body dark:bg-zinc-900 shadow-2xl transition-all duration-500 overflow-hidden lg:hidden ${
              isScrolled 
                ? 'w-[95%] rounded-[2.5rem] border border-black/5 dark:border-white/10' 
                : 'w-full rounded-none border-t border-black/5 dark:border-white/5'
            }`}
          >
            <ul className="flex flex-col items-center py-8 gap-6 ">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <NavLink
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `text-lg font-medium transition-colors ${
                        isActive ? 'text-primary' : 'text-text dark:text-gray-300'
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
