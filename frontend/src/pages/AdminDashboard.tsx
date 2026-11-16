import { useState, useEffect } from 'react'
import axios from 'axios'

interface AdminOverview {
  users: { total: number; admin: number; active: number; inactive: number }
  transactions: { total: number; total_value: number }
  investigations: { total: number; high_risk: number }
  rescue_cases: { total: number; open: number; disputed_amount: number; recovered_amount: number }
  ai_usage: { conversations: number; messages: number }
  timestamp: string
}

interface Analytics {
  period_days: number
  new_users: number
  transactions: { total_transactions: number; total_value: number; by_type: Record<string, number> }
  investigations: { total: number; by_risk: Record<string, number> }
  rescue_cases: { total: number; disputed_amount: number; recovered_amount: number; recovery_rate: number }
  timestamp: string
}

interface HealthMetric {
  status: string
  database: { status: string; total_records: Record<string, number> }
  services: Record<string, string>
  recent_activity: Array<{ id: string; action: string; entity_type: string; created_at: string }>
  timestamp: string
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [health, setHealth] = useState<HealthMetric | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [overviewRes, analyticsRes, healthRes] = await Promise.all([
        axios.get('/api/admin/overview'),
        axios.get('/api/admin/analytics'),
        axios.get('/api/admin/health'),
      ])

      setOverview(overviewRes.data)
      setAnalytics(analyticsRes.data)
      setHealth(healthRes.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading admin data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={fetchAdminData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        {['overview', 'users', 'analytics', 'health', 'audit'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Users Cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card">
                <p className="text-gray-600">Total Users</p>
                <p className="text-3xl font-bold">{overview.users.total}</p>
              </div>
              <div className="card">
                <p className="text-gray-600">Admin Users</p>
                <p className="text-3xl font-bold">{overview.users.admin}</p>
              </div>
              <div className="card">
                <p className="text-gray-600">Active Users</p>
                <p className="text-3xl font-bold">{overview.users.active}</p>
              </div>
              <div className="card">
                <p className="text-gray-600">Inactive Users</p>
                <p className="text-3xl font-bold">{overview.users.inactive}</p>
              </div>
            </div>
          </div>

          {/* Transactions Cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Transactions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <p className="text-gray-600">Total Transactions</p>
                <p className="text-3xl font-bold">{overview.transactions.total}</p>
              </div>
              <div className="card">
                <p className="text-gray-600">Total Value</p>
                <p className="text-3xl font-bold">₹{(overview.transactions.total_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          {/* Investigations Cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Investigations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <p className="text-gray-600">Total Investigations</p>
                <p className="text-3xl font-bold">{overview.investigations.total}</p>
              </div>
              <div className="card bg-red-50">
                <p className="text-gray-600">High Risk</p>
                <p className="text-3xl font-bold text-red-600">{overview.investigations.high_risk}</p>
              </div>
            </div>
          </div>

          {/* Rescue Cases Cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Rescue Cases</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card">
                <p className="text-gray-600">Total Cases</p>
                <p className="text-3xl font-bold">{overview.rescue_cases.total}</p>
              </div>
              <div className="card">
                <p className="text-gray-600">Open Cases</p>
                <p className="text-3xl font-bold">{overview.rescue_cases.open}</p>
              </div>
              <div className="card">
                <p className="text-gray-600">Disputed</p>
                <p className="text-3xl font-bold">₹{(overview.rescue_cases.disputed_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="card bg-green-50">
                <p className="text-gray-600">Recovered</p>
                <p className="text-3xl font-bold text-green-600">₹{(overview.rescue_cases.recovered_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          {/* AI Usage Cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4">AI Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <p className="text-gray-600">Conversations</p>
                <p className="text-3xl font-bold">{overview.ai_usage.conversations}</p>
              </div>
              <div className="card">
                <p className="text-gray-600">Messages</p>
                <p className="text-3xl font-bold">{overview.ai_usage.messages}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <UserManagement />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Analytics (Last 30 Days)</h2>
          
          <div className="card">
            <h3 className="font-semibold mb-4">New Users</h3>
            <p className="text-3xl font-bold">{analytics.new_users}</p>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Transactions</h3>
            <div className="space-y-2">
              <p>Total: {analytics.transactions.total_transactions}</p>
              <p>Total Value: ₹{(analytics.transactions.total_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              <div className="mt-4">
                <p className="font-semibold mb-2">By Type:</p>
                {Object.entries(analytics.transactions.by_type || {}).map(([type, count]) => (
                  <p key={type} className="text-sm text-gray-600">{type}: {count}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Investigations</h3>
            <div className="space-y-2">
              <p>Total: {analytics.investigations.total}</p>
              <div className="mt-4">
                <p className="font-semibold mb-2">By Risk Level:</p>
                {Object.entries(analytics.investigations.by_risk || {}).map(([risk, count]) => (
                  <p key={risk} className="text-sm text-gray-600">{risk}: {count}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Rescue Cases</h3>
            <div className="space-y-2">
              <p>Total Cases: {analytics.rescue_cases.total}</p>
              <p>Disputed: ₹{(analytics.rescue_cases.disputed_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              <p>Recovered: ₹{(analytics.rescue_cases.recovered_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              <p className="font-semibold mt-2">Recovery Rate: {analytics.rescue_cases.recovery_rate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Health Tab */}
      {activeTab === 'health' && health && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">System Health</h2>
          
          <div className="card">
            <h3 className="font-semibold mb-2">Overall Status</h3>
            <p className={`text-lg font-bold ${health.status === 'operational' ? 'text-green-600' : 'text-yellow-600'}`}>
              {health.status}
            </p>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Database</h3>
            <p className="mb-2">Status: <span className={health.database.status === 'healthy' ? 'text-green-600' : 'text-red-600'}>{health.database.status}</span></p>
            <div className="mt-4 text-sm text-gray-600">
              {Object.entries(health.database.total_records || {}).map(([key, value]) => (
                <p key={key}>{key}: {value}</p>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Services</h3>
            {Object.entries(health.services || {}).map(([service, status]) => (
              <p key={service} className="mb-2">
                {service}: <span className="text-green-600 font-semibold">{status}</span>
              </p>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            {health.recent_activity?.length > 0 ? (
              <div className="space-y-2">
                {health.recent_activity.map((activity) => (
                  <p key={activity.id} className="text-sm text-gray-600">
                    {activity.action} - {activity.entity_type} ({new Date(activity.created_at).toLocaleString()})
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <AuditLogs />
      )}
    </div>
  )
}

function UserManagement() {
  const [users, setUsers] = useState<Array<{ id: string; email: string; name: string; role: string; is_active: boolean; created_at: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users', { params: { limit: 100 } })
      setUsers(response.data.users)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p className="text-gray-500">Loading users...</p>

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">User Management</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-sm ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-sm ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  user_id?: string
  details?: string
  created_at: string
}

function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/admin/audit-logs', { params: { limit: 100 } })
      setLogs(response.data.logs)
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p className="text-gray-500">Loading audit logs...</p>

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{log.action}</p>
                <p className="text-sm text-gray-600">{log.entity_type} - {log.entity_id}</p>
                {log.details && <p className="text-sm text-gray-500 mt-1">{log.details}</p>}
              </div>
              <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
