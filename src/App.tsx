import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { DashboardLayout } from './components/layouts/DashboardLayout'
import { Toaster } from './components/ui/toaster'
import { LoadingSpinner } from './components/shared/LoadingSpinner'

// ── Lazy loading de todas as páginas ─────────────────────────
const LoginPage         = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const TestConnectionPage = lazy(() => import('./pages/TestConnectionPage').then(m => ({ default: m.TestConnectionPage })))
const GerencialDashboard = lazy(() => import('./pages/gerencial/GerencialDashboard').then(m => ({ default: m.GerencialDashboard })))
const TeamsPage          = lazy(() => import('./pages/gerencial/TeamsPage').then(m => ({ default: m.TeamsPage })))
const UsersPage          = lazy(() => import('./pages/gerencial/UsersPage').then(m => ({ default: m.UsersPage })))
const SongsPage          = lazy(() => import('./pages/songs/SongsPage').then(m => ({ default: m.SongsPage })))
const WorshipDashboard   = lazy(() => import('./pages/worship/WorshipDashboard').then(m => ({ default: m.WorshipDashboard })))

// ── Fallback de carregamento ──────────────────────────────────
function PageLoader() {
  return (
    <div className="flex h-full min-h-[300px] items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}

function App() {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/test-connection" element={<TestConnectionPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
        <Toaster />
      </>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/gerencial" replace />} />
          <Route path="gerencial" element={
            <Suspense fallback={<PageLoader />}><GerencialDashboard /></Suspense>
          } />
          <Route path="gerencial/equipes" element={
            <Suspense fallback={<PageLoader />}><TeamsPage /></Suspense>
          } />
          <Route path="gerencial/usuarios" element={
            <Suspense fallback={<PageLoader />}><UsersPage /></Suspense>
          } />
          <Route path="gerencial/musicas" element={
            <Suspense fallback={<PageLoader />}><SongsPage /></Suspense>
          } />
          <Route path="louvor" element={
            <Suspense fallback={<PageLoader />}><WorshipDashboard /></Suspense>
          } />
          <Route path="test-connection" element={
            <Suspense fallback={<PageLoader />}><TestConnectionPage /></Suspense>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
