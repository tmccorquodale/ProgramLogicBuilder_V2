import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'Public',
  // Ensure assets are loaded relative to the root for GitHub Pages
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
