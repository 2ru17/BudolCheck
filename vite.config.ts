import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

type ConnectNext = (err?: unknown) => void;

function budolBackendPlugin(): Plugin {
  let appPromise: Promise<
    (req: IncomingMessage, res: ServerResponse, next: ConnectNext) => void
  > | null = null;

  const loadApiApp = () => {
    if (!appPromise) {
      appPromise = import('./server/app.ts').then(
        (mod) =>
          mod.app as unknown as (
            req: IncomingMessage,
            res: ServerResponse,
            next: ConnectNext
          ) => void
      );
    }
    return appPromise;
  };

  const attachApiMiddleware = (middlewares: {
    use: (
      fn: (req: IncomingMessage, res: ServerResponse, next: ConnectNext) => void
    ) => void;
  }) => {
    middlewares.use((req, res, next) => {
      if (!req.url || !req.url.startsWith('/api')) {
        next();
        return;
      }
      loadApiApp()
        .then((handler) => handler(req, res, next))
        .catch((err) => next(err));
    });
  };

  return {
    name: 'budol-api-middleware',
    configureServer(server) {
      if (process.env.USE_EXTERNAL_API !== '1') {
        attachApiMiddleware(server.middlewares);
      }
    },
    configurePreviewServer(server) {
      if (process.env.USE_EXTERNAL_API !== '1') {
        attachApiMiddleware(server.middlewares);
      }
    },
  };
}

export default defineConfig({
  plugins: [budolBackendPlugin(), react()],
  server: {
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx'],
    },
    proxy:
      process.env.USE_EXTERNAL_API === '1'
        ? {
            '/api': {
              target: 'http://localhost:3001',
              changeOrigin: true,
            },
          }
        : undefined,
  },
  build: {
    sourcemap: false,
    cssMinify: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'zustand'],
          'mantine-vendor': ['@mantine/core', '@mantine/hooks'],
          'motion-vendor': ['motion', 'animejs'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
