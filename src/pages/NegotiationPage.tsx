import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../components/AuthContext';
import { Session, Message, Locale } from '../types/api';
import { LogOut, Send, Loader2 } from 'lucide-react';

const scenarios = [
  { id: 'price', label: 'Price Negotiation' },
  { id: 'delivery', label: 'Delivery Terms' },
  { id: 'contract', label: 'Contract Clauses' },
  { id: 'complaint', label: 'Complaint Handling' },
];

export const NegotiationPage: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scenario, setScenario] = useState('price');
  const [locale, setLocale] = useState<Locale>('en');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.negotiation.createSession({ scenario, locale });
        const data = await api.negotiation.getSession(res.sessionId);
        setSession(data);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize session');
      }
    };
    init();
  }, [scenario, locale]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !session || loading) return;
    setLoading(true);
    setError('');
    try {
      await api.negotiation.saveMessage(session.sessionId, inputText);
      // Optimistically update or just fetch
      const afterUser = await api.negotiation.getSession(session.sessionId);
      setSession(afterUser);
      setInputText('');

      // Get AI reply
      await api.negotiation.getAIReply(session.sessionId, locale);
      const afterAI = await api.negotiation.getSession(session.sessionId);
      setSession(afterAI);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-zinc-900">bussinessv2</h1>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:outline-none"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-zinc-200 p-1 bg-zinc-50">
            <button
              onClick={() => setLocale('zh')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${locale === 'zh' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
            >
              ZH
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${locale === 'en' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
            >
              EN
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">Hello, {user?.name || user?.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-hidden p-6">
        <div className="mx-auto flex h-full max-w-4xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {session?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-900 border border-zinc-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm text-zinc-500 border border-zinc-200">
                  <Loader2 size={14} className="animate-spin" />
                  AI is thinking...
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mb-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-zinc-100 p-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-zinc-400 focus:outline-none disabled:bg-zinc-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !inputText.trim()}
                className="flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-white hover:bg-zinc-800 disabled:opacity-50 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
