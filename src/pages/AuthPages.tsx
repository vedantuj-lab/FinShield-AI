import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function RolePortalSelector({ active }: { active: 'citizen' | 'admin' }) {
  const { t } = useLanguage();
  return (
    <div className="mb-5 space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] text-center">
        {t('portalRolePrompt')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/login"
          className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 transition-colors ${
            active === 'citizen'
              ? 'border-[#14B8A6] bg-[#14B8A6]/10 text-[#F3F6F9]'
              : 'border-[#243040] bg-[#131A22] text-[#94A3B8] hover:border-[#14B8A6]/50 hover:text-[#F3F6F9]'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck
              className={`h-4 w-4 ${active === 'citizen' ? 'text-[#14B8A6]' : 'text-[#64748B]'}`}
              aria-hidden="true"
            />
            <span>{t('portalCitizenLabel')}</span>
          </div>
          <span className="text-[11px] leading-snug text-[#94A3B8]">{t('portalCitizenDesc')}</span>
        </Link>

        <Link
          to="/admin/login"
          className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 transition-colors ${
            active === 'admin'
              ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F3F6F9]'
              : 'border-[#243040] bg-[#131A22] text-[#94A3B8] hover:border-[#F59E0B]/50 hover:text-[#F3F6F9]'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert
              className={`h-4 w-4 ${active === 'admin' ? 'text-[#F59E0B]' : 'text-[#64748B]'}`}
              aria-hidden="true"
            />
            <span>{t('portalAdminLabel')}</span>
          </div>
          <span className="text-[11px] leading-snug text-[#94A3B8]">{t('portalAdminDesc')}</span>
        </Link>
      </div>
    </div>
  );
}

export function LoginPage() {
  return <UserAuthPage initialRegister={false} />;
}

export function RegisterPage() {
  return <UserAuthPage initialRegister={true} />;
}

function UserAuthPage({ initialRegister }: { initialRegister: boolean }) {
  const { user, logout, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isRegisterMode, setIsRegisterMode] = useState(initialRegister);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'user') {
      navigate('/app', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogle = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (user && user.role !== 'user') {
        await logout();
      }
      const signedIn = await loginWithGoogle();
      if (signedIn.role !== 'user') {
        setError(
          'Administrator accounts cannot sign in on the Citizen portal. Switch to Admin Sign-In or use a Citizen account.'
        );
        return;
      }
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterMode && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (user && user.role !== 'user') {
        await logout();
      }
      const signedIn = isRegisterMode
        ? await registerWithEmail(name, email, password, preferredLanguage)
        : await loginWithEmail(email, password);
      if (signedIn.role !== 'user') {
        setError(
          'Administrator accounts cannot sign in on the Citizen portal. Switch to Admin Sign-In or use a Citizen account.'
        );
        return;
      }
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-6 py-12">
        <RolePortalSelector active="citizen" />
        <div className="rounded-2xl border border-[#243040] bg-[#131A22] p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center justify-center gap-2 text-[#14B8A6] text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>{t('authWorkspaceTag')}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">
              {isRegisterMode ? t('authRegisterTitle') : t('authTitle')}
            </h1>
            <p className="text-sm text-[#94A3B8] leading-relaxed">{t('authSubtitle')}</p>
          </div>

          {/* Login / Register Mode Switcher */}
          <div className="grid grid-cols-2 rounded-xl border border-[#243040] bg-[#0B0F14] p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setError('');
              }}
              className={`rounded-lg py-2 transition-colors ${
                !isRegisterMode
                  ? 'bg-[#14B8A6] text-[#0B0F14]'
                  : 'text-[#94A3B8] hover:text-[#F3F6F9]'
              }`}
            >
              {t('authTabSignIn')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setError('');
              }}
              className={`rounded-lg py-2 transition-colors ${
                isRegisterMode
                  ? 'bg-[#14B8A6] text-[#0B0F14]'
                  : 'text-[#94A3B8] hover:text-[#F3F6F9]'
              }`}
            >
              {t('authTabRegister')}
            </button>
          </div>

          {user && user.role === 'admin' && (
            <div className="rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-3 text-xs text-[#F59E0B] space-y-2">
              <div>
                You are currently signed in as an Administrator ({user.email}). Sign in with a
                Citizen account below or sign out first.
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="font-semibold underline hover:text-[#FBBF24]"
              >
                Sign out of Admin session
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('authNameLabel')}
                </label>
                <input
                  id="auth-name"
                  name="name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3.5 py-2.5 text-sm text-[#F3F6F9] focus:border-[#14B8A6] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-[#94A3B8] mb-1">
                {t('authEmailLabel')}
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3.5 py-2.5 text-sm text-[#F3F6F9] focus:border-[#14B8A6] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="auth-pass" className="block text-xs font-medium text-[#94A3B8]">
                  {t('authPasswordLabel')}
                </label>
                {!isRegisterMode && (
                  <Link
                    to="/forgot-password"
                    className="text-xs text-[#38BDF8] hover:underline"
                  >
                    {t('authForgotLink')}
                  </Link>
                )}
              </div>
              <input
                id="auth-pass"
                name="password"
                type="password"
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                required
                minLength={isRegisterMode ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3.5 py-2.5 text-sm text-[#F3F6F9] focus:border-[#14B8A6] focus:outline-none"
              />
            </div>

            {isRegisterMode && (
              <div>
                <label htmlFor="auth-lang" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('authLangLabel')}
                </label>
                <select
                  id="auth-lang"
                  name="preferredLanguage"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3.5 py-2.5 text-sm text-[#F3F6F9]"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-[#2DD4BF] disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>{isRegisterMode ? t('authRegisterBtn') : t('authSignInBtn')}</span>
            </button>
          </form>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-[#243040]" />
            <span className="mx-3 text-[11px] uppercase tracking-wider text-[#64748B]">or</span>
            <div className="flex-grow border-t border-[#243040]" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-[#243040] bg-[#F3F6F9] px-5 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-white transition-colors disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-8.97z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>{t('authGoogleBtn')}</span>
          </button>
        </div>
      </div>
    </PublicLayout>
  );
}

export function ForgotPasswordPage() {
  const { requestPasswordReset, confirmPasswordReset } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState<'request' | 'confirm' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [sandboxCode, setSandboxCode] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await requestPasswordReset(email);
      setInfoMessage(res.message);
      setSandboxCode(res.sandboxCode);
      setStep('confirm');
    } catch (err: any) {
      setError(err.message || 'Could not initiate password reset.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const msg = await confirmPasswordReset(email, resetCode, newPassword);
      setInfoMessage(msg);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Could not update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border border-[#243040] bg-[#131A22] p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center justify-center gap-2 text-[#38BDF8] text-xs font-semibold uppercase">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              <span>{t('resetPageBadge')}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">
              {t('resetPageTitle')}
            </h1>
            <p className="text-xs text-[#94A3B8] leading-relaxed">{t('resetPageSubtitle')}</p>
          </div>

          {error && (
            <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
              {error}
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('authEmailLabel')}
                </label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3.5 py-2.5 text-sm text-[#F3F6F9]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#38BDF8] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-[#7DD3FC] disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{t('resetRequestBtn')}</span>
              </button>
            </form>
          )}

          {step === 'confirm' && (
            <form onSubmit={handleConfirm} className="space-y-4">
              {infoMessage && (
                <div className="rounded-lg border border-[#38BDF8]/40 bg-[#38BDF8]/10 p-3 text-xs text-[#F3F6F9]">
                  {infoMessage}
                </div>
              )}
              {sandboxCode && (
                <div className="rounded-lg border border-[#F59E0B]/50 bg-[#F59E0B]/10 p-3 text-xs text-[#F59E0B] space-y-1">
                  <div className="font-semibold">One-Time Verification Code (15 min expiry)</div>
                  <div className="font-mono text-lg font-bold tracking-widest text-[#F3F6F9]">
                    {sandboxCode}
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="reset-code" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('resetCodeLabel')}
                </label>
                <input
                  id="reset-code"
                  name="resetCode"
                  autoComplete="one-time-code"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3.5 py-2.5 text-sm font-mono text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="reset-new-pass" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('resetNewPassLabel')}
                </label>
                <input
                  id="reset-new-pass"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3.5 py-2.5 text-sm text-[#F3F6F9]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-[#2DD4BF] disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{t('resetConfirmBtn')}</span>
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="space-y-4 text-center">
              <div className="rounded-lg border border-[#10B981]/40 bg-[#10B981]/10 p-4 text-xs text-[#34D399]">
                {infoMessage}
              </div>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#0B0F14]"
              >
                {t('authSignInBtn')}
              </Link>
            </div>
          )}

          <div className="border-t border-[#243040] pt-4 text-center">
            <Link to="/login" className="text-xs text-[#94A3B8] hover:text-[#F3F6F9]">
              ← {t('resetBackToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export function AdminLoginPage() {
  const { user, logout, loginAdmin, loginAdminWithGoogle, bootstrapAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [bootstrapInfo, setBootstrapInfo] = useState<{
    hasAdmin: boolean;
    setupSecretConfigured: boolean;
  } | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [setupName, setSetupName] = useState('Platform Administrator');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupSecret, setSetupSecret] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    fetch('/api/admin/bootstrap-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setBootstrapInfo(d))
      .catch(() => {});
  }, []);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await loginAdmin(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Administrator sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminGoogle = async () => {
    setSubmitting(true);
    setError('');
    try {
      await loginAdminWithGoogle();
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Administrator Google sign-in denied.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await bootstrapAdmin(setupName, setupEmail, setupPassword, setupSecret);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Administrator initialization failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-6 py-12">
        <RolePortalSelector active="admin" />
        <div className="rounded-2xl border border-[#F59E0B]/40 bg-[#131A22] p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center justify-center gap-2 text-[#F59E0B] text-xs font-semibold tracking-wider uppercase">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              <span>{t('adminLoginBadge')}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">
              {t('adminLoginTitle')}
            </h1>
            <p className="text-xs text-[#94A3B8] leading-relaxed">{t('adminLoginSubtitle')}</p>
          </div>

          {user && user.role !== 'admin' && (
            <div className="rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-3 text-xs text-[#F59E0B] space-y-2">
              <div>
                You are currently signed in with a Citizen account ({user.email}). Sign in with
                authorized administrator credentials below to open the Admin Governance Console.
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="font-semibold underline hover:text-[#FBBF24]"
              >
                Sign out of Citizen session
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
              {error}
            </div>
          )}

          {!showSetup ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-medium text-[#94A3B8] mb-1"
                >
                  {t('adminEmailLabel')}
                </label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3.5 py-2.5 text-sm text-[#F3F6F9] focus:border-[#F59E0B] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-pass"
                  className="block text-xs font-medium text-[#94A3B8] mb-1"
                >
                  {t('adminPassLabel')}
                </label>
                <input
                  id="admin-pass"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3.5 py-2.5 text-sm text-[#F3F6F9] focus:border-[#F59E0B] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-[#FBBF24] disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>{t('adminSignInBtn')}</span>
              </button>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-[#243040]" />
                <span className="mx-3 text-[11px] uppercase tracking-wider text-[#64748B]">or</span>
                <div className="flex-grow border-t border-[#243040]" />
              </div>

              <button
                type="button"
                onClick={handleAdminGoogle}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-[#243040] bg-[#F3F6F9] px-5 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-white transition-colors disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-8.97z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>{t('authGoogleBtn')}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleBootstrap} className="space-y-3.5">
              <div className="text-xs font-semibold text-[#F59E0B]">
                Controlled One-Time Initial Administrator Setup
              </div>
              <div>
                <label htmlFor="setup-name" className="block text-xs text-[#94A3B8] mb-1">Administrator Name</label>
                <input
                  id="setup-name"
                  name="setupName"
                  required
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="setup-email" className="block text-xs text-[#94A3B8] mb-1">Administrator Email</label>
                <input
                  id="setup-email"
                  name="setupEmail"
                  type="email"
                  required
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="setup-password" className="block text-xs text-[#94A3B8] mb-1">
                  Password (min. 10 chars)
                </label>
                <input
                  id="setup-password"
                  name="setupPassword"
                  type="password"
                  required
                  minLength={10}
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <div>
                <label htmlFor="setup-secret" className="block text-xs text-[#94A3B8] mb-1">
                  Server Setup Secret (`ADMIN_SETUP_SECRET`)
                </label>
                <input
                  id="setup-secret"
                  name="setupSecret"
                  type="password"
                  required
                  value={setupSecret}
                  onChange={(e) => setSetupSecret(e.target.value)}
                  className="w-full rounded-lg border border-[#243040] bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#F59E0B] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-[#FBBF24] disabled:opacity-50"
              >
                {submitting ? 'Creating Administrator...' : 'Initialize Administrator'}
              </button>
              <button
                type="button"
                onClick={() => setShowSetup(false)}
                className="w-full text-xs text-[#94A3B8] hover:text-[#F3F6F9]"
              >
                Cancel setup
              </button>
            </form>
          )}

          {bootstrapInfo && !bootstrapInfo.hasAdmin && !showSetup && (
            <div className="rounded-lg border border-[#243040] bg-[#0B0F14] p-3 text-xs text-[#94A3B8] space-y-2">
              <div>
                No administrator exists yet. Configure{' '}
                <code className="text-[#F59E0B]">ADMIN_EMAIL</code> &amp;{' '}
                <code className="text-[#F59E0B]">ADMIN_INITIAL_PASSWORD</code> in server secrets, or
                initialize once using <code className="text-[#F59E0B]">ADMIN_SETUP_SECRET</code>.
              </div>
              {bootstrapInfo.setupSecretConfigured && (
                <button
                  type="button"
                  onClick={() => setShowSetup(true)}
                  className="text-[#38BDF8] font-semibold hover:underline"
                >
                  Open Initial Administrator Setup →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
