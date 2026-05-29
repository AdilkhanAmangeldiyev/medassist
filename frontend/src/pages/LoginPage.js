import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: tokens } = await authApi.login(form);
      localStorage.setItem('access_token', tokens.access_token);
      const { data: me } = await authApi.me();
      await login(tokens, me);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный email или пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>
          <span style={s.logoIcon}>🏥</span>
          <span style={s.logoText}>МедАссист</span>
        </div>

        <h2 style={s.title}>Добро пожаловать</h2>
        <p style={s.sub}>Войдите в свой аккаунт</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={submit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Пароль</label>
            <input
              style={s.input}
              type="password"
              placeholder="Введите пароль"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Входим…' : 'Войти'}
          </button>
        </form>

        <div style={s.hints}>
          <div style={s.hint}>Демо пациент: <code>patient@demo.com</code> / <code>demo1234</code></div>
          <div style={s.hint}>Демо врач: <code>doctor@medassist.kz</code> / <code>doctor123</code></div>
        </div>

        <p style={s.footer}>
          Нет аккаунта?{' '}
          <Link to="/register" style={s.footerLink}>Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    minHeight: 'calc(100vh - 64px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '32px 16px',
    background: 'linear-gradient(160deg, #F0FBF7 0%, #F8FFFE 60%, #E6F7F2 100%)',
  },
  card: {
    background: '#fff', borderRadius: 24,
    padding: '44px 40px', width: '100%', maxWidth: 420,
    boxShadow: '0 8px 40px rgba(29,158,117,0.12), 0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, justifyContent: 'center' },
  logoIcon: { fontSize: 32 },
  logoText: { fontSize: 22, fontWeight: 800, color: '#1D9E75' },
  title: { fontSize: 24, fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 28 },
  errorBox: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '11px 14px', color: '#dc2626', fontSize: 14, marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, width: '100%', boxSizing: 'border-box' },
  btn: {
    padding: '13px', background: 'linear-gradient(135deg,#1D9E75,#0F6E56)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontWeight: 700, fontSize: 16, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(29,158,117,0.35)',
    transition: 'opacity 0.2s',
    marginTop: 4,
  },
  hints: { marginTop: 20, padding: '14px 16px', background: '#F0FBF7', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6 },
  hint: { fontSize: 12, color: '#6b7280' },
  footer: { textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 20 },
  footerLink: { color: '#1D9E75', fontWeight: 700 },
};
