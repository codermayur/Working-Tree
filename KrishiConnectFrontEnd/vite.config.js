import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
  server: {
    proxy: {
      // API: forward to backend so frontend can use relative /api/v1
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
      // Socket.IO: only used if client used same-origin; in dev client connects directly to :5005 to avoid ws proxy ECONNABORTED
      '/socket.io': {
        target: 'http://localhost:5005',
        changeOrigin: true,
        ws: true,
      },
      // WeatherUnion API (avoids CORS); use /weather-api/... in fetch
      '/weather-api': {
        target: 'https://www.weatherunion.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/weather-api/, ''),
      },
    },
  },
})
