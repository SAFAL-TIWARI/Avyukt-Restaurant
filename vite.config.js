import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: 'index.html',
                about: 'about.html',
                menu: 'menu.html',
                contact: 'contact.html',
                gallery: 'gallery.html',
            },
        },
    },
});
