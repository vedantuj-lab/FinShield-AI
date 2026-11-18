import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  PieChart as PieChartIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

const GUIDE_INSTRUMENTS = [
  {
    name: 'Systematic Investment Plan (SIP)',
    risk: 'Moderate–High',
    horizon: '5+ years',
    liquidity: 'High (except ELSS 3-yr lock-in)',
    summary: 'Disciplined monthly investing in mutual funds that averages purchase cost across market cycles.',
  },
  {
    name: 'Nifty 50 / Sensex Index Funds',
    risk: 'Moderate–High',
    horizon: '5–10+ years',
    liquidity: 'High',
    summary: 'Low-cost passive funds tracking broad Indian equity indices without active fund-manager risk.',
  },
  {
    name: 'Fixed Deposits (FD) & Recurring Deposits (RD)',
    risk: 'Low',
    horizon: '6 months – 5 years',
    liquidity: 'Moderate (premature penalty may apply)',
    summary: 'Bank deposits offering predictable interest; DICGC insures up to ₹5 lakh per depositor per bank.',
  },
  {
    name: 'Public Provident Fund (PPF) & Govt Schemes',
    risk: 'Very Low (Sovereign)',
    horizon: '15 years (PPF)',
    liquidity: 'Low (partial withdrawal rules)',
    summary: 'Government-backed long-term savings (PPF, SSY, SCSS, NSC) with sovereign guarantee and tax benefits.',
  },
  {
    name: 'Debt Mutual Funds & Sovereign Bonds',
    risk: 'Low–Moderate',
    horizon: '1–5 years',
    liquidity: 'High',
    summary: 'Invests in government securities, treasury bills, and high-grade corporate bonds for capital stability.',
  },
  {
    name: 'Direct Equities (NSE / BSE)',
    risk: 'High',
    horizon: '5+ years',
    liquidity: 'High (T+1 settlement)',
    summary: 'Direct ownership in listed companies; requires fundamental research and diversification.',
  },
];

const ASSET_TYPES = ['Equity', 'Mutual Fund', 'Index Fund', 'Fixed Deposit', 'Govt Scheme', 'Gold / Bond', 'Cash'];
const COLORS = ['#14B8A6', '#38BDF8', '#F59E0B', '#818CF8', '#F97316', '#10B981', '#EC4899'];

