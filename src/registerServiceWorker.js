export const registerServiceWorker = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Avyukt PWA Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.warn('Avyukt PWA Service Worker registration note:', error);
        });
    });
  }
};
