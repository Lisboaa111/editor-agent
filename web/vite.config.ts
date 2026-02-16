import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
      events: 'events',
      util: 'util',
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    include: ['buffer', 'events', 'util', '@near-wallet-selector/core', '@near-wallet-selector/my-near-wallet', '@near-wallet-selector/modal-ui-js'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
