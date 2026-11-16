import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  BarChart3,
  Percent,
  AlertTriangle,
  Briefcase,
  MessageSquare,
  Settings,
  LogOut,
  Users,
  BarChart2,
} from 'lucide-react'

interface SidebarProps {
  isAdmin?: boolean
}

export default function Sidebar({ isAdmin }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const userMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Budgeting', icon: DollarSign, path: '/budgeting' },
    { name: 'Investments', icon: TrendingUp, path: '/investments' },
    { name: 'Markets', icon: BarChart3, path: '/markets' },
    { name: 'Tax', icon: Percent, path: '/tax' },
    { name: 'Fraud Detector', icon: AlertTriangle, path: '/fraud-detector' },
    { name: 'Business', icon: Briefcase, path: '/business-finance' },
    { name: 'AI Assistant', icon: MessageSquare, path: '/ai-assistant' },
  ]

  const adminMenuItems = [
    { name: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Analytics', icon: BarChart2, path: '/admin/analytics' },
  ]

  const menuItems = isAdmin ? adminMenuItems : userMenuItems

  return (
    <div className="w-64 bg-charcoal text-white shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="text-2xl font-bold text-blue-400">
          FinShield AI
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-700 p-4 space-y-2">
        <div className="px-4 py-2 text-sm">
          <p className="text-gray-400">Logged in as</p>
          <p className="font-semibold">{user?.name}</p>
        </div>
        <Link
          to="/profile"
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-left"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
