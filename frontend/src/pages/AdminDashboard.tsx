export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-gray-600">Total Users</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="card">
          <p className="text-gray-600">Active Users</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="card">
          <p className="text-gray-600">Total Transactions</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="card">
          <p className="text-gray-600">AI Analyses</p>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>
      <div className="bg-blue-50 p-6 rounded-lg">
        <p className="text-blue-900">Admin dashboard features coming soon...</p>
      </div>
    </div>
  )
}
