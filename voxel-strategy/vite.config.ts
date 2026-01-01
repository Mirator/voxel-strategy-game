import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages deployment from root
  base: '/voxel-strategy-game/',
  build: {
    // Build directly to repository root for GitHub Pages (deploy from branch at root)
    outDir: path.resolve(__dirname, '..'),
    emptyOutDir: false, // Don't empty to preserve source files
    rollupOptions: {
      output: {
        // Place assets in assets folder at root
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})
