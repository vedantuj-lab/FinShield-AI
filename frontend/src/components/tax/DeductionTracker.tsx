import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle, Clock } from 'lucide-react'
import axios from 'axios'

interface Deduction {
  id: string
  deduction_type: string
  category: string
  amount: number
  status: string
  created_at: string
  proof_url?: string
  description?: string
}

export default function DeductionTracker() {
  const [financialYear, setFinancialYear] = useState('2024-25')
  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    deduction_type: '80C',
    category: 'Life Insurance',
    amount: 50000,
    proof_url: '',
    description: '',
  })

  const deductionTypes = [
    { code: '80C', label: 'Section 80C (Insurance, PPF, ELSS)', max: 150000 },
    { code: '80D', label: 'Section 80D (Health Insurance)', max: 50000 },
    { code: 'HRA', label: 'House Rent Allowance', max: null },
    { code: 'Home Loan', label: 'Home Loan Interest', max: 200000 },
    { code: '80E', label: 'Education Loan Interest', max: null },
    { code: 'Standard', label: 'Standard Deduction', max: 75000 },
  ]

  const categories = {
    '80C': ['Life Insurance', 'PPF', 'ELSS', 'Fixed Deposit', 'ULIPs'],
    '80D': ['Self Health Insurance', 'Family Health Insurance', 'Medical Expenses'],
    'HRA': ['Rent Paid', 'Landlord Details'],
    'Home Loan': ['Principal Repayment', 'Interest Paid'],
    '80E': ['Education Loan Interest'],
    'Standard': ['Standard Deduction'],
  }

  useEffect(() => {
    fetchDeductions()
  }, [financialYear])

  const fetchDeductions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const userId = localStorage.getItem('userId')

      if (!token || !userId) {
        setError('Authentication required')
        return
      }

      const response = await axios.get(`/api/tax/deductions/${userId}?financial_year=${financialYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setDeductions(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch deductions')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDeduction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('authToken')

      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await axios.post(`/api/tax/save-deduction?financial_year=${financialYear}`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setDeductions([...deductions, response.data])
      setFormData({
        deduction_type: '80C',
        category: 'Life Insurance',
        amount: 50000,
        proof_url: '',
        description: '',
      })
      setShowAddForm(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add deduction')
    }
  }

  const handleDeleteDeduction = async (deductionId: string) => {
    try {
      const token = localStorage.getItem('authToken')

      if (!token) {
        setError('Authentication required')
        return
      }

      await axios.delete(`/api/tax/deduction/${deductionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setDeductions(deductions.filter(d => d.id !== deductionId))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete deduction')
    }
  }

  const totalAmount = deductions.reduce((sum, d) => sum + d.amount, 0)
  const verifiedAmount = deductions
    .filter(d => d.status === 'verified')
    .reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Deduction Tracker</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition"
        >
          <Plus className="w-4 h-4" />
          Add Deduction
        </button>
      </div>

      {/* Financial Year Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Financial Year
        </label>
        <select
          value={financialYear}
          onChange={(e) => setFinancialYear(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="2024-25">2024-25</option>
          <option value="2023-24">2023-24</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">Total Deductions</p>
          <p className="text-2xl font-bold text-blue-600">
            ₹{totalAmount.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">Verified</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{verifiedAmount.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600">Pending Review</p>
          <p className="text-2xl font-bold text-purple-600">
            ₹{(totalAmount - verifiedAmount).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Add Deduction Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Deduction</h3>
          <form onSubmit={handleAddDeduction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deduction Type
                </label>
                <select
                  value={formData.deduction_type}
                  onChange={(e) => {
                    setFormData({ ...formData, deduction_type: e.target.value, category: '' })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {deductionTypes.map(type => (
                    <option key={type.code} value={type.code}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {(categories[formData.deduction_type as keyof typeof categories] || []).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.proof_url}
                  onChange={(e) => setFormData({ ...formData, proof_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Add any additional details..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition"
              >
                Save Deduction
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Deductions List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading deductions...</div>
      ) : deductions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No deductions added yet</p>
          <p className="text-sm">Add your first deduction to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deductions.map((deduction) => (
            <div key={deduction.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-800">{deduction.deduction_type}</h4>
                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                      {deduction.category}
                    </span>
                    {deduction.status === 'verified' ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {deduction.status}
                      </span>
                    )}
                  </div>
                  {deduction.description && (
                    <p className="text-sm text-gray-600 mb-1">{deduction.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Added: {new Date(deduction.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right mr-4">
                  <p className="text-xl font-bold text-green-600">
                    ₹{deduction.amount.toLocaleString('en-IN')}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteDeduction(deduction.id)}
                  className="text-red-600 hover:text-red-800 transition p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
