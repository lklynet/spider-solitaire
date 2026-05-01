import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@spider/shared-types': fileURLToPath(new URL('./packages/shared-types/src', import.meta.url)),
      '@spider/game-engine': fileURLToPath(new URL('./packages/game-engine/src', import.meta.url))
    }
  }
});
