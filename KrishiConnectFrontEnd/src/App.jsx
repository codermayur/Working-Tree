import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { authStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'
import { getLanguageToUse } from './i18n'
import i18n from './i18n'
import { SocketProvider } from './context/SocketContext'
import AppLayout from './components/AppLayout'
import HomePage from './pages/HomePage'
import AlertsPage from './pages/AlertsPage'
import MessagesPage from './pages/MessagesPage'
import OpportunitiesPage from './pages/OpportunitiesPage'
import ProfilePage from './pages/ProfilePage'
import NetworkPage from './pages/NetworkPage'
import SettingsPage from './pages/SettingsPage'
import PrivacySecurityPage from './pages/PrivacySecurityPage'
import WeatherPage from './pages/WeatherPage'
import MarketPage from './pages/MarketPage'
import CropDoctor from './pages/CropDoctor'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

function App() {
  useEffect(() => {
    const user = authStore.getState().user
    const lang = getLanguageToUse(user?.preferences?.language)
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
  }, [])

  // Sync theme from backend user preference on load (if logged in)
  useEffect(() => {
    const user = authStore.getState().user
    const prefDark = user?.preferences?.darkMode
    if (typeof prefDark === 'boolean') {
      useThemeStore.getState().setDarkMode(prefDark)
    }
  }, [])

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
          <Routes>
        {/* Auth routes: no sidebar layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* App routes: shared AppLayout (sidebar + Outlet) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<HomePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/notifications" element={<AlertsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/opportunities" element={<div><center><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>Opportunities page is coming soon...</center></div>} />
          <Route path="/jobs" element={<OpportunitiesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/privacy" element={<PrivacySecurityPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/crop-doctor" element={<CropDoctor />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </QueryClientProvider>
    </Router>
  )
}

export default App
