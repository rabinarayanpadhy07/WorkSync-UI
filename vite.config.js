import path from 'path';
import { fileURLToPath } from 'url';
import tailwind from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          editor: ['quill', 'quill-mention'],
          realtime: ['socket.io-client'],
          icons: ['lucide-react', 'react-icons'],
          radix: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip'
          ]
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
