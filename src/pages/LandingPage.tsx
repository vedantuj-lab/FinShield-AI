import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  FileSearch,
  GitBranch,
  Lock,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { useLanguage } from '../context/LanguageContext';

export function LandingPage() {
  const { t } = useLanguage();

  const lifecycle = [
    {
      step: t('life1Step'),
      title: t('life1Title'),
      desc: t('life1Desc'),
      accent: 'text-[#10B981]',
      borderHover: 'hover:border-[#10B981]/60',
    },
    {
      step: t('life2Step'),
      title: t('life2Title'),
      desc: t('life2Desc'),
      accent: 'text-[#38BDF8]',
      borderHover: 'hover:border-[#38BDF8]/60',
    },
    {
      step: t('life3Step'),
      title: t('life3Title'),
      desc: t('life3Desc'),
      accent: 'text-[#818CF8]',
      borderHover: 'hover:border-[#818CF8]/60',
    },
    {
      step: t('life4Step'),
      title: t('life4Title'),
      desc: t('life4Desc'),
      accent: 'text-[#EF4444]',
      borderHover: 'hover:border-[#EF4444]/60',
    },
  ];

  const capabilities = [
    {
      icon: FileSearch,
      title: t('cap1Title'),
      desc: t('cap1Desc'),
      to: '/app/investigate',
      iconColor: 'text-[#0284C7]',
    },
    {
      icon: Activity,
      title: t('cap2Title'),
      desc: t('cap2Desc'),
      to: '/app/manipulation',
      iconColor: 'text-[#D97706]',
    },
    {
      icon: GitBranch,
      title: t('cap3Title'),
      desc: t('cap3Desc'),
      to: '/app/reconstruction',
      featured: true,
      iconColor: 'text-[#818CF8]',
    },
    {
      icon: ShieldAlert,
      title: t('cap4Title'),
      desc: t('cap4Desc'),
      to: '/app/risk',
      iconColor: 'text-[#EA580C]',
    },
    {
      icon: ShieldCheck,
      title: t('cap5Title'),
      desc: t('cap5Desc'),
      to: '/app/payment-safety',
      iconColor: 'text-[#059669]',
    },
    {
      icon: AlertTriangle,
      title: t('cap6Title'),
      desc: t('cap6Desc'),
      to: '/app/rescue',
      iconColor: 'text-[#DC2626]',
    },
  ];

  const howSteps = [
    ['01', t('howStep1Title'), t('howStep1Desc'), 'text-[#38BDF8]'],
    ['02', t('howStep2Title'), t('howStep2Desc'), 'text-[#F59E0B]'],
    ['03', t('howStep3Title'), t('howStep3Desc'), 'text-[#818CF8]'],
    ['04', t('howStep4Title'), t('howStep4Desc'), 'text-[#F97316]'],
    ['05', t('howStep5Title'), t('howStep5Desc'), 'text-[#10B981]'],
  ];

  const demoTimeline = [
    {
      time: '10:00 AM',
      label: t('demo1Label'),
      text: t('demo1Text'),
      timeColor: 'text-[#0284C7]',
    },
    {
      time: '10:15 AM',
      label: t('demo2Label'),
      text: t('demo2Text'),
      timeColor: 'text-[#D97706]',
    },
    {
      time: '10:25 AM',
      label: t('demo3Label'),
      text: t('demo3Text'),
      timeColor: 'text-[#EA580C]',
    },
    {
      time: '10:30 AM',
      label: t('demo4Label'),
      text: t('demo4Text'),
      timeColor: 'text-[#DC2626]',
    },
  ];

  return (
    <PublicLayout>
      {/* SECTION 1 — HERO (Deep Obsidian) */}
      <section className="border-b border-[#1E293B] bg-[#0B0F14]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p className="text-sm font-medium text-[#38BDF8]">{t('heroKicker')}</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#F3F6F9] leading-[1.1] max-w-2xl [text-wrap:balance]">
              {t('heroHeadline')}
            </h1>
            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-xl">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-[#14B8A6] px-6 py-3 text-sm font-semibold text-[#0B0F14] hover:bg-[#2DD4BF] transition-colors whitespace-nowrap"
              >
                <span>{t('ctaPrimary')}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-[#243040] bg-[#131A22] px-6 py-3 text-sm font-semibold text-[#F3F6F9] hover:border-[#38BDF8] transition-colors whitespace-nowrap"
              >
                <span>{t('ctaSecondary')}</span>
              </Link>
            </div>
            <div className="pt-4 border-t border-[#1E293B] flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#94A3B8]">
              <span>{t('heroChipLang')}</span>
              <span aria-hidden="true">·</span>
              <span>{t('heroChipRules')}</span>
              <span aria-hidden="true">·</span>
              <span>{t('heroChipHelpline')}</span>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-[#243040] bg-[#131A22] overflow-hidden">
            <div className="relative h-64 sm:h-72 w-full bg-[#1B2430]">
              <img
                src="/src/assets/images/hero_finshield_workspace_1794797268602.jpg"
                alt="FINSHIELD AI financial investigation workstation displaying an evidence connection timeline"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131A22] via-[#131A22]/30 to-transparent" />
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span className="font-mono">{t('demoSectionBadge')}</span>
                <span className="font-mono text-[#EF4444] font-semibold tabular-nums">
                  {t('riskCritical')} · 85/100
                </span>
              </div>
              <h2 className="font-display text-lg font-semibold text-[#F3F6F9]">
                {t('heroDemoHeading')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-[#243040] bg-[#0D1218] p-3 space-y-1">
                  <div className="font-mono text-[#38BDF8] tabular-nums">{t('heroDemoStep1Time')}</div>
                  <div className="font-medium text-[#F3F6F9]">{t('heroDemoStep1Title')}</div>
                  <div className="text-[#94A3B8]">{t('heroDemoStep1Desc')}</div>
                </div>
                <div className="rounded-lg border border-[#243040] bg-[#0D1218] p-3 space-y-1">
                  <div className="font-mono text-[#F59E0B] tabular-nums">{t('heroDemoStep2Time')}</div>
                  <div className="font-medium text-[#F3F6F9]">{t('heroDemoStep2Title')}</div>
                  <div className="text-[#94A3B8]">{t('heroDemoStep2Desc')}</div>
                </div>
                <div className="rounded-lg border border-[#243040] bg-[#0D1218] p-3 space-y-1">
                  <div className="font-mono text-[#EF4444] tabular-nums">{t('heroDemoStep3Time')}</div>
                  <div className="font-medium text-[#F3F6F9]">{t('heroDemoStep3Title')}</div>
                  <div className="text-[#94A3B8]">{t('heroDemoStep3Desc')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — THE PROBLEM (Crisp Editorial Light Surface) */}
      <section className="border-b border-[#E2E8F0] bg-[#F4F6F8] text-[#0F172A]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-[#CBD5E1] bg-white shadow-sm">
              <img
                src="/src/assets/images/evidence_forensic_desk_1794797269761.jpg"
                alt="Smartphone and notebook representing fragmented SMS, call, and UPI payment evidence"
                referrerPolicy="no-referrer"
                className="w-full h-72 object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
              {t('problemHeading')}
            </h2>
            <p className="text-base text-[#334155] leading-relaxed">{t('problemBody')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-[#CBD5E1] bg-white p-5 space-y-1.5">
                <div className="font-semibold text-[#0F172A] text-sm">{t('problemCard1Title')}</div>
                <p className="text-xs text-[#475569] leading-relaxed">{t('problemCard1Body')}</p>
              </div>
              <div className="rounded-xl border border-[#CBD5E1] bg-white p-5 space-y-1.5">
                <div className="font-semibold text-[#0F172A] text-sm">{t('problemCard2Title')}</div>
                <p className="text-xs text-[#475569] leading-relaxed">{t('problemCard2Body')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — 4-STAGE LIFECYCLE (Deep Slate) */}
      <section className="border-b border-[#1E293B] bg-[#111827]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20 space-y-10">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F3F6F9]">
              {t('lifecycleHeading')}
            </h2>
            <p className="text-sm sm:text-base text-[#94A3B8]">{t('lifecycleSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {lifecycle.map((item) => (
              <div
                key={item.step}
                className={`rounded-xl border border-[#243040] bg-[#182232] p-6 space-y-3 transition-colors ${item.borderHover}`}
              >
                <div className={`font-mono text-xs font-semibold ${item.accent}`}>{item.step}</div>
                <h3 className="font-display text-lg font-semibold text-[#F3F6F9]">{item.title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — CORE CAPABILITIES (Light Stone Contrast Band) */}
      <section className="border-b border-[#CBD5E1] bg-[#EEF2F6] text-[#0F172A]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
                {t('featuresHeading')}
              </h2>
              <p className="text-sm sm:text-base text-[#475569]">{t('featuresSubtitle')}</p>
            </div>
            <Link
              to="/features"
              className="text-sm font-semibold text-[#0F766E] hover:text-[#115E59] whitespace-nowrap"
            >
              {t('featuresAllLink')}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <Link
                  key={cap.title}
                  to={cap.to}
                  className={`group rounded-xl p-6 space-y-3 transition-all ${
                    cap.featured
                      ? 'md:col-span-2 bg-[#0F172A] text-[#F3F6F9] border border-[#1E293B] hover:border-[#818CF8]'
                      : 'bg-white text-[#0F172A] border border-[#CBD5E1] hover:border-[#0284C7]'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${cap.iconColor}`} aria-hidden="true" />
                  <h3
                    className={`font-display text-lg font-semibold ${
                      cap.featured ? 'text-[#F3F6F9]' : 'text-[#0F172A]'
                    }`}
                  >
                    {cap.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      cap.featured ? 'text-[#CBD5E1]' : 'text-[#475569]'
                    }`}
                  >
                    {cap.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5 — HOW IT WORKS (Deep Obsidian) */}
      <section className="border-b border-[#1E293B] bg-[#0B0F14]">
        <div className="mx-auto max-w-7xl px-6 py-16 space-y-8">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F3F6F9]">
            {t('howHeading')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {howSteps.map(([num, title, desc, numColor]) => (
              <div
                key={num}
                className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-2"
              >
                <div className={`font-mono text-xs font-bold ${numColor}`}>{num}</div>
                <div className="font-display font-semibold text-sm text-[#F3F6F9]">{title}</div>
                <div className="text-xs text-[#94A3B8] leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — SYNTHETIC DEMONSTRATION (Crisp Light White Band) */}
      <section className="border-b border-[#E2E8F0] bg-white text-[#0F172A]">
        <div className="mx-auto max-w-7xl px-6 py-16 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-mono font-semibold text-[#B45309]">
                {t('demoSectionBadge')}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
                {t('demoSectionHeading')}
              </h2>
            </div>
            <Link
              to="/login"
              className="rounded-lg border border-[#0F766E] px-4 py-2 text-sm font-semibold text-[#0F766E] hover:bg-[#F0FDFA] whitespace-nowrap"
            >
              {t('demoRunBtn')}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {demoTimeline.map((step) => (
              <div
                key={step.time}
                className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-mono font-semibold tabular-nums ${step.timeColor}`}>
                    {step.time}
                  </span>
                  <span className="text-[#475569]">{step.label}</span>
                </div>
                <p className="text-sm text-[#0F172A] leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 — TRUST AND PRIVACY (Slate Navy) */}
      <section className="border-b border-[#1E293B] bg-[#111827]">
        <div className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-2 text-sm font-medium text-[#38BDF8]">
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>{t('trustBadge')}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F3F6F9]">
              {t('trustHeading')}
            </h2>
            <ul className="space-y-3 text-sm text-[#94A3B8]">
              <li>
                <strong className="text-[#F3F6F9]">{t('trustBullet1Title')}</strong>{' '}
                {t('trustBullet1Body')}
              </li>
              <li>
                <strong className="text-[#F3F6F9]">{t('trustBullet2Title')}</strong>{' '}
                {t('trustBullet2Body')}
              </li>
              <li>
                <strong className="text-[#F3F6F9]">{t('trustBullet3Title')}</strong>{' '}
                {t('trustBullet3Body')}
              </li>
            </ul>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-[#243040] bg-[#182232]">
              <img
                src="/src/assets/images/rescue_support_center_1794797270868.jpg"
                alt="Calm financial cyber-assistance desk supporting incident documentation"
                referrerPolicy="no-referrer"
                className="w-full h-64 object-cover"
              />
              <div className="p-5 flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">{t('trustHelplineCaption')}</span>
                <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#F59E0B] tabular-nums">
                  <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                  1930 · cybercrime.gov.in
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — FINAL CTA (Deep Teal-Obsidian) */}
      <section className="bg-[#0F1B24]">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center space-y-6">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F3F6F9] [text-wrap:balance]">
            {t('finalCtaHeading')}
          </h2>
          <p className="text-base text-[#CBD5E1] max-w-2xl mx-auto">{t('finalCtaBody')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#14B8A6] px-6 py-3 text-sm font-semibold text-[#0B0F14] hover:bg-[#2DD4BF] transition-colors"
            >
              <span>{t('finalCtaBtn')}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/methodology"
              className="inline-flex items-center rounded-lg border border-[#243040] bg-[#131A22] px-6 py-3 text-sm font-semibold text-[#F3F6F9] hover:border-[#38BDF8] transition-colors"
            >
              {t('navMethodology')}
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
