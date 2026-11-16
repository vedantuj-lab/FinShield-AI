import React, { useState } from 'react';
import axios from 'axios';

interface BacktestFormProps {
  token: string;
  onBacktestComplete?: (result: any) => void;
}

const BacktestForm: React.FC<BacktestFormProps> = ({ token, onBacktestComplete }) => {
  const [formData, setFormData] = useState({
    symbol: 'INFY',
    strategy_name: 'moving_average_crossover',
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    initial_capital: 100000,
    fast_ma: 10,
    slow_ma: 30,
    rsi_oversold: 30,
    rsi_overbought: 70,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_') || name.includes('capital') ? 
        (isNaN(Number(value)) ? value : Number(value)) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const requestData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };

      const response = await axios.post(
        '/api/trading/backtest',
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(response.data);
      onBacktestComplete?.(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Backtest failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-6">Strategy Backtester</h3>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        {/* Symbol */}
        <div>
          <label className="block text-sm font-semibold mb-1">Symbol</label>
          <input
            type="text"
            name="symbol"
            value={formData.symbol}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="INFY"
          />
        </div>

        {/* Strategy */}
        <div>
          <label className="block text-sm font-semibold mb-1">Strategy</label>
          <select
            name="strategy_name"
            value={formData.strategy_name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="moving_average_crossover">Moving Average Crossover</option>
            <option value="rsi_strategy">RSI Strategy</option>
            <option value="macd_strategy">MACD Strategy</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">End Date</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Initial Capital */}
        <div>
          <label className="block text-sm font-semibold mb-1">Initial Capital (₹)</label>
          <input
            type="number"
            name="initial_capital"
            value={formData.initial_capital}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Strategy Parameters */}
        {formData.strategy_name === 'moving_average_crossover' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Fast MA Period</label>
              <input
                type="number"
                name="fast_ma"
                value={formData.fast_ma}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Slow MA Period</label>
              <input
                type="number"
                name="slow_ma"
                value={formData.slow_ma}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {formData.strategy_name === 'rsi_strategy' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">RSI Oversold Level</label>
              <input
                type="number"
                name="rsi_oversold"
                value={formData.rsi_oversold}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">RSI Overbought Level</label>
              <input
                type="number"
                name="rsi_overbought"
                value={formData.rsi_overbought}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 transition"
        >
          {loading ? 'Running Backtest...' : 'Run Backtest'}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-gray-50 p-4 rounded space-y-3">
          <h4 className="font-bold text-lg">Backtest Results</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Initial Capital</p>
              <p className="text-lg font-semibold">₹{result.initial_capital.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Final Value</p>
              <p className={`text-lg font-semibold ${result.final_value >= result.initial_capital ? 'text-green-500' : 'text-red-500'}`}>
                ₹{result.final_value.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total P&L</p>
              <p className={`text-lg font-semibold ${result.total_profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {result.total_profit_loss >= 0 ? '+' : ''}₹{result.total_profit_loss.toFixed(2)} ({result.total_profit_loss_percent.toFixed(2)}%)
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Max Drawdown</p>
              <p className="text-lg font-semibold text-red-500">-{result.max_drawdown.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Trades</p>
              <p className="text-lg font-semibold">{result.total_trades}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Win Rate</p>
              <p className="text-lg font-semibold">{result.win_rate.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Winning Trades</p>
              <p className="text-lg font-semibold text-green-500">{result.winning_trades}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Losing Trades</p>
              <p className="text-lg font-semibold text-red-500">{result.losing_trades}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestForm;
