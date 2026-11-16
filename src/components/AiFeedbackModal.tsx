import React, { useState } from 'react';
import { CheckCircle2, Flag, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface AiFeedbackButtonProps {
  moduleType: 'evidence' | 'manipulation' | 'reconstruction' | 'risk' | 'payment_safety';
  investigationId?: number;
  evidenceId?: number;
  aiPredictedRisk?: string;
  reportedContentExcerpt?: string;
}

export function AiFeedbackButton({
  moduleType,
  investigationId,
  evidenceId,
  aiPredictedRisk = '',
  reportedContentExcerpt = '',
}: AiFeedbackButtonProps) {
  const { apiFetch } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investigationId,
          evidenceId,
          moduleType,
          userReason: reason,
          expectedOutcome,
          reportedContentExcerpt: reportedContentExcerpt.slice(0, 500),
          aiPredictedRisk,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit feedback.');
      setSubmitted(true);
      setReason('');
      setExpectedOutcome('');
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setSubmitted(false);
          setError('');
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3 py-1.5 text-xs font-medium text-[#F59E0B] hover:bg-[#F59E0B]/20 transition-colors"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t('reportIncorrectAiBtn')}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#243040] bg-[#131A22] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#F3F6F9]">
                {t('reportAiModalTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 text-[#94A3B8] hover:text-[#F3F6F9]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitted ? (
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2 text-[#10B981] text-sm font-semibold">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  <span>{t('reportAiSuccessTitle')}</span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {t('reportAiSuccessBody')}
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-lg bg-[#14B8A6] px-4 py-2 text-xs font-semibold text-[#0B0F14]"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {t('reportAiModalDesc')}
                </p>

                {error && (
                  <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-2.5 text-xs text-[#EF4444]">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="ai-feedback-outcome" className="block text-xs text-[#94A3B8] mb-1">
                    {t('reportAiExpectedLabel')}
                  </label>
                  <select
                    id="ai-feedback-outcome"
                    name="expectedOutcome"
                    value={expectedOutcome}
                    onChange={(e) => setExpectedOutcome(e.target.value)}
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                  >
                    <option value="">Select expected classification...</option>
                    <option value="False Positive — Legitimate message flagged as risky">
                      False Positive — Legitimate message flagged as risky
                    </option>
                    <option value="False Negative — Scam missed or scored too low">
                      False Negative — Scam missed or scored too low
                    </option>
                    <option value="Wrong Scam Category">Wrong Scam Category</option>
                    <option value="Missing or Inaccurate Explanation">
                      Missing or Inaccurate Explanation
                    </option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ai-feedback-reason" className="block text-xs text-[#94A3B8] mb-1">
                    {t('reportAiReasonLabel')}
                  </label>
                  <textarea
                    id="ai-feedback-reason"
                    name="reason"
                    required
                    minLength={5}
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain what the AI got wrong..."
                    className="w-full rounded-lg border border-[#243040] bg-[#0D1218] px-3 py-2 text-xs text-[#F3F6F9]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-[#243040] px-3.5 py-2 text-xs text-[#94A3B8] hover:text-[#F3F6F9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#F59E0B] px-4 py-2 text-xs font-semibold text-[#0B0F14] hover:bg-[#FBBF24] disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{t('reportAiSubmitBtn')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
