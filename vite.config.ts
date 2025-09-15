import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Fix for MSAL browser compatibility
      'node-fetch': 'whatwg-fetch',
    }
  },
  optimizeDeps: {
    include: ['@azure/msal-browser', '@azure/msal-react']
  }
})
