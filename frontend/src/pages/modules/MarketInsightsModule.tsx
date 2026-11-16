import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MarketChart from '../../components/trading/MarketChart';
import TechnicalAnalysisPanel from '../../components/trading/TechnicalAnalysisPanel';
import BacktestForm from '../../components/trading/BacktestForm';
import PaperTradingInterface from '../../components/trading/PaperTradingInterface';
import MarketSignals from '../../components/trading/MarketSignals';

export default function MarketInsightsModule() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSymbol, setSelectedSymbol] = useState('INFY');
  const token = localStorage.getItem('authToken') || '';

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const tabs = [
    { id: 'overview', label: '📊 Market Overview', icon: '📈' },
    { id: 'signals', label: '🎯 Trading Signals', icon: '📍' },
    { id: 'backtest', label: '📉 Backtest Strategy', icon: '🔬' },
    { id: 'paper', label: '📄 Paper Trading', icon: '💼' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">📊 Trading & Market Insights</h1>
        <p className="text-gray-600">Analyze markets, test strategies, and practice trading</p>
      </div>

      {/* Symbol Selector */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-4">
          <label className="font-semibold">Symbol:</label>
          <input
            type="text"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
            placeholder="Enter symbol (e.g., INFY, TCS, WIPRO)"
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white rounded-lg shadow-md p-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded font-semibold transition ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <MarketChart symbol={selectedSymbol} token={token} />
            <TechnicalAnalysisPanel symbol={selectedSymbol} token={token} />
          </div>
        )}

        {activeTab === 'signals' && (
          <div className="space-y-6">
            <MarketSignals symbol={selectedSymbol} token={token} />
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">📚 Understanding Signals</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 🟢 <strong>BUY:</strong> Multiple indicators suggest upward momentum</li>
                <li>• 🔴 <strong>SELL:</strong> Multiple indicators suggest downward momentum</li>
                <li>• 🟡 <strong>HOLD:</strong> Mixed signals - wait for clearer direction</li>
                <li>• These signals are based on Moving Averages, RSI, and MACD indicators</li>
                <li>• Always use these as one part of your analysis, not as sole trading signals</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'backtest' && (
          <div className="space-y-6">
            <BacktestForm token={token} />
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-3">🔬 Available Strategies</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold">Moving Average Crossover</p>
                  <p className="text-sm text-gray-600">Buy when fast MA crosses above slow MA, sell when it crosses below</p>
                </div>
                <div>
                  <p className="font-semibold">RSI Strategy</p>
                  <p className="text-sm text-gray-600">Buy when RSI is oversold (&lt;30), sell when overbought (&gt;70)</p>
                </div>
                <div>
                  <p className="font-semibold">MACD Strategy</p>
                  <p className="text-sm text-gray-600">Buy when MACD crosses above signal line, sell when it crosses below</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'paper' && (
          <div className="space-y-6">
            <PaperTradingInterface token={token} />
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-3">📄 Paper Trading Guide</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Start with ₹100,000 virtual capital</li>
                <li>✓ Practice trading without real money</li>
                <li>✓ Track your wins and losses</li>
                <li>✓ Test your trading strategies</li>
                <li>✓ Learn from mistakes risk-free</li>
                <li>✓ All trades are simulated - no real transactions</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Disclaimer:</strong> This is an educational tool. Market analysis and trading signals are 
          generated for learning purposes only. Not financial advice. Past performance doesn't guarantee future results. 
          Always conduct your own research and consult with a financial advisor before trading.
        </p>
      </div>
    </div>
  );
}
