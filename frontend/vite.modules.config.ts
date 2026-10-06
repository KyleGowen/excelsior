import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
/** Browser ESM only. The host supplies one React/Query runtime; no application bootstrap. */
export default defineConfig({plugins:[react()],build:{outDir:'dist/modules',emptyOutDir:false,assetsInlineLimit:0,lib:{entry:fileURLToPath(new URL('./src/modules/index.ts',import.meta.url)),formats:['es'],fileName:() => 'index.js',cssFileName:'styles'},rollupOptions:{external:(id) => !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0'),output:{assetFileNames:'assets/[name]-[hash][extname]'}}}});
