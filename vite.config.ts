import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/3Deditor/' : '/',
  plugins: [vue()],
  test: {
    environment: 'node',
    globals: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/@tweenjs')) return 'animation';
          if (id.includes('/src/editor/')) return 'editor-core';
          if (id.includes('/src/engine/')) return 'engine';
          return undefined;
        }
      }
    }
  }
}));
