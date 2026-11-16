import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  GitBranch,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { AiFeedbackButton } from '../components/AiFeedbackModal';
import { RiskIndicator } from '../components/RiskIndicator';
import { VoiceAssistPanel } from '../components/VoiceAssistPanel';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function InvestigatePage() {
  const { apiFetch } = useAuth();
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [investigations, setInvestigations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [activeDetail, setActiveDetail] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');

  const [evidenceType, setEvidenceType] = useState('sms');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [eventTimestamp, setEventTimestamp] = useState('');
  const [rawText, setRawText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const fetchInvestigations = async () => {
    const res = await apiFetch('/api/investigations');
    if (res.ok) {
      const data = await res.json();
      setInvestigations(data.investigations || []);
      const paramId = Number(searchParams.get('id'));
      if (paramId && data.investigations?.some((i: any) => i.id === paramId)) {
        setSelectedId(paramId);
      } else if (!selectedId && data.investigations?.length > 0) {
        setSelectedId(data.investigations[0].id);
      }
    }
  };

  const fetchDetail = async (id: number) => {
    const res = await apiFetch(`/api/investigations/${id}`);
    if (res.ok) {
      setActiveDetail(await res.json());
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(Number(selectedId));
    } else {
      setActiveDetail(null);
    }
  }, [selectedId]);

  const handleFilePick = (picked: File | null) => {
    if (!picked) return;
    if (picked.size > 10 * 1024 * 1024) {
      setError('File exceeds 10 MB upload limit.');
      return;
    }
    setError('');
    setFile(picked);
    if (picked.type.startsWith('image/')) {
      setFilePreviewUrl(URL.createObjectURL(picked));
      if (evidenceType === 'sms' || evidenceType === 'url') {
        setEvidenceType('payment_screenshot');
      }
    } else {
      setFilePreviewUrl(null);
      if (picked.type.startsWith('audio/')) {
        setEvidenceType('audio');
      }
    }
  };

  const handleCreateInvestigation = async () => {
    if (!newTitle.trim()) return;
    setError('');
    const res = await apiFetch('/api/investigations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not create investigation');
      return;
    }
    setNewTitle('');
    await fetchInvestigations();
    setSelectedId(data.investigation.id);
    setSearchParams({ id: String(data.investigation.id) });
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !rawText.trim() && !urlInput.trim()) {
      setError('Provide message text, a suspicious URL, an image screenshot, or an audio recording.');
      return;
    }
    setSubmitting(true);
    setUploadProgress(25);
    setError('');

    try {
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('evidenceType', evidenceType);
        fd.append('title', evidenceTitle.trim() || file.name);
        fd.append('rawText', rawText);
        fd.append('url', urlInput);
        fd.append('language', language);
        if (eventTimestamp.trim()) fd.append('eventTimestamp', eventTimestamp.trim());
        if (selectedId) fd.append('investigationId', String(selectedId));
        setUploadProgress(55);
        res = await apiFetch('/api/evidence/upload', { method: 'POST', body: fd });
      } else {
        setUploadProgress(55);
        res = await apiFetch('/api/evidence/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            investigationId: selectedId ? Number(selectedId) : undefined,
            evidenceType,
            title: evidenceTitle.trim() || `${evidenceType.toUpperCase()} Evidence`,
            rawText,
            url: urlInput,
            eventTimestamp: eventTimestamp.trim() || undefined,
            language,
          }),
        });
      }

      setUploadProgress(90);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed.');

      setRawText('');
      setUrlInput('');
      setEvidenceTitle('');
      setEventTimestamp('');
      setFile(null);
      setFilePreviewUrl(null);
      setUploadProgress(100);

      await fetchInvestigations();
      setSelectedId(data.investigationId);
      setSearchParams({ id: String(data.investigationId) });
      await fetchDetail(data.investigationId);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze evidence.');
    } finally {
      setSubmitting(false);
      setTimeout(() => setUploadProgress(0), 600);
    }
  };

  const handleDeleteEvidence = async (evId: number) => {
    const res = await apiFetch(`/api/evidence/${evId}`, { method: 'DELETE' });
    if (res.ok && selectedId) {
      await fetchDetail(Number(selectedId));
      await fetchInvestigations();
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">
              {t('invPageTitle')}
            </h1>
            <p className="text-sm text-[#94A3B8]">{t('invPageSubtitle')}</p>
          </div>

          {selectedId && (
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/app/reconstruction?id=${selectedId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-[#818CF8] px-4 py-2 text-xs font-semibold text-[#0B0F14] hover:bg-[#A5B4FC]"
              >
                <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('invReconstructBtn')}</span>
              </Link>
              <Link
                to={`/app/risk?id=${selectedId}`}
                className="inline-flex items-center gap-2 rounded-lg border border-[#243040] bg-[#131A22] px-4 py-2 text-xs font-semibold text-[#F3F6F9] hover:border-[#38BDF8]"
              >
                <span>{t('invRiskReportBtn')}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Investigation Workspace Selector */}
        <div className="rounded-xl border border-[#243040] bg-[#131A22] p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-6">
            <label htmlFor="inv-active-case" className="block text-xs font-medium text-[#94A3B8] mb-1">
              {t('invActiveCaseLabel')}
            </label>
            <select
              id="inv-active-case"
              name="activeCaseId"
              value={selectedId}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : '';
                setSelectedId(v);
                if (v) setSearchParams({ id: String(v) });
              }}
              className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
            >
              <option value="">{t('invAutoCreateOption')}</option>
              {investigations.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.investigationCode} — {inv.title} ({inv.riskLevel})
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-4">
            <label htmlFor="inv-new-case-title" className="block text-xs font-medium text-[#94A3B8] mb-1">
              {t('invNewCaseLabel')}
            </label>
            <input
              id="inv-new-case-title"
              name="newCaseTitle"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t('invNewCasePlaceholder')}
              className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
            />
          </div>

          <div className="lg:col-span-2">
            <button
              type="button"
              onClick={handleCreateInvestigation}
              disabled={!newTitle.trim()}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#38BDF8]/50 bg-[#1B2430] px-3 py-2 text-xs font-semibold text-[#38BDF8] hover:bg-[#38BDF8]/10 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('invNewCaseBtn')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Submission Form — Sky Blue Forensic Theme */}
          <div className="lg:col-span-6 space-y-5">
            <form
              onSubmit={handleSubmitEvidence}
              className="rounded-xl border border-[#243040] bg-[#131A22] p-6 space-y-4"
            >
              <h2 className="font-display text-lg font-semibold text-[#F3F6F9]">
                {t('invAddEvidenceHeading')}
              </h2>

              {error && (
                <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inv-evidence-type" className="block text-xs font-medium text-[#94A3B8] mb-1">
                    {t('invEvidenceTypeLabel')}
                  </label>
                  <select
                    id="inv-evidence-type"
                    name="evidenceType"
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value)}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  >
                    <option value="sms">{t('invTypeSms')}</option>
                    <option value="whatsapp">{t('invTypeWhatsapp')}</option>
                    <option value="screenshot">{t('invTypeScreenshot')}</option>
                    <option value="payment_screenshot">{t('invTypePayScreenshot')}</option>
                    <option value="bank_notification">{t('invTypeBankNotif')}</option>
                    <option value="audio">{t('invTypeAudio')}</option>
                    <option value="voice_transcript">{t('invTypeTranscript')}</option>
                    <option value="url">{t('invTypeUrl')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="inv-event-time" className="block text-xs font-medium text-[#94A3B8] mb-1">
                    {t('invEventTimeLabel')}
                  </label>
                  <input
                    id="inv-event-time"
                    name="eventTimestamp"
                    value={eventTimestamp}
                    onChange={(e) => setEventTimestamp(e.target.value)}
                    placeholder="10:15 AM"
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inv-evidence-title" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('invEvidenceLabelField')}
                </label>
                <input
                  id="inv-evidence-title"
                  name="evidenceTitle"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  placeholder={t('invEvidenceLabelPlaceholder')}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>

              {/* Drag and Drop */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files?.[0]) handleFilePick(e.dataTransfer.files[0]);
                }}
                className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
                  dragActive
                    ? 'border-[#38BDF8] bg-[#38BDF8]/10'
                    : 'border-[#243040] bg-[#0D1218]'
                }`}
              >
                <Upload className="h-6 w-6 text-[#38BDF8] mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs text-[#F3F6F9]">{t('invDropzonePrompt')}</p>
                <label htmlFor="inv-evidence-file" className="mt-3 inline-block cursor-pointer rounded-lg border border-[#243040] bg-[#1B2430] px-3.5 py-1.5 text-xs font-medium text-[#F3F6F9] hover:border-[#38BDF8]">
                  {t('invBrowseFile')}
                  <input
                    id="inv-evidence-file"
                    name="evidenceFile"
                    type="file"
                    accept="image/*,audio/*,.txt"
                    onChange={(e) => handleFilePick(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>

                {file && (
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-[#131A22] px-3 py-2 text-xs">
                    <span className="truncate text-[#38BDF8]">
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setFilePreviewUrl(null);
                      }}
                      className="text-[#EF4444] hover:underline ml-2"
                    >
                      {t('invRemoveFile')}
                    </button>
                  </div>
                )}

                {filePreviewUrl && (
                  <img
                    src={filePreviewUrl}
                    alt="Uploaded evidence preview"
                    className="mt-3 max-h-40 mx-auto rounded-lg border border-[#243040] object-contain"
                  />
                )}
              </div>

              <div>
                <label htmlFor="inv-raw-text" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('invTextLabel')}
                </label>
                <textarea
                  id="inv-raw-text"
                  name="rawText"
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={t('invTextPlaceholder')}
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>

              <div>
                <label htmlFor="inv-url-input" className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {t('invUrlLabel')}
                </label>
                <input
                  id="inv-url-input"
                  name="urlInput"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-sm text-[#F3F6F9]"
                />
              </div>

              {uploadProgress > 0 && (
                <div className="w-full bg-[#0D1218] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#38BDF8] h-2 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#38BDF8] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-[#7DD3FC] disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>{submitting ? t('analyzingEvidence') : t('submitEvidence')}</span>
              </button>
            </form>

            <VoiceAssistPanel
              onTranscriptReady={(tr) => {
                if (tr) {
                  setRawText((prev) => (prev ? `${prev}\n${tr}` : tr));
                  setEvidenceType('voice_transcript');
                }
              }}
            />
          </div>

          {/* Submitted Evidence Results */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#94A3B8]">{t('invLogHeading')}</div>
                <h2 className="font-display text-base font-semibold text-[#F3F6F9]">
                  {activeDetail?.investigation?.title || t('invNoCaseSelected')}
                </h2>
              </div>
              {activeDetail?.investigation && (
                <RiskIndicator
                  level={activeDetail.investigation.riskLevel}
                  score={activeDetail.investigation.riskScore}
                />
              )}
            </div>

            {!activeDetail || activeDetail.evidence?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#243040] bg-[#131A22]/50 p-8 text-center text-sm text-[#94A3B8]">
                {t('invLogEmpty')}
              </div>
            ) : (
              <div className="space-y-4">
                {activeDetail.evidence.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-xs text-[#38BDF8]">
                          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="font-mono uppercase">{ev.evidenceType}</span>
                          {ev.eventTimestamp && (
                            <span className="text-[#94A3B8]">· {ev.eventTimestamp}</span>
                          )}
                          <span className="text-[#94A3B8]">
                            · {t('invStatusLabel')}: {ev.analysisStatus}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-semibold text-[#F3F6F9]">
                          {ev.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteEvidence(ev.id)}
                        className="p-1.5 text-[#94A3B8] hover:text-[#EF4444]"
                        aria-label={`Remove ${ev.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="rounded-lg bg-[#0D1218] p-3 text-xs text-[#F3F6F9] whitespace-pre-wrap leading-relaxed">
                      {ev.extractedText || ev.rawInput}
                    </div>

                    {ev.analysisSummary && (
                      <p className="text-xs text-[#94A3B8] leading-relaxed">{ev.analysisSummary}</p>
                    )}

                    {ev.extractedDetails?.domainCharacteristics?.length > 0 && (
                      <div className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3 text-xs space-y-1">
                        <div className="font-semibold text-[#F59E0B]">{t('invUrlFindings')}</div>
                        <ul className="list-disc pl-4 text-[#F3F6F9]">
                          {ev.extractedDetails.domainCharacteristics.map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {ev.detectedIndicators?.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-[#F3F6F9]">
                          {t('invDetectedIndicators')}
                        </div>
                        {ev.detectedIndicators.map((ind: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-lg bg-[#1B2430] px-3 py-2 text-xs flex flex-col gap-0.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#F59E0B]">{ind.type}</span>
                              <span className="font-mono uppercase text-[#94A3B8]">
                                {ind.severity}
                              </span>
                            </div>
                            <span className="text-[#94A3B8]">"{ind.evidence}"</span>
                            <span className="text-[#F3F6F9]">{ind.explanation}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-1 flex justify-end">
                      <AiFeedbackButton
                        moduleType="evidence"
                        investigationId={activeDetail?.investigation?.id}
                        evidenceId={ev.id}
                        aiPredictedRisk={activeDetail?.investigation?.riskLevel}
                        reportedContentExcerpt={ev.analysisSummary || ev.extractedText || ev.rawInput}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
