import { useState } from 'react'
import { Calculator, Copy, RotateCcw, TrendingUp } from 'lucide-react'
import axios from 'axios'

type TabType = 'sip' | 'fd' | 'lumpsum' | 'goal'

interface SIPResult {
  monthly_investment: number
  total_invested: number
  estimated_returns: number
  future_value: number
  breakdown: {
    principal: number
    interest: number
  }
}

interface FDResult {
  principal: number
  annual_rate: number
  years: number
  interest_earned: number
  maturity_amount: number
  breakdown: {
    principal: number
    interest: number
  }
}

interface LumpSumResult {
  principal: number
  annual_return: number
  years: number
  final_amount: number
  gain: number
  breakdown: {
    principal: number
    gains: number
  }
}

interface GoalResult {
  target_amount: number
  annual_return: number
  years: number
  required_monthly_investment: number
  total_invested: number
  breakdown: {
    total_invested: number
    returns: number
  }
}

export default function InvestmentCalculators() {
  const [activeTab, setActiveTab] = useState<TabType>('sip')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // SIP Calculator State
  const [sipInputs, setSipInputs] = useState({
    monthly_investment: 5000,
    annual_return: 12,
    years: 10
  })
  const [sipResult, setSipResult] = useState<SIPResult | null>(null)

  // FD Calculator State
  const [fdInputs, setFdInputs] = useState({
    principal: 100000,
    annual_rate: 6.5,
    years: 5
  })
  const [fdResult, setFdResult] = useState<FDResult | null>(null)

  // Lump Sum Calculator State
  const [lumpSumInputs, setLumpSumInputs] = useState({
    principal: 100000,
    annual_return: 12,
    years: 20
  })
  const [lumpSumResult, setLumpSumResult] = useState<LumpSumResult | null>(null)

  // Goal Calculator State
  const [goalInputs, setGoalInputs] = useState({
    target_amount: 1000000,
    annual_return: 12,
    years: 10
  })
  const [goalResult, setGoalResult] = useState<GoalResult | null>(null)

  const formatCurrency = (value: number): string => {
    return `₹${Math.round(value).toLocaleString('en-IN')}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // SIP Calculator
  const handleSIPCalculate = async () => {
    if (sipInputs.monthly_investment <= 0 || sipInputs.annual_return < 0 || sipInputs.years <= 0) {
      alert('Please enter valid values')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.post('/api/investments/calculate-sip', sipInputs, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setSipResult(response.data)
    } catch (err) {
      console.error('Error calculating SIP:', err)
      alert('Error calculating SIP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSIPReset = () => {
    setSipInputs({ monthly_investment: 5000, annual_return: 12, years: 10 })
    setSipResult(null)
  }

  // FD Calculator
  const handleFDCalculate = async () => {
    if (fdInputs.principal <= 0 || fdInputs.annual_rate < 0 || fdInputs.years <= 0) {
      alert('Please enter valid values')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.post('/api/investments/calculate-fd', fdInputs, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setFdResult(response.data)
    } catch (err) {
      console.error('Error calculating FD:', err)
      alert('Error calculating FD. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFDReset = () => {
    setFdInputs({ principal: 100000, annual_rate: 6.5, years: 5 })
    setFdResult(null)
  }

  // Lump Sum Calculator
  const handleLumpSumCalculate = async () => {
    if (lumpSumInputs.principal <= 0 || lumpSumInputs.annual_return < 0 || lumpSumInputs.years <= 0) {
      alert('Please enter valid values')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.post('/api/investments/calculate-lumpsum', lumpSumInputs, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setLumpSumResult(response.data)
    } catch (err) {
      console.error('Error calculating Lump Sum:', err)
      alert('Error calculating Lump Sum. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLumpSumReset = () => {
    setLumpSumInputs({ principal: 100000, annual_return: 12, years: 20 })
    setLumpSumResult(null)
  }

  // Goal Calculator
  const handleGoalCalculate = async () => {
    if (goalInputs.target_amount <= 0 || goalInputs.annual_return < 0 || goalInputs.years <= 0) {
      alert('Please enter valid values')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.post('/api/investments/calculate-goal', goalInputs, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setGoalResult(response.data)
    } catch (err) {
      console.error('Error calculating Goal:', err)
      alert('Error calculating Goal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoalReset = () => {
    setGoalInputs({ target_amount: 1000000, annual_return: 12, years: 10 })
    setGoalResult(null)
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {[
          { id: 'sip', label: 'SIP Calculator' },
          { id: 'fd', label: 'FD Calculator' },
          { id: 'lumpsum', label: 'Lump Sum' },
          { id: 'goal', label: 'Goal-Based' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SIP Calculator */}
      {activeTab === 'sip' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <div className="card bg-blue-50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calculator size={20} className="text-blue-600" />
              SIP Calculator
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Monthly Investment (₹)</label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={sipInputs.monthly_investment}
                  onChange={(e) => setSipInputs({ ...sipInputs, monthly_investment: parseFloat(e.target.value) })}
                  className="input-field w-full"
                />
                <input
                  type="range"
                  min="100"
                  max="100000"
                  step="500"
                  value={sipInputs.monthly_investment}
                  onChange={(e) => setSipInputs({ ...sipInputs, monthly_investment: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">₹100 - ₹100,000</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Annual Return (%)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={sipInputs.annual_return}
                  onChange={(e) => setSipInputs({ ...sipInputs, annual_return: parseFloat(e.target.value) })}
                  className="input-field w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={sipInputs.annual_return}
                  onChange={(e) => setSipInputs({ ...sipInputs, annual_return: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">0% - 30%</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Years</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={sipInputs.years}
                  onChange={(e) => setSipInputs({ ...sipInputs, years: parseFloat(e.target.value) })}
                  className="input-field w-full"
                />
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={sipInputs.years}
                  onChange={(e) => setSipInputs({ ...sipInputs, years: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">1 - 50 years</p>
              </div>

              <div className="flex gap-3">
                <button onClick={handleSIPCalculate} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Calculating...' : 'Calculate'}
                </button>
                <button onClick={handleSIPReset} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Result Card */}
          {sipResult && (
            <div className="space-y-4">
              <div className="card border-2 border-green-200 bg-green-50">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-600" />
                  Results
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded border border-green-200">
                    <p className="text-sm text-gray-600">💰 Maturity Amount</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(sipResult.future_value)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600">Total Invested</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(sipResult.total_invested)}</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600">⬆️ Total Gain</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(sipResult.estimated_returns)}</p>
                    </div>
                  </div>

                  <div className="bg-blue-100 p-3 rounded">
                    <p className="text-xs font-medium text-blue-900 mb-2">Breakdown</p>
                    <div className="text-sm text-blue-800">
                      <p>Principal: {formatCurrency(sipResult.breakdown.principal)}</p>
                      <p>Interest: {formatCurrency(sipResult.breakdown.interest)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(`Maturity Amount: ${formatCurrency(sipResult.future_value)}, Total Invested: ${formatCurrency(sipResult.total_invested)}, Total Gain: ${formatCurrency(sipResult.estimated_returns)}`)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Copy size={18} />
                    {copied ? 'Copied!' : 'Copy Results'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FD Calculator */}
      {activeTab === 'fd' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <div className="card bg-blue-50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calculator size={20} className="text-blue-600" />
              FD Calculator
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Principal (₹)</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={fdInputs.principal}
                  onChange={(e) => setFdInputs({ ...fdInputs, principal: parseFloat(e.target.value) })}
                  className="input-field w-full"
                />
                <input
                  type="range"
                  min="1000"
                  max="10000000"
                  step="10000"
                  value={fdInputs.principal}
                  onChange={(e) => setFdInputs({ ...fdInputs, principal: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">₹1,000 - ₹1,00,00,000</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Interest Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  value={fdInputs.annual_rate}
                  onChange={(e) => setFdInputs({ ...fdInputs, annual_rate: parseFloat(e.target.value) })}
                  className="input-field w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.25"
                  value={fdInputs.annual_rate}
                  onChange={(e) => setFdInputs({ ...fdInputs, annual_rate: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">0% - 20%</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Years</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  value={fdInputs.years}
                  onChange={(e) => setFdInputs({ ...fdInputs, years: parseFloat(e.target.value) })}
                  className="input-field w-full"
                />
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={fdInputs.years}
                  onChange={(e) => setFdInputs({ ...fdInputs, years: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">1 - 20 years</p>
              </div>

              <div className="flex gap-3">
                <button onClick={handleFDCalculate} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Calculating...' : 'Calculate'}
                </button>
                <button onClick={handleFDReset} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Result Card */}
          {fdResult && (
            <div className="space-y-4">
              <div className="card border-2 border-green-200 bg-green-50">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-600" />
                  Results
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded border border-green-200">
                    <p className="text-sm text-gray-600">💰 Maturity Amount</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(fdResult.maturity_amount)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600">Principal</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(fdResult.principal)}</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600">⬆️ Interest</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(fdResult.interest_earned)}</p>
                    </div>
                  </div>

                  <div className="bg-blue-100 p-3 rounded">
                    <p className="text-xs font-medium text-blue-900 mb-2">Breakdown</p>
                    <div className="text-sm text-blue-800">
                      <p>Principal: {formatCurrency(fdResult.breakdown.principal)}</p>
                      <p>Interest: {formatCurrency(fdResult.breakdown.interest)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(`Maturity Amount: ${formatCurrency(fdResult.maturity_amount)}, Principal: ${formatCurrency(fdResult.principal)}, Interest: ${formatCurrency(fdResult.interest_earned)}`)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Copy size={18} />
                    {copied ? 'Copied!' : 'Copy Results'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lump Sum Calculator */}
      {activeTab === 'lumpsum' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <div className="card bg-blue-50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calculator size={20} className="text-blue-600" />
              Lump Sum Calculator
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Initial Investment (₹)</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={lumpSumInputs.principal}
                  onChange={(e) => setLumpSumInputs({ ...lumpSumInputs, principal: parseFloat(e.target.value) })}
                  className="input-field w-full"
                />
                <input
                  type="range"
                  min="1000"
                  max="10000000"
                  step="10000"
                  value={lumpSumInputs.principal}
                  onChange={(e) => setLumpSumInputs({ ...lumpSumInputs, principal: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">₹1,000 - ₹1,00,00,000</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Annual Return (%)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={lumpSumInputs.annual_return}
                  onChange={(e) => setLumpSumInputs({ ...lumpSumInputs, annual_return: parseFloat(e.target.value) })}
                  className="input-field w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={lumpSumInputs.annual_return}
                  onChange={(e) => setLumpSumInputs({ ...lumpSumInputs, annual_return: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">0% - 30%</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Years</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={lumpSumInputs.years}
                  onChange={(e) => setLumpSumInputs({ ...lumpSumInputs, years: parseFloat(e.target.value) })}
                  className="input-field w-full"
                />
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={lumpSumInputs.years}
                  onChange={(e) => setLumpSumInputs({ ...lumpSumInputs, years: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">1 - 50 years</p>
              </div>

              <div className="flex gap-3">
                <button onClick={handleLumpSumCalculate} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Calculating...' : 'Calculate'}
                </button>
                <button onClick={handleLumpSumReset} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Result Card */}
          {lumpSumResult && (
            <div className="space-y-4">
              <div className="card border-2 border-green-200 bg-green-50">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-600" />
                  Results
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded border border-green-200">
                    <p className="text-sm text-gray-600">💰 Final Amount</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(lumpSumResult.final_amount)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600">Principal</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(lumpSumResult.principal)}</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600">⬆️ Gain</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(lumpSumResult.gain)}</p>
                    </div>
                  </div>

                  <div className="bg-blue-100 p-3 rounded">
                    <p className="text-xs font-medium text-blue-900 mb-2">Breakdown</p>
                    <div className="text-sm text-blue-800">
                      <p>Principal: {formatCurrency(lumpSumResult.breakdown.principal)}</p>
                      <p>Gains: {formatCurrency(lumpSumResult.breakdown.gains)}</p>
                      <p className="mt-2 font-semibold">Multiplier: {(lumpSumResult.final_amount / lumpSumResult.principal).toFixed(2)}x</p>
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(`Final Amount: ${formatCurrency(lumpSumResult.final_amount)}, Principal: ${formatCurrency(lumpSumResult.principal)}, Gain: ${formatCurrency(lumpSumResult.gain)}`)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Copy size={18} />
                    {copied ? 'Copied!' : 'Copy Results'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goal-Based Calculator */}
      {activeTab === 'goal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <div className="card bg-blue-50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calculator size={20} className="text-blue-600" />
              Goal-Based Calculator
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Target Amount (₹)</label>
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  value={goalInputs.target_amount}
                  onChange={(e) => setGoalInputs({ ...goalInputs, target_amount: parseFloat(e.target.value) })}
                  className="input-field w-full"
                />
                <input
                  type="range"
                  min="10000"
                  max="100000000"
                  step="100000"
                  value={goalInputs.target_amount}
                  onChange={(e) => setGoalInputs({ ...goalInputs, target_amount: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">₹10,000 - ₹10,00,00,000</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expected Annual Return (%)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={goalInputs.annual_return}
                  onChange={(e) => setGoalInputs({ ...goalInputs, annual_return: parseFloat(e.target.value) })}
                  className="input-field w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={goalInputs.annual_return}
                  onChange={(e) => setGoalInputs({ ...goalInputs, annual_return: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">0% - 30%</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Years</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={goalInputs.years}
                  onChange={(e) => setGoalInputs({ ...goalInputs, years: parseFloat(e.target.value) })}
                  className="input-field w-full"
                />
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={goalInputs.years}
                  onChange={(e) => setGoalInputs({ ...goalInputs, years: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">1 - 50 years</p>
              </div>

              <div className="flex gap-3">
                <button onClick={handleGoalCalculate} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Calculating...' : 'Calculate'}
                </button>
                <button onClick={handleGoalReset} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Result Card */}
          {goalResult && (
            <div className="space-y-4">
              <div className="card border-2 border-green-200 bg-green-50">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-600" />
                  Results
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded border border-green-200">
                    <p className="text-sm text-gray-600">📊 Required Monthly Investment</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(goalResult.required_monthly_investment)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600">Total Invested</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(goalResult.total_invested)}</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600">⬆️ Total Gains</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(goalResult.breakdown.returns)}</p>
                    </div>
                  </div>

                  <div className="bg-blue-100 p-3 rounded">
                    <p className="text-xs font-medium text-blue-900 mb-2">Breakdown</p>
                    <div className="text-sm text-blue-800">
                      <p>Target: {formatCurrency(goalResult.target_amount)}</p>
                      <p>Total Invested: {formatCurrency(goalResult.breakdown.total_invested)}</p>
                      <p>Returns: {formatCurrency(goalResult.breakdown.returns)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(`Required Monthly: ${formatCurrency(goalResult.required_monthly_investment)}, Total Invested: ${formatCurrency(goalResult.total_invested)}, Total Gains: ${formatCurrency(goalResult.breakdown.returns)}`)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Copy size={18} />
                    {copied ? 'Copied!' : 'Copy Results'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
