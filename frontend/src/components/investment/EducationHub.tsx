import { useState, useEffect } from 'react'
import { BookOpen, ChevronDown, ExternalLink } from 'lucide-react'
import axios from 'axios'

interface EducationResource {
  id: string
  title: string
  content: string
  category: string
  url?: string
  created_at: string
}

export default function EducationHub() {
  const [resources, setResources] = useState<EducationResource[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const categories = [
    'All',
    'SIP',
    'Mutual Funds',
    'Stocks',
    'Bonds',
    'Fixed Deposits',
    'Retirement',
    'Tax',
    'Diversification',
    'Risk'
  ]

  // Default educational resources
  const defaultResources: EducationResource[] = [
    {
      id: '1',
      title: 'Understanding SIP (Systematic Investment Plan)',
      content: 'A Systematic Investment Plan (SIP) is a method of investing a fixed amount regularly. Instead of investing a lump sum, you invest a small amount monthly. This helps reduce the impact of market volatility and takes advantage of rupee-cost averaging. SIPs are ideal for beginners and those wanting disciplined investing.',
      category: 'SIP',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Mutual Funds: A Beginner\'s Guide',
      content: 'A mutual fund pools money from multiple investors to invest in stocks, bonds, and other securities. Professional fund managers manage this portfolio. Advantages include diversification, professional management, and flexibility. Different types include equity funds, debt funds, and balanced funds.',
      category: 'Mutual Funds',
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Stock Market Basics',
      content: 'Stocks represent ownership in a company. When you buy a stock, you become a partial owner. Stock prices fluctuate based on company performance and market conditions. Long-term investing in stocks historically provides good returns, though it comes with volatility.',
      category: 'Stocks',
      created_at: new Date().toISOString(),
    },
    {
      id: '4',
      title: 'Bonds and Fixed Income Securities',
      content: 'Bonds are debt securities where you lend money to a company or government for a fixed period. You receive regular interest payments. Bonds are generally less risky than stocks but offer lower returns. They\'re suitable for conservative investors.',
      category: 'Bonds',
      created_at: new Date().toISOString(),
    },
    {
      id: '5',
      title: 'Fixed Deposits (FD) Explained',
      content: 'A Fixed Deposit is a safe investment option where you deposit money for a fixed period at a guaranteed interest rate. FDs are insured by DICG up to ₹5 lakh. While returns are lower than stocks, they offer safety and predictability.',
      category: 'Fixed Deposits',
      created_at: new Date().toISOString(),
    },
    {
      id: '6',
      title: 'Retirement Planning 101',
      content: 'Retirement planning involves calculating how much you need for retirement and investing accordingly. Start early to benefit from compounding. Create a diversified portfolio with stocks, bonds, and fixed income. Review and adjust your plan periodically.',
      category: 'Retirement',
      created_at: new Date().toISOString(),
    },
    {
      id: '7',
      title: 'Tax-Efficient Investing',
      content: 'Different investments have different tax implications. ELSS (Equity Linked Savings Scheme) offers tax benefits under Section 80C. Index funds and ETFs are tax-efficient due to low turnover. Keep tax implications in mind when investing.',
      category: 'Tax',
      created_at: new Date().toISOString(),
    },
    {
      id: '8',
      title: 'The Power of Diversification',
      content: '\"Don\'t put all eggs in one basket\" - diversification reduces risk. Invest across asset classes (stocks, bonds, FDs), sectors (tech, pharma, banking), and geographies. A well-diversified portfolio helps weather market volatility.',
      category: 'Diversification',
      created_at: new Date().toISOString(),
    },
    {
      id: '9',
      title: 'Understanding Investment Risk',
      content: 'Investment risk is the potential for loss. Different investments have different risk levels. Stocks have high risk/high reward, bonds have medium risk, FDs have low risk. Your risk tolerance depends on age, goals, and financial situation.',
      category: 'Risk',
      created_at: new Date().toISOString(),
    },
    {
      id: '10',
      title: 'Compound Interest: The 8th Wonder',
      content: 'Compound interest is earning returns on your returns. The earlier you start investing, the more powerful compounding becomes. Over 30 years at 12% returns, ₹10,000 becomes ₹2,99,599. Time is your biggest asset in investing.',
      category: 'SIP',
      created_at: new Date().toISOString(),
    },
  ]

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/investments/education/resources')
      setResources(response.data && response.data.length > 0 ? response.data : defaultResources)
      setError(null)
    } catch (err) {
      console.error('Error fetching resources:', err)
      // Use default resources if API fails
      setResources(defaultResources)
    } finally {
      setLoading(false)
    }
  }

  const filteredResources = selectedCategory === 'All'
    ? resources
    : resources.filter(r => r.category === selectedCategory)

  const categoryColors: { [key: string]: string } = {
    'SIP': 'bg-blue-100 text-blue-800',
    'Mutual Funds': 'bg-green-100 text-green-800',
    'Stocks': 'bg-red-100 text-red-800',
    'Bonds': 'bg-yellow-100 text-yellow-800',
    'Fixed Deposits': 'bg-purple-100 text-purple-800',
    'Retirement': 'bg-orange-100 text-orange-800',
    'Tax': 'bg-pink-100 text-pink-800',
    'Diversification': 'bg-indigo-100 text-indigo-800',
    'Risk': 'bg-cyan-100 text-cyan-800',
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="text-blue-600" size={28} />
        <h2 className="text-2xl font-bold text-gray-900">Investment Education Hub</h2>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resources List */}
      <div className="space-y-3">
        {filteredResources.map(resource => (
          <div key={resource.id} className="border border-gray-200 rounded-lg hover:shadow-md transition">
            <button
              onClick={() => setExpandedId(expandedId === resource.id ? null : resource.id)}
              className="w-full p-4 flex items-start justify-between hover:bg-gray-50 transition"
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[resource.category] || 'bg-gray-100 text-gray-800'}`}>
                    {resource.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-1">
                  {resource.content.substring(0, 100)}...
                </p>
              </div>
              <ChevronDown
                className={`text-gray-400 flex-shrink-0 transition-transform ${expandedId === resource.id ? 'rotate-180' : ''}`}
                size={20}
              />
            </button>

            {expandedId === resource.id && (
              <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  {resource.content}
                </p>
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Learn More <ExternalLink size={16} />
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No resources found for this category.</p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
        <p className="font-medium text-gray-900 mb-2">💡 Learning Tips</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Start with the basics before moving to advanced topics</li>
          <li>Combine theory with practical calculators to understand better</li>
          <li>Review your investments regularly based on what you learn</li>
          <li>Diversify your investments as per the principles learned</li>
        </ul>
      </div>
    </div>
  )
}
