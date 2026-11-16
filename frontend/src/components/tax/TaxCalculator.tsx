import { useState } from 'react'
import { Calculator, TrendingDown } from 'lucide-react'
import axios from 'axios'

interface TaxResult {
  financial_year: string
  total_income: number
  standard_deduction: number
  taxable_income: number
  tax_liability: number
  regime: string
  breakup?: {
    salary_income: number
    business_income: number
    other_income: number
    total_income: number
    deductions: number
    taxable_income: number
    tax_before_cess: number
    cess_4_percent: number
    total_tax: number
  }
}

export default function TaxCalculator() {
  const [inputs, setInputs] = useState({
    financial_year: '2024-25',
    income_type: 'salary',
    salary_income: 500000,
    business_income: 0,
    other_income: 0,
    deductions: 75000,
  })

  const [result, setResult] = useState<TaxResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setInputs(prev => ({
      ...prev,
      [name]: name === 'income_type' ? value : parseFloat(value) || 0,
    }))
    setResult(null)
  }

  const calculateTax = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('authToken')

      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await axios.post('/api/tax/calculate', {
        financial_year: inputs.financial_year,
        income_type: inputs.income_type,
        salary_income: inputs.salary_income,
        business_income: inputs.business_income,
        other_income: inputs.other_income,
        deductions: inputs.deductions,
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to calculate tax')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Tax Calculator</h2>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2024-25">2024-25</option>
            <option value="2023-24">2023-24</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Income Type
          </label>
          <select
            name="income_type"
            value={inputs.income_type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="salary">Salary</option>
            <option value="self_employed">Self-Employed</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Income (₹)
          </label>
          <input
            type="number"
            name="salary_income"
            value={inputs.salary_income}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Income (₹)
          </label>
          <input
            type="number"
            name="business_income"
            value={inputs.business_income}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Other Income (₹)
          </label>
          <input
            type="number"
            name="other_income"
            value={inputs.other_income}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <button
        onClick={calculateTax}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-md transition"
      >
        {loading ? 'Calculating...' : 'Calculate Tax'}
      </button>

      {result && (
        <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Tax Calculation Result</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="text-xl font-bold text-gray-800">
                ₹{(result.total_income || 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Deductions</p>
              <p className="text-xl font-bold text-gray-800">
                ₹{(result.standard_deduction || 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Taxable Income</p>
              <p className="text-xl font-bold text-gray-800">
                ₹{(result.taxable_income || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow mb-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <h4 className="text-lg font-semibold text-gray-800">Tax Liability</h4>
            </div>
            <p className="text-4xl font-bold text-red-600">
              ₹{(result.tax_liability || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-gray-600 mt-2">Based on {result.regime} regime</p>
          </div>

          {result.breakup && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-semibold text-gray-800 mb-3">Detailed Breakup</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax Before Cess:</span>
                  <span className="font-medium">₹{(result.breakup.tax_before_cess).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Health & Education Cess (4%):</span>
                  <span className="font-medium">₹{(result.breakup.cess_4_percent).toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                  <span>Total Tax:</span>
                  <span className="text-red-600">₹{(result.breakup.total_tax).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
