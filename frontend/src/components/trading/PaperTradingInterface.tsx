import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PaperTradingInterfaceProps {
  token: string;
  onTradePlaced?: (trade: any) => void;
}

const PaperTradingInterface: React.FC<PaperTradingInterfaceProps> = ({ token, onTradePlaced }) => {
  const [formData, setFormData] = useState({
    symbol: 'INFY',
    order_type: 'buy',
    quantity: 10,
    price: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [portfolio, setPortfolio] = useState<any>(null);

  useEffect(() => {
    // Initialize paper trading account if needed
    initializePaperTrading();
    fetchPortfolio();
  }, []);

  const initializePaperTrading = async () => {
    try {
      await axios.post(
        '/api/trading/paper/account',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err: any) {
      // Account might already exist
    }
  };

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get(
        '/api/trading/paper/portfolio',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPortfolio(response.data);
    } catch (err: any) {
      console.error('Failed to fetch portfolio');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? Number(value) : value
    }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        '/api/trading/paper/orders',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`${formData.order_type.toUpperCase()} order placed successfully!`);
      onTradePlaced?.(response.data);
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        quantity: 10,
        price: 0,
      }));

      // Refresh portfolio
      setTimeout(fetchPortfolio, 500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">📄 Paper Trading</h3>
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
          SIMULATED
        </span>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Cash Available</p>
              <p className="text-xl font-bold">₹{portfolio.current_cash.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Portfolio Value</p>
              <p className="text-xl font-bold">₹{portfolio.current_value.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total P&L</p>
              <p className={`text-xl font-bold ${portfolio.total_profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {portfolio.total_profit_loss >= 0 ? '+' : ''}₹{portfolio.total_profit_loss.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Return %</p>
              <p className={`text-xl font-bold ${portfolio.total_profit_loss_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {portfolio.total_profit_loss_percent >= 0 ? '+' : ''}{portfolio.total_profit_loss_percent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trade Form */}
      <form onSubmit={handlePlaceOrder} className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Symbol</label>
            <input
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              placeholder="INFY"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Order Type</label>
            <select
              name="order_type"
              value={formData.order_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="buy">BUY</option>
              <option value="sell">SELL</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              step="1"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Price (₹)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {formData.quantity && formData.price && (
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Order Value</p>
            <p className="text-lg font-bold">₹{(formData.quantity * formData.price).toLocaleString()}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !portfolio || portfolio.current_cash <= 0}
          className={`w-full px-4 py-2 text-white rounded font-semibold transition ${
            formData.order_type === 'buy'
              ? 'bg-green-500 hover:bg-green-600 disabled:bg-gray-400'
              : 'bg-red-500 hover:bg-red-600 disabled:bg-gray-400'
          }`}
        >
          {loading ? 'Placing Order...' : `Place ${formData.order_type.toUpperCase()} Order`}
        </button>
      </form>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">
          ✓ {success}
        </div>
      )}

      {/* Holdings */}
      {portfolio && portfolio.holdings && portfolio.holdings.length > 0 && (
        <div>
          <h4 className="font-bold mb-3">Current Holdings</h4>
          <div className="space-y-2">
            {portfolio.holdings.map((holding: any) => (
              <div key={holding.id} className="p-3 bg-gray-50 rounded flex justify-between items-start">
                <div>
                  <p className="font-semibold">{holding.symbol}</p>
                  <p className="text-sm text-gray-600">{holding.quantity} @ ₹{holding.buy_price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${holding.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {holding.profit_loss >= 0 ? '+' : ''}₹{holding.profit_loss.toFixed(2)}
                  </p>
                  <p className={`text-sm ${holding.profit_loss_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {holding.profit_loss_percent >= 0 ? '+' : ''}{holding.profit_loss_percent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperTradingInterface;
