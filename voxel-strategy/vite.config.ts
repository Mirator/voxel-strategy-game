import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages deployment from root
  base: '/voxel-strategy-game/',
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true,
  },
})
