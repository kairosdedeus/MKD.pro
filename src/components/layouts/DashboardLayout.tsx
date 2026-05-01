import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <Breadcrumbs />
        <main className="flex-1 overflow-y-auto bg-background main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
