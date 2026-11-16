import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Signals {
  symbol: string;
  signal: string;
  indicators: {
    ma20: number | null;
    ma50: number | null;
    rsi: number | null;
    macd: number | null;
    macd_signal: number | null;
  };
  timestamp: string;
}

interface MarketSignalsProps {
  symbol: string;
  token: string;
}

const MarketSignals: React.FC<MarketSignalsProps> = ({ symbol, token }) => {
  const [signals, setSignals] = useState<Signals | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timer | null>(null);

  useEffect(() => {
    fetchSignals();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchSignals, 5 * 60 * 1000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [symbol]);

  const fetchSignals = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `/api/market/signals/${symbol}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSignals(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  };

  const getSignalEmoji = (signal: string) => {
    switch (signal) {
      case 'buy':
        return '🟢';
      case 'sell':
        return '🔴';
      default:
        return '🟡';
    }
  };

  const getSignalText = (signal: string) => {
    switch (signal) {
      case 'buy':
        return 'STRONG BUY';
      case 'sell':
        return 'STRONG SELL';
      default:
        return 'HOLD';
    }
  };

  const getSignalClass = (signal: string) => {
    switch (signal) {
      case 'buy':
        return 'bg-green-50 border-green-200';
      case 'sell':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  if (loading && !signals) return <div className="p-4">Loading signals...</div>;
  if (error && !signals) return <div className="p-4 text-red-500">{error}</div>;
  if (!signals) return <div className="p-4">No signals available</div>;

  const lastUpdated = new Date(signals.timestamp).toLocaleTimeString();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold">Market Signals</h3>
        <span className="text-xs text-gray-500">Updated: {lastUpdated}</span>
      </div>

      {/* Main Signal */}
      <div className={`border-2 rounded-lg p-6 mb-6 ${getSignalClass(signals.signal)}`}>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{getSignalEmoji(signals.signal)}</span>
          <div>
            <p className="text-sm text-gray-600">Signal for {signals.symbol}</p>
            <p className="text-3xl font-bold">{getSignalText(signals.signal)}</p>
            <p className="text-sm text-gray-600 mt-1">Based on technical analysis</p>
          </div>
        </div>
      </div>

      {/* Indicator Analysis */}
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">Indicator Analysis</h4>

        {/* Moving Averages */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Moving Averages</span>
            {signals.indicators.ma20 && signals.indicators.ma50 && (
              <span className={`text-sm px-2 py-1 rounded ${
                signals.indicators.ma20 > signals.indicators.ma50
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {signals.indicators.ma20 > signals.indicators.ma50 ? '📈 Bullish' : '📉 Bearish'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">SMA 20</p>
              <p className="font-mono">{signals.indicators.ma20?.toFixed(2) || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">SMA 50</p>
              <p className="font-mono">{signals.indicators.ma50?.toFixed(2) || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* RSI */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">RSI (14)</span>
            {signals.indicators.rsi && (
              <span className={`text-sm px-2 py-1 rounded ${
                signals.indicators.rsi < 30
                  ? 'bg-green-100 text-green-700'
                  : signals.indicators.rsi > 70
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {signals.indicators.rsi < 30
                  ? 'Oversold'
                  : signals.indicators.rsi > 70
                  ? 'Overbought'
                  : 'Neutral'}
              </span>
            )}
          </div>
          <p className="font-mono text-lg">{signals.indicators.rsi?.toFixed(2) || 'N/A'}</p>
        </div>

        {/* MACD */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">MACD</span>
            {signals.indicators.macd && signals.indicators.macd_signal && (
              <span className={`text-sm px-2 py-1 rounded ${
                signals.indicators.macd > signals.indicators.macd_signal
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {signals.indicators.macd > signals.indicators.macd_signal ? 'Positive' : 'Negative'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">MACD</p>
              <p className="font-mono">{signals.indicators.macd?.toFixed(4) || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Signal</p>
              <p className="font-mono">{signals.indicators.macd_signal?.toFixed(4) || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 pt-4 border-t text-xs text-gray-500">
        <p>
          ⚠️ These signals are for educational purposes only. Not financial advice.
          Always do your own research before trading.
        </p>
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchSignals}
        disabled={loading}
        className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 transition"
      >
        {loading ? 'Updating...' : 'Refresh Signals'}
      </button>
    </div>
  );
};

export default MarketSignals;
