import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { LoginPage } from './pages/LoginPage'
import { TestConnectionPage } from './pages/TestConnectionPage'
import { DashboardLayout } from './components/layouts/DashboardLayout'
import { GerencialDashboard } from './pages/gerencial/GerencialDashboard'
import { TeamsPage } from './pages/gerencial/TeamsPage'
import { UsersPage } from './pages/gerencial/UsersPage'
import { WorshipDashboard } from './pages/worship/WorshipDashboard'
import { SongsPage } from './pages/songs/SongsPage'
import { Toaster } from './components/ui/toaster'

function App() {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/test-connection" element={<TestConnectionPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/gerencial" replace />} />
          <Route path="gerencial" element={<GerencialDashboard />} />
          <Route path="gerencial/equipes" element={<TeamsPage />} />
          <Route path="gerencial/usuarios" element={<UsersPage />} />
          <Route path="gerencial/musicas" element={<SongsPage />} />
          <Route path="louvor" element={<WorshipDashboard />} />
          <Route path="test-connection" element={<TestConnectionPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
