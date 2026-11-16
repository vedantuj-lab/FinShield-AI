import { useState, useEffect } from 'react'
import { AlertCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import axios from 'axios'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

interface Holding {
  name: string
  weight_percent: number
  category: string
}

interface SectorBreakdown {
  sector: string
  value: number
  percent: number
}

interface RiskAnalysisData {
  risk_score: number
  risk_level: string
  concentration_risk: number
  diversification_score: number
  volatility_estimate: number
  holdings_analysis: Holding[]
  sector_breakdown: SectorBreakdown[]
  recommendations: string[]
}

export default function RiskAnalysis() {
  const [riskData, setRiskData] = useState<RiskAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [portfolio, setPortfolio] = useState<any[]>([])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const getRiskColor = (score: number) => {
    if (score <= 25) return '#10b981' // Green
    if (score <= 50) return '#f59e0b' // Yellow
    if (score <= 75) return '#ef4444' // Orange
    return '#7f1d1d' // Dark Red
  }

  const getRiskLabel = (score: number) => {
    if (score <= 25) return 'Low'
    if (score <= 50) return 'Medium'
    if (score <= 75) return 'High'
    return 'Very High'
  }

  const getRiskBgClass = (score: number) => {
    if (score <= 25) return 'bg-green-50'
    if (score <= 50) return 'bg-yellow-50'
    if (score <= 75) return 'bg-orange-50'
    return 'bg-red-50'
  }

  const getRiskBorderClass = (score: number) => {
    if (score <= 25) return 'border-green-200'
    if (score <= 50) return 'border-yellow-200'
    if (score <= 75) return 'border-orange-200'
    return 'border-red-200'
  }

  const getRiskTextClass = (score: number) => {
    if (score <= 25) return 'text-green-900'
    if (score <= 50) return 'text-yellow-900'
    if (score <= 75) return 'text-orange-900'
    return 'text-red-900'
  }

  useEffect(() => {
    fetchAnalysis()
  }, [])

  const fetchAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch portfolio
      const token = localStorage.getItem('authToken')
      const portfolioResponse = await axios.get('/api/investments/portfolio', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Extract holdings from portfolio
      const holdings = portfolioResponse.data.map((inv: any) => ({
        name: inv.name,
        value: inv.current_value || inv.purchase_value,
        category: inv.category,
        sector: inv.category // Using category as sector for now
      }))

      setPortfolio(holdings)

      // Analyze risk
      if (holdings.length === 0) {
        setRiskData(null)
        setLoading(false)
        return
      }

      const analysisResponse = await axios.post(
        '/api/investments/analyze',
        { holdings },
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      setRiskData(analysisResponse.data)
    } catch (err) {
      console.error('Error fetching risk analysis:', err)
      setError('Failed to load risk analysis. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const RiskGauge = ({ value, label, maxValue = 100 }: { value: number; label: string; maxValue?: number }) => {
    const percentage = (value / maxValue) * 100
    const color = getRiskColor(value)

    return (
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold" style={{ color }}>
            {value.toFixed(1)}
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <TrendingUp size={40} className="text-blue-600" />
          </div>
          <p className="text-gray-600">Analyzing your portfolio risk...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-red-900">Error</h3>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!riskData || portfolio.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
        <AlertCircle size={40} className="mx-auto text-blue-600 mb-3" />
        <p className="text-blue-900 font-medium">No portfolio data available</p>
        <p className="text-blue-800 text-sm mt-2">
          Add investments in the Portfolio Manager tab to see your risk analysis.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Risk Level Badge - Top */}
      <div className={`card border-2 ${getRiskBorderClass(riskData.risk_score)} ${getRiskBgClass(riskData.risk_score)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${getRiskTextClass(riskData.risk_score)}`}>Overall Risk Level</p>
            <h2 className={`text-4xl font-bold mt-2 ${getRiskTextClass(riskData.risk_score)}`}>
              {getRiskLabel(riskData.risk_score)}
            </h2>
            <p className={`text-sm mt-2 ${getRiskTextClass(riskData.risk_score)}`}>
              Risk Score: {riskData.risk_score.toFixed(0)}/100
            </p>
          </div>
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ backgroundColor: getRiskColor(riskData.risk_score) + '20', borderWidth: '3px', borderColor: getRiskColor(riskData.risk_score) }}
          >
            <p className="text-3xl font-bold" style={{ color: getRiskColor(riskData.risk_score) }}>
              {riskData.risk_score.toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskGauge value={riskData.concentration_risk} label="Concentration Risk" />
        <RiskGauge value={riskData.diversification_score} label="Diversification Score" />
        <RiskGauge value={riskData.volatility_estimate} label="Volatility Estimate (%)" maxValue={100} />
      </div>

      {/* Holdings Table with Percentages */}
      {riskData.holdings_analysis.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Portfolio Holdings</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Investment Name</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-right">Concentration %</th>
                </tr>
              </thead>
              <tbody>
                {riskData.holdings_analysis.map((holding, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{holding.name}</td>
                    <td className="px-4 py-3 text-gray-600">{holding.category}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 bg-gray-200 rounded h-2">
                          <div
                            className="bg-blue-600 h-2 rounded"
                            style={{ width: `${Math.min(holding.weight_percent, 100)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900 min-w-[45px]">
                          {holding.weight_percent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sector Breakdown Pie Chart */}
      {riskData.sector_breakdown.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Sector/Asset Class Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskData.sector_breakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ sector, percent }: { sector: string; percent: number }) => `${sector}: ${percent.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="percent"
              >
                {riskData.sector_breakdown.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${(value as number).toFixed(1)}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recommendations */}
      {riskData.recommendations.length > 0 && (
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-4">📋 Recommendations</h3>
          <div className="space-y-3">
            {riskData.recommendations.map((rec, idx) => {
              let icon = <AlertCircle className="text-blue-600" size={20} />
              if (rec.toLowerCase().includes('good')) {
                icon = <TrendingUp className="text-green-600" size={20} />
              } else if (rec.toLowerCase().includes('consider') || rec.toLowerCase().includes('add')) {
                icon = <TrendingDown className="text-yellow-600" size={20} />
              } else if (rec.toLowerCase().includes('too much') || rec.toLowerCase().includes('diversify')) {
                icon = <AlertTriangle className="text-orange-600" size={20} />
              }

              return (
                <div key={idx} className="flex gap-3 items-start p-3 bg-white rounded border border-blue-100">
                  <div className="flex-shrink-0">{icon}</div>
                  <p className="text-gray-800 text-sm">{rec}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Risk Education */}
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-amber-900 mb-3">📚 Understanding Risk Levels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded border-l-4 border-green-500">
            <p className="font-bold text-green-700">Low Risk (0-25)</p>
            <p className="text-sm text-gray-700 mt-1">Conservative portfolio with focus on stability. Suitable for short-term goals.</p>
          </div>
          <div className="bg-white p-3 rounded border-l-4 border-yellow-500">
            <p className="font-bold text-yellow-700">Medium Risk (26-50)</p>
            <p className="text-sm text-gray-700 mt-1">Balanced approach with moderate growth. Good for medium-term goals (5-10 years).</p>
          </div>
          <div className="bg-white p-3 rounded border-l-4 border-orange-500">
            <p className="font-bold text-orange-700">High Risk (51-75)</p>
            <p className="text-sm text-gray-700 mt-1">Growth-oriented with higher volatility. Suitable for long-term goals (10+ years).</p>
          </div>
          <div className="bg-white p-3 rounded border-l-4 border-red-500">
            <p className="font-bold text-red-700">Very High Risk (76-100)</p>
            <p className="text-sm text-gray-700 mt-1">Aggressive portfolio. Consider diversification to reduce risk.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
