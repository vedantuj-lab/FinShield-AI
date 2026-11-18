import React, { useEffect, useState } from 'react';
import { Activity, LineChart as LineChartIcon, Play, TrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

const SYMBOLS = ['NIFTYBEES', 'TCS', 'HDFCBANK', 'RELIANCE'];

export function MarketTradingPage() {
  const { apiFetch } = useAuth();
  const [symbol, setSymbol] = useState('NIFTYBEES');
  const [marketSeries, setMarketSeries] = useState<any[]>([]);
  const [latestPrice, setLatestPrice] = useState(0);
  const [cashBalance, setCashBalance] = useState(1000000);
  const [trades, setTrades] = useState<any[]>([]);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('10');
  const [notes, setNotes] = useState('');
  const [banner, setBanner] = useState('');
  const [error, setError] = useState('');

  // Backtester
  const [btCapital, setBtCapital] = useState('100000');
  const [btResult, setBtResult] = useState<any>(null);

  const loadMarket = async (sym = symbol) => {
    const res = await apiFetch(`/api/finance/market/historical?symbol=${encodeURIComponent(sym)}`);
    if (res.ok) {
      const d = await res.json();
      setMarketSeries(d.series || []);
      setLatestPrice(d.latestPrice || 0);
    }
  };

  const loadTrades = async () => {
    const res = await apiFetch('/api/finance/paper-trades');
    if (res.ok) {
      const d = await res.json();
      setCashBalance(d.virtualCashBalance ?? 1000000);
      setTrades(d.trades || []);
    }
  };

  useEffect(() => {
    loadMarket(symbol);
  }, [symbol]);

  useEffect(() => {
    loadTrades();
  }, []);

  const handlePlacePaperTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBanner('');
    const res = await apiFetch('/api/finance/paper-trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        side,
        quantity: Number(quantity),
        price: latestPrice,
        notes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not place simulated order.');
      return;
    }
    setBanner(`Simulated ${side} order executed for ${quantity} ${symbol} @ ₹${latestPrice}.`);
    setNotes('');
    await loadTrades();
  };

  const handleBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await apiFetch('/api/finance/paper-trades/backtest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        initialCapital: Number(btCapital),
        strategy: 'sma_crossover',
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Backtest failed.');
      return;
    }
    setBtResult(data);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">
                Market Insights &amp; Paper Trading
              </h1>
              <span className="rounded border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#F59E0B]">
                SYNTHETIC DEMONSTRATION DATA
              </span>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">
              Explore historical reference series with SMA-3 moving averages, practise virtual ₹10,00,000 paper trading, and backtest strategies.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="market-symbol" className="text-xs text-[#94A3B8]">
              Instrument:
            </label>
            <select
              id="market-symbol"
              name="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="rounded-lg border border-[#243040] bg-[#131A22] px-3 py-2 text-sm font-mono text-[#F3F6F9]"
            >
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">{error}</div>}
        {banner && <div className="rounded-lg border border-[#14B8A6]/40 bg-[#14B8A6]/10 p-3 text-xs text-[#14B8A6]">{banner}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LineChartIcon className="h-4 w-4 text-[#14B8A6]" />
                <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                  {symbol} — Reference Price &amp; SMA-3 Trend
                </h2>
              </div>
              <div className="font-mono text-sm font-bold text-[#14B8A6]">
                Ref: ₹{Number(latestPrice).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marketSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#243040" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D1218', borderColor: '#243040', color: '#F3F6F9' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="close" name="Close (₹)" stroke="#14B8A6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sma3" name="SMA-3 (₹)" stroke="#F59E0B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <form
            onSubmit={handlePlacePaperTrade}
            className="lg:col-span-4 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                Virtual Paper Order
              </h2>
              <TrendingUp className="h-4 w-4 text-[#38BDF8]" />
            </div>
            <div className="rounded-lg bg-[#0D1218] border border-[#243040] p-3">
              <div className="text-[11px] text-[#94A3B8]">Virtual Cash Balance</div>
              <div className="font-mono text-lg font-bold text-[#14B8A6]">
                ₹{Number(cashBalance).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`rounded-lg py-2 text-xs font-semibold ${
                  side === 'BUY' ? 'bg-[#10B981] text-[#0D1218]' : 'bg-[#0D1218] text-[#94A3B8] border border-[#243040]'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`rounded-lg py-2 text-xs font-semibold ${
                  side === 'SELL' ? 'bg-[#EF4444] text-white' : 'bg-[#0D1218] text-[#94A3B8] border border-[#243040]'
                }`}
              >
                SELL
              </button>
            </div>
            <div>
              <label htmlFor="pt-qty" className="block text-xs text-[#94A3B8] mb-1">
                Quantity ({symbol} @ ₹{latestPrice})
              </label>
              <input
                id="pt-qty"
                name="quantity"
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
              />
            </div>
            <div>
              <label htmlFor="pt-notes" className="block text-xs text-[#94A3B8] mb-1">
                Trade Rationale (optional)
              </label>
              <input
                id="pt-notes"
                name="notes"
                type="text"
                placeholder="e.g. Testing SMA breakout"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#0D1218] hover:bg-[#2DD4BF]"
            >
              Execute Simulated {side}
            </button>
          </form>
        </div>

        {/* Strategy Backtester */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleBacktest}
            className="lg:col-span-5 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#F59E0B]" />
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                Historical Strategy Backtester
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Simulates an SMA-3 trend-following strategy on the {symbol} synthetic historical series. Past or simulated performance does not guarantee future results.
            </p>
            <div>
              <label htmlFor="bt-capital" className="block text-xs text-[#94A3B8] mb-1">
                Simulated Starting Capital (₹)
              </label>
              <input
                id="bt-capital"
                name="btCapital"
                type="number"
                min="1000"
                value={btCapital}
                onChange={(e) => setBtCapital(e.target.value)}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2 text-xs font-semibold text-[#0D1218] hover:bg-[#FBBF24]"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Run Backtest</span>
            </button>

            {btResult && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-[#0D1218] border border-[#243040] p-3">
                  <div className="text-[11px] text-[#94A3B8]">Ending Value</div>
                  <div className="font-mono text-sm font-bold text-[#14B8A6]">
                    ₹{Number(btResult.endingCapital).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="rounded-lg bg-[#0D1218] border border-[#243040] p-3">
                  <div className="text-[11px] text-[#94A3B8]">Return %</div>
                  <div className="font-mono text-sm font-bold text-[#38BDF8]">
                    {btResult.returnPct}%
                  </div>
                </div>
                <div className="rounded-lg bg-[#0D1218] border border-[#243040] p-3">
                  <div className="text-[11px] text-[#94A3B8]">Win Rate</div>
                  <div className="font-mono text-sm font-bold text-[#F3F6F9]">
                    {btResult.winRatePct}%
                  </div>
                </div>
                <div className="rounded-lg bg-[#0D1218] border border-[#243040] p-3">
                  <div className="text-[11px] text-[#94A3B8]">Max Drawdown</div>
                  <div className="font-mono text-sm font-bold text-[#EF4444]">
                    {btResult.maxDrawdownPct}%
                  </div>
                </div>
              </div>
            )}
          </form>

          <div className="lg:col-span-7 rounded-xl border border-[#243040] bg-[#131A22] p-5 overflow-x-auto">
            <h2 className="font-display text-base font-semibold text-[#F3F6F9] mb-4">
              Paper Trading Ledger
            </h2>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#243040] text-[#94A3B8]">
                <tr>
                  <th className="py-2 pr-3">Symbol</th>
                  <th className="py-2 pr-3">Side</th>
                  <th className="py-2 pr-3 text-right">Qty</th>
                  <th className="py-2 pr-3 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243040]/60">
                {trades.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-3 font-mono font-semibold text-[#F3F6F9]">{t.symbol}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                          t.side === 'BUY' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#EF4444]/15 text-[#EF4444]'
                        }`}
                      >
                        {t.side}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono">{t.quantity}</td>
                    <td className="py-2.5 pr-3 text-right font-mono">₹{Number(t.price).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-right font-mono text-[#38BDF8]">
                      ₹{Number(t.quantity * t.price).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                {trades.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#94A3B8]">
                      No simulated paper trades executed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
