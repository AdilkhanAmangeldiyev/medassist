import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { statsApi } from '../services/api';

const HERO_FEATURES = [
  { icon: '📅', text: 'Онлайн запись' },
  { icon: '🤖', text: 'ИИ-ассистент' },
  { icon: '⚡', text: 'Без очередей' },
];

const SPECIALTY_CARDS = [
  { icon: '❤️', label: 'Кардиология',     specialty: 'Кардиолог' },
  { icon: '🧠', label: 'Неврология',      specialty: 'Невролог' },
  { icon: '🩺', label: 'Терапия',         specialty: 'Терапевт' },
  { icon: '👶', label: 'Педиатрия',       specialty: 'Педиатр' },
  { icon: '🔪', label: 'Хирургия',        specialty: 'Хирург' },
  { icon: '🤖', label: 'ИИ-консультация', specialty: null },
];

const WHY_ITEMS = [
  { icon: '👨‍⚕️', title: 'Опытные врачи',     desc: '15 специалистов с подтверждённой квалификацией и многолетним стажем' },
  { icon: '🕐',  title: 'Онлайн запись 24/7', desc: 'Записывайтесь в любое время — слоты обновляются в реальном времени' },
  { icon: '🤖',  title: 'ИИ-ассистент',        desc: 'Получите первичную консультацию и рекомендацию специалиста мгновенно' },
  { icon: '⚡',  title: 'Быстрый ответ',       desc: 'Подтверждение записи в течение нескольких минут после бронирования' },
];

const REVIEWS = [
  {
    name: 'Айгерим Сейткали', avatar: 'А', rating: 5, date: 'Май 2026',
    text: 'Отличный сервис! Записалась к кардиологу за пару минут. Врач очень внимательный и профессиональный. Рекомендую всем!',
  },
  {
    name: 'Денис Козлов', avatar: 'Д', rating: 5, date: 'Апрель 2026',
    text: 'ИИ-ассистент помог разобраться с симптомами и сразу направил к неврологу. Удобно, что всё в одном приложении.',
  },
  {
    name: 'Жанар Тастанова', avatar: 'Ж', rating: 5, date: 'Май 2026',
    text: 'Записала ребёнка к педиатру без очередей и звонков. Выбрала удобное время, пришли — всё прошло отлично.',
  },
];

