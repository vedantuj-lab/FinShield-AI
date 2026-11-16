import { useState } from 'react'
import { Edit2 } from 'lucide-react'

const DEFAULT_CATEGORIES = [
  { name: 'Food', emoji: '🍔', description: 'Groceries, restaurants, food delivery' },
  { name: 'Shopping', emoji: '🛍️', description: 'Clothes, accessories, household items' },
  { name: 'Transport', emoji: '🚗', description: 'Fuel, public transport, car maintenance' },
  { name: 'Healthcare', emoji: '⚕️', description: 'Medical, pharmacy, health services' },
  { name: 'Education', emoji: '📚', description: 'Courses, books, tuition' },
  { name: 'Rent', emoji: '🏠', description: 'Housing, utilities' },
  { name: 'Entertainment', emoji: '🎬', description: 'Movies, games, streaming' },
  { name: 'Investments', emoji: '📈', description: 'Mutual funds, stocks, savings' },
  { name: 'Transfers', emoji: '💸', description: 'Transfers to friends, loans' },
  { name: 'Bills', emoji: '📄', description: 'Phone, internet, insurance' },
  { name: 'Travel', emoji: '✈️', description: 'Hotels, flights, tours' },
  { name: 'Other', emoji: '📦', description: 'Miscellaneous expenses' },
]

interface CategoryBudget {
  category: string
  budget: number
}

export default function ExpenseCategories() {
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([])
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingBudget, setEditingBudget] = useState('')

  const handleSetBudget = (category: string) => {
    if (!editingBudget) return

    const existing = categoryBudgets.find(cb => cb.category === category)
    if (existing) {
      setCategoryBudgets(categoryBudgets.map(cb =>
        cb.category === category ? { ...cb, budget: parseFloat(editingBudget) } : cb
      ))
    } else {
      setCategoryBudgets([...categoryBudgets, { category, budget: parseFloat(editingBudget) }])
    }

    setEditingCategory(null)
    setEditingBudget('')
  }

  const getBudgetForCategory = (category: string) => {
    return categoryBudgets.find(cb => cb.category === category)?.budget || 0
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Expense Categories</h2>
        <p className="text-gray-600 mb-6">Set budget limits for each category to track your spending</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEFAULT_CATEGORIES.map(category => {
            const budget = getBudgetForCategory(category.name)
            const isEditing = editingCategory === category.name

            return (
              <div key={category.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.emoji}</span>
                    <div>
                      <h3 className="font-bold">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editingBudget}
                        onChange={(e) => setEditingBudget(e.target.value)}
                        placeholder="Budget amount"
                        className="input-field flex-1"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSetBudget(category.name)}
                        className="btn-primary px-3"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="btn-secondary px-3"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Budget Limit</p>
                        <p className="text-lg font-bold">
                          ₹{budget?.toLocaleString() || '—'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingCategory(category.name)
                          setEditingBudget(budget?.toString() || '')
                        }}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit2 size={18} className="text-gray-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Budget Summary */}
      {categoryBudgets.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Budget Summary</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-900">
              Total Category Budgets: <span className="font-bold">₹{categoryBudgets.reduce((sum, cb) => sum + cb.budget, 0).toLocaleString()}</span>
            </p>
            <p className="text-sm text-blue-800 mt-2">
              You've set budget limits for {categoryBudgets.length} categor{categoryBudgets.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card bg-emerald-50 border border-emerald-200">
        <h3 className="text-lg font-bold text-emerald-900 mb-3">💡 Budgeting Tips</h3>
        <ul className="space-y-2 text-emerald-900 text-sm">
          <li>• Set realistic budgets based on your spending history</li>
          <li>• Track your spending against each category's budget</li>
          <li>• Review and adjust budgets monthly</li>
          <li>• Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
          <li>• Prioritize savings and emergency funds</li>
        </ul>
      </div>
    </div>
  )
}
