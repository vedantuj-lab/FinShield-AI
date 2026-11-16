import { useState } from 'react'
import { FileText, ChevronRight, AlertCircle } from 'lucide-react'
import axios from 'axios'

interface Deduction {
  type: string
  code: string
  amount?: number
  max_amount?: number
  description: string
  applicable?: boolean
  required_documents?: string[]
}

interface DeductionSuggestions {
  applicable_deductions: Deduction[]
  total_possible_deduction: number
  explanation: string
}

export default function DeductionAssistant() {
  const [inputs, setInputs] = useState({
    financial_year: '2024-25',
    income_type: 'salary',
    salary: 500000,
    has_hra: true,
    has_health_insurance: false,
    has_life_insurance: false,
  })

  const [suggestions, setSuggestions] = useState<DeductionSuggestions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setInputs(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'income_type' || name === 'financial_year' ? value : parseFloat(value) || 0,
    }))
    setSuggestions(null)
  }

  const getSuggestions = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('authToken')

      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await axios.post('/api/tax/deductions', {
        financial_year: inputs.financial_year,
        income_type: inputs.income_type,
        salary: inputs.salary,
        has_hra: inputs.has_hra,
        has_health_insurance: inputs.has_health_insurance,
        has_life_insurance: inputs.has_life_insurance,
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setSuggestions(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get deduction suggestions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-gray-800">Deduction Assistant</h2>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="salary">Salaried</option>
            <option value="self_employed">Self-Employed</option>
            <option value="mixed">Mixed Income</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Salary (₹)
          </label>
          <input
            type="number"
            name="salary"
            value={inputs.salary}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Your Situation</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="has_hra"
              checked={inputs.has_hra}
              onChange={handleInputChange}
              className="w-4 h-4 text-orange-600 rounded"
            />
            <span className="text-gray-700">I receive HRA</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="has_health_insurance"
              checked={inputs.has_health_insurance}
              onChange={handleInputChange}
              className="w-4 h-4 text-orange-600 rounded"
            />
            <span className="text-gray-700">I have health insurance</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="has_life_insurance"
              checked={inputs.has_life_insurance}
              onChange={handleInputChange}
              className="w-4 h-4 text-orange-600 rounded"
            />
            <span className="text-gray-700">I have life insurance</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <button
        onClick={getSuggestions}
        disabled={loading}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-md transition"
      >
        {loading ? 'Getting Suggestions...' : 'Get Deduction Suggestions'}
      </button>

      {suggestions && (
        <div className="mt-8">
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-600 rounded">
            <h3 className="font-bold text-green-800 mb-2">Total Possible Deductions</h3>
            <p className="text-3xl font-bold text-green-600">
              ₹{suggestions.total_possible_deduction.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {suggestions.applicable_deductions.map((deduction, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="w-full p-4 hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-800">{deduction.type}</h4>
                    <p className="text-sm text-gray-600">{deduction.code}</p>
                  </div>
                  <ChevronRight 
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedIndex === index ? 'rotate-90' : ''}`}
                  />
                </button>

                {expandedIndex === index && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <p className="text-gray-700 mb-3">{deduction.description}</p>

                    {deduction.amount && (
                      <div className="mb-3 p-2 bg-white rounded border border-orange-200">
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="text-lg font-semibold text-orange-600">
                          ₹{deduction.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}

                    {deduction.max_amount && (
                      <div className="mb-3 p-2 bg-white rounded border border-blue-200">
                        <p className="text-sm text-gray-600">Maximum Limit</p>
                        <p className="text-lg font-semibold text-blue-600">
                          ₹{deduction.max_amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}

                    {deduction.required_documents && deduction.required_documents.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Required Documents:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {deduction.required_documents.map((doc, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {deduction.applicable === false && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded flex gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                          Not applicable based on your current profile
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Important Notes</h4>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">
              {suggestions.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
