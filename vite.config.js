import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/time': {
        target: 'https://timeapi.io',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/time/, '/api')
      }
    }
  }
})
