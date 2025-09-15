import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      external: (id) => {
        // Externalize Node.js modules that shouldn't be bundled
        return ['crypto', 'fs', 'path', 'os', 'util', 'stream', 'events', 'buffer', 'url', 'querystring'].includes(id)
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  define: {
    global: 'globalThis',
    'process.env': '{}',
    'process.platform': '"browser"',
    'process.version': '"v16.0.0"',
  },
  resolve: {
    alias: {
      // Fix for MSAL browser compatibility
      'node-fetch': 'whatwg-fetch',
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'buffer': 'buffer',
      'util': 'util',
    }
  },
  optimizeDeps: {
    include: ['@azure/msal-browser', '@azure/msal-react', 'whatwg-fetch'],
    exclude: ['crypto', 'fs', 'path', 'os', 'util', 'stream', 'events', 'buffer', 'url', 'querystring']
  }
})
