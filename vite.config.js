import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 300,     // Polling every 300ms (more reasonable for Docker)
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    hmr: {
      // Auto-detect the correct port based on where the server is actually running
      // clientPort: 5173  // Removed: causes issues when port 5173 is in use
    },
    proxy: {
      '/graphql': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
