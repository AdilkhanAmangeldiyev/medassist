import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'patient', icon: '🧑‍💼', label: 'Я пациент',  desc: 'Записываюсь к врачу' },
  { value: 'doctor',  icon: '👨‍⚕️', label: 'Я врач',     desc: 'Веду приём пациентов' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: tokens } = await authApi.register(form);
      localStorage.setItem('access_token', tokens.access_token);
      const { data: me } = await authApi.me();
      await login(tokens, me);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка регистрации. Попробуйте снова.');
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

        <h2 style={s.title}>Создать аккаунт</h2>
        <p style={s.sub}>Начните пользоваться платформой бесплатно</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={submit} style={s.form}>

          {/* Role selector */}
          <div style={s.field}>
            <label style={s.label}>Тип аккаунта</label>
            <div style={s.roleRow}>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  style={{
                    ...s.roleBtn,
                    ...(form.role === r.value ? s.roleBtnActive : {}),
                  }}
                >
                  <span style={s.roleIcon}>{r.icon}</span>
                  <div style={s.roleLabelWrap}>
                    <div style={s.roleLabel}>{r.label}</div>
                    <div style={s.roleDesc}>{r.desc}</div>
                  </div>
                  {form.role === r.value && <span style={s.roleCheck}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Полное имя</label>
            <input
              style={s.input}
              type="text"
              placeholder="Ваше имя"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

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
              placeholder="Не менее 8 символов"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
          </div>

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
          </button>
        </form>

        <p style={s.footer}>
          Уже есть аккаунт?{' '}
          <Link to="/login" style={s.footerLink}>Войти</Link>
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
    padding: '44px 40px', width: '100%', maxWidth: 440,
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
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, width: '100%', boxSizing: 'border-box' },

  roleRow: { display: 'flex', gap: 10 },
  roleBtn: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px', borderRadius: 12,
    border: '2px solid #e5e7eb', background: '#fff',
    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
    position: 'relative',
  },
  roleBtnActive: {
    border: '2px solid #1D9E75',
    background: '#F0FBF7',
  },
  roleIcon: { fontSize: 24, flexShrink: 0 },
  roleLabelWrap: { flex: 1 },
  roleLabel: { fontSize: 14, fontWeight: 700, color: '#1a1a1a' },
  roleDesc: { fontSize: 11, color: '#6b7280' },
  roleCheck: { color: '#1D9E75', fontWeight: 800, fontSize: 16, flexShrink: 0 },

  btn: {
    padding: '13px', background: 'linear-gradient(135deg,#1D9E75,#0F6E56)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontWeight: 700, fontSize: 16, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(29,158,117,0.35)',
    transition: 'opacity 0.2s',
    marginTop: 4,
  },
  footer: { textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 24 },
  footerLink: { color: '#1D9E75', fontWeight: 700 },
};
