import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { VoiceAssistPanel } from '../components/VoiceAssistPanel';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_LABELS, SupportedLanguage } from '../i18n/translations';

export function LanguageSettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const sampleAdvice: Record<SupportedLanguage, string> = {
    en: 'Do not share any OTP or UPI PIN, and do not pay any verification fee. Contact your bank directly using its official helpline.',
    hi: 'कृपया कोई भी OTP या UPI PIN साझा न करें और किसी भी सत्यापन शुल्क का भुगतान न करें। अपने बैंक के आधिकारिक नंबर पर संपर्क करें।',
    mr: 'कृपया कोणताही OTP किंवा UPI PIN शेअर करू नका आणि पडताळणीसाठी पैसे पाठवू नका. बँकेच्या अधिकृत क्रमांकावर संपर्क साधा.',
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">
              {t('langSettingsTitle')}
            </h1>
            <p className="text-sm text-[#94A3B8]">{t('langSettingsSubtitle')}</p>
          </div>
          <div className="flex gap-2 text-xs">
            <Link
              to="/app/profile"
              className="rounded-lg border border-[#243040] px-3 py-1.5 text-[#94A3B8] hover:text-[#F3F6F9]"
            >
              {t('langProfileLink')}
            </Link>
            <Link
              to="/app/settings/privacy"
              className="rounded-lg border border-[#243040] px-3 py-1.5 text-[#94A3B8] hover:text-[#F3F6F9]"
            >
              {t('langPrivacyLink')}
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
            {t('langCardTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(LANGUAGE_LABELS).map(([code, meta]) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code as SupportedLanguage)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  language === code
                    ? 'border-[#14B8A6] bg-[#1B2430] text-[#F3F6F9]'
                    : 'border-[#243040] bg-[#0D1218] text-[#94A3B8] hover:text-[#F3F6F9]'
                }`}
              >
                <div className="font-display text-base font-semibold">{meta.native}</div>
                <div className="text-xs">{meta.english}</div>
              </button>
            ))}
          </div>
        </div>

        <VoiceAssistPanel speechTextToSpeak={sampleAdvice[language]} />
      </div>
    </AppShell>
  );
}

export function ProfilePage() {
  const { user, apiFetch, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // Support tickets & AI feedback state
  const [tickets, setTickets] = useState<any[]>([]);
  const [myFeedback, setMyFeedback] = useState<any[]>([]);
  const [supTopic, setSupTopic] = useState('');
  const [supMessage, setSupMessage] = useState('');
  const [supSending, setSupSending] = useState(false);
  const [supFeedbackMsg, setSupFeedbackMsg] = useState('');
  const [supErr, setSupErr] = useState('');

  const loadAccountActivity = async () => {
    try {
      const [supRes, fbRes] = await Promise.all([
        apiFetch('/api/support/my'),
        apiFetch('/api/feedback/my'),
      ]);
      if (supRes.ok) {
        const d = await supRes.json();
        setTickets(d.tickets || []);
      }
      if (fbRes.ok) {
        const f = await fbRes.json();
        setMyFeedback(f.feedback || []);
      }
    } catch {
      // Ignore transient errors
    }
  };

  React.useEffect(() => {
    loadAccountActivity();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    const res = await apiFetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      await refreshUser();
      setSavedMsg(t('profileUpdatedMsg'));
    }
    setSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErr('');
    setPassMsg('');
    if (newPassword.length < 8) {
      setPassErr('New password must be at least 8 characters.');
      return;
    }
    setChangingPass(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update password.');
      setPassMsg('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPassErr(err.message);
    } finally {
      setChangingPass(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupErr('');
    setSupFeedbackMsg('');
    setSupSending(true);
    try {
      const res = await apiFetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: supTopic, message: supMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit support ticket.');
      setSupFeedbackMsg(`Support request ${data.ticket.referenceCode} created.`);
      setSupTopic('');
      setSupMessage('');
      await loadAccountActivity();
    } catch (err: any) {
      setSupErr(err.message);
    } finally {
      setSupSending(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">{t('profileTitle')}</h1>
          <p className="text-sm text-[#94A3B8]">{t('profileSubtitle')}</p>
        </div>

        <form
          onSubmit={handleSave}
          className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4"
        >
          {savedMsg && <div className="text-xs text-[#10B981]">{savedMsg}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-name" className="block text-xs text-[#94A3B8] mb-1">{t('profileNameLabel')}</label>
              <input
                id="profile-name"
                name="name"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
              />
            </div>
            <div>
              <label htmlFor="profile-email" className="block text-xs text-[#94A3B8] mb-1">{t('profileEmailLabel')}</label>
              <input
                id="profile-email"
                name="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218]/50 px-3 py-2 text-sm text-[#94A3B8]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#14B8A6] px-5 py-2 text-sm font-semibold text-[#0B0F14]"
          >
            {saving ? t('savingBtn') : t('saveChangesBtn')}
          </button>
        </form>

        {/* Change Password */}
        <form
          onSubmit={handlePasswordChange}
          className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4"
        >
          <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
            {t('profileChangePassTitle')}
          </h2>
          {passErr && (
            <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-2.5 text-xs text-[#EF4444]">
              {passErr}
            </div>
          )}
          {passMsg && (
            <div className="rounded-lg border border-[#10B981]/40 bg-[#10B981]/10 p-2.5 text-xs text-[#34D399]">
              {passMsg}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-current-pass" className="block text-xs text-[#94A3B8] mb-1">
                {t('profileCurrPassLabel')}
              </label>
              <input
                id="profile-current-pass"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
              />
            </div>
            <div>
              <label htmlFor="profile-new-pass" className="block text-xs text-[#94A3B8] mb-1">
                {t('profileNewPassLabel')}
              </label>
              <input
                id="profile-new-pass"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={changingPass}
            className="rounded-lg border border-[#38BDF8]/50 bg-[#1B2430] px-4 py-2 text-xs font-semibold text-[#38BDF8] hover:bg-[#38BDF8]/10 disabled:opacity-50"
          >
            {changingPass ? t('savingBtn') : t('profileChangePassBtn')}
          </button>
        </form>

        {/* User Support Requests */}
        <div className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
            {t('profileSupportTitle')}
          </h2>
          {supErr && (
            <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-2.5 text-xs text-[#EF4444]">
              {supErr}
            </div>
          )}
          {supFeedbackMsg && (
            <div className="rounded-lg border border-[#10B981]/40 bg-[#10B981]/10 p-2.5 text-xs text-[#34D399]">
              {supFeedbackMsg}
            </div>
          )}
          <form onSubmit={handleSupportSubmit} className="space-y-3">
            <div>
              <label htmlFor="support-topic" className="block text-xs text-[#94A3B8] mb-1">
                {t('profileSupportSubject')}
              </label>
              <input
                id="support-topic"
                name="topic"
                required
                value={supTopic}
                onChange={(e) => setSupTopic(e.target.value)}
                placeholder="e.g., Question about investigation report or account privacy"
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
              />
            </div>
            <div>
              <label htmlFor="support-message" className="block text-xs text-[#94A3B8] mb-1">
                {t('profileSupportMessage')}
              </label>
              <textarea
                id="support-message"
                name="message"
                required
                minLength={8}
                rows={3}
                value={supMessage}
                onChange={(e) => setSupMessage(e.target.value)}
                placeholder="Describe how our team can help (never share OTP, UPI PIN, CVV, or bank passwords)..."
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
              />
            </div>
            <button
              type="submit"
              disabled={supSending}
              className="rounded-lg bg-[#38BDF8] px-4 py-2 text-xs font-semibold text-[#0B0F14] hover:bg-[#7DD3FC] disabled:opacity-50"
            >
              {supSending ? t('contactSendingBtn') : t('profileSupportSubmit')}
            </button>
          </form>

          {tickets.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-[#243040]">
              {tickets.map((tk) => (
                <div
                  key={tk.id}
                  className="rounded-lg bg-[#0D1218] border border-[#243040] p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#38BDF8]">{tk.referenceCode}</span>
                    <span className="font-mono uppercase text-[#F59E0B]">{tk.status}</span>
                  </div>
                  <div className="font-semibold text-[#F3F6F9]">{tk.topic}</div>
                  <p className="text-[#94A3B8]">{tk.message}</p>
                  {tk.adminReply && (
                    <div className="mt-2 rounded bg-[#1B2430] p-2 text-[#34D399]">
                      <strong>Admin Reply:</strong> {tk.adminReply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Reported AI Feedback */}
        {myFeedback.length > 0 && (
          <div className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-3">
            <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
              {t('profileMyFeedbackTitle')}
            </h2>
            <div className="space-y-2">
              {myFeedback.map((fb) => (
                <div
                  key={fb.id}
                  className="rounded-lg bg-[#0D1218] border border-[#243040] p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono uppercase text-[#F59E0B]">{fb.moduleType}</span>
                    <span className="font-mono uppercase text-[#38BDF8]">{fb.status}</span>
                  </div>
                  <p className="text-[#F3F6F9]">{fb.userReason}</p>
                  {fb.adminNotes && (
                    <p className="text-[#34D399]">
                      <strong>Admin Resolution Note:</strong> {fb.adminNotes}
                    </p>
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

export function PrivacyDataPage() {
  const { user, apiFetch, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [redactSensitive, setRedactSensitive] = useState(user?.redactSensitive ?? true);
  const [retentionDays, setRetentionDays] = useState(user?.retentionDays ?? 90);
  const [status, setStatus] = useState('');

  const handleSave = async () => {
    setStatus('');
    const res = await apiFetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redactSensitive, retentionDays }),
    });
    if (res.ok) {
      await refreshUser();
      setStatus(t('privacySavedMsg'));
    }
  };

  const handlePurge = async () => {
    const res = await apiFetch('/api/profile/data', { method: 'DELETE' });
    if (res.ok) {
      setStatus(t('privacyPurgedMsg'));
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">{t('privacyTitle')}</h1>
          <p className="text-sm text-[#94A3B8]">{t('privacySubtitle')}</p>
        </div>

        {status && (
          <div className="rounded-lg border border-[#10B981]/40 bg-[#10B981]/10 p-3 text-xs text-[#34D399]">
            {status}
          </div>
        )}

        <div className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-5">
          <label htmlFor="privacy-redact" className="flex items-start gap-3 text-sm text-[#F3F6F9] cursor-pointer">
            <input
              id="privacy-redact"
              name="redactSensitive"
              type="checkbox"
              checked={redactSensitive}
              onChange={(e) => setRedactSensitive(e.target.checked)}
              className="mt-1 accent-[#14B8A6]"
            />
            <span>{t('privacyRedactLabel')}</span>
          </label>

          <div>
            <label htmlFor="privacy-retention" className="block text-xs text-[#94A3B8] mb-1">
              {t('privacyRetentionLabel')}
            </label>
            <select
              id="privacy-retention"
              name="retentionDays"
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
            >
              <option value={30}>30 {t('privacyDaysUnit')}</option>
              <option value={90}>90 {t('privacyDaysUnit')}</option>
              <option value={180}>180 {t('privacyDaysUnit')}</option>
              <option value={365}>365 {t('privacyDaysUnit')}</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-[#14B8A6] px-5 py-2 text-sm font-semibold text-[#0B0F14]"
          >
            {t('privacySaveBtn')}
          </button>
        </div>

        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-6 space-y-3">
          <h2 className="font-display text-base font-semibold text-[#EF4444]">
            {t('privacyDeleteTitle')}
          </h2>
          <p className="text-xs text-[#F3F6F9]/85">{t('privacyDeleteDesc')}</p>
          <button
            type="button"
            onClick={handlePurge}
            className="rounded-lg bg-[#EF4444] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
          >
            {t('privacyDeleteBtn')}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
