import { useState } from 'react'
import { ChevronDown, TrendingUp, DollarSign, Percent, Shield, AlertCircle } from 'lucide-react'

interface Concept {
  title: string
  icon: React.ReactNode
  description: string
  details: string[]
  example: string
}

export default function InvestmentEducation() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const concepts: Concept[] = [
    {
      title: 'What is an SIP (Systematic Investment Plan)?',
      icon: <TrendingUp className="text-blue-600" size={32} />,
      description: 'Invest a fixed amount regularly to reduce market risk',
      details: [
        'SIP means investing a fixed amount (e.g., ₹5,000) every month',
        'You buy more units when prices are low, fewer when prices are high',
        'This averages out your cost and reduces risk (called rupee-cost averaging)',
        'Great for beginners with limited capital',
        'Perfect for building wealth over time',
        'Discipline is key - invest consistently'
      ],
      example: 'Invest ₹5,000 every month for 10 years at 12% returns = ₹1,19,35,906'
    },
    {
      title: 'What is a Mutual Fund?',
      icon: <DollarSign className="text-green-600" size={32} />,
      description: 'Professional fund managers invest your money in stocks/bonds',
      details: [
        'A mutual fund pools money from many investors',
        'A professional fund manager invests this money in stocks, bonds, or other securities',
        'You own units/shares in the fund',
        'Funds are diversified - reduce risk by investing in many securities',
        'Returns depend on the underlying investments',
        'Mutual funds have an annual management fee (expense ratio)'
      ],
      example: 'Invest ₹10,000 in a mutual fund, get 100 units at ₹100/unit. If fund grows to ₹150/unit, your ₹10,000 becomes ₹15,000'
    },
    {
      title: 'What is an Index Fund?',
      icon: <Percent className="text-purple-600" size={32} />,
      description: 'Low-cost funds that track market indexes like Nifty 50',
      details: [
        'Index funds replicate a market index (Sensex, Nifty 50, etc.)',
        'Very low fees - index funds have minimal management involvement',
        'More transparent - you know exactly which companies you own',
        'Better long-term returns than 80% of active funds (studies show)',
        'Beginners can start here for low-cost diversification',
        'Requires patience - good for 5-10 year investment horizon'
      ],
      example: 'Nifty 50 Index Fund: Your money is invested in 50 top Indian companies. Lower fees = higher returns.'
    },
    {
      title: 'What is a Fixed Deposit (FD)?',
      icon: <Shield className="text-orange-600" size={32} />,
      description: 'Safe investment with guaranteed returns',
      details: [
        'You lend money to a bank for a fixed period (1-10 years)',
        'Bank guarantees a fixed interest rate',
        'Very safe - money is insured by DICG up to ₹5 lakh',
        'Interest rate depends on tenure and bank',
        'Low returns compared to stocks (4-7% vs 10-15%)',
        'Best for safety over growth, short-term goals'
      ],
      example: 'Deposit ₹1,00,000 at 6% for 5 years = Returns ₹1,33,822 (guaranteed)'
    },
    {
      title: 'What is Diversification?',
      icon: <TrendingUp className="text-red-600" size={32} />,
      description: 'Don\'t put all eggs in one basket',
      details: [
        '"Do not put all your eggs in one basket"',
        'Spread investments across different asset classes',
        'Different sectors - tech, banking, pharma, FMCG',
        'Different types - stocks, bonds, FDs, real estate',
        'Different geographies - domestic and international',
        'Reduces risk - if one investment fails, others may succeed'
      ],
      example: '₹10 lakh portfolio: ₹5 lakh stocks + ₹3 lakh bonds + ₹2 lakh FDs = Better returns with lower risk'
    },
    {
      title: 'What is Compound Interest (The 8th Wonder)?',
      icon: <Percent className="text-green-600" size={32} />,
      description: 'Your money grows exponentially over time',
      details: [
        '"Compound interest is the 8th wonder of the world" - Einstein',
        'You earn returns not just on your money, but on your returns too',
        'The earlier you start, the more powerful compound interest becomes',
        'Time is your biggest asset - start young',
        '10 years at 12% returns = ₹1,00,000 becomes ₹3,10,585',
        '20 years at 12% returns = ₹1,00,000 becomes ₹9,64,629'
      ],
      example: 'Invest ₹10,000/month for 30 years at 12% = ₹2,14,72,399 (most is compound interest!)'
    },
    {
      title: 'What is Market Volatility?',
      icon: <AlertCircle className="text-red-600" size={32} />,
      description: 'Stock prices go up and down - that\'s normal',
      details: [
        'Stock prices fluctuate based on company performance and market sentiment',
        'Short-term volatility is NORMAL - don\'t panic',
        'Volatility creates opportunities to buy low and sell high',
        'Over long periods (5-10 years), markets tend to go up',
        'Beginners who panic sell during crashes lose money',
        'Stay invested, don\'t try to time the market'
      ],
      example: 'Stock A: ₹100 → ₹150 (gain) → ₹120 (loss) → ₹180 (gain). Don\'t panic during the dip!'
    },
    {
      title: 'Equity vs Debt - What\'s the Difference?',
      icon: <DollarSign className="text-blue-600" size={32} />,
      description: 'Stocks vs Bonds - different risk/return profiles',
      details: [
        'EQUITY (Stocks): You own a piece of the company',
        'Higher returns (10-15% average) but higher risk',
        'Prices fluctuate daily',
        'DEBT (Bonds/FD): You lend money to company/bank',
        'Lower returns (4-8% average) but lower risk',
        'Predictable income - you know exactly what you\'ll get',
        'Balance both in your portfolio based on goals'
      ],
      example: '₹10 lakh: 60% equity (₹6L) + 40% debt (₹4L) = Balanced growth with some safety'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-blue-900 mb-3">🎓 Investment 101</h2>
        <p className="text-blue-800">
          Learn the fundamentals of investing. Click any topic to expand and read the full explanation with examples.
        </p>
      </div>

      <div className="space-y-4">
        {concepts.map((concept, index) => (
          <div key={index} className="card cursor-pointer" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
            <div className="flex items-start justify-between">
              <div className="flex gap-4 flex-1">
                <div className="flex-shrink-0">{concept.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{concept.title}</h3>
                  <p className="text-gray-600 mt-1">{concept.description}</p>
                </div>
              </div>
              <ChevronDown
                size={24}
                className={`flex-shrink-0 text-gray-400 transition-transform ${
                  expandedIndex === index ? 'rotate-180' : ''
                }`}
              />
            </div>

            {/* Expanded Content */}
            {expandedIndex === index && (
              <div className="mt-6 pt-6 border-t">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Key Points:</h4>
                    <ul className="space-y-2">
                      {concept.details.map((detail, i) => (
                        <li key={i} className="flex gap-3 text-gray-700">
                          <span className="text-blue-600 font-bold">→</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-bold text-green-900 mb-2">💰 Real Example:</h4>
                    <p className="text-green-800">{concept.example}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Investment Principles */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-purple-900 mb-4">📚 Golden Rules of Investing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded">
            <p className="font-bold text-purple-900 mb-2">1. Start Early</p>
            <p className="text-sm text-gray-700">The earlier you start, the more compound interest works in your favor. A 25-year-old has a 40-year advantage over a 65-year-old.</p>
          </div>
          <div className="bg-white p-4 rounded">
            <p className="font-bold text-purple-900 mb-2">2. Invest Regularly</p>
            <p className="text-sm text-gray-700">SIP is better than lumpsum. Regular investments help you take advantage of market volatility and build discipline.</p>
          </div>
          <div className="bg-white p-4 rounded">
            <p className="font-bold text-purple-900 mb-2">3. Diversify</p>
            <p className="text-sm text-gray-700">Spread risk across different asset classes, sectors, and geographies. Don't put all eggs in one basket.</p>
          </div>
          <div className="bg-white p-4 rounded">
            <p className="font-bold text-purple-900 mb-2">4. Stay Invested</p>
            <p className="text-sm text-gray-700">Don't panic sell during crashes. Market crashes are buying opportunities. Patience is rewarded.</p>
          </div>
          <div className="bg-white p-4 rounded">
            <p className="font-bold text-purple-900 mb-2">5. Reduce Costs</p>
            <p className="text-sm text-gray-700">Lower expense ratios and fees mean higher returns. Index funds often beat expensive active funds.</p>
          </div>
          <div className="bg-white p-4 rounded">
            <p className="font-bold text-purple-900 mb-2">6. Have a Goal</p>
            <p className="text-sm text-gray-700">Define clear financial goals (retirement, house, education). Invest according to your timeline.</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-amber-900 mb-3">🎯 What to Do Next?</h3>
        <ol className="space-y-2 text-amber-900">
          <li>1. <strong>Define your goals:</strong> Retirement, house, education, travel? What timeline?</li>
          <li>2. <strong>Assess your risk capacity:</strong> How much can you afford to lose?</li>
          <li>3. <strong>Start with SIP:</strong> Invest a small amount monthly (₹500-₹1000 minimum)</li>
          <li>4. <strong>Choose low-cost funds:</strong> Start with index funds for beginners</li>
          <li>5. <strong>Diversify gradually:</strong> Add different asset classes as you learn</li>
          <li>6. <strong>Review annually:</strong> Check progress, rebalance if needed</li>
        </ol>
      </div>
    </div>
  )
}
