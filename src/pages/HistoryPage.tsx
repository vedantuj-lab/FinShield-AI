import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { RiskIndicator } from '../components/RiskIndicator';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function HistoryPage() {
  const { apiFetch } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== 'ALL') params.set('risk', filter);
    if (query.trim()) params.set('q', query.trim());
    const res = await apiFetch(`/api/history?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.history || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const handleDelete = async (id: number) => {
    const res = await apiFetch(`/api/investigations/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const filterButtons = [
    { code: 'ALL', label: t('historyAll') },
    { code: 'LOW', label: t('historyLow') },
    { code: 'MODERATE', label: t('historyModerate') },
    { code: 'HIGH', label: t('historyHigh') },
    { code: 'CRITICAL', label: t('historyCritical') },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">
              {t('historyTitle')}
            </h1>
            <p className="text-sm text-[#94A3B8]">{t('historySubtitle')}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadHistory();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <Search
                className="h-3.5 w-3.5 text-[#94A3B8] absolute left-3 top-2.5"
                aria-hidden="true"
              />
              <input
                id="history-search"
                name="query"
                aria-label={t('historySearchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('historySearchPlaceholder')}
                className="rounded-lg border border-[#243040] bg-[#131A22] pl-8 pr-3 py-1.5 text-xs text-[#F3F6F9]"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#38BDF8] px-3.5 py-1.5 text-xs font-semibold text-[#0B0F14]"
            >
              {t('historySearchBtn')}
            </button>
          </form>
        </div>

        {/* Segmented Filter Control */}
        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#131A22] border border-[#243040]">
          {filterButtons.map((btn) => (
            <button
              key={btn.code}
              type="button"
              onClick={() => setFilter(btn.code)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === btn.code
                  ? 'bg-[#1B2430] text-[#38BDF8]'
                  : 'text-[#94A3B8] hover:text-[#F3F6F9]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-40 rounded-xl bg-[#131A22] animate-pulse" />
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#243040] bg-[#131A22] p-8 text-center text-sm text-[#94A3B8]">
            {t('historyEmpty')}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#243040] bg-[#131A22]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#243040] bg-[#1B2430] text-[#94A3B8]">
                <tr>
                  <th className="px-4 py-3">{t('historyColId')}</th>
                  <th className="px-4 py-3">{t('historyColTitle')}</th>
                  <th className="px-4 py-3">{t('historyColDate')}</th>
                  <th className="px-4 py-3">{t('historyColRisk')}</th>
                  <th className="px-4 py-3">{t('historyColStatus')}</th>
                  <th className="px-4 py-3 text-right">{t('historyColEvidence')}</th>
                  <th className="px-4 py-3 text-right">{t('historyColActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243040]">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1B2430]/40">
                    <td className="px-4 py-3 font-mono text-[#38BDF8]">
                      {item.investigationCode}
                    </td>
                    <td className="px-4 py-3 text-[#F3F6F9] font-medium">
                      {item.title}
                      {item.isSyntheticDemo && (
                        <span className="ml-2 font-mono text-[10px] text-[#F59E0B]">
                          {t('demoSectionBadge')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#94A3B8] tabular-nums">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <RiskIndicator level={item.riskLevel} score={item.riskScore} />
                    </td>
                    <td className="px-4 py-3 capitalize text-[#94A3B8]">{item.status}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-[#F3F6F9]">
                      {item.evidenceCount}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <Link
                        to={`/app/reconstruction?id=${item.id}`}
                        className="text-[#38BDF8] hover:underline font-medium"
                      >
                        {t('historyViewReport')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center gap-1 text-[#EF4444] hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t('historyDelete')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
