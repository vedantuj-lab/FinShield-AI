import React, { useRef, useState } from 'react';
import { Mic, Square, Upload, Volume2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface VoiceAssistPanelProps {
  onTranscriptReady?: (transcript: string, note: string) => void;
  speechTextToSpeak?: string;
}

export function VoiceAssistPanel({
  onTranscriptReady,
  speechTextToSpeak,
}: VoiceAssistPanelProps) {
  const { apiFetch } = useAuth();
  const { language, t } = useLanguage();
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [sttNote, setSttNote] = useState('');
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        await uploadAudioBlob(blob, 'recorded-voice.webm');
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError('Microphone access was denied or is unavailable. You can upload an audio file instead.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadAudioBlob = async (blob: Blob, filename: string) => {
    setTranscribing(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('audio', blob, filename);
      const res = await apiFetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audio transcription failed');
      setTranscript(data.transcript || '');
      setSttNote(data.note || '');
      if (onTranscriptReady) {
        onTranscriptReady(data.transcript || '', data.note || '');
      }
    } catch (err: any) {
      setError(err.message || 'Could not transcribe audio.');
    } finally {
      setTranscribing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAudioBlob(file, file.name);
  };

  const speakGuidance = async (customText?: string) => {
    const text = (customText || speechTextToSpeak || transcript).trim();
    if (!text) return;
    setSpeaking(true);
    setError('');
    try {
      const res = await apiFetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Speech generation failed');
      const url = `data:${data.mimeType};base64,${data.audioBase64}`;
      setAudioUrl(url);
      const audio = new Audio(url);
      await audio.play();
    } catch (err: any) {
      setError(err.message || 'Could not play speech guidance.');
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-[#F3F6F9]">
            {t('voiceTitle')}
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">{t('voiceSubtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={transcribing}
              className="inline-flex items-center gap-2 rounded-lg bg-[#38BDF8] px-3.5 py-2 text-xs font-semibold text-[#0B0F14] hover:bg-[#7DD3FC] disabled:opacity-50 whitespace-nowrap"
            >
              <Mic className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('voiceRecord')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 rounded-lg bg-[#EF4444] px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 whitespace-nowrap"
            >
              <Square className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('voiceStop')}</span>
            </button>
          )}

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#243040] bg-[#1B2430] px-3.5 py-2 text-xs font-medium text-[#F3F6F9] hover:border-[#38BDF8] whitespace-nowrap">
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('voiceUpload')}</span>
            <input
              id="voice-assist-audio"
              name="voiceAudioFile"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {(speechTextToSpeak || transcript) && (
            <button
              type="button"
              onClick={() => speakGuidance()}
              disabled={speaking}
              className="inline-flex items-center gap-2 rounded-lg border border-[#38BDF8]/40 bg-[#1B2430] px-3.5 py-2 text-xs font-medium text-[#38BDF8] hover:bg-[#38BDF8]/10 disabled:opacity-50 whitespace-nowrap"
            >
              {speaking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{t('voiceHear')}</span>
            </button>
          )}
        </div>
      </div>

      {transcribing && (
        <div className="flex items-center gap-2 text-xs text-[#38BDF8]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{t('voiceTranscribing')}</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-3.5 py-2.5 text-xs text-[#EF4444]">
          {error}
        </div>
      )}

      {transcript && (
        <div className="rounded-lg border border-[#243040] bg-[#0D1218] p-3.5 space-y-1.5">
          <div className="text-xs font-semibold text-[#38BDF8]">{t('voiceExtracted')}</div>
          <p className="text-sm text-[#F3F6F9] leading-relaxed">{transcript}</p>
          {sttNote && <p className="text-[11px] text-[#94A3B8]">{sttNote}</p>}
        </div>
      )}

      {audioUrl && <audio controls src={audioUrl} className="w-full h-9" />}
    </div>
  );
}
