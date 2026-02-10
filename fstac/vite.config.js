import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
<<<<<<< HEAD
    open: true,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true, timeout: 300000 },
      '/static': { target: 'http://localhost:8000', changeOrigin: true },
    },
=======
    open: true
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})