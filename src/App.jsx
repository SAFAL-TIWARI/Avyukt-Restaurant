import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Eagerly loaded critical landing page
import Home from './pages/Home';

// Dynamically split routes (Lazy loaded chunks)
const AboutPage = lazy(() => import('./pages/AboutPage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const RecipesPage = lazy(() => import('./pages/RecipesPage'));
const DashboardPage = lazy(() => import('./pages/Admin_Dashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));

import { PageSkeleton } from './components/common/Skeleton';

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
                <Suspense fallback={<PageSkeleton />}>
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
                </Suspense>
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
