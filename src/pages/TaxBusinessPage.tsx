import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  Building2,
  Calculator,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Plus,
  Receipt,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

export function TaxBusinessPage() {
  const { apiFetch } = useAuth();
  const [tab, setTab] = useState<'tax' | 'invoices' | 'cashflow' | 'emi'>('tax');
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');

  // Tax state
  const [taxForm, setTaxForm] = useState({
    annualIncome: '1200000',
    deduction80C: '150000',
    deduction80D: '25000',
    hraExemption: '0',
    homeLoanInterest: '0',
  });
  const [taxResult, setTaxResult] = useState<any>(null);
  const [taxHistory, setTaxHistory] = useState<any[]>([]);

  // Business invoices & cashflow
  const [invoices, setInvoices] = useState<any[]>([]);
  const [cashflow, setCashflow] = useState<any[]>([]);
  const [invForm, setInvForm] = useState({
    clientName: '',
    clientGstin: '',
    description: '',
    subtotal: '',
    gstRate: '18',
    dueDate: new Date().toISOString().slice(0, 10),
  });
  const [cfForm, setCfForm] = useState({
    entryDate: new Date().toISOString().slice(0, 10),
    type: 'inflow' as 'inflow' | 'outflow',
    category: 'Client Payment',
    amount: '',
    notes: '',
  });

  // EMI calculator (client-side deterministic math)
  const [loanAmount, setLoanAmount] = useState('500000');
  const [annualRate, setAnnualRate] = useState('10.5');
  const [tenureMonths, setTenureMonths] = useState('36');

  const loadData = async () => {
    try {
      const [thRes, invRes] = await Promise.all([
        apiFetch('/api/finance/tax/history'),
        apiFetch('/api/finance/business/invoices'),
      ]);
      if (thRes.ok) setTaxHistory((await thRes.json()).history || []);
      if (invRes.ok) {
        const d = await invRes.json();
        setInvoices(d.invoices || []);
        setCashflow(d.cashflow || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tax/business data.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBanner('');
    const res = await apiFetch('/api/finance/tax/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        annualIncome: Number(taxForm.annualIncome),
        deduction80C: Number(taxForm.deduction80C),
        deduction80D: Number(taxForm.deduction80D),
        hraExemption: Number(taxForm.hraExemption),
        homeLoanInterest: Number(taxForm.homeLoanInterest),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Tax calculation failed.');
      return;
    }
    setTaxResult(data);
    setBanner('FY 2025-26 Old vs. New Regime comparison saved.');
    await loadData();
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBanner('');
    const res = await apiFetch('/api/finance/business/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...invForm,
        subtotal: Number(invForm.subtotal),
        gstRate: Number(invForm.gstRate),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create invoice.');
      return;
    }
    setInvForm({
      clientName: '',
      clientGstin: '',
      description: '',
      subtotal: '',
      gstRate: '18',
      dueDate: new Date().toISOString().slice(0, 10),
    });
    setBanner(`GST Invoice ${data.invoice.invoiceNumber} created.`);
    await loadData();
  };

  const handleToggleInvoicePaid = async (inv: any) => {
    const nextStatus = inv.status === 'paid' ? 'unpaid' : 'paid';
    const res = await apiFetch(`/api/finance/business/invoices/${inv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) await loadData();
  };

  const handleDownloadInvoicePdf = (inv: any) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('TAX INVOICE (GST)', 20, 22);
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${inv.invoiceNumber}`, 20, 34);
    doc.text(`Status: ${String(inv.status).toUpperCase()}`, 20, 41);
    doc.text(`Due Date: ${inv.dueDate || 'N/A'}`, 20, 48);
    doc.text(`Bill To: ${inv.clientName}`, 20, 60);
    if (inv.clientGstin) doc.text(`Client GSTIN: ${inv.clientGstin}`, 20, 67);
    doc.text(`Description: ${inv.description}`, 20, 80);
    doc.text(`Subtotal: Rs. ${Number(inv.subtotal).toLocaleString('en-IN')}`, 20, 94);
    doc.text(`GST (${inv.gstRate}%): Rs. ${Number(inv.gstAmount).toLocaleString('en-IN')}`, 20, 102);
    doc.setFontSize(12);
    doc.text(`Total Payable: Rs. ${Number(inv.totalAmount).toLocaleString('en-IN')}`, 20, 114);
    doc.setFontSize(8);
    doc.text('Generated via FINSHIELD AI Small Business Finance Suite.', 20, 134);
    doc.save(`${inv.invoiceNumber}.pdf`);
  };

  const handleAddCashflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBanner('');
    const res = await apiFetch('/api/finance/business/cashflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...cfForm,
        amount: Number(cfForm.amount),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not record cashflow entry.');
      return;
    }
    setCfForm({ ...cfForm, amount: '', notes: '' });
    setBanner('Cash-flow entry recorded.');
    await loadData();
  };

  // EMI calculation
  const P = Math.max(0, Number(loanAmount) || 0);
  const r = Math.max(0, Number(annualRate) || 0) / 12 / 100;
  const n = Math.max(1, Number(tenureMonths) || 1);
  const emi = r > 0 ? (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : P / n;
  const totalPayable = emi * n;
  const totalInterest = Math.max(0, totalPayable - P);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">
            Tax Assistant &amp; Small Business Finance
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Compare Indian FY 2025-26 Old vs. New Tax Regimes, generate GST PDF invoices, track business cash flow, and calculate loan EMIs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[#243040] pb-3">
          {[
            ['tax', 'FY 2025-26 Tax Calculator', FileSpreadsheet],
            ['invoices', `GST Invoices (${invoices.length})`, Receipt],
            ['cashflow', 'Business Cash Flow', Building2],
            ['emi', 'Loan & EMI Calculator', Calculator],
          ].map(([id, label, Icon]: any) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold ${
                tab === id
                  ? 'bg-[#14B8A6] text-[#0D1218]'
                  : 'bg-[#131A22] text-[#94A3B8] border border-[#243040]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {error && <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">{error}</div>}
        {banner && <div className="rounded-lg border border-[#14B8A6]/40 bg-[#14B8A6]/10 p-3 text-xs text-[#14B8A6]">{banner}</div>}

        {tab === 'tax' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCalculateTax}
              className="lg:col-span-5 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4"
            >
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                Indian Income Tax Estimator (FY 2025-26)
              </h2>
              {[
                ['tax-income', 'annualIncome', 'Annual Gross Income (₹)'],
                ['tax-80c', 'deduction80C', 'Section 80C Deductions (max ₹1,50,000)'],
                ['tax-80d', 'deduction80D', 'Section 80D Health Insurance (₹)'],
                ['tax-hra', 'hraExemption', 'HRA Exemption (Old Regime, ₹)'],
                ['tax-homeloan', 'homeLoanInterest', 'Home Loan Interest Sec 24(b) (₹)'],
              ].map(([id, key, label]) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-xs text-[#94A3B8] mb-1">
                    {label}
                  </label>
                  <input
                    id={id}
                    name={key}
                    type="number"
                    min="0"
                    value={(taxForm as any)[key]}
                    onChange={(e) => setTaxForm({ ...taxForm, [key]: e.target.value })}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="w-full rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#0D1218] hover:bg-[#2DD4BF]"
              >
                Compare Old vs. New Regime
              </button>
            </form>

            <div className="lg:col-span-7 space-y-6">
              {taxResult && (
                <div className="rounded-xl border border-[#14B8A6]/40 bg-[#131A22] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold text-[#F3F6F9]">
                      Regime Comparison Result ({taxResult.ruleVersion})
                    </h3>
                    <span className="rounded bg-[#14B8A6]/15 px-2.5 py-1 font-mono text-xs font-semibold text-[#14B8A6]">
                      Recommended: {taxResult.recommendedRegime}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-[#0D1218] border border-[#243040] p-4">
                      <div className="text-xs text-[#94A3B8]">New Regime Tax (incl. 4% cess)</div>
                      <div className="font-mono text-2xl font-bold text-[#14B8A6] mt-1">
                        ₹{Number(taxResult.newRegimeTax).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="rounded-lg bg-[#0D1218] border border-[#243040] p-4">
                      <div className="text-xs text-[#94A3B8]">Old Regime Tax (incl. 4% cess)</div>
                      <div className="font-mono text-2xl font-bold text-[#F59E0B] mt-1">
                        ₹{Number(taxResult.oldRegimeTax).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    Estimated savings with {taxResult.recommendedRegime}:{' '}
                    <strong className="text-[#10B981]">
                      ₹{Number(taxResult.estimatedSavings).toLocaleString('en-IN')}
                    </strong>
                    . For official filing, consult a Chartered Accountant or the Income Tax e-Filing portal.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5">
                <h3 className="font-display text-sm font-semibold text-[#F3F6F9] mb-3">
                  Saved Tax Calculations
                </h3>
                {taxHistory.length ? (
                  <div className="space-y-2 text-xs">
                    {taxHistory.slice(0, 6).map((h) => (
                      <div
                        key={h.id}
                        className="rounded-lg bg-[#0D1218] border border-[#243040] p-3 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono text-[#F3F6F9]">
                            Income: ₹{Number(h.annualIncome).toLocaleString('en-IN')}
                          </span>
                          <span className="ml-2 text-[#94A3B8]">({h.financialYear})</span>
                        </div>
                        <div className="font-mono text-[#14B8A6]">{h.recommendedRegime}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8]">No calculations saved yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'invoices' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCreateInvoice}
              className="lg:col-span-4 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3.5 h-fit"
            >
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                Create GST Invoice
              </h2>
              <div>
                <label htmlFor="inv-client" className="block text-xs text-[#94A3B8] mb-1">
                  Client Name
                </label>
                <input
                  id="inv-client"
                  name="clientName"
                  required
                  value={invForm.clientName}
                  onChange={(e) => setInvForm({ ...invForm, clientName: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="inv-gstin" className="block text-xs text-[#94A3B8] mb-1">
                  Client GSTIN (optional)
                </label>
                <input
                  id="inv-gstin"
                  name="clientGstin"
                  placeholder="27AAAAA0000A1Z5"
                  value={invForm.clientGstin}
                  onChange={(e) => setInvForm({ ...invForm, clientGstin: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="inv-desc" className="block text-xs text-[#94A3B8] mb-1">
                  Service / Product Description
                </label>
                <input
                  id="inv-desc"
                  name="description"
                  required
                  value={invForm.description}
                  onChange={(e) => setInvForm({ ...invForm, description: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inv-sub" className="block text-xs text-[#94A3B8] mb-1">
                    Subtotal (₹)
                  </label>
                  <input
                    id="inv-sub"
                    name="subtotal"
                    type="number"
                    min="1"
                    required
                    value={invForm.subtotal}
                    onChange={(e) => setInvForm({ ...invForm, subtotal: e.target.value })}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  />
                </div>
                <div>
                  <label htmlFor="inv-gst" className="block text-xs text-[#94A3B8] mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    id="inv-gst"
                    name="gstRate"
                    value={invForm.gstRate}
                    onChange={(e) => setInvForm({ ...invForm, gstRate: e.target.value })}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="inv-due" className="block text-xs text-[#94A3B8] mb-1">
                  Due Date
                </label>
                <input
                  id="inv-due"
                  name="dueDate"
                  type="date"
                  value={invForm.dueDate}
                  onChange={(e) => setInvForm({ ...invForm, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#0D1218] hover:bg-[#2DD4BF]"
              >
                <Plus className="h-4 w-4" />
                <span>Generate Invoice</span>
              </button>
            </form>

            <div className="lg:col-span-8 rounded-xl border border-[#243040] bg-[#131A22] p-5 overflow-x-auto">
              <h2 className="font-display text-base font-semibold text-[#F3F6F9] mb-4">
                Generated GST Invoices
              </h2>
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#243040] text-[#94A3B8]">
                  <tr>
                    <th className="py-2 pr-3">Invoice #</th>
                    <th className="py-2 pr-3">Client</th>
                    <th className="py-2 pr-3 text-right">Total (incl. GST)</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243040]/60">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-2.5 pr-3 font-mono text-[#38BDF8]">{inv.invoiceNumber}</td>
                      <td className="py-2.5 pr-3 text-[#F3F6F9]">{inv.clientName}</td>
                      <td className="py-2.5 pr-3 text-right font-mono font-semibold">
                        ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 pr-3">
                        <button
                          type="button"
                          onClick={() => handleToggleInvoicePaid(inv)}
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${
                            inv.status === 'paid'
                              ? 'bg-[#10B981]/15 text-[#10B981]'
                              : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {inv.status}
                        </button>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoicePdf(inv)}
                          className="inline-flex items-center gap-1 rounded border border-[#243040] px-2 py-1 text-[11px] text-[#14B8A6] hover:border-[#14B8A6]"
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#94A3B8]">
                        No invoices generated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'cashflow' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleAddCashflow}
              className="lg:col-span-4 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3.5 h-fit"
            >
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                Record Cash Flow
              </h2>
              <div>
                <label htmlFor="cf-date" className="block text-xs text-[#94A3B8] mb-1">
                  Date
                </label>
                <input
                  id="cf-date"
                  name="entryDate"
                  type="date"
                  required
                  value={cfForm.entryDate}
                  onChange={(e) => setCfForm({ ...cfForm, entryDate: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cf-type" className="block text-xs text-[#94A3B8] mb-1">
                    Direction
                  </label>
                  <select
                    id="cf-type"
                    name="type"
                    value={cfForm.type}
                    onChange={(e) => setCfForm({ ...cfForm, type: e.target.value as 'inflow' | 'outflow' })}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  >
                    <option value="inflow">Inflow</option>
                    <option value="outflow">Outflow</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cf-amt" className="block text-xs text-[#94A3B8] mb-1">
                    Amount (₹)
                  </label>
                  <input
                    id="cf-amt"
                    name="amount"
                    type="number"
                    min="1"
                    required
                    value={cfForm.amount}
                    onChange={(e) => setCfForm({ ...cfForm, amount: e.target.value })}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="cf-cat" className="block text-xs text-[#94A3B8] mb-1">
                  Category
                </label>
                <input
                  id="cf-cat"
                  name="category"
                  required
                  value={cfForm.category}
                  onChange={(e) => setCfForm({ ...cfForm, category: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="cf-notes" className="block text-xs text-[#94A3B8] mb-1">
                  Notes
                </label>
                <input
                  id="cf-notes"
                  name="notes"
                  value={cfForm.notes}
                  onChange={(e) => setCfForm({ ...cfForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#0D1218]"
              >
                Save Cash-Flow Entry
              </button>
            </form>

            <div className="lg:col-span-8 rounded-xl border border-[#243040] bg-[#131A22] p-5">
              <h2 className="font-display text-base font-semibold text-[#F3F6F9] mb-4">
                Cash-Flow Ledger
              </h2>
              <div className="space-y-2 text-xs">
                {cashflow.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg bg-[#0D1218] border border-[#243040] p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-[#F3F6F9]">{c.category}</div>
                      <div className="text-[#94A3B8]">
                        {c.entryDate} {c.notes ? `· ${c.notes}` : ''}
                      </div>
                    </div>
                    <div
                      className={`font-mono font-bold ${
                        c.type === 'inflow' ? 'text-[#10B981]' : 'text-[#EF4444]'
                      }`}
                    >
                      {c.type === 'inflow' ? '+' : '-'}₹{Number(c.amount).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
                {cashflow.length === 0 && (
                  <p className="text-xs text-[#94A3B8]">No cash-flow entries recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'emi' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4">
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                Loan &amp; EMI Parameters
              </h2>
              <div>
                <label htmlFor="emi-principal" className="block text-xs text-[#94A3B8] mb-1">
                  Loan Principal (₹)
                </label>
                <input
                  id="emi-principal"
                  name="loanAmount"
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="emi-rate" className="block text-xs text-[#94A3B8] mb-1">
                  Annual Interest Rate (%)
                </label>
                <input
                  id="emi-rate"
                  name="annualRate"
                  type="number"
                  step="0.1"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="emi-tenure" className="block text-xs text-[#94A3B8] mb-1">
                  Tenure (Months)
                </label>
                <input
                  id="emi-tenure"
                  name="tenureMonths"
                  type="number"
                  min="1"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
            </div>

            <div className="lg:col-span-7 rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-5">
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                Amortisation Summary
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg bg-[#0D1218] border border-[#243040] p-4">
                  <div className="text-xs text-[#94A3B8]">Monthly EMI</div>
                  <div className="font-mono text-2xl font-bold text-[#14B8A6] mt-1">
                    ₹{Math.round(emi).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="rounded-lg bg-[#0D1218] border border-[#243040] p-4">
                  <div className="text-xs text-[#94A3B8]">Total Interest</div>
                  <div className="font-mono text-2xl font-bold text-[#F59E0B] mt-1">
                    ₹{Math.round(totalInterest).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="rounded-lg bg-[#0D1218] border border-[#243040] p-4">
                  <div className="text-xs text-[#94A3B8]">Total Payable</div>
                  <div className="font-mono text-2xl font-bold text-[#F3F6F9] mt-1">
                    ₹{Math.round(totalPayable).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
