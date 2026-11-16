import { useState } from 'react'
import { Upload, AlertCircle, CheckCircle } from 'lucide-react'
import axios from 'axios'

interface TransactionImportProps {
  onImportSuccess: () => void
}

export default function TransactionImport({ onImportSuccess }: TransactionImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [preview, setPreview] = useState<any[]>([])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Please upload a CSV file' })
      return
    }

    setFile(selectedFile)
    setMessage(null)

    // Parse CSV for preview
    const text = await selectedFile.text()
    const lines = text.split('\n').slice(0, 6) // Show first 5 rows
    const preview = lines.map(line => line.split(','))
    setPreview(preview)
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('authToken')
      const response = await axios.post('/api/budget/import', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      setMessage({ type: 'success', text: `Successfully imported ${response.data.count} transactions` })
      setFile(null)
      setPreview([])
      setTimeout(onImportSuccess, 1500)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Import failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="card">
        <h2 className="text-xl font-bold mb-6">Import Transactions</h2>

        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 mb-2">Drag and drop your CSV file here, or click to select</p>
          <p className="text-sm text-gray-500 mb-4">Supported formats: CSV</p>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="btn-primary cursor-pointer inline-block">
            Select File
          </label>

          {file && <p className="mt-4 text-green-600">✓ {file.name} selected</p>}
        </div>

        {/* Messages */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg flex gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-900 border border-green-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        {/* Upload Button */}
        {file && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Uploading...' : 'Upload & Import'}
            </button>
            <button
              onClick={() => {
                setFile(null)
                setPreview([])
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Preview (First 5 rows)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  {preview[0]?.map((cell: string, i: number) => (
                    <th key={i} className="px-4 py-2 text-left">{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row: string[], i: number) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    {row.map((cell: string, j: number) => (
                      <td key={j} className="px-4 py-2">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Format Guide */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">CSV Format</h3>
        <p className="text-gray-600 mb-4">Your CSV file should have these columns:</p>
        <div className="bg-gray-50 p-4 rounded font-mono text-sm">
          <p>date,amount,description,category,type,merchant</p>
          <p className="text-gray-500 mt-2">Example:</p>
          <p>2024-01-15,500,Grocery Store,Food,expense,Walmart</p>
          <p>2024-01-16,50000,Salary,Income,income,Employer</p>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          <strong>date:</strong> Transaction date (YYYY-MM-DD)<br/>
          <strong>amount:</strong> Transaction amount<br/>
          <strong>description:</strong> What the transaction was for<br/>
          <strong>category:</strong> Expense category<br/>
          <strong>type:</strong> "expense" or "income"<br/>
          <strong>merchant:</strong> Where the transaction occurred
        </p>
      </div>
    </div>
  )
}
