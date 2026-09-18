import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If navigating to a specific hash on the page, smoothly scroll to that anchor
    if (hash) {
      const id = hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Force instant top scroll by temporarily disabling smooth scroll on <html>
    const resetScroll = () => {
      const html = document.documentElement;
      const originalScrollBehavior = html ? html.style.scrollBehavior : '';
      if (html) html.style.scrollBehavior = 'auto';

      window.scrollTo(0, 0);
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const root = document.getElementById('root');
      if (root) root.scrollTop = 0;

      if (html) html.style.scrollBehavior = originalScrollBehavior;
    };

    // Trigger reset at key transition phases:
    // 0ms (immediate), next animation frame, 50ms, 150ms, 300ms (exit finish), 450ms (mount finish)
    resetScroll();
    const rafId = requestAnimationFrame(resetScroll);
    const timeouts = [10, 50, 150, 300, 450].map(delay => setTimeout(resetScroll, delay));

    return () => {
      cancelAnimationFrame(rafId);
      timeouts.forEach(clearTimeout);
    };
  }, [pathname, search, hash]);

  return null;
};

export default ScrollToTop;
