import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { AiFeedbackButton } from '../components/AiFeedbackModal';
import { RiskIndicator } from '../components/RiskIndicator';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function RiskAssessmentPage() {
  const { apiFetch } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/investigations');
      if (res.ok) {
        const data = await res.json();
        setInvestigations(data.investigations || []);
        const paramId = Number(searchParams.get('id'));
        if (paramId && data.investigations?.some((i: any) => i.id === paramId)) {
          setSelectedId(paramId);
        } else if (data.investigations?.length > 0) {
          setSelectedId(data.investigations[0].id);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      setLoading(true);
      const res = await apiFetch('/api/risk/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investigationId: Number(selectedId) }),
      });
      if (res.ok) {
        setAssessment(await res.json());
      }
      setLoading(false);
    })();
  }, [selectedId]);

  const meterColor = (score: number) => {
    if (score >= 70) return 'bg-[#EF4444]';
    if (score >= 40) return 'bg-[#F97316]';
    if (score >= 20) return 'bg-[#F59E0B]';
    return 'bg-[#10B981]';
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">{t('riskTitle')}</h1>
            <p className="text-sm text-[#94A3B8]">{t('riskSubtitle')}</p>
          </div>
          <select
            id="risk-investigation-select"
            name="investigationId"
            aria-label={t('riskTitle')}
            value={selectedId}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : '';
              setSelectedId(v);
              if (v) setSearchParams({ id: String(v) });
            }}
            className="rounded-lg border border-[#243040] bg-[#131A22] px-3 py-2 text-xs text-[#F3F6F9]"
          >
            {investigations.length === 0 && (
              <option value="">{t('reconNoInvestigations')}</option>
            )}
            {investigations.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.investigationCode} — {inv.title}
              </option>
            ))}
          </select>
        </div>

        {loading && <div className="h-40 rounded-xl bg-[#131A22] animate-pulse" />}

        {assessment && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#243040] bg-[#131A22] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                  <ShieldAlert className="h-4 w-4 text-[#F97316]" aria-hidden="true" />
                  <span>{assessment.investigation.investigationCode}</span>
                </div>
                <h2 className="font-display text-xl font-bold text-[#F3F6F9]">
                  {assessment.investigation.title}
                </h2>
                <p className="text-sm text-[#94A3B8]">{assessment.risk.categoryDescription}</p>
                <p className="text-xs text-[#F59E0B]">
                  {assessment.risk.isPrototypeScoringDisclaimer}
                </p>
              </div>

              <div className="rounded-xl border border-[#243040] bg-[#0D1218] p-5 text-center min-w-[210px] space-y-2.5">
                <div className="font-mono text-3xl font-bold text-[#F3F6F9] tabular-nums">
                  {assessment.risk.riskScore}/100
                </div>
                <div className="h-2 w-full rounded-full bg-[#1B2430] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${meterColor(assessment.risk.riskScore)}`}
                    style={{ width: `${Math.min(100, assessment.risk.riskScore)}%` }}
                  />
                </div>
                <RiskIndicator level={assessment.risk.riskLevel} />
                <div className="pt-1 flex justify-center">
                  <AiFeedbackButton
                    moduleType="risk"
                    investigationId={assessment.investigation.id}
                    aiPredictedRisk={assessment.risk.riskLevel}
                    reportedContentExcerpt={assessment.risk.categoryDescription}
                  />
                </div>
              </div>
            </div>

            {/* Transparent Rule Breakdown Table */}
            <div className="rounded-xl border border-[#243040] bg-[#131A22] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#243040]">
                <h3 className="font-display text-base font-semibold text-[#F3F6F9]">
                  {t('riskBreakdownTitle')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1B2430] text-[#94A3B8]">
                    <tr>
                      <th className="px-5 py-3">{t('riskColCategory')}</th>
                      <th className="px-5 py-3">{t('riskColStatus')}</th>
                      <th className="px-5 py-3">{t('riskColEvidence')}</th>
                      <th className="px-5 py-3 text-right">{t('riskColMax')}</th>
                      <th className="px-5 py-3 text-right">{t('riskColApplied')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#243040]">
                    {assessment.risk.scoredIndicators.map((ind: any) => (
                      <tr key={ind.type}>
                        <td className="px-5 py-3.5 font-medium text-[#F3F6F9]">{ind.label}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={
                              ind.detected ? 'text-[#EF4444] font-semibold' : 'text-[#94A3B8]'
                            }
                          >
                            {ind.detected
                              ? `${t('manipStatusDetected')} (${ind.severity})`
                              : t('manipStatusNotDetected')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[#94A3B8] max-w-md">
                          {ind.supportingEvidence ? `"${ind.supportingEvidence}"` : ind.explanation}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums text-[#94A3B8]">
                          {ind.weight}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums text-[#F3F6F9]">
                          +{ind.appliedPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-2.5">
                <h3 className="font-display text-base font-semibold text-[#F3F6F9]">
                  {t('riskActionsTitle')}
                </h3>
                <ul className="list-disc pl-4 text-xs text-[#94A3B8] space-y-1.5">
                  {assessment.risk.recommendedActions.map((act: string, i: number) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-2.5">
                <h3 className="font-display text-base font-semibold text-[#F3F6F9]">
                  {t('riskSafeguardsTitle')}
                </h3>
                {assessment.risk.safeguardsApplied.length === 0 ? (
                  <p className="text-xs text-[#94A3B8]">{t('riskSafeguardsEmpty')}</p>
                ) : (
                  <ul className="list-disc pl-4 text-xs text-[#38BDF8] space-y-1.5">
                    {assessment.risk.safeguardsApplied.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
