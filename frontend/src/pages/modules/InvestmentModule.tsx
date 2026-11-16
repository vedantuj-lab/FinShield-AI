import { useState } from 'react'
import { BookOpen, TrendingUp, Calculator, AlertCircle } from 'lucide-react'
import InvestmentEducation from '../../components/investment/InvestmentEducation'
import PortfolioManager from '../../components/investment/PortfolioManager'
import RiskAnalysis from '../../components/investment/RiskAnalysis'
import InvestmentCalculators from '../../components/investment/InvestmentCalculators'

export default function InvestmentModule() {
  const [activeTab, setActiveTab] = useState<'education' | 'portfolio' | 'risk' | 'calculators'>('education')

  const tabs = [
    { id: 'education', label: 'Learn', icon: BookOpen },
    { id: 'portfolio', label: 'My Portfolio', icon: TrendingUp },
    { id: 'risk', label: 'Risk Analysis', icon: AlertCircle },
    { id: 'calculators', label: 'Calculators', icon: Calculator },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Investment & Portfolio Guide</h1>
        <p className="text-gray-600">Learn, invest, and grow your wealth</p>
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
        {activeTab === 'education' && <InvestmentEducation />}
        {activeTab === 'portfolio' && <PortfolioManager />}
        {activeTab === 'risk' && <RiskAnalysis />}
        {activeTab === 'calculators' && <InvestmentCalculators />}
      </div>
    </div>
  )
}
