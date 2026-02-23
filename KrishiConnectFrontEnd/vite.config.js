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
      // When frontend uses relative /api/v1 (e.g. no .env), forward to backend
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true,
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
