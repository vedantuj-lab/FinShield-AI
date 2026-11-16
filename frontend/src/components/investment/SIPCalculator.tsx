import { useState } from 'react'
import { Calculator, TrendingUp } from 'lucide-react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SIPResult {
  maturity_amount: number
  total_invested: number
  total_gain: number
  breakdown: {
    invested: number
    gained: number
  }
}

export default function SIPCalculator() {
  const [inputs, setInputs] = useState({
    monthly_investment: 5000,
    years: 10,
    annual_return: 12,
  })
  const [result, setResult] = useState<SIPResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<any[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }))
    setResult(null)
    setChartData([])
  }

  const calculateSIP = async () => {
    if (inputs.monthly_investment <= 0 || inputs.years <= 0) {
      setError('Please enter valid values')
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

      const response = await axios.post('/api/investments/calculators/sip', {
        monthly_investment: inputs.monthly_investment,
        annual_return: inputs.annual_return,
        years: inputs.years,
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setResult(response.data)

      // Generate chart data
      const data = []
      const monthlyReturn = (inputs.annual_return / 100) / 12
      let futureValue = 0

      for (let month = 0; month <= inputs.years * 12; month++) {
        if (month === 0) {
          futureValue = 0
        } else {
          if (monthlyReturn === 0) {
            futureValue = inputs.monthly_investment * month
          } else {
            futureValue = inputs.monthly_investment * (((1 + monthlyReturn) ** month - 1) / monthlyReturn)
          }
        }

        if (month % 6 === 0 || month === inputs.years * 12) {
          data.push({
            month: month,
            invested: inputs.monthly_investment * month,
            value: Math.round(futureValue),
            gain: Math.round(futureValue - (inputs.monthly_investment * month)),
          })
        }
      }

      setChartData(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to calculate SIP')
      console.error('Error calculating SIP:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="text-blue-600" size={28} />
        <h2 className="text-2xl font-bold text-gray-900">SIP Calculator</h2>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-lg">
        {/* Monthly Investment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Investment (₹)
          </label>
          <input
            type="number"
            name="monthly_investment"
            value={inputs.monthly_investment}
            onChange={handleInputChange}
            min="100"
            step="100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Min: ₹100</p>
        </div>

        {/* Years */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Investment Period (Years)
          </label>
          <input
            type="number"
            name="years"
            value={inputs.years}
            onChange={handleInputChange}
            min="1"
            max="40"
            step="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">1 - 40 years</p>
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
            max="50"
            step="0.5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">0 - 50%</p>
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={calculateSIP}
        disabled={loading}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium flex items-center justify-center gap-2"
      >
        <TrendingUp size={20} />
        {loading ? 'Calculating...' : 'Calculate SIP Returns'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Result Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm font-medium">Total Invested</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₹{result.total_invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm font-medium">Total Gain</p>
              <p className="text-2xl font-bold text-green-700 mt-2">
                ₹{result.total_gain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm font-medium">Maturity Amount</p>
              <p className="text-2xl font-bold text-purple-700 mt-2">
                ₹{result.maturity_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Investment Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded border border-gray-200">
                <p className="text-gray-600 text-sm">Amount Invested</p>
                <p className="text-xl font-bold text-gray-900 mt-2">
                  ₹{result.breakdown.invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="p-4 bg-white rounded border border-gray-200">
                <p className="text-gray-600 text-sm">Earnings (Returns)</p>
                <p className="text-xl font-bold text-green-700 mt-2">
                  ₹{result.breakdown.gained.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Growth Over Time</h3>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: '₹ Amount', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                    <Legend />
                    <Line type="monotone" dataKey="invested" stroke="#3b82f6" name="Amount Invested" strokeWidth={2} />
                    <Line type="monotone" dataKey="value" stroke="#10b981" name="Portfolio Value" strokeWidth={2} />
                    <Line type="monotone" dataKey="gain" stroke="#f59e0b" name="Earnings" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Key Insights</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>
                  By investing ₹{inputs.monthly_investment.toLocaleString('en-IN')} monthly for {inputs.years} years at {inputs.annual_return}% annual return
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>
                  You will invest a total of ₹{result.total_invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>
                  Your investment will grow to ₹{result.maturity_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>
                  Returns earned: ₹{result.total_gain.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({((result.total_gain / result.total_invested) * 100).toFixed(1)}%)
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
