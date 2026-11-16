import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Shield, TrendingUp, DollarSign, AlertCircle, Briefcase } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-blue-600">FinShield AI</div>
            <div className="flex gap-4">
              <Link to="/login" className="text-gray-700 hover:text-gray-900">Login</Link>
              <Link to="/register" className="btn-primary">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-charcoal mb-6">
            Your Complete AI-Powered Financial Companion
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Manage your money, understand investments, analyse markets, plan taxes, detect scams and grow your business — all in one intelligent platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register" className="btn-primary flex items-center gap-2">
              Get Started <ArrowRight size={20} />
            </Link>
            <button className="btn-secondary">Explore Features</button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Six Powerful Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Smart Budgeting */}
            <div className="card">
              <DollarSign className="text-emerald-500 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Smart Budgeting</h3>
              <p className="text-gray-600 mb-4">Track expenses, set budgets, and get AI-powered spending insights.</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Transaction import</li>
                <li>✓ Auto categorisation</li>
                <li>✓ Monthly budgets</li>
                <li>✓ Spending analysis</li>
              </ul>
            </div>

            {/* Investment */}
            <div className="card">
              <TrendingUp className="text-blue-500 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Investment Guide</h3>
              <p className="text-gray-600 mb-4">Learn about investments, analyse portfolios, and calculate returns.</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Educational content</li>
                <li>✓ Portfolio analysis</li>
                <li>✓ Risk assessment</li>
                <li>✓ Investment calculators</li>
              </ul>
            </div>

            {/* Trading */}
            <div className="card">
              <Zap className="text-amber-500 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Market Insights</h3>
              <p className="text-gray-600 mb-4">Backtest strategies and practice paper trading with historical data.</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Historical analysis</li>
                <li>✓ Technical indicators</li>
                <li>✓ Strategy backtesting</li>
                <li>✓ Paper trading</li>
              </ul>
            </div>

            {/* Tax */}
            <div className="card">
              <Shield className="text-green-500 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Tax Assistant</h3>
              <p className="text-gray-600 mb-4">Understand tax rules, compare regimes, and plan taxes effectively.</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Tax calculations</li>
                <li>✓ Regime comparison</li>
                <li>✓ Deduction guidance</li>
                <li>✓ Plain language explanations</li>
              </ul>
            </div>

            {/* Fraud */}
            <div className="card">
              <AlertCircle className="text-red-500 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Fraud Detector</h3>
              <p className="text-gray-600 mb-4">Identify scams, analyse evidence, and get emergency assistance.</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Evidence analysis</li>
                <li>✓ Risk assessment</li>
                <li>✓ Scam reconstruction</li>
                <li>✓ FINSHIELD RESCUE</li>
              </ul>
            </div>

            {/* Business */}
            <div className="card">
              <Briefcase className="text-indigo-500 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Business Finance</h3>
              <p className="text-gray-600 mb-4">Manage invoices, forecast cash flow, and plan loans.</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ GST invoices</li>
                <li>✓ Expense tracking</li>
                <li>✓ Cash flow forecast</li>
                <li>✓ EMI calculator</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-blue-50 rounded-lg p-12 text-center">
          <h2 className="text-4xl font-bold mb-6">Unified AI Financial Assistant</h2>
          <p className="text-xl text-gray-700 mb-8">
            Ask questions in plain language and get instant financial guidance. The AI assistant connects all modules to help you make better decisions.
          </p>
          <div className="space-y-3">
            <p className="text-gray-600">"Where did my money go this month?"</p>
            <p className="text-gray-600">"Explain SIPs in simple terms"</p>
            <p className="text-gray-600">"Is this payment request suspicious?"</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-charcoal text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Take Control of Your Finances?</h2>
          <Link to="/register" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg">
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 FinShield AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
