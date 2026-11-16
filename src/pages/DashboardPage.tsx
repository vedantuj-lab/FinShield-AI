import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppShell } from '../components/AppShell';
import { RiskIndicator } from '../components/RiskIndicator';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function DashboardPage() {
  const { apiFetch } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [investigations, setInvestigations] = useState<any[]>([]);
  const [rescueCases, setRescueCases] = useState<any[]>([]);
  const [advisories, setAdvisories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [invRes, rescueRes] = await Promise.all([
        apiFetch('/api/investigations'),
        apiFetch('/api/rescue'),
      ]);
      if (!invRes.ok) throw new Error('Failed to load investigations');
      const invJson = await invRes.json();
      const rescueJson = rescueRes.ok ? await rescueRes.json() : { rescueCases: [] };
      setInvestigations(invJson.investigations || []);
      setRescueCases(rescueJson.rescueCases || []);
    } catch (err: any) {
      setError(err.message || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetch(`/api/safety-advisories?lang=${encodeURIComponent(language)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.advisories) setAdvisories(d.advisories);
      })
      .catch(() => {});
  }, [language]);

  const handleLoadDemo = async () => {
    setSeedingDemo(true);
    setError('');
    try {
      const res = await apiFetch('/api/investigations/seed-demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate synthetic demo');
      navigate(`/app/reconstruction?id=${data.investigationId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSeedingDemo(false);
    }
  };

  const highRiskCount = investigations.filter(
    (i) => i.riskLevel === 'HIGH' || i.riskLevel === 'CRITICAL'
  ).length;
  const openRescueCount = rescueCases.filter((r) => r.status === 'open').length;

  const riskChartData = [
    {
      name: t('historyLow'),
      count: investigations.filter((i) => i.riskLevel === 'LOW').length,
      color: '#10B981',
    },
    {
      name: t('historyModerate'),
      count: investigations.filter((i) => i.riskLevel === 'MODERATE').length,
      color: '#F59E0B',
    },
    {
      name: t('historyHigh'),
      count: investigations.filter((i) => i.riskLevel === 'HIGH').length,
      color: '#F97316',
    },
    {
      name: t('historyCritical'),
      count: investigations.filter((i) => i.riskLevel === 'CRITICAL').length,
      color: '#EF4444',
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome & Demo Trigger */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F3F6F9]">
              {t('welcomeTitle')}
            </h1>
            <p className="text-sm text-[#94A3B8]">{t('welcomeSubtitle')}</p>
          </div>

          <button
            type="button"
            onClick={handleLoadDemo}
            disabled={seedingDemo}
            className="inline-flex items-center gap-2 rounded-lg border border-[#38BDF8]/40 bg-[#131A22] px-4 py-2 text-xs font-semibold text-[#38BDF8] hover:bg-[#1B2430] disabled:opacity-50 whitespace-nowrap self-start"
          >
            {seedingDemo ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{seedingDemo ? t('loadingDemo') : t('loadDemo')}</span>
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        {/* Quick Actions — Distinct Stage Accents */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/app/investigate"
            className="rounded-xl border border-[#243040] bg-[#131A22] p-5 hover:border-[#38BDF8] transition-colors flex items-start justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[#38BDF8] text-sm font-semibold">
                <Upload className="h-4 w-4" aria-hidden="true" />
                <span>{t('quickInvestigate')}</span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {t('quickInvestigateDesc')}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#94A3B8] shrink-0 mt-1" aria-hidden="true" />
          </Link>

          <Link
            to="/app/payment-safety"
            className="rounded-xl border border-[#243040] bg-[#131A22] p-5 hover:border-[#10B981] transition-colors flex items-start justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[#10B981] text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>{t('quickPaymentSafety')}</span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {t('quickPaymentSafetyDesc')}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#94A3B8] shrink-0 mt-1" aria-hidden="true" />
          </Link>

          <Link
            to="/app/rescue"
            className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-5 hover:border-[#EF4444] transition-colors flex items-start justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[#EF4444] text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <span>{t('quickRescue')}</span>
              </div>
              <p className="text-xs text-[#F3F6F9]/85 leading-relaxed">
                {t('quickRescueDesc')}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#EF4444] shrink-0 mt-1" aria-hidden="true" />
          </Link>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5">
            <div className="text-xs text-[#94A3B8]">{t('statTotalInv')}</div>
            <div className="font-mono text-2xl font-bold text-[#F3F6F9] tabular-nums mt-1">
              {loading ? '—' : investigations.length}
            </div>
          </div>
          <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5">
            <div className="text-xs text-[#94A3B8]">{t('statHighRisk')}</div>
            <div className="font-mono text-2xl font-bold text-[#EF4444] tabular-nums mt-1">
              {loading ? '—' : highRiskCount}
            </div>
          </div>
          <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5">
            <div className="text-xs text-[#94A3B8]">{t('statPendingRescue')}</div>
            <div className="font-mono text-2xl font-bold text-[#F59E0B] tabular-nums mt-1">
              {loading ? '—' : openRescueCount}
            </div>
          </div>
          <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5">
            <div className="text-xs text-[#94A3B8]">{t('statRecentInv')}</div>
            <div className="font-mono text-2xl font-bold text-[#38BDF8] tabular-nums mt-1">
              {loading ? '—' : Math.min(5, investigations.length)}
            </div>
          </div>
        </div>

        {/* Chart & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4">
            <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
              {t('chartRiskTitle')}
            </h2>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskChartData}>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1218',
                      border: '1px solid #243040',
                      borderRadius: '8px',
                      color: '#F3F6F9',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {riskChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                {t('recentActivityTitle')}
              </h2>
              <Link
                to="/app/history"
                className="text-xs font-medium text-[#38BDF8] hover:text-[#7DD3FC]"
              >
                {t('viewAllHistory')}
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-12 rounded-lg bg-[#1B2430] animate-pulse" />
                ))}
              </div>
            ) : investigations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#243040] p-6 text-center space-y-3">
                <p className="text-sm text-[#94A3B8]">{t('emptyActivityMsg')}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    to="/app/investigate"
                    className="rounded-lg bg-[#38BDF8] px-4 py-2 text-xs font-semibold text-[#0B0F14]"
                  >
                    {t('startFirstInv')}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLoadDemo}
                    disabled={seedingDemo}
                    className="rounded-lg border border-[#243040] px-4 py-2 text-xs font-medium text-[#F3F6F9]"
                  >
                    {t('loadDemo')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#243040]">
                {investigations.slice(0, 5).map((inv) => (
                  <div
                    key={inv.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                        <span className="font-mono">{inv.investigationCode}</span>
                        {inv.isSyntheticDemo && (
                          <span className="font-mono text-[#F59E0B]">
                            · {t('demoSectionBadge')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-[#F3F6F9] truncate">{inv.title}</div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <RiskIndicator level={inv.riskLevel} score={inv.riskScore} />
                      <Link
                        to={`/app/reconstruction?id=${inv.id}`}
                        className="text-xs font-medium text-[#38BDF8] hover:underline whitespace-nowrap"
                      >
                        {t('openReport')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Safety Advisories (Published by Platform Administrators) */}
        {advisories.length > 0 && (
          <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-semibold text-[#F3F6F9] flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#14B8A6]" aria-hidden="true" />
                  <span>{t('safetyAdvisoriesTitle')}</span>
                </h2>
                <p className="text-xs text-[#94A3B8]">{t('safetyAdvisoriesSubtitle')}</p>
              </div>
              <Link
                to="/app/profile"
                className="text-xs font-medium text-[#14B8A6] hover:underline"
              >
                {t('profileSupportTitle')} →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {advisories.slice(0, 4).map((adv) => (
                <div
                  key={adv.id}
                  className="rounded-xl border border-[#243040] bg-[#0D1218] p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase text-[#14B8A6]">
                      {adv.category}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-[#64748B]">
                      {adv.language}
                    </span>
                  </div>
                  <h3 className="font-display text-sm font-semibold text-[#F3F6F9]">
                    {adv.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{adv.summary}</p>
                  {adv.actionChecklist?.length > 0 && (
                    <ul className="space-y-1 pt-1">
                      {adv.actionChecklist.slice(0, 3).map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[#F3F6F9]">
                          <CheckCircle2
                            className="h-3.5 w-3.5 text-[#10B981] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
