import React, { useEffect, useState } from 'react';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { AiFeedbackButton } from '../components/AiFeedbackModal';
import { RiskIndicator } from '../components/RiskIndicator';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function PaymentSafetyPage() {
  const { apiFetch } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    amount: '25000',
    purpose: 'Bank verification',
    recipientFamiliarity: 'unknown' as 'known' | 'merchant' | 'unknown',
    contactMethod: 'phone_call' as
      | 'phone_call'
      | 'sms'
      | 'whatsapp'
      | 'email'
      | 'in_person'
      | 'official_app',
    requestedByCaller: true,
    urgencyInvolved: true,
    kycRelated: true,
    confidentialInfoAsked: false,
    independentlyVerified: false,
    saveAssessment: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    const res = await apiFetch('/api/payment-safety/history');
    if (res.ok) {
      const data = await res.json();
      setHistory(data.checks || []);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch('/api/payment-safety/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not evaluate payment safety');
      setResult(data.evaluation);
      await loadHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">{t('payTitle')}</h1>
          <p className="text-sm text-[#94A3B8]">{t('paySubtitle')}</p>
        </div>

        <div className="rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-4 py-3 text-xs text-[#F59E0B]">
          {t('payDisclaimer')}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-6 rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-semibold text-[#F3F6F9]">
              {t('payFormTitle')}
            </h2>

            {error && (
              <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pay-amount" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('payAmountLabel')}
                </label>
                <input
                  id="pay-amount"
                  name="amount"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9] focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="pay-recipient" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('payRecipientLabel')}
                </label>
                <select
                  id="pay-recipient"
                  name="recipientFamiliarity"
                  value={form.recipientFamiliarity}
                  onChange={(e) =>
                    setForm({ ...form, recipientFamiliarity: e.target.value as any })
                  }
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                >
                  <option value="unknown">{t('payRecUnknown')}</option>
                  <option value="merchant">{t('payRecMerchant')}</option>
                  <option value="known">{t('payRecKnown')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pay-purpose" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('payPurposeLabel')}
                </label>
                <input
                  id="pay-purpose"
                  name="purpose"
                  required
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder={t('payPurposePlaceholder')}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>

              <div>
                <label htmlFor="pay-method" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('payMethodLabel')}
                </label>
                <select
                  id="pay-method"
                  name="contactMethod"
                  value={form.contactMethod}
                  onChange={(e) => setForm({ ...form, contactMethod: e.target.value as any })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                >
                  <option value="phone_call">{t('payMethodCall')}</option>
                  <option value="whatsapp">{t('payMethodWhatsapp')}</option>
                  <option value="sms">{t('payMethodSms')}</option>
                  <option value="email">{t('payMethodEmail')}</option>
                  <option value="official_app">{t('payMethodApp')}</option>
                  <option value="in_person">{t('payMethodPerson')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 text-xs text-[#F3F6F9]">
              {[
                ['requestedByCaller', t('payChkCaller')],
                ['urgencyInvolved', t('payChkUrgency')],
                ['kycRelated', t('payChkKyc')],
                ['confidentialInfoAsked', t('payChkConfidential')],
                ['independentlyVerified', t('payChkVerified')],
                ['saveAssessment', t('payChkSave')],
              ].map(([key, label]) => (
                <label key={key} htmlFor={`pay-chk-${key}`} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    id={`pay-chk-${key}`}
                    name={key}
                    type="checkbox"
                    checked={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="h-4 w-4 accent-[#10B981]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-[#34D399] disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>{t('paySubmitBtn')}</span>
            </button>
          </form>

          <div className="lg:col-span-6 space-y-5">
            {result ? (
              <div className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#F3F6F9]">
                    {result.riskLevel === 'LOW' ? (
                      <ShieldCheck className="h-5 w-5 text-[#10B981]" aria-hidden="true" />
                    ) : (
                      <ShieldAlert className="h-5 w-5 text-[#EF4444]" aria-hidden="true" />
                    )}
                    <span>{result.title}</span>
                  </div>
                  <RiskIndicator level={result.riskLevel} score={result.riskScore} />
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[#94A3B8]">{t('payReasonsTitle')}</div>
                  <ul className="list-disc pl-4 text-sm text-[#F3F6F9] space-y-1">
                    {result.reasons.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-[#0D1218] border border-[#243040] p-4 space-y-1">
                  <div className="text-xs font-semibold text-[#10B981]">{t('payActionTitle')}</div>
                  <p className="text-sm text-[#F3F6F9] leading-relaxed">
                    {result.recommendedAction}
                  </p>
                </div>

                <div className="flex justify-end">
                  <AiFeedbackButton
                    moduleType="payment_safety"
                    aiPredictedRisk={result.riskLevel}
                    reportedContentExcerpt={`${result.title} — ${result.recommendedAction}`}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#243040] bg-[#131A22]/60 p-8 text-center text-sm text-[#94A3B8]">
                {t('payEmptyPrompt')}
              </div>
            )}

            <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3">
              <h3 className="font-display text-base font-semibold text-[#F3F6F9]">
                {t('paySavedTitle')}
              </h3>
              {history.length === 0 ? (
                <p className="text-xs text-[#94A3B8]">{t('payNoSaved')}</p>
              ) : (
                <div className="divide-y divide-[#243040] text-xs">
                  {history.slice(0, 6).map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-[#F3F6F9]">
                          ₹{item.amount} · {item.purpose}
                        </div>
                        <div className="text-[#94A3B8]">
                          {t('paySavedRecLabel')}: {item.recipientFamiliarity} ·{' '}
                          {t('paySavedMethodLabel')}: {item.contactMethod.replace('_', ' ')}
                        </div>
                      </div>
                      <RiskIndicator level={item.riskLevel} score={item.riskScore} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
