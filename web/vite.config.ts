import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Root is web/ (see `vite web` in package.json). /api is proxied to the
// Express server in dev so there is no CORS to configure; in production the
// built bundle is served by Express from web/dist on the same origin.
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
