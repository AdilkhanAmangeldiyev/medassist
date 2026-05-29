import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiApi, patientsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const QUICK = [
  { icon: '🤕', text: 'Болит голова' },
  { icon: '❤️', text: 'Проблемы с сердцем' },
  { icon: '🩺', text: 'Нужен терапевт' },
  { icon: '📅', text: 'Записаться к врачу' },
];

const GREETING = {
  role: 'assistant',
  content: 'Здравствуйте! Я ваш медицинский ИИ-ассистент.\n\nОпишите симптомы — я дам советы первой помощи и порекомендую нужного специалиста. Вы также можете сразу записаться к врачу прямо из чата.',
  action: null,
};

// use a function that creates a fresh regex each call to avoid lastIndex issues with /g flag
function cleanReply(text) {
  return (text ?? '').replace(/<BOOKING_ACTION>[\s\S]*?<\/BOOKING_ACTION>/g, '').trim();
}

function parseMarkdown(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### '))
      return <div key={i} style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', margin: '8px 0 2px' }}>{line.slice(4)}</div>;
    if (line === '---')
      return <hr key={i} style={{ border: 'none', borderTop: '1px solid #d1fae5', margin: '8px 0' }} />;
    if (line === '')
      return <div key={i} style={{ height: '0.5em' }} />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <div key={i}>
        {parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j}>{p.slice(2, -2)}</strong>
            : p
        )}
      </div>
    );
  });
}

function DoctorCard({ doctor }) {
  const navigate = useNavigate();
  const bio = doctor.bio ?? '';
  return (
    <div style={s.docCard}>
      <div style={s.docAvatar}>{(doctor.name ?? '?').charAt(0)}</div>
      <div style={s.docInfo}>
        <div style={s.docName}>{doctor.name}</div>
        <div style={s.docSpec}>{doctor.specialty}</div>
        {bio && <div style={s.docBio}>{bio.length > 85 ? bio.slice(0, 85) + '…' : bio}</div>}
        <div style={s.docHours}>🕐 {doctor.work_start} – {doctor.work_end}</div>
      </div>
      <button style={s.docBtn} onClick={() => navigate(`/doctors/${doctor.id}`)}>
        Записаться
      </button>
    </div>
  );
}

