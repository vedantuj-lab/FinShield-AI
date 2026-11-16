import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface MarketData {
  date: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
}

interface MarketChartProps {
  symbol: string;
  token: string;
}

const MarketChart: React.FC<MarketChartProps> = ({ symbol, token }) => {
  const [data, setData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('1m');

  useEffect(() => {
    fetchHistoricalData();
  }, [symbol, timeframe]);

  const fetchHistoricalData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `/api/market/history/${symbol}?limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading chart...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!data.length) return <div className="p-4">No data available</div>;

  // Simple ASCII chart representation
  const prices = data.map(d => d.close_price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;

  const currentPrice = prices[prices.length - 1];
  const previousPrice = prices[0];
  const change = currentPrice - previousPrice;
  const changePercent = (change / previousPrice) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold">{symbol}</h2>
          <p className="text-3xl font-bold text-gray-800">₹{currentPrice.toFixed(2)}</p>
          <p className={`text-lg font-semibold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
          </p>
        </div>
        <div className="flex gap-2">
          {['1d', '1w', '1m', '3m', '1y'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded ${
                timeframe === tf
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded mb-4">
        <div className="text-sm text-gray-600 font-mono leading-relaxed">
          {/* Simple candlestick visualization */}
          {data.slice(-20).map((d, idx) => {
            const close = ((d.close_price - minPrice) / range) * 100;
            const isUp = d.close_price >= d.open_price;
            
            return (
              <div key={idx} className="flex items-end justify-between gap-1 mb-1">
                <div 
                  className={`w-2 ${isUp ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ height: `${close}px` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <p className="text-gray-600 text-sm">High</p>
          <p className="text-lg font-semibold">₹{maxPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Low</p>
          <p className="text-lg font-semibold">₹{minPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Latest Volume</p>
          <p className="text-lg font-semibold">{(data[data.length - 1].volume / 1000000).toFixed(2)}M</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Avg Volume</p>
          <p className="text-lg font-semibold">
            {(data.reduce((sum, d) => sum + d.volume, 0) / data.length / 1000000).toFixed(2)}M
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketChart;
