import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        dir: '../../scripts/nativeapm',
        entryFileNames: 'script.js',
        assetFileNames: 'script.css',
      },
    },
  },
});
