import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'public',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(process.cwd(), 'public/index.html'),
                about: resolve(process.cwd(), 'public/about.html'),
                menu: resolve(process.cwd(), 'public/menu.html'),
                contact: resolve(process.cwd(), 'public/contact.html'),
                gallery: resolve(process.cwd(), 'public/gallery.html'),
            },
        },
    },
});
