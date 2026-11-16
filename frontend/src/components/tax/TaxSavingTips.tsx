import { Lightbulb, TrendingUp, Zap, Award } from 'lucide-react'

interface Tip {
  title: string
  description: string
  savings: string
  icon: React.ReactNode
}

const tips: Tip[] = [
  {
    title: 'Maximize Section 80C Deductions',
    description: 'Invest up to ₹1,50,000 in life insurance, PPF, or ELSS mutual funds to claim full deduction under Section 80C.',
    savings: 'Up to ₹45,000 tax savings',
    icon: <Zap className="w-6 h-6" />,
  },
  {
    title: 'Claim Section 80D Health Insurance',
    description: 'Health insurance premiums up to ₹50,000 for self and family are fully deductible under Section 80D.',
    savings: 'Up to ₹15,000 tax savings',
    icon: <Award className="w-6 h-6" />,
  },
  {
    title: 'Optimize HRA Exemption',
    description: 'If you pay rent, claim HRA exemption which is the lowest of: salary/10, actual HRA, or rent paid minus 10% of salary.',
    savings: 'Up to ₹1,00,000+ savings',
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    title: 'Home Loan Interest Deduction',
    description: 'Claim up to ₹2,00,000 deduction on home loan interest for self-occupied properties under Section 24.',
    savings: 'Up to ₹60,000 tax savings',
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    title: 'Education Loan Interest Deduction',
    description: 'Education loan interest has NO upper limit and is fully deductible under Section 80E for any number of years.',
    savings: 'Variable based on loan',
    icon: <Zap className="w-6 h-6" />,
  },
  {
    title: 'Plan Investments in December',
    description: 'Make Section 80C investments before December 31 to maximize deductions before the financial year ends.',
    savings: 'Full ₹1,50,000 deduction',
    icon: <Award className="w-6 h-6" />,
  },
  {
    title: 'Choose New Regime Wisely',
    description: 'New regime offers lower tax rates but no deductions. Compare both regimes before filing to save maximum tax.',
    savings: 'Up to ₹50,000+ savings',
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    title: 'Claim Standard Deduction',
    description: 'All salaried individuals get a standard deduction of ₹75,000 in new regime or ₹50,000 in old regime automatically.',
    savings: 'At least ₹15,000 savings',
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    title: 'Use Spousal Income Planning',
    description: 'If your spouse has low income, claim deductions under their name to utilize their tax slabs efficiently.',
    savings: 'Variable based on income',
    icon: <Award className="w-6 h-6" />,
  },
  {
    title: 'Track Medical Expenses',
    description: 'Parent medical expenses over ₹60 years get higher deduction limits (₹1,00,000) under Section 80D.',
    savings: 'Up to ₹30,000 extra savings',
    icon: <Zap className="w-6 h-6" />,
  },
  {
    title: 'Donate to Approved Charities',
    description: 'Donations to government-approved charities are 100% deductible under Section 80G (subject to 10% income limit).',
    savings: 'Variable based on donation',
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    title: 'Carry Forward Unused Deductions',
    description: 'Unused 80C and 80D deductions cannot be carried forward, so claim them in the same financial year itself.',
    savings: 'Avoid wasting deductions',
    icon: <Lightbulb className="w-6 h-6" />,
  },
]

export default function TaxSavingTips() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-8">
        <Lightbulb className="w-6 h-6 text-amber-600" />
        <h2 className="text-2xl font-bold text-gray-800">Tax Saving Tips & Strategies</h2>
      </div>

      <p className="text-gray-700 mb-8">
        Here are 12 proven strategies to help you save maximum tax while staying compliant with Indian tax laws.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-amber-400 hover:shadow-lg transition group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-amber-600 group-hover:text-amber-700 transition">
                {tip.icon}
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Tip {index + 1}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2">{tip.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{tip.description}</p>

            <div className="p-3 bg-green-50 rounded border border-green-200">
              <p className="text-xs text-gray-600">Potential Savings:</p>
              <p className="text-sm font-bold text-green-600">{tip.savings}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Key Takeaways */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-4">Key Takeaways</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-blue-800 mb-3">Old Regime (If Beneficial)</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>✓ Take all available deductions</li>
              <li>✓ Use Section 80C fully (₹1,50,000)</li>
              <li>✓ Claim Section 80D (₹50,000)</li>
              <li>✓ Optimize HRA and home loan interest</li>
              <li>✓ Best for high earners with deductions</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-blue-800 mb-3">New Regime (If Beneficial)</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>✓ Lower tax rates (especially for high income)</li>
              <li>✓ No complex deduction tracking needed</li>
              <li>✓ Use when income is high but deductions are low</li>
              <li>✓ Still get ₹75,000 standard deduction</li>
              <li>✓ Simple filing process</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Important Reminders */}
      <div className="mt-8 p-6 bg-yellow-50 border-l-4 border-yellow-600 rounded">
        <h3 className="font-bold text-yellow-900 mb-3">⚠️ Important Reminders</h3>
        <ul className="text-sm text-yellow-800 space-y-2">
          <li>• Always maintain supporting documents for at least 3 years</li>
          <li>• Report all income including gifts above ₹50,000</li>
          <li>• File ITR even if income is below taxable limit (if you have investments)</li>
          <li>• Penalties for not filing ITR can be up to ₹5,000</li>
          <li>• Compare both tax regimes before filing to ensure maximum savings</li>
          <li>• File before the due date (usually July 31 for most taxpayers)</li>
          <li>• Consult a CA for complex situations or high incomes</li>
        </ul>
      </div>

      {/* Calculator Tip */}
      <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
        <div className="flex items-start gap-4">
          <TrendingUp className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-green-900 mb-2">Use Our Tools</h3>
            <p className="text-sm text-green-800">
              Use our Tax Calculator to compare old vs new regime for your specific situation, 
              and use the Deduction Assistant to identify all applicable deductions. Together, 
              these tools can help you save significant tax every year.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
