import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone || 
                         document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('avyukt_pwa_dismissed');
    if (isDismissed) return;

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt banner after a short delay so user has seen the landing page
      setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('avyukt_pwa_dismissed', 'true');
  };

  if (isInstalled || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#FFFDD0] dark:bg-zinc-900 border border-amber-950/20 dark:border-white/10 rounded-3xl p-4 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-3.5">
          {/* App Icon */}
          <div className="w-13 h-13 rounded-2xl overflow-hidden shadow-md shrink-0 border border-primary/20 bg-primary/10 flex items-center justify-center">
            <img 
              src="/icons/icon-192x192.png" 
              alt="Avyukt Restaurant" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/favicon.png';
              }}
            />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-title dark:text-white font-title truncate">
                Install Avyukt App
              </h4>
              <span className="px-1.5 py-0.2 bg-primary/10 text-primary text-[9px] font-extrabold uppercase rounded-full">
                PWA
              </span>
            </div>
            <p className="text-xs text-text/70 dark:text-white/60 line-clamp-1 mt-0.5 font-medium">
              Faster ordering & offline table tracking
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="p-1.5 text-text/40 hover:text-text dark:text-white/40 dark:hover:text-white rounded-full transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-3.5 flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer active:scale-98"
          >
            <Download size={15} />
            <span>Install App</span>
          </button>
          <button
            onClick={handleDismiss}
            className="py-2.5 px-3.5 rounded-xl text-xs font-semibold text-text/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Later
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
