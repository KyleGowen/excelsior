import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { fileURLToPath, URL } from 'node:url';

// Vite dev server proxies API + card image asset requests to the Express
// backend on :8085 so the SPA can run on :5173 during local development.
// The backend default port is 8085 (process.env.PORT || 8085).
const BACKEND = 'http://localhost:8085';
// Development-only server fallback for the fictional host's native nested URLs.
// Production routes/build inputs are unchanged; no fixture is exposed by Express.
const nativeHostFixture: Plugin = {
 name: 'native-host-fixture', apply: 'serve',
 configureServer(server) {
  server.middlewares.use((req, _res, next) => {
   const path = req.url?.split('?')[0];
   if (req.method === 'GET' && req.headers.accept?.includes('text/html') && (path === '/fictional-host' || path?.startsWith('/fictional-host/'))) req.url = '/native-route-harness.html';
   if (req.method === 'GET' && req.headers.accept?.includes('text/html') && (path === '/prepared-host' || path?.startsWith('/prepared-host/'))) req.url = '/native-integration-harness.html';
   next();
  });
 },
};

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    nativeHostFixture,
    mode === 'analyze' &&
      visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Bind 0.0.0.0 so other devices on the LAN can reach the dev SPA.
    // API traffic still proxies to localhost:8085 on this machine.
    host: true,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/health': { target: BACKEND, changeOrigin: true },
      // Card art + UI image assets are served by Express static middleware
      // in local dev (production uses S3/CloudFront via cdnBase).
      '/src/resources': { target: BACKEND, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom')) return 'vendor-react-dom';
          if (id.includes('node_modules/react/')) return 'vendor-react';
          if (id.includes('node_modules/react-router')) return 'vendor-router';
          if (id.includes('node_modules/@tanstack/react-query')) return 'vendor-query';
        },
      },
    },
  },
}));
