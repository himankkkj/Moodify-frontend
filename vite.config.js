import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  plugins: [
    react(),
    svgr(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom')) return 'react-vendor'
            if (id.includes('react-router')) return 'router'
            if (id.includes('gsap')) return 'gsap'
            if (id.includes('axios')) return 'axios'
            if (id.includes('react')) return 'react-vendor'
          }
        }
      }
    }
  }
})