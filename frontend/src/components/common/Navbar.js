import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hovered, setHovered] = useState(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLink = (to, label) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        style={{
          ...s.link,
          ...(active ? s.linkActive : {}),
          ...(hovered === to ? s.linkHover : {}),
        }}
        onMouseEnter={() => setHovered(to)}
        onMouseLeave={() => setHovered(null)}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav style={s.nav}>
      <div style={s.inner}>
        {/* Logo */}
        <Link to="/" style={s.brand}>
          <span style={s.brandIcon}>🏥</span>
          <span style={s.brandText}>МедАссист</span>
        </Link>

        {/* Links */}
        <div style={s.links}>
          {user?.role === 'doctor' && (
            <>
              {navLink('/appointments', 'Мои пациенты')}
              <div style={s.divider} />
              <span style={s.userBadge}>{user.name}</span>
              <button style={s.logoutBtn} onClick={handleLogout}>Выйти</button>
            </>
          )}

          {user?.role === 'patient' && (
            <>
              {navLink('/doctors', 'Врачи')}
              {navLink('/appointments', 'Мои записи')}
              {navLink('/ai', 'ИИ-ассистент')}
              {navLink('/profile', '👤 Профиль')}
              <div style={s.divider} />
              <span style={s.userBadge}>{user.name}</span>
              <button style={s.logoutBtn} onClick={handleLogout}>Выйти</button>
            </>
          )}

          {!user && (
            <>
              {navLink('/doctors', 'Врачи')}
              {navLink('/login', 'Войти')}
              <Link to="/register" style={s.registerBtn}>Регистрация</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const s = {
  nav: {
    background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)',
    boxShadow: '0 2px 12px rgba(15,110,86,0.25)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  inner: {
    maxWidth: 1200, margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px', height: 64,
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    textDecoration: 'none',
  },
  brandIcon: { fontSize: 28 },
  brandText: {
    color: '#fff', fontWeight: 800, fontSize: 20,
    letterSpacing: '-0.3px',
  },
  links: { display: 'flex', alignItems: 'center', gap: 4 },
  link: {
    color: 'rgba(255,255,255,0.85)',
    textDecoration: 'none',
    fontSize: 14, fontWeight: 500,
    padding: '6px 14px', borderRadius: 8,
    transition: 'all 0.2s ease',
  },
  linkActive: {
    color: '#fff',
    background: 'rgba(255,255,255,0.15)',
  },
  linkHover: {
    color: '#fff',
    background: 'rgba(255,255,255,0.12)',
  },
  divider: {
    width: 1, height: 24,
    background: 'rgba(255,255,255,0.25)',
    margin: '0 8px',
  },
  userBadge: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13, fontWeight: 500,
    padding: '4px 12px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff',
    padding: '6px 16px', borderRadius: 8,
    fontSize: 13, fontWeight: 500,
    cursor: 'pointer',
    marginLeft: 4,
    transition: 'all 0.2s ease',
  },
  registerBtn: {
    background: '#fff',
    color: '#0F6E56',
    padding: '7px 18px', borderRadius: 8,
    fontSize: 14, fontWeight: 700,
    textDecoration: 'none',
    marginLeft: 4,
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
};
