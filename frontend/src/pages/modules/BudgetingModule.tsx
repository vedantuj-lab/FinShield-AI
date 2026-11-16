import { useState } from 'react'
import { Upload, Plus, BarChart3, TrendingUp, DollarSign } from 'lucide-react'
import TransactionImport from '../../components/budgeting/TransactionImport'
import BudgetDashboard from '../../components/budgeting/BudgetDashboard'
import ExpenseCategories from '../../components/budgeting/ExpenseCategories'
import SpendingInsights from '../../components/budgeting/SpendingInsights'

export default function BudgetingModule() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'import' | 'categories' | 'insights'>('dashboard')
  const [refreshData, setRefreshData] = useState(0)

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'import', label: 'Import Transactions', icon: Upload },
    { id: 'categories', label: 'Categories', icon: DollarSign },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
  ]

  const handleTransactionImport = () => {
    setRefreshData(prev => prev + 1)
    setActiveTab('dashboard')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Smart Budgeting</h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Budget
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow flex gap-4 p-4 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && (
          <BudgetDashboard refreshKey={refreshData} />
        )}
        {activeTab === 'import' && (
          <TransactionImport onImportSuccess={handleTransactionImport} />
        )}
        {activeTab === 'categories' && (
          <ExpenseCategories />
        )}
        {activeTab === 'insights' && (
          <SpendingInsights refreshKey={refreshData} />
        )}
      </div>
    </div>
  )
}
