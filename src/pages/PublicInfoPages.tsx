import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Play, ShieldCheck } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { useLanguage } from '../context/LanguageContext';

export function AboutPage() {
  const { t } = useLanguage();
  return (
    <PublicLayout>
      <div className="border-b border-[#1E293B] bg-[#0B0F14]">
        <div className="mx-auto max-w-4xl px-6 py-14 space-y-4">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F3F6F9]">
            {t('aboutTitle')}
          </h1>
          <p className="text-base text-[#94A3B8] leading-relaxed">{t('aboutIntro')}</p>
        </div>
      </div>

      <div className="bg-[#F4F6F8] text-[#0F172A]">
        <div className="mx-auto max-w-4xl px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#CBD5E1] bg-white p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-[#0F172A]">{t('aboutWhoTitle')}</h2>
            <p className="text-sm text-[#475569] leading-relaxed">{t('aboutWhoBody')}</p>
          </div>
          <div className="rounded-xl border border-[#CBD5E1] bg-white p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-[#0F172A]">
              {t('aboutPrincipleTitle')}
            </h2>
            <p className="text-sm text-[#475569] leading-relaxed">{t('aboutPrincipleBody')}</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export function HowItWorksPage() {
  const { t } = useLanguage();
  const steps = [
    { num: '01', title: t('howStep1Title'), desc: t('howStep1Desc'), color: 'text-[#0284C7]' },
    { num: '02', title: t('howStep2Title'), desc: t('howStep2Desc'), color: 'text-[#D97706]' },
    { num: '03', title: t('howStep3Title'), desc: t('howStep3Desc'), color: 'text-[#6366F1]' },
    { num: '04', title: t('howStep4Title'), desc: t('howStep4Desc'), color: 'text-[#EA580C]' },
    { num: '05', title: t('howStep5Title'), desc: t('howStep5Desc'), color: 'text-[#059669]' },
  ];

  return (
    <PublicLayout>
      <div className="border-b border-[#1E293B] bg-[#0B0F14]">
        <div className="mx-auto max-w-5xl px-6 py-14 space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F3F6F9]">
            {t('navHowItWorks')}
          </h1>
          <p className="text-base text-[#94A3B8]">{t('howPageSubtitle')}</p>
        </div>
      </div>

      <div className="bg-[#F4F6F8] text-[#0F172A]">
        <div className="mx-auto max-w-5xl px-6 py-14 space-y-6">
          <div className="space-y-4">
            {steps.map((s) => (
              <div
                key={s.num}
                className="rounded-xl border border-[#CBD5E1] bg-white p-6 flex flex-col sm:flex-row gap-4 sm:items-start"
              >
                <div className={`font-mono text-lg font-bold tabular-nums shrink-0 ${s.color}`}>
                  {s.num}
                </div>
                <div className="space-y-1.5">
                  <h2 className="font-display text-lg font-semibold text-[#0F172A]">{s.title}</h2>
                  <p className="text-sm text-[#475569] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/login"
            className="inline-flex items-center rounded-lg bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#115E59]"
          >
            {t('finalCtaBtn')}
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}

export function FeaturesPage() {
  const { t } = useLanguage();
  const features = [
    [t('cap1Title'), t('cap1Desc')],
    [t('cap2Title'), t('cap2Desc')],
    [t('cap3Title'), t('cap3Desc')],
    [t('cap4Title'), t('cap4Desc')],
    [t('cap5Title'), t('cap5Desc')],
    [t('cap6Title'), t('cap6Desc')],
    [t('trustedTitle'), t('trustedSubtitle')],
    [t('voiceTitle'), t('voiceSubtitle')],
  ];

  return (
    <PublicLayout>
      <div className="border-b border-[#1E293B] bg-[#0B0F14]">
        <div className="mx-auto max-w-6xl px-6 py-14 space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F3F6F9]">
            {t('featuresPageTitle')}
          </h1>
          <p className="text-base text-[#94A3B8]">{t('featuresPageSubtitle')}</p>
        </div>
      </div>

      <div className="bg-[#EEF2F6] text-[#0F172A]">
        <div className="mx-auto max-w-6xl px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map(([title, desc]) => (
            <div key={title} className="rounded-xl border border-[#CBD5E1] bg-white p-6 space-y-2">
              <h2 className="font-display text-lg font-semibold text-[#0F172A]">{title}</h2>
              <p className="text-sm text-[#475569] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}

export function SecurityPrivacyPage() {
  const { t } = useLanguage();
  return (
    <PublicLayout>
      <div className="border-b border-[#1E293B] bg-[#0B0F14]">
        <div className="mx-auto max-w-4xl px-6 py-14 space-y-3">
          <div className="flex items-center gap-2 text-sm text-[#38BDF8] font-medium">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>{t('securityPageBadge')}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F3F6F9]">
            {t('securityPageTitle')}
          </h1>
        </div>
      </div>

      <div className="bg-[#F4F6F8] text-[#0F172A]">
        <div className="mx-auto max-w-4xl px-6 py-14 space-y-5 text-sm text-[#475569] leading-relaxed">
          <div className="rounded-xl border border-[#CBD5E1] bg-white p-6 space-y-2">
            <h2 className="font-display text-lg font-semibold text-[#0F172A]">
              1. {t('trustBullet2Title')}
            </h2>
            <p>{t('trustBullet2Body')}</p>
          </div>
          <div className="rounded-xl border border-[#CBD5E1] bg-white p-6 space-y-2">
            <h2 className="font-display text-lg font-semibold text-[#0F172A]">
              2. {t('trustBullet1Title')}
            </h2>
            <p>{t('trustBullet1Body')}</p>
          </div>
          <div id="terms" className="rounded-xl border border-[#CBD5E1] bg-white p-6 space-y-2">
            <h2 className="font-display text-lg font-semibold text-[#0F172A]">
              3. {t('trustBullet3Title')}
            </h2>
            <p>{t('trustBullet3Body')}</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export function MethodologyPage() {
  const { t } = useLanguage();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  const handleRunEvaluation = async () => {
    setRunning(true);
    setError('');
    try {
      const res = await fetch('/api/evaluation/run', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Evaluation failed');
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Could not complete synthetic evaluation.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F3F6F9]">
              {t('methodologyTitle')}
            </h1>
            <p className="text-sm sm:text-base text-[#94A3B8]">{t('methodologySubtitle')}</p>
          </div>

          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-[#38BDF8] px-5 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-[#7DD3FC] disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{running ? t('methodologyRunningBtn') : t('methodologyRunBtn')}</span>
          </button>
        </div>

        <div className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#F3F6F9]">
            Prototype Rule-Based Weights (Maximum 100 Points)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[
              ['OTP or PIN request', '25 pts'],
              ['Authority impersonation', '20 pts'],
              ['Urgent payment demand', '15 pts'],
              ['Suspicious external link', '15 pts'],
              ['Payment-purpose inconsistency', '15 pts'],
              ['Threat or fear-based language', '10 pts'],
            ].map(([label, pts]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg bg-[#0D1218] border border-[#243040] px-4 py-3"
              >
                <span className="text-[#F3F6F9]">{label}</span>
                <span className="font-mono font-semibold text-[#38BDF8] tabular-nums">{pts}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#94A3B8]">
            Thresholds: 0–19 LOW · 20–39 MODERATE · 40–69 HIGH · 70–100 CRITICAL. Prototype heuristic weights, not statistically calibrated fraud probabilities.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        {report && (
          <div className="space-y-6">
            <div className="rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-4 text-xs text-[#F59E0B]">
              {report.disclaimer}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                ['Precision', report.metrics.precision],
                ['Recall', report.metrics.recall],
                ['F1-Score', report.metrics.f1Score],
                ['False-Positive Rate', report.metrics.falsePositiveRate],
                ['Avg Latency (ms)', `${report.metrics.avgProcessingMs} ms`],
                ['Explanation Coverage', report.metrics.explanationCoverage],
              ].map(([k, v]) => (
                <div key={String(k)} className="rounded-xl border border-[#243040] bg-[#131A22] p-4">
                  <div className="text-xs text-[#94A3B8]">{k}</div>
                  <div className="font-mono text-xl font-bold text-[#F3F6F9] tabular-nums mt-1">
                    {v}
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#243040] bg-[#131A22]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#243040] bg-[#1B2430] text-[#94A3B8]">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Scenario</th>
                    <th className="px-4 py-3">Lang</th>
                    <th className="px-4 py-3">Expected</th>
                    <th className="px-4 py-3">Predicted</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-right">Time</th>
                    <th className="px-4 py-3">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243040]">
                  {report.cases.map((c: any) => (
                    <tr key={c.id} className="hover:bg-[#1B2430]/50">
                      <td className="px-4 py-3 font-mono text-[#38BDF8]">{c.id}</td>
                      <td className="px-4 py-3 text-[#F3F6F9]">{c.label}</td>
                      <td className="px-4 py-3 text-[#94A3B8]">{c.language}</td>
                      <td className="px-4 py-3">{c.expectedSuspicious ? 'Suspicious' : 'Genuine'}</td>
                      <td className="px-4 py-3">{c.riskLevel}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{c.riskScore}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{c.processingMs} ms</td>
                      <td className="px-4 py-3 font-mono font-semibold text-[#10B981]">{c.outcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

export function ContactPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', topic: 'General Support', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ referenceId: string; note: string } | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setConfirmation({ referenceId: data.referenceId, note: data.note });
      setForm({ name: '', email: '', topic: 'General Support', message: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5 space-y-4">
          <h1 className="font-display text-3xl font-bold text-[#F3F6F9]">{t('contactTitle')}</h1>
          <p className="text-sm text-[#94A3B8] leading-relaxed">{t('contactSubtitle')}</p>
          <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-4 space-y-2 text-xs">
            <div className="font-semibold text-[#EF4444]">{t('contactEmergencyTitle')}</div>
            <div className="font-mono text-base font-bold text-[#F3F6F9]">{t('call1930')}</div>
            <a
              href="https://cybercrime.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[#38BDF8] underline"
            >
              https://cybercrime.gov.in/
            </a>
          </div>
        </div>

        <div className="md:col-span-7 rounded-xl border border-[#243040] bg-[#131A22] p-6">
          {confirmation ? (
            <div className="space-y-3 py-6">
              <CheckCircle2 className="h-8 w-8 text-[#10B981]" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-[#F3F6F9]">
                Inquiry Received ({confirmation.referenceId})
              </h2>
              <p className="text-sm text-[#94A3B8]">{confirmation.note}</p>
              <button
                onClick={() => setConfirmation(null)}
                className="rounded-lg border border-[#243040] px-4 py-2 text-xs font-medium text-[#F3F6F9]"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="contact-name" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('authNameLabel')}
                </label>
                <input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3.5 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('authEmailLabel')}
                </label>
                <input
                  id="contact-email"
                  name="email"
                  autoComplete="email"
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3.5 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="contact-topic" className="block text-xs font-medium text-[#94A3B8] mb-1">Topic</label>
                <select
                  id="contact-topic"
                  name="topic"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3.5 py-2 text-sm text-[#F3F6F9]"
                >
                  <option>General Support</option>
                  <option>Language &amp; Accessibility</option>
                  <option>Research &amp; Methodology</option>
                  <option>Privacy Request</option>
                </select>
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-xs font-medium text-[#94A3B8] mb-1">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3.5 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-[#2DD4BF] disabled:opacity-50"
              >
                {submitting ? t('contactSendingBtn') : t('contactSubmitBtn')}
              </button>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
