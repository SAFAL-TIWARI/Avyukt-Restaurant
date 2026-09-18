import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import AboutPage from './pages/AboutPage';
import MenuPage from './pages/MenuPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import RecipesPage from './pages/RecipesPage';
import DashboardPage from './pages/Admin_Dashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import NotificationsPage from './pages/NotificationsPage';
import HelpPage from './pages/HelpPage';
import FeedbackPage from './pages/FeedbackPage';

// Protected Route Guard
const ProtectedRoute = ({ children, message = "Please sign in to access this page." }) => {
  const { isLoggedIn, loading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const alertedRef = React.useRef(false);

  useEffect(() => {
    if (!loading && !isLoggedIn && !alertedRef.current) {
      alertedRef.current = true;
      toast.warning(message, 'Sign In Required');
    }
  }, [isLoggedIn, loading, message, toast]);

  if (loading) return null;

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const location = useLocation();

  return (
    <ThemeProvider>
      <ToastProvider>
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
                    
                    {/* Admin Portal Routes */}
                    <Route path="/admin" element={<DashboardPage />} />
                    <Route path="/admin" element={<DashboardPage />} />

                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/register" element={<SignupPage />} />
                    <Route path="/help" element={<HelpPage />} />

                    {/* Protected User Pages */}
                    <Route 
                      path="/cart" 
                      element={
                        <ProtectedRoute message="Please sign in to view and checkout your cart.">
                          <CartPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute message="Please sign in to view your profile settings.">
                          <ProfilePage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/orders" 
                      element={
                        <ProtectedRoute message="Please sign in to view your live orders.">
                          <OrdersPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/notifications" 
                      element={
                        <ProtectedRoute message="Please sign in to view your notifications.">
                          <NotificationsPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/feedback" 
                      element={
                        <ProtectedRoute message="Please sign in to share your valuable dining feedback.">
                          <FeedbackPage />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </AnimatePresence>
              </main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
