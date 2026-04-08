import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, User, Bot, Loader2,
  RotateCcw, ChevronRight, LightbulbIcon
} from 'lucide-react';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

// ── Example prompts shown as chips ──────────────────────────────────────────
const EXAMPLE_PROMPTS = [
  "How many students haven't paid their fees?",
  "List all pending complaints this week",
  "Which rooms in Block A are full?",
  "How many leave requests are pending?",
  "Show students with high priority complaints",
  "Which complaints are still in progress?",
  "Count students on medical leave",
  "List all rooms under maintenance",
];

// ── Render DB result as a formatted table / list ─────────────────────────────
const DataDisplay = ({ data }) => {
  if (!data) return null;

  const { type, value, rows, docs, groupBy, collection, count } = data;

  if (type === 'count') {
    return (
      <div className="mt-3 inline-flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3">
        <span className="text-4xl font-black text-indigo-600">{value}</span>
        <span className="text-sm font-semibold text-indigo-500 capitalize">{collection}</span>
      </div>
    );
  }

  if (type === 'summary' && rows?.length > 0) {
    const max = Math.max(...rows.map(r => r.count));
    return (
      <div className="mt-3 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 w-24 shrink-0 capitalize">
              {row._id || 'Unknown'}
            </span>
            <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                style={{ width: `${Math.round((row.count / max) * 100)}%` }}
              >
                <span className="text-white text-xs font-bold">{row.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list' && docs?.length > 0) {
    // Pick meaningful columns based on collection
    const getLabel = (doc) => {
      if (doc.name) return doc.name;
      if (doc.studentId?.name) return doc.studentId.name;
      if (doc.roomNumber) return `Room ${doc.roomNumber}`;
      if (doc.title) return doc.title;
      return '—';
    };
    const getSub = (doc) => {
      if (doc.studentId) return doc.studentId?.name || '';
      if (doc.block) return `Block ${doc.block}, Floor ${doc.floor}`;
      if (doc.email) return doc.email;
      return '';
    };
    const getBadge = (doc) => doc.status || doc.priority || doc.role || '';

    const badgeColors = {
      Pending: 'bg-amber-100 text-amber-700',
      'In Progress': 'bg-blue-100 text-blue-700',
      Resolved: 'bg-emerald-100 text-emerald-700',
      Approved: 'bg-emerald-100 text-emerald-700',
      Rejected: 'bg-rose-100 text-rose-700',
      Paid: 'bg-emerald-100 text-emerald-700',
      Unpaid: 'bg-rose-100 text-rose-700',
      'Partially Paid': 'bg-amber-100 text-amber-700',
      Full: 'bg-rose-100 text-rose-700',
      Available: 'bg-emerald-100 text-emerald-700',
      Maintenance: 'bg-slate-100 text-slate-600',
      High: 'bg-rose-100 text-rose-700',
      Medium: 'bg-amber-100 text-amber-700',
      Low: 'bg-slate-100 text-slate-600',
      admin: 'bg-indigo-100 text-indigo-700',
      warden: 'bg-teal-100 text-teal-700',
      student: 'bg-blue-100 text-blue-700',
    };

    return (
      <div className="mt-3 space-y-1.5">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
          {count} result{count !== 1 ? 's' : ''}
        </p>
        {docs.map((doc, i) => {
          const badge = getBadge(doc);
          return (
            <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                  {getLabel(doc)?.[0]?.toUpperCase() || '#'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 leading-none">{getLabel(doc)}</p>
                  {getSub(doc) && (
                    <p className="text-xs text-slate-400 mt-0.5">{getSub(doc)}</p>
                  )}
                </div>
              </div>
              {badge && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColors[badge] || 'bg-slate-100 text-slate-600'}`}>
                  {badge}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};

// ── Chat message bubble ───────────────────────────────────────────────────────
const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center shadow-sm ${
        isUser
          ? 'bg-gradient-to-br from-indigo-500 to-violet-500'
          : 'bg-gradient-to-br from-emerald-500 to-teal-500'
      }`}>
        {isUser
          ? <User className="h-4 w-4 text-white" />
          : <Bot className="h-4 w-4 text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm'
            : 'bg-white border border-slate-100 rounded-tl-sm'
        }`}>
          <p className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-slate-700'}`}>
            {msg.content}
          </p>
        </div>
        {/* DB data display below AI bubble */}
        {!isUser && msg.data && <DataDisplay data={msg.data} />}
        <p className="text-xs text-slate-300 mt-1 px-1">{msg.time}</p>
      </div>
    </div>
  );
};

// ── Thinking / loading indicator ─────────────────────────────────────────────
const ThinkingBubble = () => (
  <div className="flex gap-3">
    <div className="shrink-0 h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
      <Bot className="h-4 w-4 text-white" />
    </div>
    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
        <span className="text-sm text-slate-500">Thinking…</span>
      </div>
      <p className="text-xs text-slate-300 mt-1">Querying your hostel data</p>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: "Hi! I'm your AI Co-Pilot 👋 Ask me anything about students, rooms, complaints, fees, or leave requests — in plain English.",
      data: null,
      time: 'Now',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const getTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const send = async (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q, data: null, time: getTime() }]);
    setLoading(true);

    try {
      const res = await axios.post('/ai/query', { question: q });
      const { answer, data } = res.data;
      setMessages(prev => [...prev, { role: 'ai', content: answer, data, time: getTime() }]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(msg);
      setMessages(prev => [...prev, { role: 'ai', content: msg, data: null, time: getTime() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'ai',
      content: "Chat cleared! What would you like to know?",
      data: null,
      time: getTime(),
    }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">AI Co-Pilot</h1>
            <p className="text-xs text-slate-400 mt-0.5">Ask anything about your hostel in plain English</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Clear
        </button>
      </div>

      {/* ── Example prompts (shown only at start) ── */}
      {messages.length === 1 && (
        <div className="mb-4 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <LightbulbIcon className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Try asking…</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => send(p)}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl px-3 py-1.5 transition-all"
              >
                <ChevronRight className="h-3 w-3 shrink-0" />
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Chat messages ── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-2">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && <ThinkingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="shrink-0 mt-4">
        <div className="flex items-end gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-3 focus-within:border-indigo-300 focus-within:shadow-md transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask about students, rooms, complaints, fees, leaves…"
            disabled={loading}
            className="flex-1 resize-none text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent leading-relaxed max-h-32"
            style={{ fieldSizing: 'content' }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="shrink-0 p-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </button>
        </div>
        <p className="text-center text-xs text-slate-300 mt-2">
          Powered by Gemini · Reads live hostel data · Only Admin &amp; Warden access
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
