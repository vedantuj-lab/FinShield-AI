import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_LABELS, SupportedLanguage } from '../i18n/translations';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { to: '/about', label: t('navAbout') },
    { to: '/how-it-works', label: t('navHowItWorks') },
    { to: '/features', label: t('navFeatures') },
    { to: '/methodology', label: t('navMethodology') },
    { to: '/security-privacy', label: t('navSecurity') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F14] text-[#F3F6F9]">
      {/* Strict 3-zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-[#1E293B] bg-[#0B0F14]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#F3F6F9] whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="h-5 w-5 text-[#14B8A6]" aria-hidden="true" />
            <span className="font-display">FINSHIELD AI</span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#94A3B8]"
          >
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`whitespace-nowrap shrink-0 transition-colors duration-150 ${
                    active
                      ? 'text-[#F3F6F9] underline decoration-[#14B8A6] underline-offset-4'
                      : 'hover:text-[#F3F6F9]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <Link
              to={user ? (user.role === 'admin' ? '/admin' : '/app') : '/login'}
              className="inline-flex items-center justify-center rounded-lg bg-[#14B8A6] px-4 py-2 text-sm font-semibold text-[#0B0F14] transition-colors duration-150 hover:bg-[#2DD4BF] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14B8A6]"
            >
              {user
                ? user.role === 'admin'
                  ? t('adminConsoleLink')
                  : t('navDashboard')
                : t('navLogin')}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#1E293B] bg-[#0F1722]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-display text-base font-bold text-[#F3F6F9]">
                <ShieldCheck className="h-4 w-4 text-[#14B8A6]" aria-hidden="true" />
                <span>FINSHIELD AI</span>
              </div>
              <p className="text-sm leading-relaxed text-[#94A3B8]">{t('tagline')}</p>
              <p className="text-xs text-[#64748B]">{t('footerLifecycle')}</p>

              <div className="pt-2 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
                <div className="inline-flex rounded-lg border border-[#1E293B] bg-[#0B0F14] p-0.5 text-xs">
                  {Object.entries(LANGUAGE_LABELS).map(([code, meta]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLanguage(code as SupportedLanguage)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        language === code
                          ? 'bg-[#14B8A6] text-[#0B0F14] font-semibold'
                          : 'text-[#94A3B8] hover:text-[#F3F6F9]'
                      }`}
                    >
                      {meta.native}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="font-semibold text-[#F3F6F9]">{t('footerPlatform')}</div>
              <div className="flex flex-col gap-2 text-[#94A3B8]">
                <Link to="/about" className="hover:text-[#F3F6F9] transition-colors">
                  {t('footerLinkAbout')}
                </Link>
                <Link to="/features" className="hover:text-[#F3F6F9] transition-colors">
                  {t('footerLinkFeatures')}
                </Link>
                <Link to="/how-it-works" className="hover:text-[#F3F6F9] transition-colors">
                  {t('footerLinkHow')}
                </Link>
                <Link to="/methodology" className="hover:text-[#F3F6F9] transition-colors">
                  {t('footerLinkMethodology')}
                </Link>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="font-semibold text-[#F3F6F9]">{t('footerTrust')}</div>
              <div className="flex flex-col gap-2 text-[#94A3B8]">
                <Link to="/security-privacy" className="hover:text-[#F3F6F9] transition-colors">
                  {t('footerLinkPrivacy')}
                </Link>
                <Link to="/contact" className="hover:text-[#F3F6F9] transition-colors">
                  {t('footerLinkContact')}
                </Link>
                <Link to="/security-privacy#terms" className="hover:text-[#F3F6F9] transition-colors">
                  {t('footerLinkTerms')}
                </Link>
                <Link to="/admin/login" className="hover:text-[#F59E0B] transition-colors">
                  {t('adminPortalFooterLink')}
                </Link>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="font-semibold text-[#F3F6F9]">{t('footerReporting')}</div>
              <p className="text-xs leading-relaxed text-[#94A3B8]">{t('footerReportingNote')}</p>
              <div className="space-y-1 text-sm">
                <div className="font-mono font-semibold text-[#F59E0B] tabular-nums">
                  {t('footerHelplineLabel')}
                </div>
                <a
                  href="https://cybercrime.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[#38BDF8] underline underline-offset-4 hover:text-[#7DD3FC]"
                >
                  cybercrime.gov.in
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-[#1E293B] pt-6 text-xs text-[#64748B] sm:flex-row sm:items-center sm:justify-between">
            <span>{t('footerBottomLeft')}</span>
            <span>{t('footerDisclaimer')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
