import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import axios from 'axios'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface Holding {
  name: string
  current_value: number
  category: string
  sector?: string
}

interface RiskAnalysis {
  risk_score: number
  risk_level: string
  concentration_risk: number
  diversification_score: number
  volatility_estimate: number
  holdings_analysis: Array<{
    name: string
    weight_percent: number
    category: string
    value: number
  }>
  sector_breakdown: Array<{
    sector: string
    value: number
    percent: number
  }>
  recommendations: string[]
}

export default function RiskAnalysisDisplay() {
  const [holdings] = useState<Holding[]>([
    { name: 'HDFC Bank', current_value: 100000, category: 'Stock', sector: 'Banking' },
    { name: 'Axis Mutual Fund', current_value: 50000, category: 'Mutual Fund', sector: 'Diversified' },
    { name: 'FD - HDFC', current_value: 50000, category: 'FD', sector: 'Fixed Income' },
  ])
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzePortfolio = async () => {
    if (holdings.length === 0) {
      setError('Please add at least one holding')
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

      const response = await axios.post('/api/investments/calculate-risk', {
        holdings: holdings
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setAnalysis(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze portfolio')
      console.error('Error analyzing portfolio:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'VeryHigh':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Portfolio Risk Analysis</h2>
        <button
          onClick={analyzePortfolio}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
        >
          {loading ? 'Analyzing...' : 'Analyze Portfolio'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Risk Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <p className="text-gray-600 text-sm font-medium mb-2">Overall Risk Score</p>
              <p className="text-4xl font-bold text-gray-900 mb-2">{analysis.risk_score}/100</p>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getRiskColor(analysis.risk_level)}`}>
                {analysis.risk_level} Risk
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Concentration Risk</span>
                <span className="font-bold text-gray-900">{analysis.concentration_risk.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Diversification Score</span>
                <span className="font-bold text-gray-900">{analysis.diversification_score.toFixed(1)}/100</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Volatility Estimate</span>
                <span className="font-bold text-gray-900">{analysis.volatility_estimate.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Holdings Analysis Chart */}
          {analysis.holdings_analysis.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Portfolio Allocation</h3>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analysis.holdings_analysis}
                      dataKey="weight_percent"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {analysis.holdings_analysis.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `${value.toFixed(2)}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Sector Breakdown */}
          {analysis.sector_breakdown.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sector Breakdown</h3>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.sector_breakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sector" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="percent" fill="#3b82f6" name="Percentage" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="text-blue-600" size={20} />
                Recommendations
              </h3>
              <ul className="space-y-3">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
