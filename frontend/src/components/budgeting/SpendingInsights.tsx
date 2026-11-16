import { useEffect, useState } from 'react'
import axios from 'axios'
import { TrendingUp, AlertCircle, Lightbulb, Check } from 'lucide-react'

interface InsightType {
  type: 'positive' | 'warning' | 'suggestion'
  title: string
  description: string
  action?: string
}

interface SpendingInsightsProps {
  refreshKey: number
}

export default function SpendingInsights({ refreshKey }: SpendingInsightsProps) {
  const [insights, setInsights] = useState<InsightType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsights()
  }, [refreshKey])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')

      const response = await axios.get('/api/budget/insights', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Generate insights from the data
      const generatedInsights = generateInsights(response.data)
      setInsights(generatedInsights)
    } catch (err) {
      console.error('Error fetching insights:', err)
      setInsights(getDefaultInsights())
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = (data: any): InsightType[] => {
    const insights: InsightType[] = []

    if (!data || Object.keys(data).length === 0) {
      return getDefaultInsights()
    }

    // Insight 1: Spending Overview
    if (data.total_income && data.total_expenses) {
      const savingsRate = ((data.total_income - data.total_expenses) / data.total_income) * 100
      if (savingsRate >= 20) {
        insights.push({
          type: 'positive',
          title: '💰 Great Savings Rate!',
          description: `You're saving ${savingsRate.toFixed(1)}% of your income this month. Keep it up!`,
        })
      } else if (savingsRate >= 10) {
        insights.push({
          type: 'suggestion',
          title: '📈 Opportunity to Save More',
          description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Try to reach 20% for better financial health.`,
          action: 'Review your expenses for areas to cut'
        })
      } else {
        insights.push({
          type: 'warning',
          title: '⚠️ Low Savings Rate',
          description: `You're only saving ${savingsRate.toFixed(1)}% of your income. Consider reducing expenses.`,
          action: 'Create a detailed budget and stick to it'
        })
      }
    }

    // Insight 2: Top Spending Category
    if (data.top_category) {
      insights.push({
        type: 'suggestion',
        title: `📊 Your Biggest Expense: ${data.top_category.name}`,
        description: `You spent ₹${data.top_category.amount?.toLocaleString()} on ${data.top_category.name} (${data.top_category.percent}% of total).`,
        action: 'Review this category for optimization opportunities'
      })
    }

    // Insight 3: Budget Status
    if (data.budget_remaining !== undefined) {
      if (data.budget_remaining > 0) {
        insights.push({
          type: 'positive',
          title: '✅ Within Budget',
          description: `You have ₹${data.budget_remaining?.toLocaleString()} left in your budget.`,
        })
      } else {
        insights.push({
          type: 'warning',
          title: '❌ Budget Exceeded',
          description: `You've exceeded your budget by ₹${Math.abs(data.budget_remaining)?.toLocaleString()}.`,
          action: 'Review recent transactions and adjust future spending'
        })
      }
    }

    // Insight 4: Recurring Expenses
    if (data.recurring_expenses?.length > 0) {
      const totalRecurring = data.recurring_expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0)
      insights.push({
        type: 'suggestion',
        title: `🔄 Recurring Expenses: ₹${totalRecurring?.toLocaleString()}/month`,
        description: `You have ${data.recurring_expenses.length} recurring transactions (subscriptions, bills, etc.)`,
        action: 'Review subscriptions - cancel unused ones to save money'
      })
    }

    return insights
  }

  const getDefaultInsights = (): InsightType[] => [
    {
      type: 'suggestion',
      title: 'Start Tracking Your Spending',
      description: 'Import your first month of transactions to get personalized insights and recommendations.',
      action: 'Go to Import Transactions tab'
    },
    {
      type: 'positive',
      title: '💡 Pro Tip: The 50/30/20 Rule',
      description: 'Allocate 50% to needs, 30% to wants, and 20% to savings for healthy finances.',
    },
  ]

  if (loading) {
    return <div className="text-center py-12">Loading insights...</div>
  }

  return (
    <div className="space-y-6">
      {/* Insights Grid */}
      {insights.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {insights.map((insight, idx) => {
            let bgColor = 'bg-blue-50'
            let borderColor = 'border-blue-200'
            let textColor = 'text-blue-900'
            let icon = <Lightbulb size={24} className="text-blue-600" />

            if (insight.type === 'positive') {
              bgColor = 'bg-green-50'
              borderColor = 'border-green-200'
              textColor = 'text-green-900'
              icon = <Check size={24} className="text-green-600" />
            } else if (insight.type === 'warning') {
              bgColor = 'bg-red-50'
              borderColor = 'border-red-200'
              textColor = 'text-red-900'
              icon = <AlertCircle size={24} className="text-red-600" />
            }

            return (
              <div key={idx} className={`${bgColor} border-2 ${borderColor} rounded-lg p-6`}>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">{icon}</div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${textColor}`}>{insight.title}</h3>
                    <p className={`${textColor} mt-2`}>{insight.description}</p>
                    {insight.action && (
                      <p className={`${textColor} text-sm mt-2 italic`}>→ {insight.action}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500">No insights yet. Import transactions to get started!</p>
        </div>
      )}

      {/* Recommendations */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Lightbulb size={28} />
          Smart Recommendations
        </h2>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <h3 className="font-bold text-amber-900 mb-2">📋 Monthly Review</h3>
            <p className="text-amber-800 text-sm">
              Review your spending every month to identify patterns and areas for improvement.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <h3 className="font-bold text-purple-900 mb-2">🎯 Set Goals</h3>
            <p className="text-purple-800 text-sm">
              Set specific savings goals (emergency fund, vacation, investment) to stay motivated.
            </p>
          </div>

          <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-lg">
            <h3 className="font-bold text-cyan-900 mb-2">💳 Reduce Subscriptions</h3>
            <p className="text-cyan-800 text-sm">
              Review all subscriptions (streaming, apps, memberships) and cancel ones you don't use.
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
            <h3 className="font-bold text-indigo-900 mb-2">🏦 Emergency Fund</h3>
            <p className="text-indigo-800 text-sm">
              Try to save 3-6 months of expenses in an emergency fund for financial security.
            </p>
          </div>
        </div>
      </div>

      {/* Spending Trends */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Monthly Trends
        </h3>
        <div className="text-center py-8 text-gray-500">
          <p>Trend data will appear as you import more months of transactions</p>
        </div>
      </div>
    </div>
  )
}
