import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://zaxi-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://zaxi-backend.onrender.com',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
