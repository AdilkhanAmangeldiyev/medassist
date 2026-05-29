import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { doctorsApi } from '../services/api';

const SPECIALTIES = [
  { value: '', label: 'Все специальности' },
  { value: 'Кардиолог',  label: '❤️ Кардиолог' },
  { value: 'Невролог',   label: '🧠 Невролог' },
  { value: 'Терапевт',   label: '🩺 Терапевт' },
  { value: 'Педиатр',    label: '👶 Педиатр' },
  { value: 'Хирург',     label: '🔪 Хирург' },
];

const SCHEDULE_LABELS = {
  '08:00': '🌅 Утренний (08:00–14:00)',
  '10:00': '☀️ Дневной (10:00–17:00)',
  '14:00': '🌆 Вечерний (14:00–20:00)',
  '09:00': '📅 Выходные (09:00–13:00)',
};

function mockRating(id)  { return (4.5 + (id % 6) * 0.1).toFixed(1); }
function mockReviews(id) { return 20 + (id * 13 + 3) % 61; }

function Stars({ rating }) {
  const full = Math.floor(rating);
  return (
    <span style={{ color: '#f59e0b', fontSize: 13 }}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}

function DoctorCard({ doc }) {
  const [hovered, setHovered] = useState(false);
  const rating  = parseFloat(mockRating(doc.id));
  const reviews = mockReviews(doc.id);
  const scheduleLabel = SCHEDULE_LABELS[doc.doctor_profile?.work_start] ?? '';

  return (
    <div
      style={{ ...s.card, ...(hovered ? s.cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={s.cardTop}>
        <div style={s.avatar}>{doc.name.charAt(0)}</div>
        <div style={s.cardMeta}>
          <div style={s.specBadge}>{doc.doctor_profile?.specialty}</div>
          {scheduleLabel && <div style={s.schedulePill}>{scheduleLabel}</div>}
        </div>
      </div>

      <h3 style={s.name}>{doc.name}</h3>

      <div style={s.ratingRow}>
        <Stars rating={rating} />
        <span style={s.ratingNum}>{rating}</span>
        <span style={s.ratingCount}>({reviews} отзывов)</span>
      </div>

      <p style={s.bio}>{doc.doctor_profile?.bio}</p>

      <Link to={`/doctors/${doc.id}`} style={s.btn}>
        Записаться →
      </Link>
    </div>
  );
}

export default function DoctorsPage() {
  const location = useLocation();
  const [doctors, setDoctors]     = useState([]);
  const [specialty, setSpecialty] = useState(location.state?.specialty ?? '');
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    doctorsApi.list(specialty || undefined)
      .then((r) => setDoctors(r.data))
      .finally(() => setLoading(false));
  }, [specialty]);

  const filtered = useMemo(() => {
    if (!search.trim()) return doctors;
    const q = search.toLowerCase();
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.doctor_profile?.specialty ?? '').toLowerCase().includes(q)
    );
  }, [doctors, search]);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Найти врача</h2>
        <p style={s.sub}>Выберите специальность или введите имя врача</p>
      </div>

      {/* filters */}
      <div style={s.filters}>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            type="text"
            placeholder="Поиск по имени или специальности…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          style={s.select}
          value={specialty}
          onChange={(e) => { setSpecialty(e.target.value); setSearch(''); }}
        >
          {SPECIALTIES.map((sp) => (
            <option key={sp.value} value={sp.value}>{sp.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={s.loading}>Загрузка врачей…</div>
      ) : (
        <>
          <p style={s.count}>
            Найдено: <strong>{filtered.length}</strong> врач{
              filtered.length === 1 ? '' : filtered.length < 5 ? 'а' : 'ей'
            }
          </p>
          <div style={s.grid}>
            {filtered.map((doc) => <DoctorCard key={doc.id} doc={doc} />)}
            {filtered.length === 0 && (
              <div style={s.empty}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p>Врачи не найдены. Попробуйте изменить запрос.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '32px 32px 64px' },
  header: { marginBottom: 28 },
  title: { fontSize: 28, color: '#1a1a1a', marginBottom: 6 },
  sub: { color: '#6b7280', fontSize: 15 },

  filters: { display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  searchWrap: {
    flex: 1, minWidth: 240,
    position: 'relative', display: 'flex', alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute', left: 14, fontSize: 16, pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', padding: '11px 14px 11px 40px',
    borderRadius: 10, border: '1.5px solid #e5e7eb',
    fontSize: 14,
  },
  select: {
    padding: '11px 16px', borderRadius: 10,
    border: '1.5px solid #e5e7eb',
    fontSize: 14, background: '#fff', cursor: 'pointer',
    minWidth: 200,
  },
  count: { color: '#6b7280', fontSize: 13, margin: '8px 0 20px' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },

  card: {
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #e5e7eb',
    padding: 24,
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  cardHover: {
    boxShadow: '0 8px 24px rgba(29,158,117,0.15)',
    transform: 'translateY(-3px)',
  },
  cardTop: { display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 },
  avatar: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, fontWeight: 800, flexShrink: 0,
  },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: 6 },
  specBadge: {
    background: '#E6F7F2', color: '#0F6E56',
    borderRadius: 999, padding: '3px 12px',
    fontSize: 12, fontWeight: 700,
    display: 'inline-block',
  },
  schedulePill: {
    background: '#f3f4f6', color: '#374151',
    borderRadius: 999, padding: '2px 10px',
    fontSize: 11,
  },
  name: { fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 },
  ratingNum: { fontSize: 13, fontWeight: 700, color: '#374151' },
  ratingCount: { fontSize: 11, color: '#9ca3af' },
  bio: { fontSize: 13, color: '#6b7280', lineHeight: 1.5, flexGrow: 1, marginBottom: 16 },
  btn: {
    display: 'block', textAlign: 'center',
    background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
    color: '#fff', borderRadius: 10,
    padding: '10px 20px', fontWeight: 600, fontSize: 14,
    transition: 'opacity 0.2s',
    marginTop: 'auto',
  },
  loading: { textAlign: 'center', color: '#6b7280', padding: '64px 0', fontSize: 16 },
  empty: { gridColumn: '1/-1', textAlign: 'center', color: '#6b7280', padding: '64px 0' },
};
