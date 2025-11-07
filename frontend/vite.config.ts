import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Expose to network for Electron
    port: 5173,
    watch: {
      usePolling: true, // Enable polling for WSL/Windows file systems
    },
    hmr: {
      overlay: true, // Show error overlay on HMR errors
    },
  },
  build: {
    outDir: 'dist',
  },
})
