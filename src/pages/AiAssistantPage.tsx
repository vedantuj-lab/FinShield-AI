import React, { useState } from 'react';
import { Bot, Loader2, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  disclaimer?: string;
}

const QUICK_PROMPTS = [
  'How should I structure an emergency fund in India?',
  'Compare Old vs. New Tax Regime for ₹12 lakh salary.',
  'What are red flags of a fake SEBI/stock tip WhatsApp group?',
  'Explain SIP vs. lump-sum investing in Nifty 50 index funds.',
];

export function AiAssistantPage() {
  const { apiFetch } = useAuth();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am the FINSHIELD AI Financial & Safety Assistant. Ask me about budgeting, Indian investment concepts, tax regimes, small-business GST basics, or how to spot financial scams.',
      disclaimer: 'Educational guidance only — not licensed financial, legal, or tax advice.',
    },
  ]);
  const [question, setQuestion] = useState('');
  const [includeSavedContext, setIncludeSavedContext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendQuestion = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          includeSavedContext,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Assistant request failed.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || 'No response generated.',
          disclaimer: data.disclaimer,
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Could not reach AI Assistant.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(question);
  };

  return (
    <AppShell>
      <div className="space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F3F6F9]">
            AI Financial &amp; Safety Assistant
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Gemini-powered educational Q&amp;A for personal finance, Indian tax concepts, and scam prevention.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendQuestion(prompt)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#243040] bg-[#131A22] px-3 py-1.5 text-xs text-[#94A3B8] hover:border-[#14B8A6] hover:text-[#F3F6F9]"
            >
              <Sparkles className="h-3 w-3 text-[#14B8A6]" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-[#243040] bg-[#131A22] p-5 space-y-4 min-h-[380px] max-h-[520px] overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-[#14B8A6] text-[#0D1218] font-medium'
                    : 'bg-[#0D1218] border border-[#243040] text-[#F3F6F9]'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#14B8A6]">
                    <Bot className="h-3.5 w-3.5" />
                    <span>FINSHIELD AI</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                {msg.disclaimer && (
                  <div className="pt-1 border-t border-[#243040] text-[11px] text-[#94A3B8] flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#F59E0B] shrink-0" />
                    <span>{msg.disclaimer}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
              <Loader2 className="h-4 w-4 animate-spin text-[#14B8A6]" />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label
            htmlFor="ai-include-context"
            className="inline-flex items-center gap-2 text-xs text-[#94A3B8] cursor-pointer"
          >
            <input
              id="ai-include-context"
              name="includeSavedContext"
              type="checkbox"
              checked={includeSavedContext}
              onChange={(e) => setIncludeSavedContext(e.target.checked)}
              className="rounded border-[#243040] bg-[#0D1218]"
            />
            <span>
              Include my saved budget &amp; portfolio summary for personalised context (opt-in)
            </span>
          </label>

          <div className="flex gap-2">
            <label htmlFor="ai-question-input" className="sr-only">
              Ask a financial or safety question
            </label>
            <input
              id="ai-question-input"
              name="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about budgeting, SIPs, tax regimes, GST, or scam red flags..."
              className="flex-1 rounded-lg border border-[#243040] bg-[#131A22] px-4 py-2.5 text-sm text-[#F3F6F9] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#14B8A6] px-5 py-2.5 text-sm font-semibold text-[#0D1218] hover:bg-[#2DD4BF] disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              <span>Ask</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
