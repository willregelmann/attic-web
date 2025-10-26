import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 300,     // Polling every 300ms (more reasonable for Docker)
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    hmr: {
      // Let the browser connect to the HMR server through the same host it's accessing the app from
      clientPort: 5173
    },
    proxy: {
      '/graphql': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
