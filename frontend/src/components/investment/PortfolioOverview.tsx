import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'
import axios from 'axios'

interface Portfolio {
  portfolio_id: string
  total_invested: number
  current_value: number
  gain_loss: number
  gain_loss_percentage: number
  investments_count: number
  last_updated: string
}

export default function PortfolioOverview() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const userId = localStorage.getItem('userId')
      
      if (!token || !userId) {
        setError('Authentication required')
        setLoading(false)
        return
      }

      const response = await axios.get(`/api/investments/portfolio/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setPortfolio(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching portfolio:', err)
      setError('Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
        <p className="text-red-600">{error || 'No portfolio data available'}</p>
      </div>
    )
  }

  const isPositive = portfolio.gain_loss >= 0

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Invested */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Invested</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₹{portfolio.total_invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <DollarSign className="text-blue-600" size={32} />
          </div>
        </div>

        {/* Current Value */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Current Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₹{portfolio.current_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <Percent className="text-green-600" size={32} />
          </div>
        </div>

        {/* Gain/Loss */}
        <div className={`rounded-lg shadow p-4 ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                Gain/Loss
              </p>
              <p className={`text-2xl font-bold mt-2 ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                ₹{Math.abs(portfolio.gain_loss).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            {isPositive ? (
              <TrendingUp className="text-green-600" size={32} />
            ) : (
              <TrendingDown className="text-red-600" size={32} />
            )}
          </div>
        </div>

        {/* Gain/Loss % */}
        <div className={`rounded-lg shadow p-4 ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                Return %
              </p>
              <p className={`text-2xl font-bold mt-2 ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                {portfolio.gain_loss_percentage.toFixed(2)}%
              </p>
            </div>
            {isPositive ? (
              <TrendingUp className="text-green-600" size={32} />
            ) : (
              <TrendingDown className="text-red-600" size={32} />
            )}
          </div>
        </div>
      </div>

      {/* Portfolio Info */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600 text-sm">Total Holdings</p>
            <p className="text-xl font-bold text-gray-900">{portfolio.investments_count}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600 text-sm">Last Updated</p>
            <p className="text-sm text-gray-500">
              {new Date(portfolio.last_updated).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
