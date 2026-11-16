import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Financial Overview */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Financial Overview</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600">₹0</p>
            </div>
            <div>
              <p className="text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">₹0</p>
            </div>
            <div>
              <p className="text-gray-600">Balance</p>
              <p className="text-2xl font-bold text-blue-600">₹0</p>
            </div>
          </div>
        </div>

        {/* Investment Summary */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Portfolio Summary</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600">Total Invested</p>
              <p className="text-2xl font-bold">₹0</p>
            </div>
            <div>
              <p className="text-gray-600">Current Value</p>
              <p className="text-2xl font-bold text-blue-600">₹0</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600">Transactions</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <p className="text-gray-600">Investigations</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Quick Access */}
      <div className="card">
        <h2 className="text-xl font-bold mb-6">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <a href="/budgeting" className="p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition">
            <p className="font-semibold text-emerald-700">💰 Budgeting</p>
          </a>
          <a href="/investments" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
            <p className="font-semibold text-blue-700">📈 Investments</p>
          </a>
          <a href="/markets" className="p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition">
            <p className="font-semibold text-amber-700">⚡ Markets</p>
          </a>
          <a href="/tax" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition">
            <p className="font-semibold text-green-700">🛡️ Tax</p>
          </a>
          <a href="/fraud-detector" className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition">
            <p className="font-semibold text-red-700">🚨 Fraud</p>
          </a>
          <a href="/business-finance" className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition">
            <p className="font-semibold text-indigo-700">💼 Business</p>
          </a>
        </div>
      </div>

      {/* AI Insights */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">AI Insights</h2>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-900">AI analysis will appear here as you start using the platform.</p>
        </div>
      </div>
    </div>
  )
}