function AssistantMessage({ message }) {
  return (
    <div style={s.assistantGroup}>
      <div style={s.assistantAvatar}>🏥</div>
      <div style={s.assistantContent}>
        {message.content && (
          <div style={s.aiBubble}>{parseMarkdown(message.content)}</div>
        )}
        {message.action?.type === 'suggest_doctors' && message.action.doctors.length > 0 && (
          <div style={s.docList}>
            <div style={s.docListTitle}>
              Специалисты по запросу «{message.action.specialty}»:
            </div>
            {message.action.doctors.map(doc => <DoctorCard key={doc.id} doctor={doc} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AiPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [allergies, setAllergies] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (user?.role === 'patient') {
      patientsApi.getProfile()
        .then(r => {
          const a = r.data?.allergies ?? '';
          if (a && a.toLowerCase() !== 'нет' && a.trim()) setAllergies(a);
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg = { role: 'user', content, action: null };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    const apiMessages = next
      .filter((m) => m.role !== 'assistant' || messages.indexOf(m) > 0)
      .map(({ role, content: c }) => ({ role, content: c }));

    try {
      const { data } = await aiApi.chat(apiMessages);
      setMessages([...next, { role: 'assistant', content: cleanReply(data.reply), action: data.action ?? null }]);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Сервис временно недоступен. Попробуйте позже.';
      setMessages([...next, { role: 'assistant', content: detail, action: null }]);
    } finally {
      setLoading(false);
    }
  }, [messages, input, loading]);

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={s.page}>
      {/* allergy warning banner */}
      {allergies && (
        <div style={s.allergyBanner}>
          ⚠️ <strong>Внимание:</strong> у вас аллергия на <strong>{allergies}</strong> — ИИ-ассистент учтёт это в рекомендациях.
        </div>
      )}

      {/* header */}
      <div style={s.header}>
        <div style={s.headerIcon}>🤖</div>
        <div>
          <h2 style={s.title}>ИИ-ассистент</h2>
          <p style={s.sub}>Опишите симптомы для советов первой помощи и подбора специалиста. Не является диагнозом.</p>
        </div>
      </div>

      {/* chat */}
      <div style={s.chat}>
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} style={s.userRow}>
              <div style={s.userBubble}>{m.content}</div>
            </div>
          ) : (
            <AssistantMessage key={i} message={m} />
          )
        )}
        {loading && (
          <div style={s.assistantGroup}>
            <div style={s.assistantAvatar}>🏥</div>
            <div style={s.assistantContent}>
              <div style={{ ...s.aiBubble, ...s.thinking }}>
                <span style={s.dot1}>●</span>
                <span style={s.dot2}>●</span>
                <span style={s.dot3}>●</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* quick suggestions */}
      <div style={s.quickRow}>
        {QUICK.map((q) => (
          <button
            key={q.text}
            style={s.quickBtn}
            onClick={() => send(q.text)}
            disabled={loading}
          >
            <span>{q.icon}</span> {q.text}
          </button>
        ))}
      </div>

      {/* input */}
      <div style={s.inputWrap}>
        <textarea
          style={s.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Опишите симптомы… (Enter — отправить, Shift+Enter — перенос строки)"
          rows={2}
          disabled={loading}
        />
        <button
          style={{ ...s.sendBtn, opacity: (!input.trim() || loading) ? 0.5 : 1 }}
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    maxWidth: 760, margin: '0 auto', padding: '24px 32px 0',
    display: 'flex', flexDirection: 'column',
    height: 'calc(100vh - 64px)', boxSizing: 'border-box',
  },

  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexShrink: 0 },
  headerIcon: { fontSize: 40, width: 60, height: 60, background: '#E6F7F2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: 22, color: '#1a1a1a', marginBottom: 2 },
  sub: { color: '#6b7280', fontSize: 13 },

  chat: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 },

  /* user message */
  userRow: { display: 'flex', justifyContent: 'flex-end' },
  userBubble: {
    background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
    color: '#fff', borderRadius: '18px 18px 4px 18px',
    padding: '12px 18px', maxWidth: '78%',
    fontSize: 14, lineHeight: 1.6, wordBreak: 'break-word',
  },

  /* assistant message */
  assistantGroup: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  assistantAvatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: '#E6F7F2', fontSize: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
    border: '2px solid #A7E5CE',
  },
  assistantContent: { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: '85%' },
  aiBubble: {
    background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: '4px 18px 18px 18px',
    padding: '12px 16px', fontSize: 14, lineHeight: 1.6,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    color: '#1a1a1a',
    borderLeft: '3px solid #1D9E75',
  },
  thinking: { display: 'flex', gap: 6, padding: '14px 18px', alignItems: 'center' },
  dot1: { color: '#1D9E75', fontSize: 18, animation: 'pulse 1.2s ease-in-out infinite' },
  dot2: { color: '#1D9E75', fontSize: 18, animation: 'pulse 1.2s ease-in-out 0.2s infinite' },
  dot3: { color: '#1D9E75', fontSize: 18, animation: 'pulse 1.2s ease-in-out 0.4s infinite' },

  /* doctor cards in chat */
  docList: { display: 'flex', flexDirection: 'column', gap: 10 },
  docListTitle: { fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 4 },
  docCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#fff', border: '1px solid #d1fae5',
    borderRadius: 14, padding: '14px 16px',
    boxShadow: '0 2px 8px rgba(29,158,117,0.1)',
  },
  docAvatar: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'linear-gradient(135deg,#1D9E75,#0F6E56)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 800, flexShrink: 0,
  },
  docInfo: { flex: 1, minWidth: 0 },
  docName: { fontWeight: 700, fontSize: 14, color: '#1a1a1a' },
  docSpec: { fontSize: 12, color: '#1D9E75', fontWeight: 600, margin: '2px 0' },
  docBio: { fontSize: 12, color: '#6b7280' },
  docHours: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  docBtn: {
    flexShrink: 0, padding: '8px 16px',
    background: 'linear-gradient(135deg,#1D9E75,#0F6E56)',
    color: '#fff', border: 'none', borderRadius: 8,
    cursor: 'pointer', fontWeight: 600, fontSize: 13,
    whiteSpace: 'nowrap',
  },

  /* quick suggestions */
  quickRow: { display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 0 8px', flexShrink: 0 },
  quickBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 16px',
    background: '#fff', border: '1.5px solid #A7E5CE',
    color: '#0F6E56', borderRadius: 999,
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
    transition: 'all 0.2s',
  },

  /* input */
  inputWrap: { display: 'flex', gap: 10, paddingBottom: 20, flexShrink: 0 },
  textarea: {
    flex: 1, padding: '12px 16px',
    border: '1.5px solid #e5e7eb', borderRadius: 14,
    fontSize: 14, resize: 'none', fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  allergyBanner: { background: '#fff7ed', border: '1.5px solid #fb923c', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: '#c2410c', marginBottom: 12, lineHeight: 1.5, flexShrink: 0 },
  sendBtn: {
    width: 52, height: 52, alignSelf: 'flex-end',
    background: 'linear-gradient(135deg,#1D9E75,#0F6E56)',
    color: '#fff', border: 'none', borderRadius: 14,
    cursor: 'pointer', fontSize: 20, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.2s',
    flexShrink: 0,
  },
};
