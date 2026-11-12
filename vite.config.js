import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  /* relative paths — GitHub Pages / kisi bhi subfolder pe kaam karta hai */
  base: './',
});
