import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, GitBranch, Loader2, RefreshCw } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { AiFeedbackButton } from '../components/AiFeedbackModal';
import { RiskIndicator } from '../components/RiskIndicator';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function ReconstructionPage() {
  const { apiFetch } = useAuth();
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [investigations, setInvestigations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [detail, setDetail] = useState<any>(null);
  const [reconstruction, setReconstruction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reconstructing, setReconstructing] = useState(false);
  const [error, setError] = useState('');

  const loadList = async () => {
    const res = await apiFetch('/api/investigations');
    if (res.ok) {
      const data = await res.json();
      setInvestigations(data.investigations || []);
      const paramId = Number(searchParams.get('id'));
      if (paramId && data.investigations?.some((i: any) => i.id === paramId)) {
        setSelectedId(paramId);
      } else if (data.investigations?.length > 0 && !selectedId) {
        setSelectedId(data.investigations[0].id);
      }
    }
  };

  const loadDetail = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/investigations/${id}`);
      if (!res.ok) throw new Error('Could not load investigation');
      const data = await res.json();
      setDetail(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(Number(selectedId));
      setReconstruction(null);
    }
  }, [selectedId]);

  const handleReconstruct = async () => {
    if (!selectedId) return;
    setReconstructing(true);
    setError('');
    try {
      const res = await apiFetch('/api/investigations/reconstruct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investigationId: Number(selectedId), language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reconstruction failed');
      setReconstruction(data.reconstruction);
      await loadDetail(Number(selectedId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReconstructing(false);
    }
  };

  const evItems = detail?.evidence || [];
  const relationships = detail?.relationships || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">
              {t('reconTitle')}
            </h1>
            <p className="text-sm text-[#94A3B8]">{t('reconSubtitle')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              id="recon-investigation-select"
              name="investigationId"
              aria-label={t('reconTitle')}
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

            <button
              type="button"
              onClick={handleReconstruct}
              disabled={!selectedId || reconstructing || evItems.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-[#818CF8] px-4 py-2 text-xs font-semibold text-[#0B0F14] hover:bg-[#A5B4FC] disabled:opacity-50"
            >
              {reconstructing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{reconstructing ? t('reconWorking') : t('reconBtn')}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-48 rounded-xl bg-[#131A22] animate-pulse" />
        ) : !detail ? (
          <div className="rounded-xl border border-dashed border-[#243040] bg-[#131A22] p-8 text-center space-y-3">
            <p className="text-sm text-[#94A3B8]">{t('reconEmpty')}</p>
            <Link
              to="/app/investigate"
              className="inline-block rounded-lg bg-[#818CF8] px-4 py-2 text-xs font-semibold text-[#0B0F14]"
            >
              {t('reconGoInvestigate')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Final Investigation Report Header */}
            <div className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <span className="font-mono">{detail.investigation.investigationCode}</span>
                    {detail.investigation.isSyntheticDemo && (
                      <span className="font-mono text-[#F59E0B]">
                        · {t('demoSectionBadge')}
                      </span>
                    )}
                    <span>· {detail.investigation.suspectedCategory}</span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#F3F6F9]">
                    {detail.investigation.title}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <RiskIndicator
                    level={detail.investigation.riskLevel}
                    score={detail.investigation.riskScore}
                  />
                  <AiFeedbackButton
                    moduleType="reconstruction"
                    investigationId={detail.investigation.id}
                    aiPredictedRisk={detail.investigation.riskLevel}
                    reportedContentExcerpt={
                      detail.investigation.explanation || detail.investigation.title
                    }
                  />
                </div>
              </div>

              {detail.investigation.explanation && (
                <p className="text-sm text-[#F3F6F9] leading-relaxed">
                  {detail.investigation.explanation}
                </p>
              )}

              {reconstruction?.insufficient_evidence && (
                <div className="rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-4 flex items-start gap-3 text-xs text-[#F59E0B]">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <strong>{t('reconInsufficientTitle')}</strong>{' '}
                    {reconstruction.insufficiency_reason ||
                      'A factual relationship between submitted items could not be established without additional evidence.'}
                  </div>
                </div>
              )}

              {evItems.length < 2 && (
                <div className="rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-3.5 text-xs text-[#F59E0B]">
                  {t('reconFewItemsNote')}
                </div>
              )}
            </div>

            {/* Visual Evidence Node Graph — Indigo Accent */}
            <div className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-[#F3F6F9] flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />
                  <span>{t('reconGraphTitle')}</span>
                </h3>
                <span className="text-xs text-[#94A3B8] tabular-nums">
                  {evItems.length} {t('reconNodesLabel')} · {relationships.length} {t('reconLinksLabel')}
                </span>
              </div>

              {evItems.length > 0 && (
                <div className="overflow-x-auto">
                  <div className="min-w-[640px] flex items-center justify-between gap-4 py-4">
                    {evItems.map((ev: any, idx: number) => {
                      const relOut = relationships.find((r: any) => r.sourceEvidenceId === ev.id);
                      return (
                        <React.Fragment key={ev.id}>
                          <div className="flex-1 rounded-xl border border-[#818CF8]/40 bg-[#0D1218] p-4 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-mono text-[#818CF8]">
                              <span>NODE #{idx + 1}</span>
                              <span>{ev.eventTimestamp || ev.evidenceType}</span>
                            </div>
                            <div className="text-sm font-semibold text-[#F3F6F9] line-clamp-1">
                              {ev.title}
                            </div>
                            <div className="text-xs text-[#94A3B8] line-clamp-2">
                              {ev.analysisSummary || ev.extractedText}
                            </div>
                          </div>

                          {idx < evItems.length - 1 && (
                            <div className="flex flex-col items-center shrink-0 w-32 text-center">
                              <div className="text-[11px] font-mono text-[#F59E0B] mb-1">
                                {relOut ? relOut.indicatorLabel : t('reconUnlinked')}
                              </div>
                              <div className="w-full h-0.5 bg-[#818CF8]/60 relative">
                                <span className="absolute right-0 -top-1.5 text-[#818CF8] text-xs">
                                  ▶
                                </span>
                              </div>
                              <div className="text-[10px] text-[#94A3B8] mt-1 line-clamp-2">
                                {relOut ? relOut.relationshipType : t('reconClickPrompt')}
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {relationships.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#243040]">
                  {relationships.map((rel: any) => (
                    <div
                      key={rel.id}
                      className="rounded-lg bg-[#0D1218] px-4 py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-[#818CF8]">
                          {rel.relationshipType} ({rel.indicatorLabel})
                        </span>
                        <p className="text-[#94A3B8]">{rel.explanation}</p>
                      </div>
                      {rel.eventTime && (
                        <span className="font-mono text-[#F59E0B] shrink-0">{rel.eventTime}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chronological Investigation Timeline + Conflicts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4">
                <h3 className="font-display text-base font-semibold text-[#F3F6F9]">
                  {t('reconTimelineTitle')}
                </h3>
                <div className="space-y-4">
                  {(reconstruction?.timeline?.length
                    ? reconstruction.timeline
                    : evItems.map((ev: any) => ({
                        time: ev.eventTimestamp || '—',
                        title: ev.title,
                        indicator_label: ev.evidenceType,
                        explanation: ev.analysisSummary || ev.extractedText,
                      }))
                  ).map((step: any, i: number) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="font-mono text-xs font-semibold text-[#818CF8] w-24 shrink-0 pt-0.5 tabular-nums">
                        {step.time}
                      </div>
                      <div className="flex-1 rounded-lg bg-[#0D1218] border border-[#243040] p-3.5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#F3F6F9]">{step.title}</span>
                          <span className="text-[11px] font-mono text-[#F59E0B]">
                            {step.indicator_label}
                          </span>
                        </div>
                        <p className="text-xs text-[#94A3B8] leading-relaxed">{step.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-2">
                  <h3 className="font-display text-base font-semibold text-[#F3F6F9]">
                    {t('reconComparisonTitle')}
                  </h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {reconstruction?.payment_instruction_comparison || t('reconComparisonEmpty')}
                  </p>
                </div>

                {reconstruction?.conflicting_information?.length > 0 && (
                  <div className="rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-5 space-y-2">
                    <h3 className="font-display text-sm font-semibold text-[#F59E0B]">
                      {t('reconConflictsTitle')}
                    </h3>
                    <ul className="list-disc pl-4 text-xs text-[#F3F6F9] space-y-1">
                      {reconstruction.conflicting_information.map((c: string, idx: number) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-2">
                  <h3 className="font-display text-base font-semibold text-[#F3F6F9]">
                    {t('reconActionsTitle')}
                  </h3>
                  <ul className="list-disc pl-4 text-xs text-[#94A3B8] space-y-1.5">
                    {(detail.investigation.recommendedActions || []).map((a: string, i: number) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                  <div className="pt-3 flex flex-wrap gap-2">
                    <Link
                      to={`/app/risk?id=${detail.investigation.id}`}
                      className="rounded-lg border border-[#243040] bg-[#1B2430] px-3 py-1.5 text-xs font-medium text-[#F3F6F9]"
                    >
                      {t('reconInspectRisk')}
                    </Link>
                    <Link
                      to="/app/trusted-circle"
                      className="rounded-lg border border-[#818CF8]/40 px-3 py-1.5 text-xs font-medium text-[#A5B4FC]"
                    >
                      {t('reconShareWarn')}
                    </Link>
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
