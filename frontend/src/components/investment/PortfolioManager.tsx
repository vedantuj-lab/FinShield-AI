import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react'
import axios from 'axios'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

interface Investment {
  id: string
  category: string
  name: string
  purchase_value: number
  units: number
  purchase_date: string
  current_value?: number
}

export default function PortfolioManager() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    category: 'Mutual Fund',
    name: '',
    purchase_value: '',
    units: '',
    purchase_date: new Date().toISOString().split('T')[0],
  })

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  const CATEGORIES = ['FD', 'Mutual Fund', 'SIP', 'Index Fund', 'Stock', 'ETF', 'Bond']

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('authToken')
      await axios.get('/api/investments/portfolio', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      // Format response as investments
      setInvestments([])
    } catch (err) {
      console.error('Error fetching portfolio:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddInvestment = async () => {
    if (!formData.name || !formData.purchase_value || !formData.units) {
      alert('Please fill all fields')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      await axios.post('/api/investments/holdings', {
        category: formData.category,
        name: formData.name,
        purchase_value: parseFloat(formData.purchase_value),
        units: parseFloat(formData.units),
        purchase_date: formData.purchase_date,
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Reset form and refresh
      setFormData({
        category: 'Mutual Fund',
        name: '',
        purchase_value: '',
        units: '',
        purchase_date: new Date().toISOString().split('T')[0],
      })
      setShowForm(false)
      fetchPortfolio()
    } catch (err) {
      alert('Error adding investment')
    }
  }

  const calculateStats = () => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.purchase_value, 0)
    const currentValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.purchase_value), 0)
    const gain = currentValue - totalInvested
    const gainPercent = totalInvested > 0 ? (gain / totalInvested * 100).toFixed(2) : '0'

    return { totalInvested, currentValue, gain, gainPercent }
  }

  const getCategoryData = () => {
    const categoryMap: { [key: string]: number } = {}
    investments.forEach(inv => {
      categoryMap[inv.category] = (categoryMap[inv.category] || 0) + (inv.current_value || inv.purchase_value)
    })
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
  }

  const stats = calculateStats()
  const categoryData = getCategoryData()

  if (loading) {
    return <div className="text-center py-12">Loading portfolio...</div>
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-gray-600 text-sm">Total Invested</p>
          <p className="text-2xl font-bold text-blue-600">₹{stats.totalInvested.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Current Value</p>
          <p className="text-2xl font-bold text-green-600">₹{stats.currentValue.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Gain/Loss</p>
          <p className={`text-2xl font-bold ${stats.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{Math.abs(stats.gain).toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Return %</p>
          <p className={`text-2xl font-bold ${parseFloat(stats.gainPercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.gainPercent}%
          </p>
        </div>
      </div>

      {/* Add Investment Button */}
      <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
        <Plus size={20} />
        Add Investment
      </button>

      {/* Add Investment Form */}
      {showForm && (
        <div className="card bg-blue-50">
          <h3 className="text-lg font-bold mb-4">Add New Investment</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Investment Name</label>
              <input
                type="text"
                placeholder="e.g., HDFC Index Fund"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Purchase Value (₹)</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={formData.purchase_value}
                  onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Units</label>
                <input
                  type="number"
                  placeholder="100"
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Purchase Date</label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={handleAddInvestment} className="btn-primary flex-1">
                Add Investment
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Chart */}
      {categoryData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Asset Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }: { name: string; value: number }) => `${name}: ₹${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Investments Table */}
      {investments.length > 0 ? (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Your Investments</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-right">Value</th>
                  <th className="px-4 py-2 text-right">Units</th>
                  <th className="px-4 py-2 text-right">Current Value</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {investments.map(inv => (
                  <tr key={inv.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{inv.category}</td>
                    <td className="px-4 py-3">{inv.name}</td>
                    <td className="px-4 py-3 text-right">₹{inv.purchase_value.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{inv.units}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ₹{(inv.current_value || inv.purchase_value).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center flex gap-2 justify-center">
                      <button className="p-2 hover:bg-blue-100 rounded">
                        <Edit2 size={18} className="text-blue-600" />
                      </button>
                      <button className="p-2 hover:bg-red-100 rounded">
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No investments yet</p>
          <p className="text-sm text-gray-400">Add your first investment to get started</p>
        </div>
      )}
    </div>
  )
}
