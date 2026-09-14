import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const RENDER_BACKEND = 'https://zaxi-backend.onrender.com';

function apiProxyPlugin(): Plugin {
  return {
    name: 'render-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api')) {
          return next();
        }

        try {
          const targetUrl = `${RENDER_BACKEND}${req.url}`;
          const headers: Record<string, string> = {};

          for (const [key, value] of Object.entries(req.headers)) {
            const lower = key.toLowerCase();
            // Strip Origin, Referer, Expect, Host, Content-Length and Accept-Encoding
            if (
              lower === 'origin' ||
              lower === 'referer' ||
              lower === 'host' ||
              lower === 'expect' ||
              lower === 'content-length' ||
              lower === 'accept-encoding'
            ) {
              continue;
            }
            if (typeof value === 'string') {
              headers[lower] = value;
            } else if (Array.isArray(value)) {
              headers[lower] = value.join(', ');
            }
          }

          const fetchOptions: RequestInit = {
            method: req.method,
            headers,
          };

          if (req.method !== 'GET' && req.method !== 'HEAD') {
            const chunks: Uint8Array[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            fetchOptions.body = Buffer.concat(chunks);
          }

          const backendRes = await fetch(targetUrl, fetchOptions);

          res.statusCode = backendRes.status;
          backendRes.headers.forEach((val, key) => {
            const lower = key.toLowerCase();
            // Do not copy content-encoding or length since Node fetch already decompressed the body
            if (
              !lower.startsWith('access-control-') &&
              lower !== 'content-encoding' &&
              lower !== 'content-length' &&
              lower !== 'transfer-encoding'
            ) {
              res.setHeader(key, val);
            }
          });
          // Set permissive local CORS headers for the browser
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Access-Control-Allow-Methods', '*');

          const arrayBuffer = await backendRes.arrayBuffer();
          res.end(Buffer.from(arrayBuffer));
        } catch (err) {
          console.error('[API Proxy Error]:', err);
          next(err);
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiProxyPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/socket.io': {
        target: RENDER_BACKEND,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
