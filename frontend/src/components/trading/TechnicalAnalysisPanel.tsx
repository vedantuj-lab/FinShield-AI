import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface TechnicalIndicators {
  symbol: string;
  date: string;
  close_price: number;
  sma_20: number | null;
  sma_50: number | null;
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
  bollinger_bands_upper: number | null;
  bollinger_bands_lower: number | null;
  signal: string;
}

interface TechnicalAnalysisPanelProps {
  symbol: string;
  token: string;
}

const TechnicalAnalysisPanel: React.FC<TechnicalAnalysisPanelProps> = ({ symbol, token }) => {
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTechnicalAnalysis();
  }, [symbol]);

  const fetchTechnicalAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(
        '/api/market/technical-analysis',
        { symbol, period: 14 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIndicators(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch technical analysis');
    } finally {
      setLoading(false);
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy':
        return 'text-green-500 bg-green-50';
      case 'sell':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getRSIStatus = (rsi: number | null) => {
    if (rsi === null) return 'N/A';
    if (rsi < 30) return 'Oversold';
    if (rsi > 70) return 'Overbought';
    return 'Neutral';
  };

  const getRSIColor = (rsi: number | null) => {
    if (rsi === null) return 'text-gray-500';
    if (rsi < 30) return 'text-green-500';
    if (rsi > 70) return 'text-red-500';
    return 'text-gray-500';
  };

  if (loading) return <div className="p-4">Analyzing...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!indicators) return <div className="p-4">No analysis available</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-6">Technical Analysis</h3>

      {/* Trading Signal */}
      <div className={`mb-6 p-4 rounded-lg ${getSignalColor(indicators.signal)}`}>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Trading Signal</span>
          <span className="text-2xl font-bold uppercase">{indicators.signal}</span>
        </div>
      </div>

      {/* Moving Averages */}
      <div className="mb-6 border-b pb-4">
        <h4 className="font-semibold mb-3">Moving Averages</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">SMA 20</p>
            <p className="text-lg font-semibold">
              {indicators.sma_20 ? `₹${indicators.sma_20.toFixed(2)}` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">SMA 50</p>
            <p className="text-lg font-semibold">
              {indicators.sma_50 ? `₹${indicators.sma_50.toFixed(2)}` : 'N/A'}
            </p>
          </div>
        </div>
        {indicators.sma_20 && indicators.sma_50 && (
          <p className="text-sm text-gray-600 mt-2">
            Trend: {indicators.sma_20 > indicators.sma_50 ? '📈 Bullish' : '📉 Bearish'}
          </p>
        )}
      </div>

      {/* RSI */}
      <div className="mb-6 border-b pb-4">
        <h4 className="font-semibold mb-3">Relative Strength Index (RSI)</h4>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full ${
                  indicators.rsi === null
                    ? 'bg-gray-300'
                    : indicators.rsi < 30
                    ? 'bg-green-500'
                    : indicators.rsi > 70
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }`}
                style={{ width: `${(indicators.rsi || 50) / 100 * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
          <div className="ml-4 text-right">
            <p className={`text-lg font-semibold ${getRSIColor(indicators.rsi)}`}>
              {indicators.rsi ? indicators.rsi.toFixed(2) : 'N/A'}
            </p>
            <p className="text-sm text-gray-600">{getRSIStatus(indicators.rsi)}</p>
          </div>
        </div>
      </div>

      {/* MACD */}
      <div className="mb-6 border-b pb-4">
        <h4 className="font-semibold mb-3">MACD</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">MACD Line</p>
            <p className="text-lg font-semibold">
              {indicators.macd ? indicators.macd.toFixed(4) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Signal Line</p>
            <p className="text-lg font-semibold">
              {indicators.macd_signal ? indicators.macd_signal.toFixed(4) : 'N/A'}
            </p>
          </div>
        </div>
        {indicators.macd && indicators.macd_signal && (
          <p className="text-sm text-gray-600 mt-2">
            Histogram: {(indicators.macd - indicators.macd_signal).toFixed(4)} 
            {' '}
            {indicators.macd > indicators.macd_signal ? '📈 Positive' : '📉 Negative'}
          </p>
        )}
      </div>

      {/* Bollinger Bands */}
      <div>
        <h4 className="font-semibold mb-3">Bollinger Bands</h4>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-600">Upper Band</p>
            <p className="text-lg font-semibold">
              {indicators.bollinger_bands_upper
                ? `₹${indicators.bollinger_bands_upper.toFixed(2)}`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Price</p>
            <p className="text-lg font-semibold">₹{indicators.close_price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Lower Band</p>
            <p className="text-lg font-semibold">
              {indicators.bollinger_bands_lower
                ? `₹${indicators.bollinger_bands_lower.toFixed(2)}`
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t">
        <button
          onClick={fetchTechnicalAnalysis}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Refresh Analysis
        </button>
      </div>
    </div>
  );
};

export default TechnicalAnalysisPanel;
