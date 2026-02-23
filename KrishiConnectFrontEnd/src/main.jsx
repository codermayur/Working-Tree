import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import { useThemeStore } from './store/themeStore'
import App from './App.jsx'

// Apply saved theme before first paint to avoid flash
useThemeStore.getState().init()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
