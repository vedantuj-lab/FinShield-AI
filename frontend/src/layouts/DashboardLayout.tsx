import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

interface DashboardLayoutProps {
  isAdmin?: boolean
}

export default function DashboardLayout({ isAdmin = false }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
