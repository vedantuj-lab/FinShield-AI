import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import axios from 'axios'

interface AddHoldingFormProps {
  onSuccess?: () => void
}

export default function AddHoldingForm({ onSuccess }: AddHoldingFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: 'Mutual Fund',
    name: '',
    purchase_value: '',
    units: '',
    purchase_date: new Date().toISOString().split('T')[0],
    current_value: '',
    notes: '',
  })

  const CATEGORIES = [
    'Stock',
    'Mutual Fund',
    'SIP',
    'Index Fund',
    'ETF',
    'FD',
    'Bond',
    'Cryptocurrency',
    'Real Estate',
    'Other'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name || !formData.purchase_value || !formData.units) {
      setError('Please fill in all required fields')
      return
    }

    if (parseFloat(formData.purchase_value) <= 0) {
      setError('Purchase value must be greater than 0')
      return
    }

    if (parseFloat(formData.units) <= 0) {
      setError('Units must be greater than 0')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')

      if (!token) {
        setError('Authentication required')
        return
      }

      await axios.post('/api/investments/holdings', {
        category: formData.category,
        name: formData.name,
        purchase_value: parseFloat(formData.purchase_value),
        units: parseFloat(formData.units),
        purchase_date: new Date(formData.purchase_date).toISOString(),
        current_value: formData.current_value ? parseFloat(formData.current_value) : parseFloat(formData.purchase_value),
        notes: formData.notes || null,
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Reset form
      setFormData({
        category: 'Mutual Fund',
        name: '',
        purchase_value: '',
        units: '',
        purchase_date: new Date().toISOString().split('T')[0],
        current_value: '',
        notes: '',
      })
      setShowForm(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add holding')
      console.error('Error adding holding:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        <Plus size={20} />
        Add Investment
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Add Investment</h2>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Investment Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Investment Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., HDFC Bank, Axis Mutual Fund"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Purchase Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Value (₹) *
            </label>
            <input
              type="number"
              name="purchase_value"
              value={formData.purchase_value}
              onChange={handleChange}
              placeholder="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Units */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Units/Quantity *
            </label>
            <input
              type="number"
              name="units"
              value={formData.units}
              onChange={handleChange}
              placeholder="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Date
            </label>
            <input
              type="date"
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Current Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Value (₹) (Optional)
            </label>
            <input
              type="number"
              name="current_value"
              value={formData.current_value}
              onChange={handleChange}
              placeholder="Leave blank to use purchase value"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any additional notes about this investment"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
          >
            {loading ? 'Adding...' : 'Add Investment'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
