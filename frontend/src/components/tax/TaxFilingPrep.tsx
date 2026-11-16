import { useState } from 'react'
import { FileCheck, CheckCircle, AlertCircle, Download } from 'lucide-react'
import axios from 'axios'

interface FilingSummary {
  financial_year: string
  total_income: number
  total_deductions: number
  taxable_income: number
  tax_liability: number
  regime_used: string
  deductions_list: any[]
  filing_checklist: string[]
  ready_to_file: boolean
}

export default function TaxFilingPrep() {
  const [financialYear, setFinancialYear] = useState('2024-25')
  const [userId, setUserId] = useState('')
  const [summary, setSummary] = useState<FilingSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set())

  const generateSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('authToken')
      const storedUserId = localStorage.getItem('userId')

      if (!token || !storedUserId) {
        setError('Authentication required')
        return
      }

      const response = await axios.post('/api/tax/filing-summary', {
        financial_year: financialYear,
        user_id: storedUserId,
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setSummary(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate tax filing summary')
    } finally {
      setLoading(false)
    }
  }

  const toggleChecklistItem = (index: number) => {
    const newCompleted = new Set(completedItems)
    if (newCompleted.has(index)) {
      newCompleted.delete(index)
    } else {
      newCompleted.add(index)
    }
    setCompletedItems(newCompleted)
  }

  const downloadSummary = () => {
    if (!summary) return

    const content = `
TAX FILING SUMMARY - FY ${summary.financial_year}
=====================================================

INCOME SUMMARY
--------------
Total Income:            ₹${summary.total_income.toLocaleString('en-IN')}
Total Deductions:        ₹${summary.total_deductions.toLocaleString('en-IN')}
Taxable Income:          ₹${summary.taxable_income.toLocaleString('en-IN')}
Tax Liability:           ₹${summary.tax_liability.toLocaleString('en-IN')}
Tax Regime Used:         ${summary.regime_used.toUpperCase()}

DEDUCTIONS CLAIMED
------------------
${summary.deductions_list.map(d => 
  `${d.deduction_type} (${d.category}): ₹${d.amount.toLocaleString('en-IN')}`
).join('\n')}

FILING CHECKLIST
----------------
${summary.filing_checklist.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Ready to File: ${summary.ready_to_file ? 'YES' : 'NO - More information needed'}
Generated: ${new Date().toLocaleDateString()}
    `

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
    element.setAttribute('download', `tax-filing-summary-${summary.financial_year}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileCheck className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">Tax Filing Preparation</h2>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Financial Year
          </label>
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="2024-25">2024-25</option>
            <option value="2023-24">2023-24</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={generateSummary}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-md transition"
          >
            {loading ? 'Preparing...' : 'Prepare Summary'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          {/* Filing Status */}
          <div className={`p-6 rounded-lg border-2 ${summary.ready_to_file ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-bold ${summary.ready_to_file ? 'text-green-800' : 'text-yellow-800'}`}>
                  {summary.ready_to_file ? '✓ Ready to File' : '⚠ More Information Needed'}
                </h3>
                <p className={`text-sm mt-1 ${summary.ready_to_file ? 'text-green-700' : 'text-yellow-700'}`}>
                  {summary.ready_to_file 
                    ? 'You have all the information needed to file your ITR'
                    : 'Please add more details before filing'}
                </p>
              </div>
              {summary.ready_to_file && (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
            </div>
          </div>

          {/* Income Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{summary.total_income.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600">Total Deductions</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{summary.total_deductions.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600">Taxable Income</p>
              <p className="text-2xl font-bold text-purple-600">
                ₹{summary.taxable_income.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
              <p className="text-sm text-gray-600">Tax Liability</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{summary.tax_liability.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Deductions Summary */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Claimed Deductions</h3>
            {summary.deductions_list.length === 0 ? (
              <p className="text-gray-600">No deductions claimed yet</p>
            ) : (
              <div className="space-y-2">
                {summary.deductions_list.map((deduction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-800">{deduction.deduction_type}</p>
                      <p className="text-sm text-gray-600">{deduction.category}</p>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      ₹{deduction.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filing Checklist */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Filing Checklist</h3>
            <div className="space-y-2">
              {summary.filing_checklist.map((item, index) => (
                <label
                  key={index}
                  className="flex items-start gap-3 p-3 bg-white rounded border border-gray-200 cursor-pointer hover:bg-blue-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={completedItems.has(index)}
                    onChange={() => toggleChecklistItem(index)}
                    className="w-5 h-5 text-blue-600 rounded mt-0.5"
                  />
                  <span className={`text-sm ${completedItems.has(index) ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                    {item}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-800">
                {completedItems.size} of {summary.filing_checklist.length} items completed
              </span>
            </div>
          </div>

          {/* Important Notes */}
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• File your ITR on the official e-filing portal: incometaxindiaefiling.gov.in</li>
              <li>• You can file ITR within 5 months of financial year end for best results</li>
              <li>• Keep all supporting documents for at least 3 years</li>
              <li>• This summary is for reference only. Consult a CA for complex situations</li>
              <li>• E-verify your return within 30 days of filing</li>
            </ul>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadSummary}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition"
          >
            <Download className="w-5 h-5" />
            Download Summary as Text
          </button>
        </div>
      )}
    </div>
  )
}
