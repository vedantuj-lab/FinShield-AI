import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function RiskIndicator({ level, score }: { level: string; score?: number }) {
  const { t } = useLanguage();
  const upper = (level || 'LOW').toUpperCase();
  const config: Record<string, { color: string; icon: React.ComponentType<any>; label: string }> = {
    LOW: { color: 'text-[#10B981]', icon: CheckCircle2, label: t('riskLow') },
    MODERATE: { color: 'text-[#F59E0B]', icon: Info, label: t('riskModerate') },
    HIGH: { color: 'text-[#F97316]', icon: AlertTriangle, label: t('riskHigh') },
    CRITICAL: { color: 'text-[#EF4444]', icon: AlertOctagon, label: t('riskCritical') },
  };
  const cfg = config[upper] || config.LOW;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${cfg.color}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{cfg.label}</span>
      {typeof score === 'number' && (
        <span className="font-mono tabular-nums text-[#94A3B8]">· {score}/100</span>
      )}
    </span>
  );
}
