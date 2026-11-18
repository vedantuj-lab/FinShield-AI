import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Bot,
  Briefcase,
  Calculator,
  FileText,
  GitBranch,
  History,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  PiggyBank,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_LABELS, SupportedLanguage } from '../i18n/translations';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const desktopNavRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = desktopNavRef.current;
    if (!el) return;
    const saved = sessionStorage.getItem('finshield_sidebar_scroll');
    if (saved) {
      el.scrollTop = Number(saved) || 0;
    }
  }, [location.pathname]);

  const navLinks = [
    { to: '/app', label: t('navDashboard'), icon: LayoutDashboard, accent: 'text-[#14B8A6]' },
    { to: '/app/investigate', label: t('navInvestigate'), icon: Upload, accent: 'text-[#38BDF8]' },
    { to: '/app/manipulation', label: t('navManipulation'), icon: Activity, accent: 'text-[#F59E0B]' },
    { to: '/app/reconstruction', label: t('navReconstruction'), icon: GitBranch, accent: 'text-[#818CF8]' },
    { to: '/app/risk', label: t('navRisk'), icon: ShieldAlert, accent: 'text-[#F97316]' },
    { to: '/app/payment-safety', label: t('navPaymentSafety'), icon: ShieldCheck, accent: 'text-[#10B981]' },
    { to: '/app/rescue', label: t('navRescue'), icon: AlertTriangle, accent: 'text-[#EF4444]', emergency: true },
    { to: '/app/budgeting', label: 'Smart Budgeting', icon: PiggyBank, accent: 'text-[#14B8A6]' },
    { to: '/app/investments', label: 'Investments & Portfolio', icon: Briefcase, accent: 'text-[#38BDF8]' },
    { to: '/app/markets', label: 'Market & Paper Trading', icon: LineChart, accent: 'text-[#F59E0B]' },
    { to: '/app/tax-business', label: 'Tax & Small Business', icon: Calculator, accent: 'text-[#10B981]' },
    { to: '/app/assistant', label: 'AI Finance Assistant', icon: Bot, accent: 'text-[#818CF8]' },
    { to: '/app/reports', label: t('navReports'), icon: FileText, accent: 'text-[#F43F5E]' },
    { to: '/app/history', label: t('navHistory'), icon: History, accent: 'text-[#38BDF8]' },
    { to: '/app/trusted-circle', label: t('navTrustedCircle'), icon: Users, accent: 'text-[#818CF8]' },
    { to: '/app/settings/language', label: t('navSettings'), icon: Settings, accent: 'text-[#14B8A6]' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/app/history?q=${encodeURIComponent(q)}` : '/app/history');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0D1218] text-[#F3F6F9] flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-[#243040] bg-[#131A22]">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#243040]">
          <ShieldCheck className="h-5 w-5 text-[#14B8A6] shrink-0" aria-hidden="true" />
          <Link to="/" className="font-display text-base font-bold tracking-tight text-[#F3F6F9] whitespace-nowrap">
            FINSHIELD AI
          </Link>
        </div>

        <nav
          ref={desktopNavRef}
          onScroll={(e) => {
            sessionStorage.setItem('finshield_sidebar_scroll', String(e.currentTarget.scrollTop));
          }}
          className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
          aria-label="Application"
        >
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === '/app'
                ? location.pathname === '/app'
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? item.emergency
                      ? 'bg-[#EF4444]/15 text-[#EF4444]'
                      : `bg-[#1B2430] ${item.accent}`
                    : item.emergency
                      ? 'text-[#EF4444] hover:bg-[#EF4444]/10'
                      : 'text-[#94A3B8] hover:bg-[#1B2430] hover:text-[#F3F6F9]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`mt-2 flex items-center gap-3 rounded-lg border border-[#F59E0B]/40 px-3 py-2.5 text-sm font-semibold transition-colors ${
                location.pathname.startsWith('/admin')
                  ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                  : 'text-[#F59E0B] hover:bg-[#F59E0B]/10'
              }`}
            >
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t('adminConsoleLink')}</span>
            </Link>
          )}
        </nav>

        <div className="border-t border-[#243040] p-4 space-y-3">
          <div className="rounded-lg bg-[#1B2430] p-3 text-xs space-y-1">
            <div className="font-semibold text-[#F59E0B]">{t('emergencyHelplineTitle')}</div>
            <div className="font-mono text-sm font-semibold text-[#F3F6F9] tabular-nums">
              1930 · cybercrime.gov.in
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#94A3B8] hover:bg-[#1B2430] hover:text-[#F3F6F9] transition-colors"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>{t('signOut')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[#131A22] border-r border-[#243040] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#243040]">
              <span className="font-display text-base font-bold text-[#F3F6F9]">FINSHIELD AI</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-[#94A3B8] hover:text-[#F3F6F9]"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active =
                  item.to === '/app'
                    ? location.pathname === '/app'
                    : location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      active
                        ? `bg-[#1B2430] ${item.accent}`
                        : item.emergency
                          ? 'text-[#EF4444]'
                          : 'text-[#94A3B8] hover:bg-[#1B2430] hover:text-[#F3F6F9]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className="mt-2 flex items-center gap-3 rounded-lg border border-[#F59E0B]/40 px-3 py-2.5 text-sm font-semibold text-[#F59E0B]"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{t('adminConsoleLink')}</span>
                </Link>
              )}
            </nav>
            <div className="border-t border-[#243040] p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#94A3B8] hover:text-[#F3F6F9]"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('signOut')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen pb-16 lg:pb-0">
        <header className="sticky top-0 z-30 border-b border-[#243040] bg-[#0D1218]/95 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg border border-[#243040] text-[#F3F6F9] hover:bg-[#1B2430]"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <form onSubmit={handleSearch} className="hidden sm:flex items-center relative w-64 md:w-80">
                <Search
                  className="h-4 w-4 text-[#94A3B8] absolute left-3 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="workspace-search"
                  name="q"
                  type="search"
                  aria-label={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full rounded-lg border border-[#243040] bg-[#131A22] pl-9 pr-3 py-1.5 text-sm text-[#F3F6F9] placeholder-[#64748B] focus:border-[#38BDF8] focus:outline-none"
                />
              </form>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <label htmlFor="header-lang" className="sr-only">
                Language
              </label>
              <select
                id="header-lang"
                name="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="rounded-lg border border-[#243040] bg-[#131A22] px-2.5 py-1.5 text-xs font-medium text-[#F3F6F9] focus:border-[#38BDF8] focus:outline-none"
              >
                {Object.entries(LANGUAGE_LABELS).map(([code, meta]) => (
                  <option key={code} value={code}>
                    {meta.native}
                  </option>
                ))}
              </select>

              <Link
                to="/app/rescue"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-1.5 text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/20 whitespace-nowrap shrink-0"
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('rescueHeaderBtn')}</span>
              </Link>

              <Link
                to="/app/profile"
                className="flex items-center gap-2 rounded-lg border border-[#243040] bg-[#131A22] px-3 py-1.5 text-xs font-medium text-[#F3F6F9] hover:bg-[#1B2430] whitespace-nowrap shrink-0"
              >
                <span className="truncate max-w-[120px]">{user?.name || t('accountLabel')}</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t border-[#243040] bg-[#131A22] grid grid-cols-5 text-[11px]"
      >
        {[
          { to: '/app', label: t('mobileHome'), icon: LayoutDashboard },
          { to: '/app/investigate', label: t('mobileInvestigate'), icon: Upload },
          { to: '/app/reconstruction', label: t('mobileStory'), icon: GitBranch },
          { to: '/app/payment-safety', label: t('mobilePay'), icon: ShieldCheck },
          { to: '/app/rescue', label: t('mobileRescue'), icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.to === '/app' ? location.pathname === '/app' : location.pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center justify-center py-2 gap-0.5 ${
                active ? 'text-[#38BDF8]' : 'text-[#94A3B8]'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