export function InvestmentsPage() {
  const { apiFetch } = useAuth();
  const [tab, setTab] = useState<'portfolio' | 'guide'>('portfolio');
  const [holdings, setHoldings] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');

  const [form, setForm] = useState({
    symbol: '',
    name: '',
    assetType: 'Index Fund',
    quantity: '',
    avgBuyPrice: '',
    currentPrice: '',
  });
  const [saving, setSaving] = useState(false);

  const loadPortfolio = async () => {
    try {
      const res = await apiFetch('/api/finance/portfolio');
      if (res.ok) {
        const d = await res.json();
        setHoldings(d.holdings || []);
        setSummary(d.summary || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolio.');
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setBanner('');
    try {
      const res = await apiFetch('/api/finance/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          avgBuyPrice: Number(form.avgBuyPrice),
          currentPrice: Number(form.currentPrice || form.avgBuyPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add holding.');
      setForm({ symbol: '', name: '', assetType: 'Index Fund', quantity: '', avgBuyPrice: '', currentPrice: '' });
      setBanner('Holding added to your portfolio.');
      await loadPortfolio();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await apiFetch(`/api/finance/portfolio/${id}`, { method: 'DELETE' });
    if (res.ok) await loadPortfolio();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">
            Investment Guide &amp; Portfolio Analysis
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Learn Indian investment instruments and analyse your manual portfolio allocation &amp; concentration risk.
          </p>
        </div>

        <div className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/5 px-4 py-2.5 text-xs text-[#F59E0B]">
          Educational tool only — not SEBI-registered investment advice. Reference prices are user-entered or illustrative; no returns are guaranteed.
        </div>

        <div className="flex gap-2 border-b border-[#243040] pb-3">
          <button
            type="button"
            onClick={() => setTab('portfolio')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold ${
              tab === 'portfolio'
                ? 'bg-[#14B8A6] text-[#0D1218]'
                : 'bg-[#131A22] text-[#94A3B8] border border-[#243040]'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>My Portfolio ({holdings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('guide')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold ${
              tab === 'guide'
                ? 'bg-[#14B8A6] text-[#0D1218]'
                : 'bg-[#131A22] text-[#94A3B8] border border-[#243040]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Indian Investment Guide</span>
          </button>
        </div>

        {error && <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">{error}</div>}
        {banner && <div className="rounded-lg border border-[#14B8A6]/40 bg-[#14B8A6]/10 p-3 text-xs text-[#14B8A6]">{banner}</div>}

        {tab === 'portfolio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#243040] bg-[#131A22] p-4">
                <div className="text-xs text-[#94A3B8]">Total Invested</div>
                <div className="font-mono text-2xl font-bold text-[#F3F6F9] mt-1">
                  ₹{Number(summary?.totalInvested || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="rounded-xl border border-[#243040] bg-[#131A22] p-4">
                <div className="text-xs text-[#94A3B8]">Current Reference Value</div>
                <div className="font-mono text-2xl font-bold text-[#14B8A6] mt-1">
                  ₹{Number(summary?.currentValue || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="rounded-xl border border-[#243040] bg-[#131A22] p-4">
                <div className="text-xs text-[#94A3B8]">Unrealised P&amp;L</div>
                <div
                  className={`font-mono text-2xl font-bold mt-1 ${
                    (summary?.totalGainLoss || 0) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                  }`}
                >
                  {(summary?.totalGainLoss || 0) >= 0 ? '+' : ''}₹
                  {Number(summary?.totalGainLoss || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {summary?.concentrationWarning && (
              <div className="rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-4 text-xs text-[#F59E0B] flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{summary.concentrationWarning}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleAddHolding}
                className="lg:col-span-4 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3.5 h-fit"
              >
                <h2 className="font-display text-base font-semibold text-[#F3F6F9]">Add Holding</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="pf-symbol" className="block text-xs text-[#94A3B8] mb-1">
                      Symbol / Code
                    </label>
                    <input
                      id="pf-symbol"
                      name="symbol"
                      required
                      placeholder="NIFTYBEES"
                      value={form.symbol}
                      onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                      className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                    />
                  </div>
                  <div>
                    <label htmlFor="pf-type" className="block text-xs text-[#94A3B8] mb-1">
                      Asset Class
                    </label>
                    <select
                      id="pf-type"
                      name="assetType"
                      value={form.assetType}
                      onChange={(e) => setForm({ ...form, assetType: e.target.value })}
                      className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                    >
                      {ASSET_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="pf-name" className="block text-xs text-[#94A3B8] mb-1">
                    Instrument Name
                  </label>
                  <input
                    id="pf-name"
                    name="name"
                    required
                    placeholder="Nippon India Nifty 50 BeES"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="pf-qty" className="block text-xs text-[#94A3B8] mb-1">
                      Qty
                    </label>
                    <input
                      id="pf-qty"
                      name="quantity"
                      type="number"
                      step="0.01"
                      required
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-2.5 py-2 text-sm text-[#F3F6F9]"
                    />
                  </div>
                  <div>
                    <label htmlFor="pf-buy" className="block text-xs text-[#94A3B8] mb-1">
                      Avg Buy (₹)
                    </label>
                    <input
                      id="pf-buy"
                      name="avgBuyPrice"
                      type="number"
                      step="0.01"
                      required
                      value={form.avgBuyPrice}
                      onChange={(e) => setForm({ ...form, avgBuyPrice: e.target.value })}
                      className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-2.5 py-2 text-sm text-[#F3F6F9]"
                    />
                  </div>
                  <div>
                    <label htmlFor="pf-curr" className="block text-xs text-[#94A3B8] mb-1">
                      Ref Price (₹)
                    </label>
                    <input
                      id="pf-curr"
                      name="currentPrice"
                      type="number"
                      step="0.01"
                      value={form.currentPrice}
                      onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
                      className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-2.5 py-2 text-sm text-[#F3F6F9]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#0D1218] hover:bg-[#2DD4BF]"
                >
                  <Plus className="h-4 w-4" />
                  <span>{saving ? 'Adding...' : 'Add Holding'}</span>
                </button>
              </form>

              <div className="lg:col-span-8 space-y-6">
                <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <PieChartIcon className="h-4 w-4 text-[#38BDF8]" />
                    <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                      Asset Class Allocation
                    </h2>
                  </div>
                  {summary?.allocation?.length ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={summary.allocation}
                            dataKey="value"
                            nameKey="assetType"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry: any) => `${entry.assetType} (${entry.percentage}%)`}
                          >
                            {summary.allocation.map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0D1218', borderColor: '#243040', color: '#F3F6F9' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-[#94A3B8] py-8 text-center">
                      Add holdings to view your asset allocation chart.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#243040] text-[#94A3B8]">
                      <tr>
                        <th className="py-2 pr-3">Instrument</th>
                        <th className="py-2 pr-3">Class</th>
                        <th className="py-2 pr-3 text-right">Qty</th>
                        <th className="py-2 pr-3 text-right">Invested</th>
                        <th className="py-2 pr-3 text-right">Current</th>
                        <th className="py-2 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#243040]/60">
                      {holdings.map((h) => (
                        <tr key={h.id}>
                          <td className="py-2.5 pr-3">
                            <div className="font-semibold text-[#F3F6F9]">{h.symbol}</div>
                            <div className="text-[#94A3B8]">{h.name}</div>
                          </td>
                          <td className="py-2.5 pr-3 text-[#94A3B8]">{h.assetType}</td>
                          <td className="py-2.5 pr-3 text-right font-mono">{h.quantity}</td>
                          <td className="py-2.5 pr-3 text-right font-mono">
                            ₹{Number(h.quantity * h.avgBuyPrice).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 pr-3 text-right font-mono text-[#14B8A6]">
                            ₹{Number(h.quantity * h.currentPrice).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDelete(h.id)}
                              aria-label={`Remove ${h.symbol}`}
                              className="text-[#94A3B8] hover:text-[#EF4444]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {holdings.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#94A3B8]">
                            No holdings added yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'guide' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GUIDE_INSTRUMENTS.map((inst) => (
              <div
                key={inst.name}
                className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3"
              >
                <h3 className="font-display text-base font-semibold text-[#F3F6F9]">{inst.name}</h3>
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="rounded bg-[#0D1218] border border-[#243040] px-2 py-0.5 text-[#F59E0B]">
                    Risk: {inst.risk}
                  </span>
                  <span className="rounded bg-[#0D1218] border border-[#243040] px-2 py-0.5 text-[#38BDF8]">
                    Horizon: {inst.horizon}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{inst.summary}</p>
                <div className="text-[11px] text-[#14B8A6]">Liquidity: {inst.liquidity}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
