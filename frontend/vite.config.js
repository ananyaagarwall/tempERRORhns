import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  root: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@property': path.resolve(__dirname, './src/property_page'),
      '@home': path.resolve(__dirname, './src/hns_home_page'),
      '@blog': path.resolve(__dirname, './src/hns_blog_page'),
      '@admin': path.resolve(__dirname, './src/hns_admin_page'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
})