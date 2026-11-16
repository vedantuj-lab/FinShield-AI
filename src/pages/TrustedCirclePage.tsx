import React, { useEffect, useState } from 'react';
import { Send, Trash2, Users } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function TrustedCirclePage() {
  const { apiFetch } = useAuth();
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [newContact, setNewContact] = useState({
    contactName: '',
    relationship: 'Family',
    contactDetails: '',
    explicitConsentConfirmed: false,
  });

  const [shareForm, setShareForm] = useState({
    contactId: '',
    investigationId: '',
    riskLevel: 'HIGH',
    customMessage:
      'I received a suspicious bank KYC call and payment request. I am verifying independently before taking any action.',
    userApprovedSharing: false,
  });

  const loadAll = async () => {
    const [cRes, iRes] = await Promise.all([
      apiFetch('/api/contacts'),
      apiFetch('/api/investigations'),
    ]);
    if (cRes.ok) {
      const cData = await cRes.json();
      setContacts(cData.contacts || []);
      setWarnings(cData.sharedWarnings || []);
      if (cData.contacts?.length > 0 && !shareForm.contactId) {
        setShareForm((s) => ({ ...s, contactId: String(cData.contacts[0].id) }));
      }
    }
    if (iRes.ok) {
      const iData = await iRes.json();
      setInvestigations(iData.investigations || []);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!newContact.explicitConsentConfirmed) {
      setError('Confirm explicit user consent before nominating a trusted contact.');
      return;
    }
    const res = await apiFetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContact),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not add contact');
      return;
    }
    setNewContact({
      contactName: '',
      relationship: 'Family',
      contactDetails: '',
      explicitConsentConfirmed: false,
    });
    setNotice('Trusted contact added with explicit consent.');
    await loadAll();
  };

  const handleToggleConsent = async (c: any) => {
    const nextStatus = c.consentStatus === 'granted' ? 'revoked' : 'granted';
    await apiFetch(`/api/contacts/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consentStatus: nextStatus,
        canReceiveRedactedAlerts: nextStatus === 'granted',
      }),
    });
    await loadAll();
  };

  const handleDeleteContact = async (id: number) => {
    await apiFetch(`/api/contacts/${id}`, { method: 'DELETE' });
    await loadAll();
  };

  const handleShareWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!shareForm.userApprovedSharing) {
      setError('Please check the explicit approval box before sharing a redacted warning.');
      return;
    }
    const res = await apiFetch('/api/contacts/share-warning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId: Number(shareForm.contactId),
        investigationId: shareForm.investigationId ? Number(shareForm.investigationId) : undefined,
        customMessage: shareForm.customMessage,
        riskLevel: shareForm.riskLevel,
        userApprovedSharing: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not share warning.');
      return;
    }
    setNotice(data.note);
    setShareForm((s) => ({ ...s, userApprovedSharing: false }));
    await loadAll();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">{t('trustedTitle')}</h1>
          <p className="text-sm text-[#94A3B8]">{t('trustedSubtitle')}</p>
        </div>

        {error && (
          <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-lg border border-[#10B981]/40 bg-[#10B981]/10 p-3 text-xs text-[#34D399]">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            <form
              onSubmit={handleAddContact}
              className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4"
            >
              <h2 className="font-display text-lg font-semibold text-[#F3F6F9] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />
                <span>{t('trustedAddTitle')}</span>
              </h2>
              <input
                id="trusted-contact-name"
                name="contactName"
                required
                placeholder={t('trustedNamePlaceholder')}
                value={newContact.contactName}
                onChange={(e) => setNewContact({ ...newContact, contactName: e.target.value })}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
              />
              <input
                id="trusted-relationship"
                name="relationship"
                required
                placeholder={t('trustedRelPlaceholder')}
                value={newContact.relationship}
                onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
              />
              <input
                id="trusted-contact-details"
                name="contactDetails"
                required
                placeholder={t('trustedDetailsPlaceholder')}
                value={newContact.contactDetails}
                onChange={(e) => setNewContact({ ...newContact, contactDetails: e.target.value })}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
              />
              <label htmlFor="trusted-consent" className="flex items-start gap-2.5 text-xs text-[#94A3B8] cursor-pointer">
                <input
                  id="trusted-consent"
                  name="explicitConsentConfirmed"
                  type="checkbox"
                  checked={newContact.explicitConsentConfirmed}
                  onChange={(e) =>
                    setNewContact({ ...newContact, explicitConsentConfirmed: e.target.checked })
                  }
                  className="mt-0.5 accent-[#818CF8]"
                />
                <span>{t('trustedConsentLabel')}</span>
              </label>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#818CF8] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-[#A5B4FC]"
              >
                {t('trustedSaveBtn')}
              </button>
            </form>

            <form
              onSubmit={handleShareWarning}
              className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4"
            >
              <h2 className="font-display text-lg font-semibold text-[#F3F6F9]">
                {t('trustedShareTitle')}
              </h2>
              <select
                id="trusted-share-contact"
                name="contactId"
                aria-label={t('trustedSelectContact')}
                required
                value={shareForm.contactId}
                onChange={(e) => setShareForm({ ...shareForm, contactId: e.target.value })}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
              >
                <option value="">{t('trustedSelectContact')}</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contactName} ({c.consentStatus})
                  </option>
                ))}
              </select>

              <select
                id="trusted-share-investigation"
                name="investigationId"
                aria-label={t('trustedLinkInv')}
                value={shareForm.investigationId}
                onChange={(e) => setShareForm({ ...shareForm, investigationId: e.target.value })}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
              >
                <option value="">{t('trustedLinkInv')}</option>
                {investigations.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.investigationCode} — {inv.title}
                  </option>
                ))}
              </select>

              <textarea
                id="trusted-share-message"
                name="customMessage"
                aria-label={t('trustedShareTitle')}
                rows={3}
                required
                value={shareForm.customMessage}
                onChange={(e) => setShareForm({ ...shareForm, customMessage: e.target.value })}
                className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
              />

              <label htmlFor="trusted-approve-sharing" className="flex items-start gap-2.5 text-xs text-[#94A3B8] cursor-pointer">
                <input
                  id="trusted-approve-sharing"
                  name="userApprovedSharing"
                  type="checkbox"
                  checked={shareForm.userApprovedSharing}
                  onChange={(e) =>
                    setShareForm({ ...shareForm, userApprovedSharing: e.target.checked })
                  }
                  className="mt-0.5 accent-[#818CF8]"
                />
                <span>{t('trustedApproveLabel')}</span>
              </label>

              <button
                type="submit"
                disabled={contacts.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#818CF8] bg-[#1B2430] px-4 py-2 text-xs font-semibold text-[#A5B4FC] disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('trustedShareBtn')}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4">
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                {t('trustedListTitle')}
              </h2>
              {contacts.length === 0 ? (
                <p className="text-xs text-[#94A3B8]">{t('trustedNoContacts')}</p>
              ) : (
                <div className="divide-y divide-[#243040]">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="text-xs space-y-0.5">
                        <div className="text-sm font-semibold text-[#F3F6F9]">
                          {c.contactName} · <span className="text-[#94A3B8]">{c.relationship}</span>
                        </div>
                        <div className="text-[#94A3B8]">{c.contactDetails}</div>
                        <div className="font-mono text-[#818CF8]">
                          {t('trustedConsentPrefix')} {c.consentStatus.toUpperCase()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleConsent(c)}
                          className="rounded-lg border border-[#243040] px-3 py-1.5 text-xs text-[#F3F6F9] hover:border-[#F59E0B]"
                        >
                          {c.consentStatus === 'granted'
                            ? t('trustedRevokeBtn')
                            : t('trustedRestoreBtn')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteContact(c.id)}
                          className="p-1.5 text-[#EF4444]"
                          aria-label={`Remove ${c.contactName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-3">
              <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                {t('trustedLogTitle')}
              </h2>
              {warnings.length === 0 ? (
                <p className="text-xs text-[#94A3B8]">{t('trustedNoWarnings')}</p>
              ) : (
                <div className="space-y-2.5">
                  {warnings.map((w) => (
                    <div
                      key={w.id}
                      className="rounded-lg bg-[#0D1218] border border-[#243040] p-3.5 text-xs space-y-1"
                    >
                      <div className="flex justify-between font-mono text-[#F59E0B]">
                        <span>{w.riskLevel}</span>
                        <span className="text-[#94A3B8]">
                          {new Date(w.sharedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[#F3F6F9]">{w.redactedSummary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
