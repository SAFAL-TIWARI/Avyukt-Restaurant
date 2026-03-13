import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import AboutPage from './pages/AboutPage';
import MenuPage from './pages/MenuPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import RecipesPage from './pages/RecipesPage';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import NotificationsPage from './pages/NotificationsPage';
import HelpPage from './pages/HelpPage';
import FeedbackPage from './pages/FeedbackPage';

function App() {
  const location = useLocation();

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-body dark:bg-zinc-950 transition-colors duration-300">
            <ScrollToTop />
            <Header />
            <main>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/recipes" element={<RecipesPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/feedback" element={<FeedbackPage />} />
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
