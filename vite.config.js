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
      // Auto-detect the correct port based on where the server is actually running
      // clientPort: 5173  // Removed: causes issues when port 5173 is in use
    },
    proxy: {
      '/graphql': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
