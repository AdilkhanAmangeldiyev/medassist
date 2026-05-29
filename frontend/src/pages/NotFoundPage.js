import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={s.wrap}>
      <div style={s.box}>
        <div style={s.codeWrap}>
          <span style={s.code}>4</span>
          <span style={s.codeIcon}>🏥</span>
          <span style={s.code}>4</span>
        </div>
        <h2 style={s.title}>Страница не найдена</h2>
        <p style={s.sub}>
          Возможно, страница была удалена или вы перешли по неверной ссылке.
          <br />Вернитесь на главную и попробуйте снова.
        </p>
        <div style={s.btns}>
          <Link to="/" style={s.btnPrimary}>На главную</Link>
          <Link to="/doctors" style={s.btnOutline}>Найти врача</Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
    background: 'linear-gradient(160deg, #F0FBF7 0%, #F8FFFE 60%, #E6F7F2 100%)',
  },
  box: {
    textAlign: 'center', padding: '64px 40px',
    maxWidth: 480,
  },
  codeWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 32,
  },
  code: {
    fontSize: 100, fontWeight: 900,
    color: '#1D9E75', lineHeight: 1,
    textShadow: '0 4px 16px rgba(29,158,117,0.2)',
  },
  codeIcon: { fontSize: 72, lineHeight: 1 },
  title: {
    fontSize: 28, fontWeight: 800,
    color: '#1a1a1a', marginBottom: 14,
  },
  sub: {
    fontSize: 16, color: '#6b7280',
    lineHeight: 1.7, marginBottom: 36,
  },
  btns: { display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: {
    padding: '13px 32px',
    background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
    color: '#fff', borderRadius: 12,
    fontWeight: 700, fontSize: 15,
    boxShadow: '0 4px 14px rgba(29,158,117,0.3)',
  },
  btnOutline: {
    padding: '13px 32px',
    background: '#fff',
    color: '#1D9E75',
    border: '2px solid #1D9E75',
    borderRadius: 12,
    fontWeight: 700, fontSize: 15,
  },
};
