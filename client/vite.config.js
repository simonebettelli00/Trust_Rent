import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: 'dist/stats.html', gzipSize: true }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-day-picker')) return 'vendor-daypicker'
          if (id.includes('leaflet')) return 'vendor-leaflet'
          if (id.includes('socket.io-client') || id.includes('engine.io-client')) return 'vendor-socket'
          if (id.includes('react-router') || id.includes('/react/') || id.includes('/react-dom/')) return 'vendor-react'
        },
      },
    },
  },
})
