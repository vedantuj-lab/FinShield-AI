import { useState } from 'react'
import { Home, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import axios from 'axios'

interface RetirementPlan {
  years_to_retirement: number
  corpus_needed: number
  monthly_expense_at_retirement: number
  monthly_investment_needed: number
  future_value_of_current_savings: number
}

export default function RetirementPlanner() {
  const [inputs, setInputs] = useState({
    current_age: 30,
    retirement_age: 60,
    monthly_expense: 50000,
    annual_inflation: 5,
    annual_return: 10,
    current_savings: 500000,
  })
  const [plan, setPlan] = useState<RetirementPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }))
    setPlan(null)
  }

  const calculatePlan = async () => {
    if (inputs.current_age >= inputs.retirement_age) {
      setError('Retirement age must be greater than current age')
      return
    }

    if (inputs.monthly_expense <= 0) {
      setError('Monthly expense must be greater than 0')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('authToken')

      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await axios.post('/api/investments/calculators/retirement-plan', {
        current_age: inputs.current_age,
        retirement_age: inputs.retirement_age,
        monthly_expense: inputs.monthly_expense,
        annual_inflation: inputs.annual_inflation,
        annual_return: inputs.annual_return,
        current_savings: inputs.current_savings,
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setPlan(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to calculate retirement plan')
      console.error('Error calculating plan:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Home className="text-blue-600" size={28} />
        <h2 className="text-2xl font-bold text-gray-900">Retirement Planning Calculator</h2>
      </div>

      {/* Input Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Age
            </label>
            <input
              type="number"
              name="current_age"
              value={inputs.current_age}
              onChange={handleInputChange}
              min="18"
              max="70"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Retirement Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retirement Age
            </label>
            <input
              type="number"
              name="retirement_age"
              value={inputs.retirement_age}
              onChange={handleInputChange}
              min="30"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Monthly Expense */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Expense (₹)
            </label>
            <input
              type="number"
              name="monthly_expense"
              value={inputs.monthly_expense}
              onChange={handleInputChange}
              min="1000"
              step="1000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Annual Inflation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Inflation (%)
            </label>
            <input
              type="number"
              name="annual_inflation"
              value={inputs.annual_inflation}
              onChange={handleInputChange}
              min="0"
              max="20"
              step="0.5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Annual Return */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Annual Return (%)
            </label>
            <input
              type="number"
              name="annual_return"
              value={inputs.annual_return}
              onChange={handleInputChange}
              min="0"
              max="30"
              step="0.5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Current Savings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Savings (₹)
            </label>
            <input
              type="number"
              name="current_savings"
              value={inputs.current_savings}
              onChange={handleInputChange}
              min="0"
              step="10000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={calculatePlan}
        disabled={loading}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium flex items-center justify-center gap-2"
      >
        <TrendingUp size={20} />
        {loading ? 'Calculating...' : 'Calculate Retirement Plan'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Results */}
      {plan && (
        <div className="space-y-6">
          {/* Key Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="text-blue-600" size={20} />
                <p className="text-gray-600 text-sm font-medium">Years to Retirement</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{plan.years_to_retirement} years</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-600" size={20} />
                <p className="text-gray-600 text-sm font-medium">Corpus Needed</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                ₹{plan.corpus_needed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
              <p className="text-gray-600 text-sm font-medium mb-2">Monthly Expense at Retirement</p>
              <p className="text-3xl font-bold text-gray-900">
                ₹{plan.monthly_expense_at_retirement.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-600 mt-2">(Adjusted for inflation)</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <p className="text-gray-600 text-sm font-medium mb-2">Monthly Investment Needed</p>
              <p className="text-3xl font-bold text-gray-900">
                ₹{plan.monthly_investment_needed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-600 mt-2">From now till retirement</p>
            </div>
          </div>

          {/* Current Savings Impact */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Impact of Current Savings</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded border border-blue-100">
                <span className="text-gray-600">Current Savings</span>
                <span className="font-bold text-gray-900">
                  ₹{inputs.current_savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border border-blue-100">
                <span className="text-gray-600">Future Value at Retirement</span>
                <span className="font-bold text-green-700">
                  ₹{plan.future_value_of_current_savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border border-blue-100">
                <span className="text-gray-600">Remaining Corpus Needed</span>
                <span className="font-bold text-orange-700">
                  ₹{(plan.corpus_needed - plan.future_value_of_current_savings).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Key Insights</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  You have <strong>{plan.years_to_retirement} years</strong> to save for retirement
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  Assuming <strong>{inputs.annual_inflation}% inflation</strong>, your monthly expense of ₹{inputs.monthly_expense.toLocaleString('en-IN')} will become ₹{plan.monthly_expense_at_retirement.toLocaleString('en-IN', { maximumFractionDigits: 0 })} at retirement
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  You need a corpus of ₹{plan.corpus_needed.toLocaleString('en-IN', { maximumFractionDigits: 0 })} to support 30 years of retirement
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  By investing ₹{plan.monthly_investment_needed.toLocaleString('en-IN', { maximumFractionDigits: 0 })} monthly at {inputs.annual_return}% returns, you can achieve your goal
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  Your current savings will grow to ₹{plan.future_value_of_current_savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}, reducing the monthly investment needed
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
