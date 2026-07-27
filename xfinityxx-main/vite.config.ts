import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Vite plugin to serve .js.download files with the correct JavaScript MIME type.
 * The saved Xfinity HTML page references script assets with a .download suffix,
 * which Vite does not recognise by default.
 */
function fixDownloadMime(): Plugin {
  return {
    name: 'fix-download-mime',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.endsWith('.js.download')) {
          try {
            const filePath = join(process.cwd(), 'public', req.url);
            const content = readFileSync(filePath);
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.end(content);
          } catch {
            next();
          }
        } else {
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), fixDownloadMime()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  base: '/',
});