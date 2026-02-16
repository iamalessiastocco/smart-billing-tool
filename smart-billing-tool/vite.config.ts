// vite.config.ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api/company': {
        target: 'https://test.company.openapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/company/, ''),
        secure: false,
      },
      '/api/invoice': {
        target: 'https://test.invoice.openapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/invoice/, ''),
        secure: false,
      }
    }
  }
})