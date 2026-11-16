import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Download,
  ExternalLink,
  Loader2,
  PhoneCall,
  Plus,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { downloadRescuePdf } from '../utils/rescuePdf';

export function RescuePage() {
  const { apiFetch } = useAuth();
  const { t } = useLanguage();
  const [activated, setActivated] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [activeCase, setActiveCase] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingEv, setUploadingEv] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    incidentDate: new Date().toISOString().slice(0, 10),
    incidentTime: '10:30',
    amountInvolved: '',
    paymentMethod: 'UPI',
    transactionReference: '',
    bankProvider: '',
    suspectedCategory: 'Bank / KYC Impersonation',
    description: '',
    actionsTaken: [] as string[],
  });

  const [evForm, setEvForm] = useState({
    type: 'payment_screenshot',
    title: '',
    summary: '',
    timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
    file: null as File | null,
  });

  const loadCases = async () => {
    const res = await apiFetch('/api/rescue');
    if (res.ok) {
      const data = await res.json();
      setCases(data.rescueCases || []);
      if (data.rescueCases?.length > 0 && !activeCase) {
        setActiveCase(data.rescueCases[0]);
      }
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch('/api/rescue/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create rescue case');
      setActiveCase(data.rescueCase);
      await loadCases();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;
    setUploadingEv(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('type', evForm.type);
      fd.append('title', evForm.title || 'Rescue Evidence Item');
      fd.append('summary', evForm.summary);
      fd.append('timestamp', evForm.timestamp);
      if (evForm.file) fd.append('file', evForm.file);

      const res = await apiFetch(`/api/rescue/${activeCase.id}/evidence`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add evidence');
      setActiveCase(data.rescueCase);
      setEvForm({
        type: 'payment_screenshot',
        title: '',
        summary: '',
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        file: null,
      });
      await loadCases();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingEv(false);
    }
  };

  const handleDownloadPdf = async (caseId: number) => {
    const res = await apiFetch(`/api/rescue/${caseId}/report`);
    if (res.ok) {
      const data = await res.json();
      downloadRescuePdf(data.report);
    }
  };

  const actionOptions = [
    { val: 'Called 1930 Cyber Crime Helpline', label: t('rescueAct1930') },
    { val: 'Reported to Bank Fraud Desk', label: t('rescueActBank') },
    { val: 'Submitted complaint on cybercrime.gov.in', label: t('rescueActPortal') },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Emergency Banner — Crimson Command Center */}
        <div className="rounded-xl border border-[#EF4444] bg-[#EF4444]/15 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EF4444]">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <span>{t('rescueBadge')}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F3F6F9]">
              {t('call1930')}
            </h1>
            <p className="text-sm text-[#F3F6F9]/90 max-w-2xl">{t('rescueUrgentDesc')}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href="tel:1930"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#EF4444] px-5 py-3 text-sm font-bold text-white hover:opacity-90 whitespace-nowrap"
            >
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              <span>{t('rescueCallBtn')}</span>
            </a>
            <a
              href="https://cybercrime.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#F3F6F9]/30 bg-[#0D1218] px-5 py-3 text-sm font-semibold text-[#F3F6F9] hover:border-[#38BDF8] whitespace-nowrap"
            >
              <span>cybercrime.gov.in</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {!activated && (
          <button
            type="button"
            onClick={() => setActivated(true)}
            className="rounded-lg bg-[#EF4444] px-5 py-3 text-sm font-bold text-white"
          >
            {t('rescueBadge')}
          </button>
        )}

        {error && (
          <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* STEP 1 — Incident Details */}
          <form
            onSubmit={handleCreateCase}
            className="lg:col-span-6 rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4"
          >
            <div className="space-y-1">
              <div className="font-mono text-xs text-[#EF4444]">{t('rescueStep1Label')}</div>
              <h2 className="font-display text-lg font-semibold text-[#F3F6F9]">
                {t('rescueStep1Title')}
              </h2>
              <p className="text-xs text-[#94A3B8]">{t('rescueNoPinNote')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="rescue-date" className="block text-xs text-[#94A3B8] mb-1">
                  {t('rescueDateLabel')}
                </label>
                <input
                  id="rescue-date"
                  name="incidentDate"
                  type="date"
                  required
                  value={form.incidentDate}
                  onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="rescue-time" className="block text-xs text-[#94A3B8] mb-1">
                  {t('rescueTimeLabel')}
                </label>
                <input
                  id="rescue-time"
                  name="incidentTime"
                  type="time"
                  required
                  value={form.incidentTime}
                  onChange={(e) => setForm({ ...form, incidentTime: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="rescue-amount" className="block text-xs text-[#94A3B8] mb-1">
                  {t('rescueAmountLabel')}
                </label>
                <input
                  id="rescue-amount"
                  name="amountInvolved"
                  required
                  placeholder="₹25,000"
                  value={form.amountInvolved}
                  onChange={(e) => setForm({ ...form, amountInvolved: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="rescue-method" className="block text-xs text-[#94A3B8] mb-1">
                  {t('rescueMethodLabel')}
                </label>
                <select
                  id="rescue-method"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                >
                  <option>UPI</option>
                  <option>IMPS / NEFT / RTGS</option>
                  <option>Debit / Credit Card</option>
                  <option>NetBanking</option>
                  <option>Digital Wallet</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="rescue-ref" className="block text-xs text-[#94A3B8] mb-1">
                  {t('rescueRefLabel')}
                </label>
                <input
                  id="rescue-ref"
                  name="transactionReference"
                  required
                  placeholder="UTR 6319XXXX1234"
                  value={form.transactionReference}
                  onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="rescue-bank" className="block text-xs text-[#94A3B8] mb-1">
                  {t('rescueBankLabel')}
                </label>
                <input
                  id="rescue-bank"
                  name="bankProvider"
                  required
                  placeholder="SBI / HDFC / GPay"
                  value={form.bankProvider}
                  onChange={(e) => setForm({ ...form, bankProvider: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="rescue-category" className="block text-xs text-[#94A3B8] mb-1">{t('rescueCatLabel')}</label>
              <select
                id="rescue-category"
                name="suspectedCategory"
                value={form.suspectedCategory}
                onChange={(e) => setForm({ ...form, suspectedCategory: e.target.value })}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
              >
                <option>Bank / KYC Impersonation</option>
                <option>UPI Refund Scam</option>
                <option>Fake Customer Care</option>
                <option>Investment / Trading Scam</option>
                <option>Loan Processing Fee Scam</option>
                <option>Phishing Link / OTP Theft</option>
              </select>
            </div>

            <div>
              <label htmlFor="rescue-desc" className="block text-xs text-[#94A3B8] mb-1">{t('rescueDescLabel')}</label>
              <textarea
                id="rescue-desc"
                name="description"
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('rescueDescPlaceholder')}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
              />
            </div>

            <div className="space-y-1.5 text-xs text-[#F3F6F9]">
              <div className="text-[#94A3B8]">{t('rescueActionsTakenLabel')}</div>
              {actionOptions.map((act) => (
                <label key={act.val} htmlFor={`rescue-action-${act.val}`} className="flex items-center gap-2">
                  <input
                    id={`rescue-action-${act.val}`}
                    name={`action_${act.val}`}
                    type="checkbox"
                    checked={form.actionsTaken.includes(act.val)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...form.actionsTaken, act.val]
                        : form.actionsTaken.filter((a) => a !== act.val);
                      setForm({ ...form, actionsTaken: next });
                    }}
                    className="accent-[#EF4444]"
                  />
                  <span>{act.label}</span>
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#EF4444] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#DC2626] disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>{t('rescueCreateBtn')}</span>
            </button>
          </form>

          {/* STEP 3, 4, 5 — Evidence Organisation, Timeline & PDF Export */}
          <div className="lg:col-span-6 space-y-5">
            {cases.length > 0 && (
              <div className="rounded-xl border border-[#243040] bg-[#131A22] p-4 flex flex-wrap items-center justify-between gap-3">
                <select
                  id="rescue-active-case"
                  name="activeRescueCaseId"
                  aria-label={t('rescueStep3Label')}
                  value={activeCase?.id || ''}
                  onChange={(e) =>
                    setActiveCase(cases.find((c) => c.id === Number(e.target.value)) || null)
                  }
                  className="rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.rescueCode} — {c.amountInvolved} ({c.incidentDate})
                    </option>
                  ))}
                </select>

                {activeCase && (
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(activeCase.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2 text-xs font-semibold text-[#0B0F14] hover:bg-[#FBBF24]"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('rescueDownloadBtn')}</span>
                  </button>
                )}
              </div>
            )}

            {activeCase ? (
              <>
                <form
                  onSubmit={handleAddEvidence}
                  className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-3"
                >
                  <div className="font-mono text-xs text-[#EF4444]">
                    {t('rescueStep3Label')} ({activeCase.rescueCode})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      id="rescue-ev-type"
                      name="rescueEvidenceType"
                      aria-label={t('invEvidenceTypeLabel')}
                      value={evForm.type}
                      onChange={(e) => setEvForm({ ...evForm, type: e.target.value })}
                      className="rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                    >
                      <option value="payment_screenshot">{t('invTypePayScreenshot')}</option>
                      <option value="bank_notification">{t('invTypeBankNotif')}</option>
                      <option value="sms">{t('invTypeSms')}</option>
                      <option value="whatsapp">{t('invTypeWhatsapp')}</option>
                      <option value="voice_transcript">{t('invTypeTranscript')}</option>
                      <option value="document">{t('invTypeScreenshot')}</option>
                    </select>
                    <input
                      id="rescue-ev-title"
                      name="rescueEvidenceTitle"
                      aria-label={t('invEvidenceLabelField')}
                      value={evForm.title}
                      onChange={(e) => setEvForm({ ...evForm, title: e.target.value })}
                      placeholder={t('invEvidenceLabelField')}
                      className="rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                    />
                  </div>
                  <input
                    id="rescue-ev-summary"
                    name="rescueEvidenceSummary"
                    aria-label={t('invTextLabel')}
                    value={evForm.summary}
                    onChange={(e) => setEvForm({ ...evForm, summary: e.target.value })}
                    placeholder={t('invTextLabel')}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <input
                      id="rescue-ev-file"
                      name="rescueEvidenceFile"
                      aria-label={t('invBrowseFile')}
                      type="file"
                      onChange={(e) =>
                        setEvForm({ ...evForm, file: e.target.files?.[0] || null })
                      }
                      className="text-xs text-[#94A3B8]"
                    />
                    <button
                      type="submit"
                      disabled={uploadingEv}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#EF4444]/50 bg-[#1B2430] px-3.5 py-2 text-xs font-semibold text-[#F87171]"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{uploadingEv ? t('rescueAttachingBtn') : t('rescueAttachBtn')}</span>
                    </button>
                  </div>
                </form>

                <div className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-3">
                  <div className="font-mono text-xs text-[#EF4444]">{t('rescueStep4Label')}</div>
                  <div className="space-y-2.5">
                    {(activeCase.timelineEvents || []).map((ev: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-lg bg-[#0D1218] border border-[#243040] p-3 text-xs space-y-1"
                      >
                        <div className="flex justify-between font-mono text-[#F59E0B]">
                          <span>{ev.title}</span>
                          <span>{ev.time}</span>
                        </div>
                        <p className="text-[#94A3B8]">{ev.detail}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#94A3B8] pt-2 border-t border-[#243040]">
                    {t('rescuePdfDisclaimer')}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-[#243040] bg-[#131A22]/50 p-8 text-center text-sm text-[#94A3B8]">
                {t('rescueEmptyRight')}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export function IncidentReportsPage() {
  const { apiFetch } = useAuth();
  const { t } = useLanguage();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/rescue');
      if (res.ok) {
        const data = await res.json();
        setCases(data.rescueCases || []);
      }
      setLoading(false);
    })();
  }, []);

  const handleDownload = async (id: number) => {
    const res = await apiFetch(`/api/rescue/${id}/report`);
    if (res.ok) {
      const data = await res.json();
      downloadRescuePdf(data.report);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">{t('reportsTitle')}</h1>
          <p className="text-sm text-[#94A3B8]">{t('reportsSubtitle')}</p>
        </div>

        {loading ? (
          <div className="h-32 rounded-xl bg-[#131A22] animate-pulse" />
        ) : cases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#243040] bg-[#131A22] p-8 text-center text-sm text-[#94A3B8]">
            {t('reportsEmpty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#F43F5E]">{c.rescueCode}</span>
                  <span className="font-mono text-[#94A3B8]">{c.reportReference}</span>
                </div>
                <div className="font-display text-lg font-semibold text-[#F3F6F9]">
                  {c.suspectedCategory} · {c.amountInvolved}
                </div>
                <p className="text-xs text-[#94A3B8]">
                  {c.incidentDate} · {c.incidentTime} · {c.bankProvider} · {c.transactionReference}
                </p>
                <button
                  type="button"
                  onClick={() => handleDownload(c.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#F43F5E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#E11D48]"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t('reportsDownloadDossier')}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
