import { useState } from 'react'
import { TrendingUp, TrendingDown, Check } from 'lucide-react'
import axios from 'axios'

interface RegimeComparison {
  financial_year: string
  total_income: number
  old_regime_tax: number
  new_regime_tax: number
  difference: number
  recommended_regime: string
  explanation: string
}

export default function RegimeComparator() {
  const [inputs, setInputs] = useState({
    financial_year: '2024-25',
    total_income: 1000000,
    deductions: 150000,
    hra_amount: 200000,
  })

  const [result, setResult] = useState<RegimeComparison | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setInputs(prev => ({
      ...prev,
      [name]: name === 'financial_year' ? value : parseFloat(value) || 0,
    }))
    setResult(null)
  }

  const compareRegimes = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('authToken')

      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await axios.post('/api/tax/regime-comparison', {
        financial_year: inputs.financial_year,
        total_income: inputs.total_income,
        deductions: inputs.deductions,
        hra_amount: inputs.hra_amount,
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to compare regimes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-800">Tax Regime Comparison</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Financial Year
          </label>
          <select
            name="financial_year"
            value={inputs.financial_year}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="2024-25">2024-25</option>
            <option value="2023-24">2023-24</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Income (₹)
          </label>
          <input
            type="number"
            name="total_income"
            value={inputs.total_income}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deductions (₹)
          </label>
          <input
            type="number"
            name="deductions"
            value={inputs.deductions}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            HRA Amount (₹)
          </label>
          <input
            type="number"
            name="hra_amount"
            value={inputs.hra_amount}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <button
        onClick={compareRegimes}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-md transition"
      >
        {loading ? 'Comparing...' : 'Compare Regimes'}
      </button>

      {result && (
        <div className="mt-8">
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
            <p className="text-blue-800">
              <strong>Recommended:</strong> {result.recommended_regime.toUpperCase()} Regime
            </p>
            <p className="text-blue-700 text-sm mt-2">{result.explanation}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old Regime */}
            <div className={`p-6 rounded-lg border-2 ${result.recommended_regime === 'old' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Old Regime</h3>
                {result.recommended_regime === 'old' && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-xl font-semibold text-gray-800">
                    ₹{result.total_income.toLocaleString('en-IN')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Standard Deduction (50,000)</p>
                  <p className="text-sm text-gray-700">Plus other deductions applicable</p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Tax Liability</p>
                  <p className="text-3xl font-bold text-red-600">
                    ₹{result.old_regime_tax.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            {/* New Regime */}
            <div className={`p-6 rounded-lg border-2 ${result.recommended_regime === 'new' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">New Regime</h3>
                {result.recommended_regime === 'new' && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-xl font-semibold text-gray-800">
                    ₹{result.total_income.toLocaleString('en-IN')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Standard Deduction (75,000)</p>
                  <p className="text-sm text-gray-700">No other deductions allowed</p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Tax Liability</p>
                  <p className="text-3xl font-bold text-red-600">
                    ₹{result.new_regime_tax.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
            <h4 className="text-lg font-bold text-gray-800 mb-3">Savings Analysis</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tax Difference</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{result.difference.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Savings by choosing {result.recommended_regime.toUpperCase()} regime
                </p>
              </div>
              <TrendingDown className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> This comparison is based on current tax slabs. Please consult a tax professional before making final decisions.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
