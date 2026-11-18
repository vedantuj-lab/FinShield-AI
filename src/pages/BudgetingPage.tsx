import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Database,
  Loader2,
  PiggyBank,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'Food & Dining',
  'Housing & Rent',
  'Transport',
  'Utilities & Bills',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Education',
  'Salary',
  'Investments',
  'Other',
];

const CHART_COLORS = ['#14B8A6', '#38BDF8', '#F59E0B', '#818CF8', '#F97316', '#EF4444', '#10B981', '#EC4899'];

export function BudgetingPage() {
  const { apiFetch } = useAuth();
  const [tab, setTab] = useState<'overview' | 'transactions' | 'budgets' | 'import'>('overview');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');

  const [transactions, setTransactions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);

  // Manual transaction form
  const [txForm, setTxForm] = useState({
    txnDate: new Date().toISOString().slice(0, 10),
    description: '',
    category: 'Food & Dining',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    paymentMethod: 'UPI',
  });
  const [savingTx, setSavingTx] = useState(false);

  // Budget form
  const [budgetCategory, setBudgetCategory] = useState('Food & Dining');
  const [budgetLimit, setBudgetLimit] = useState('10000');
  const [savingBudget, setSavingBudget] = useState(false);

  // Bulk import
  const [rawImportText, setRawImportText] = useState('');
  const [importing, setImporting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [txRes, inRes] = await Promise.all([
        apiFetch('/api/finance/transactions'),
        apiFetch('/api/finance/insights'),
      ]);
      if (txRes.ok) {
        const d = await txRes.json();
        setTransactions(d.transactions || []);
      }
      if (inRes.ok) {
        setInsights(await inRes.json());
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load financial data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedDemo = async () => {
    setSeeding(true);
    setError('');
    setBanner('');
    try {
      const res = await apiFetch('/api/finance/seed-demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load synthetic demo.');
      setBanner(data.message || 'Loaded 3-month synthetic demonstration transactions and budgets.');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTx(true);
    setError('');
    setBanner('');
    try {
      const res = await apiFetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...txForm,
          amount: Number(txForm.amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save transaction.');
      setTxForm({
        ...txForm,
        description: '',
        amount: '',
      });
      setBanner('Transaction recorded in PostgreSQL.');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingTx(false);
    }
  };

  const handleDeleteTx = async (id: number) => {
    const res = await apiFetch(`/api/finance/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadData();
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBudget(true);
    setError('');
    setBanner('');
    try {
      const res = await apiFetch('/api/finance/budgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: budgetCategory,
          monthlyLimit: Number(budgetLimit),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update budget.');
      setBanner(`Monthly budget limit for ${budgetCategory} updated.`);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingBudget(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawImportText.trim()) return;
    setImporting(true);
    setError('');
    setBanner('');
    try {
      const res = await apiFetch('/api/finance/transactions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawImportText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed.');
      setRawImportText('');
      setBanner(`Imported ${data.importedCount} transactions from pasted CSV/UPI SMS text.`);
      await loadData();
      setTab('overview');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const summary = insights?.summary || {
    totalIncome: 0,
    totalExpense: 0,
    netSavings: 0,
    savingsRate: 0,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">
              Smart Budgeting &amp; Financial Insights
            </h1>
            <p className="text-sm text-[#94A3B8] mt-1">
              Track income, categorise expenses, detect recurring bills &amp; spending anomalies, and import CSV/UPI SMS statements.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSeedDemo}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3.5 py-2 text-xs font-semibold text-[#F59E0B] hover:bg-[#F59E0B]/20 disabled:opacity-60"
            >
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
              <span>Load Synthetic 3-Month Demo</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#243040] bg-[#131A22] px-3 py-2 text-xs font-medium text-[#38BDF8] hover:border-[#38BDF8]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-[#243040] bg-[#131A22] px-4 py-2.5 text-xs text-[#94A3B8] flex items-center justify-between gap-2">
          <span>
            Privacy notice: We never connect directly to your bank or ask for UPI PINs, OTPs, or banking passwords. All records are user-entered, pasted, or synthetic demo data.
          </span>
        </div>

        {error && (
          <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3.5 text-xs text-[#EF4444]">
            {error}
          </div>
        )}
        {banner && (
          <div className="rounded-lg border border-[#14B8A6]/40 bg-[#14B8A6]/10 p-3.5 text-xs text-[#14B8A6]">
            {banner}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#243040] bg-[#131A22] p-4">
            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <span>Total Income</span>
              <ArrowUpRight className="h-4 w-4 text-[#10B981]" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#10B981] mt-1 tabular-nums">
              ₹{Number(summary.totalIncome || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="rounded-xl border border-[#243040] bg-[#131A22] p-4">
            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <span>Total Expenses</span>
              <ArrowDownRight className="h-4 w-4 text-[#EF4444]" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#F3F6F9] mt-1 tabular-nums">
              ₹{Number(summary.totalExpense || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="rounded-xl border border-[#243040] bg-[#131A22] p-4">
            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <span>Net Savings</span>
              <PiggyBank className="h-4 w-4 text-[#14B8A6]" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#14B8A6] mt-1 tabular-nums">
              ₹{Number(summary.netSavings || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="rounded-xl border border-[#243040] bg-[#131A22] p-4">
            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <span>Savings Rate</span>
              <Wallet className="h-4 w-4 text-[#38BDF8]" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#38BDF8] mt-1 tabular-nums">
              {Number(summary.savingsRate || 0).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#243040] pb-3">
          {[
            ['overview', 'Insights & Charts'],
            ['transactions', `Transactions (${transactions.length})`],
            ['budgets', 'Category Budgets'],
            ['import', 'CSV / UPI SMS Import'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id as any)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                tab === id
                  ? 'bg-[#14B8A6] text-[#0D1218]'
                  : 'bg-[#131A22] text-[#94A3B8] border border-[#243040] hover:text-[#F3F6F9]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4">
                <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                  Monthly Income vs. Expenses
                </h2>
                {insights?.monthlyTrend?.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insights.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#243040" />
                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                        <YAxis stroke="#94A3B8" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0D1218', borderColor: '#243040', color: '#F3F6F9' }}
                        />
                        <Bar dataKey="income" name="Income (₹)" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Expense (₹)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8] py-12 text-center">
                    No transactions yet. Add a transaction or click &ldquo;Load Synthetic 3-Month Demo&rdquo;.
                  </p>
                )}
              </div>

              <div className="lg:col-span-5 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4">
                <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                  Expense Breakdown by Category
                </h2>
                {insights?.categoryBreakdown?.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={insights.categoryBreakdown}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          label={(entry: any) => entry.category}
                        >
                          {insights.categoryBreakdown.map((_: any, idx: number) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0D1218', borderColor: '#243040', color: '#F3F6F9' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8] py-12 text-center">
                    Expense distribution will appear once expenses are recorded.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
                  <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                    Spending Anomalies Detected
                  </h2>
                </div>
                {insights?.anomalies?.length ? (
                  <div className="space-y-2.5">
                    {insights.anomalies.map((a: any) => (
                      <div
                        key={a.id}
                        className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/5 p-3 text-xs flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-semibold text-[#F3F6F9]">{a.description}</div>
                          <div className="text-[#94A3B8]">
                            {a.category} · {a.txnDate} · {a.reason}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-[#F59E0B] whitespace-nowrap">
                          ₹{Number(a.amount).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8]">
                    No unusual spending spikes detected across your recorded categories.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3">
                <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                  Detected Recurring Expenses
                </h2>
                {insights?.recurring?.length ? (
                  <div className="space-y-2.5">
                    {insights.recurring.map((r: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-lg border border-[#243040] bg-[#0D1218] p-3 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-[#F3F6F9]">{r.description}</div>
                          <div className="text-[#94A3B8]">
                            {r.category} · {r.occurrences} occurrences
                          </div>
                        </div>
                        <div className="font-mono font-semibold text-[#38BDF8]">
                          ~₹{Number(r.averageAmount).toLocaleString('en-IN')}/mo
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8]">
                    Recurring bills and subscriptions will appear when similar transactions repeat across months.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'transactions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleAddTransaction}
              className="lg:col-span-4 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4 h-fit"
            >
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                Add Transaction
              </h2>
              <div>
                <label htmlFor="tx-date" className="block text-xs text-[#94A3B8] mb-1">
                  Date
                </label>
                <input
                  id="tx-date"
                  name="txnDate"
                  type="date"
                  required
                  value={txForm.txnDate}
                  onChange={(e) => setTxForm({ ...txForm, txnDate: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="tx-desc" className="block text-xs text-[#94A3B8] mb-1">
                  Description / Merchant
                </label>
                <input
                  id="tx-desc"
                  name="description"
                  type="text"
                  required
                  placeholder="e.g. Swiggy, Rent, Salary"
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="tx-type" className="block text-xs text-[#94A3B8] mb-1">
                    Type
                  </label>
                  <select
                    id="tx-type"
                    name="type"
                    value={txForm.type}
                    onChange={(e) => setTxForm({ ...txForm, type: e.target.value as 'income' | 'expense' })}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="tx-amount" className="block text-xs text-[#94A3B8] mb-1">
                    Amount (₹)
                  </label>
                  <input
                    id="tx-amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="tx-category" className="block text-xs text-[#94A3B8] mb-1">
                    Category
                  </label>
                  <select
                    id="tx-category"
                    name="category"
                    value={txForm.category}
                    onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="tx-method" className="block text-xs text-[#94A3B8] mb-1">
                    Method
                  </label>
                  <select
                    id="tx-method"
                    name="paymentMethod"
                    value={txForm.paymentMethod}
                    onChange={(e) => setTxForm({ ...txForm, paymentMethod: e.target.value })}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={savingTx}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#0D1218] hover:bg-[#2DD4BF] disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                <span>{savingTx ? 'Saving...' : 'Save Transaction'}</span>
              </button>
            </form>

            <div className="lg:col-span-8 rounded-xl border border-[#243040] bg-[#131A22] p-5 overflow-x-auto">
              <h2 className="font-display text-base font-semibold text-[#F3F6F9] mb-4">
                Recorded Transactions
              </h2>
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#243040] text-[#94A3B8]">
                  <tr>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Description</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3 text-right">Amount</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243040]/60">
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2.5 pr-3 font-mono text-[#94A3B8]">{t.txnDate}</td>
                      <td className="py-2.5 pr-3 text-[#F3F6F9]">
                        {t.description}
                        {t.isSynthetic && (
                          <span className="ml-2 rounded bg-[#F59E0B]/15 px-1.5 py-0.5 text-[10px] text-[#F59E0B]">
                            DEMO
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-[#94A3B8]">{t.category}</td>
                      <td
                        className={`py-2.5 pr-3 text-right font-mono font-semibold ${
                          t.type === 'income' ? 'text-[#10B981]' : 'text-[#F3F6F9]'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteTx(t.id)}
                          aria-label={`Delete transaction ${t.description}`}
                          className="text-[#94A3B8] hover:text-[#EF4444]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#94A3B8]">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'budgets' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveBudget}
              className="lg:col-span-4 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4 h-fit"
            >
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                Set Monthly Category Limit
              </h2>
              <div>
                <label htmlFor="budget-category" className="block text-xs text-[#94A3B8] mb-1">
                  Category
                </label>
                <select
                  id="budget-category"
                  name="budgetCategory"
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                >
                  {CATEGORIES.filter((c) => c !== 'Salary').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="budget-limit" className="block text-xs text-[#94A3B8] mb-1">
                  Monthly Limit (₹)
                </label>
                <input
                  id="budget-limit"
                  name="budgetLimit"
                  type="number"
                  min="100"
                  required
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <button
                type="submit"
                disabled={savingBudget}
                className="w-full rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#0D1218] hover:bg-[#2DD4BF]"
              >
                {savingBudget ? 'Saving...' : 'Save Budget Limit'}
              </button>
            </form>

            <div className="lg:col-span-8 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4">
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                Budget Utilization
              </h2>
              {insights?.budgetStatus?.length ? (
                <div className="space-y-4">
                  {insights.budgetStatus.map((b: any) => {
                    const pct = Math.min(100, Math.round(b.utilizationPct || 0));
                    const over = b.spent > b.monthlyLimit;
                    return (
                      <div key={b.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#F3F6F9]">{b.category}</span>
                          <span className={`font-mono ${over ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>
                            ₹{Number(b.spent).toLocaleString('en-IN')} / ₹{Number(b.monthlyLimit).toLocaleString('en-IN')} ({Math.round(b.utilizationPct)}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#0D1218] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${over ? 'bg-[#EF4444]' : pct > 80 ? 'bg-[#F59E0B]' : 'bg-[#14B8A6]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#94A3B8]">
                  No category limits set yet. Set a monthly limit on the left or load the synthetic demo.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === 'import' && (
          <form
            onSubmit={handleBulkImport}
            className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4 max-w-3xl"
          >
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-[#14B8A6]" />
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                Import CSV or Pasted UPI / Bank SMS Lines
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Paste CSV rows (<code>YYYY-MM-DD,Description,Amount,expense|income,Category</code>) or standard Indian bank/UPI SMS alerts (e.g., <code>Debited Rs. 450.00 to Swiggy via UPI on 2026-03-10</code>).
            </p>
            <div>
              <label htmlFor="bulk-import-text" className="sr-only">
                Paste CSV or UPI SMS lines
              </label>
              <textarea
                id="bulk-import-text"
                name="rawImportText"
                rows={7}
                value={rawImportText}
                onChange={(e) => setRawImportText(e.target.value)}
                placeholder={'2026-03-01,Monthly Rent,18000,expense,Housing & Rent\nDebited Rs. 620.00 to Zomato via UPI\nCredited Rs. 65000.00 Salary'}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] p-3 font-mono text-xs text-[#F3F6F9] placeholder-[#64748B]"
              />
            </div>
            <button
              type="submit"
              disabled={importing || !rawImportText.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#0D1218] hover:bg-[#2DD4BF] disabled:opacity-60"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>Parse &amp; Import Transactions</span>
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
