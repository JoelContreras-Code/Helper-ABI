import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// Env files (.env.development, ...) live in the repository root.
const ROOT_DIR = resolve(import.meta.dirname, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ROOT_DIR, '');
  const apiTarget = `http://${env.API_HOST ?? '127.0.0.1'}:${env.API_PORT ?? '4000'}`;

  return {
    // Only VITE_* variables are exposed to the browser bundle.
    envDir: ROOT_DIR,
    plugins: [react(), tailwindcss()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      // Same-origin calls to /api are forwarded to the Express API.
      proxy: { '/api': apiTarget },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