function Stars({ count }) {
  return <span style={{ color: '#f59e0b', fontSize: 15 }}>{'★'.repeat(count)}{'☆'.repeat(5 - count)}</span>;
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    statsApi.get().then(r => setStats(r.data)).catch(() => {});
  }, []);

  const handleSpecialty = (card) => {
    if (!card.specialty) { navigate('/ai'); return; }
    navigate('/doctors', { state: { specialty: card.specialty } });
  };

  return (
    <div style={s.page}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <h1 style={s.heroTitle}>Ваше здоровье —<br />наша забота</h1>
          <p style={s.heroSub}>
            Запишитесь к нужному специалисту онлайн, получите консультацию
            ИИ-ассистента и управляйте своими приёмами в одном месте.
          </p>
          <div style={s.heroCtas}>
            <Link to="/doctors" style={s.ctaPrimary}>Найти врача</Link>
            {!user && <Link to="/register" style={s.ctaSecondary}>Создать аккаунт</Link>}
            {user  && <Link to="/ai"       style={s.ctaSecondary}>ИИ-ассистент</Link>}
          </div>

          {/* hero feature pills */}
          <div style={s.heroPills}>
            {HERO_FEATURES.map((f, i) => (
              <React.Fragment key={f.text}>
                {i > 0 && <span style={s.pillDivider}>·</span>}
                <span style={s.pill}>
                  <span>{f.icon}</span>
                  <span>{f.text}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={s.heroDecor}>
          <div style={s.heroEmoji}>🩺</div>
        </div>
      </section>

      {/* ── Specialties grid ─────────────────────────────────── */}
      <section style={s.section}>
        <div style={s.sectionHead}>
          <h2 style={s.sectionTitle}>Найдите своего специалиста</h2>
          <p style={s.sectionSub}>Нажмите на карточку — откроется список врачей этой специальности</p>
        </div>
        <div style={s.specGrid}>
          {SPECIALTY_CARDS.map((card) => (
            <button key={card.label} style={s.specCard} onClick={() => handleSpecialty(card)}>
              <span style={s.specIcon}>{card.icon}</span>
              <span style={s.specLabel}>{card.label}</span>
              <span style={s.specArrow}>→</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Why MedAssist ────────────────────────────────────── */}
      <section style={s.section}>
        <div style={s.sectionHead}>
          <h2 style={s.sectionTitle}>Почему МедАссист?</h2>
          <p style={s.sectionSub}>Мы делаем медицину доступнее и удобнее для каждого</p>
        </div>
        <div style={s.whyGrid}>
          {WHY_ITEMS.map(({ icon, title, desc }) => (
            <div key={title} style={s.whyCard}>
              <div style={s.whyIconWrap}>{icon}</div>
              <h3 style={s.whyTitle}>{title}</h3>
              <p style={s.whyDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────────── */}
      <section style={s.section}>
        <div style={s.sectionHead}>
          <h2 style={s.sectionTitle}>Отзывы пациентов</h2>
          <p style={s.sectionSub}>Нам доверяют тысячи пациентов по всему Казахстану</p>
        </div>
        <div style={s.reviewsGrid}>
          {REVIEWS.map((r) => (
            <div key={r.name} style={s.reviewCard}>
              <div style={s.reviewTop}>
                <div style={s.reviewAvatar}>{r.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={s.reviewName}>{r.name}</div>
                  <div style={s.reviewDate}>{r.date}</div>
                </div>
                <Stars count={r.rating} />
              </div>
              <p style={s.reviewText}>«{r.text}»</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live stats ───────────────────────────────────────── */}
      <section style={s.statsRow}>
        {[
          { icon: '👨‍⚕️', val: stats?.doctors,      label: 'врачей' },
          { icon: '🏥',  val: stats?.specialties,  label: 'специальностей' },
          { icon: '📋',  val: stats?.appointments, label: 'записей в системе' },
        ].map(({ icon, val, label }) => (
          <div key={label} style={s.statCard}>
            <span style={s.statIcon}>{icon}</span>
            <div style={s.statVal}>{val ?? '—'}</div>
            <div style={s.statLabel}>{label}</div>
          </div>
        ))}
      </section>

      {/* ── CTA banner ───────────────────────────────────────── */}
      <section style={s.ctaBanner}>
        <h2 style={s.ctaBannerTitle}>Готовы записаться к врачу?</h2>
        <p style={s.ctaBannerSub}>Более 15 специалистов ждут вас — выберите удобное время прямо сейчас</p>
        <Link to="/doctors" style={s.ctaBannerBtn}>Найти врача →</Link>
      </section>

    </div>
  );
}

const s = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '0 32px 80px' },

  /* hero */
  hero: {
    background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)',
    borderRadius: 20, margin: '32px 0',
    padding: '56px 48px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    overflow: 'hidden',
  },
  heroInner: { flex: 1, maxWidth: 600 },
  heroTitle: { color: '#fff', fontSize: 44, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 },
  heroSub: { color: 'rgba(255,255,255,0.88)', fontSize: 17, lineHeight: 1.6, marginBottom: 32 },
  heroCtas: { display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 },
  ctaPrimary: { background: '#fff', color: '#0F6E56', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' },
  ctaSecondary: { background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.5)', color: '#fff', padding: '13px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15 },

  heroPills: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  pill: { display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500 },
  pillDivider: { color: 'rgba(255,255,255,0.4)', fontSize: 18, lineHeight: 1 },

  heroDecor: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 160, height: 160, background: 'rgba(255,255,255,0.12)', borderRadius: '50%', flexShrink: 0 },
  heroEmoji: { fontSize: 80 },

  /* section wrapper */
  section: { marginBottom: 64 },
  sectionHead: { textAlign: 'center', marginBottom: 36 },
  sectionTitle: { fontSize: 28, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 },
  sectionSub: { color: '#6b7280', fontSize: 15 },

  /* specialties grid */
  specGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  specCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '20px 22px',
    background: '#fff', border: '1.5px solid #e5e7eb',
    borderRadius: 14, cursor: 'pointer',
    textAlign: 'left',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.2s',
  },
  specIcon: { fontSize: 32, flexShrink: 0 },
  specLabel: { flex: 1, fontSize: 16, fontWeight: 700, color: '#1a1a1a' },
  specArrow: { color: '#1D9E75', fontSize: 18, fontWeight: 700, flexShrink: 0 },

  /* why */
  whyGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 },
  whyCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 26, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  whyIconWrap: { fontSize: 36, marginBottom: 14 },
  whyTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 },
  whyDesc: { fontSize: 13, color: '#6b7280', lineHeight: 1.6 },

  /* reviews */
  reviewsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
  reviewCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  reviewTop: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 },
  reviewAvatar: { width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#1D9E75,#0F6E56)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, flexShrink: 0 },
  reviewName: { fontWeight: 700, fontSize: 14, color: '#1a1a1a' },
  reviewDate: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  reviewText: { fontSize: 13, color: '#4b5563', lineHeight: 1.7, fontStyle: 'italic' },

  /* live stats */
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 64 },
  statCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '28px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(29,158,117,0.08)' },
  statIcon: { fontSize: 32, display: 'block', marginBottom: 10 },
  statVal: { fontSize: 44, fontWeight: 800, color: '#1D9E75', lineHeight: 1 },
  statLabel: { color: '#6b7280', fontSize: 13, marginTop: 6 },

  /* cta banner */
  ctaBanner: { background: 'linear-gradient(135deg,#1D9E75,#0F6E56)', borderRadius: 20, padding: '52px 48px', textAlign: 'center' },
  ctaBannerTitle: { color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 12 },
  ctaBannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 28 },
  ctaBannerBtn: { display: 'inline-block', background: '#fff', color: '#0F6E56', padding: '13px 32px', borderRadius: 12, fontWeight: 700, fontSize: 15, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' },
};
