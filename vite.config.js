import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        notes: resolve(import.meta.dirname, 'notes/index.html'),
        budget: resolve(import.meta.dirname, 'budget/index.html'),
        outils: resolve(import.meta.dirname, 'outils/index.html'),
      },
    },
  },
});
