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
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return
          if (id.includes('@vladmandic/face-api') || id.includes('@tensorflow')) return 'faceapi'
          if (id.includes('@mediapipe')) return 'mediapipe'
          if (id.includes('three') || id.includes('@react-three') || id.includes('postprocessing')) return 'three'
          if (id.includes('gsap') || id.includes('lenis')) return 'motion'
          if (id.includes('react-router')) return 'router'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
          if (id.includes('axios')) return 'axios'
          if (id.includes('lucide-react')) return 'icons'
        }
      }
    }
  }
})