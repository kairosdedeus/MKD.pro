import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'

const routerBaseName = ['/', './'].includes(import.meta.env.BASE_URL)
  ? undefined
  : import.meta.env.BASE_URL

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function MissingEnvironment() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <section className="w-full max-w-xl rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <p className="text-sm font-medium uppercase tracking-wide text-amber-300">
          Configuracao pendente
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Supabase nao configurado</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Configure os secrets VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no GitHub Actions e rode o deploy novamente.
        </p>
      </section>
    </main>
  )
}

function render(element: React.ReactNode) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>{element}</React.StrictMode>,
  )
}

async function bootstrap() {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    render(<MissingEnvironment />)
    return
  }

  const { default: App } = await import('./App')

  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={routerBaseName}>
        <App />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>,
  )
}

void bootstrap()
