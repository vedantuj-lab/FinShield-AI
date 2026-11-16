import { useEffect, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import axios from 'axios'
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react'

interface BudgetDashboardProps {
  refreshKey: number
}

export default function BudgetDashboard({ refreshKey }: BudgetDashboardProps) {
  const [budget, setBudget] = useState<any>(null)
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899']

  useEffect(() => {
    fetchBudgetData()
  }, [refreshKey])

  const fetchBudgetData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')

      const [summaryRes] = await Promise.all([
        axios.get('/api/budget/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('/api/budget/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      // Process category data
      const categories: { [key: string]: number } = {}
      summaryRes.data.categoryBreakdown?.forEach((item: any) => {
        categories[item.category] = item.amount
      })

      const categoryArray = Object.entries(categories).map(([name, value]) => ({
        name,
        value
      }))
      setCategoryData(categoryArray)

      // Calculate budget data
      const totalIncome = summaryRes.data.total_income || 0
      const totalExpenses = summaryRes.data.total_expenses || 0
      const budgetData = {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        remaining: Math.max(0, totalIncome - totalExpenses),
        savings_percent: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0
      }
      setBudget(budgetData)
    } catch (err) {
      console.error('Error fetching budget data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading budget data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm">Total Income</p>
              <p className="text-2xl font-bold text-green-600">₹{budget?.total_income?.toLocaleString()}</p>
            </div>
            <TrendingUp className="text-green-600" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">₹{budget?.total_expenses?.toLocaleString()}</p>
            </div>
            <TrendingDown className="text-red-600" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm">Remaining Balance</p>
              <p className="text-2xl font-bold text-blue-600">₹{budget?.remaining?.toLocaleString()}</p>
            </div>
            <DollarSign className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm">Savings %</p>
              <p className="text-2xl font-bold text-emerald-600">{budget?.savings_percent}%</p>
            </div>
            <Target className="text-emerald-600" size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              {
                name: 'Monthly',
                Income: budget?.total_income || 0,
                Expenses: budget?.total_expenses || 0
              }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
              <Bar dataKey="Income" fill="#10b981" />
              <Bar dataKey="Expenses" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Spending by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: { name: string; value: number }) => `${name}: ₹${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No transaction data. Import transactions to see breakdown.
            </div>
          )}
        </div>
      </div>

      {/* Category Details Table */}
      {categoryData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Category Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ₹{item.value?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {((item.value / (budget?.total_expenses || 1)) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t font-bold">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">₹{budget?.total_expenses?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
