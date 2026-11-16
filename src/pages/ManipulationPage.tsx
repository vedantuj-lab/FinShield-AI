import React, { useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { AiFeedbackButton } from '../components/AiFeedbackModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function ManipulationPage() {
  const { apiFetch } = useAuth();
  const { language, t } = useLanguage();
  const [text, setText] = useState(
    'Your bank account will be blocked within 10 minutes. Contact our verification department and complete the payment immediately.'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const cardTitles: Record<string, string> = {
    urgency: t('manipCardUrgency'),
    fear: t('manipCardFear'),
    authority_impersonation: t('manipCardAuthority'),
    secrecy: t('manipCardSecrecy'),
    emotional_manipulation: t('manipCardEmotional'),
    financial_pressure: t('manipCardFinancial'),
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/manipulation/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed.');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'Detected') return 'text-[#EF4444]';
    if (status === 'Possible') return 'text-[#F59E0B]';
    return 'text-[#10B981]';
  };

  const statusLabel = (status: string) => {
    if (status === 'Detected') return t('manipStatusDetected');
    if (status === 'Possible') return t('manipStatusPossible');
    return t('manipStatusNotDetected');
  };

  const severityMeta = (severity: string, status: string) => {
    if (status === 'Not Detected') return { pct: 8, bar: 'bg-[#10B981]' };
    const s = (severity || '').toLowerCase();
    if (s === 'high') return { pct: 95, bar: 'bg-[#EF4444]' };
    if (s === 'medium') return { pct: 62, bar: 'bg-[#F59E0B]' };
    return { pct: 32, bar: 'bg-[#38BDF8]' };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">
            {t('manipTitle')}
          </h1>
          <p className="text-sm text-[#94A3B8]">{t('manipSubtitle')}</p>
        </div>

        <form
          onSubmit={handleAnalyze}
          className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4"
        >
          <label htmlFor="manip-input-text" className="block text-xs font-medium text-[#94A3B8]">
            {t('manipInputLabel')}
          </label>
          <textarea
            id="manip-input-text"
            name="text"
            rows={4}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-lg border border-[#243040] bg-[#0D1218] p-3.5 text-sm text-[#F3F6F9] focus:border-[#F59E0B] focus:outline-none"
          />
          {error && (
            <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
              {error}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  setText(
                    'मला बँकेकडून फोन आला आहे. ते सांगत आहेत की केवायसी अपडेट न केल्यास खाते १० मिनिटांत बंद होईल आणि ते पैसे पाठवायला सांगत आहेत.'
                  )
                }
                className="rounded-lg border border-[#243040] bg-[#1B2430] px-3 py-1.5 text-[#94A3B8] hover:text-[#F3F6F9]"
              >
                {t('manipSampleMarathi')}
              </button>
              <button
                type="button"
                onClick={() =>
                  setText(
                    'Reminder: Your monthly electricity bill of INR 1,240 is due on 25-11-2026. Pay via your official electricity portal.'
                  )
                }
                className="rounded-lg border border-[#243040] bg-[#1B2430] px-3 py-1.5 text-[#94A3B8] hover:text-[#F3F6F9]"
              >
                {t('manipSampleGenuine')}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-5 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-[#FBBF24] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>{loading ? t('manipAnalyzing') : t('manipAnalyzeBtn')}</span>
            </button>
          </div>
        </form>

        {result && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#F59E0B]/40 bg-[#131A22] p-6 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#F59E0B]">
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  <span>{t('manipAiHeading')}</span>
                </div>
                <AiFeedbackButton
                  moduleType="manipulation"
                  reportedContentExcerpt={result.overall_assessment || text}
                />
              </div>
              <p className="text-sm text-[#F3F6F9] leading-relaxed">{result.overall_assessment}</p>
              <p className="text-xs text-[#94A3B8]">{result.suspected_vs_proven_note}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.core_cards?.map((card: any) => {
                const meter = severityMeta(card.severity, card.status);
                const borderClass =
                  card.status === 'Detected'
                    ? 'border-[#EF4444]/50'
                    : card.status === 'Possible'
                      ? 'border-[#F59E0B]/50'
                      : 'border-[#243040]';
                return (
                  <div
                    key={card.dimension}
                    className={`rounded-xl border ${borderClass} bg-[#131A22] p-5 space-y-3`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                        {cardTitles[card.dimension] || card.dimension}
                      </h2>
                      <span className={`text-xs font-semibold ${statusColor(card.status)}`}>
                        {statusLabel(card.status)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-[#94A3B8] uppercase">
                        <span>{t('manipSeverityLabel')}</span>
                        <span>{card.severity}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#0D1218] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${meter.bar}`}
                          style={{ width: `${meter.pct}%` }}
                        />
                      </div>
                    </div>

                    {card.supporting_evidence && (
                      <div className="rounded-lg bg-[#0D1218] p-2.5 text-xs text-[#F3F6F9]">
                        "{card.supporting_evidence}"
                      </div>
                    )}
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{card.explanation}</p>
                  </div>
                );
              })}
            </div>

            {result.extended_signals?.length > 0 && (
              <div className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-3">
                <h3 className="font-display text-base font-semibold text-[#F3F6F9]">
                  {t('manipAdditionalHeading')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.extended_signals.map((sig: any) => (
                    <div
                      key={sig.dimension}
                      className="rounded-lg bg-[#0D1218] border border-[#243040] p-3.5 text-xs space-y-1"
                    >
                      <div className="flex justify-between font-semibold">
                        <span className="text-[#F3F6F9] capitalize">
                          {sig.dimension.replace(/_/g, ' ')}
                        </span>
                        <span className={sig.detected ? 'text-[#F59E0B]' : 'text-[#10B981]'}>
                          {sig.detected
                            ? `${t('manipStatusDetected')} (${sig.severity})`
                            : t('manipStatusNotDetected')}
                        </span>
                      </div>
                      <p className="text-[#94A3B8]">{sig.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
