import React, { useEffect, useState, useCallback } from 'react';
import { appointmentsApi, patientsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS = {
  pending:   { label: 'Ожидание',    bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
  confirmed: { label: 'Подтверждён', bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
  completed: { label: 'Завершён',    bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  cancelled: { label: 'Отменён',     bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
};

/* ── Medical card modal ──────────────────────────────────────── */
function MedCardModal({ patientId, patientName, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    patientsApi.getDoctorView(patientId)
      .then(r => setProfile(r.data))
      .catch(e => setError(e.response?.data?.detail || 'Медкарта не заполнена'))
      .finally(() => setLoading(false));
  }, [patientId]);

  const Badges = ({ text, bg, color, border }) => {
    if (!text || text.trim() === '' || text.toLowerCase() === 'нет')
      return <span style={{ color: '#9ca3af', fontSize: 13 }}>Не указано</span>;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {text.split(/[,;]+/).map(s => s.trim()).filter(Boolean).map((item, i) => (
          <span key={i} style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 999, padding: '3px 12px', fontSize: 13, fontWeight: 600 }}>{item}</span>
        ))}
      </div>
    );
  };

  return (
    <div style={mc.overlay} onClick={onClose}>
      <div style={mc.box} onClick={e => e.stopPropagation()}>
        <div style={mc.header}>
          <div style={mc.patientRow}>
            <div style={mc.avatar}>{patientName.charAt(0)}</div>
            <div>
              <div style={mc.patientName}>{patientName}</div>
              <div style={mc.patientSub}>Медицинская карта</div>
            </div>
          </div>
          <button style={mc.closeBtn} onClick={onClose}>✕</button>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>Загрузка…</div>}
        {error && <div style={mc.errorBox}>{error}</div>}

        {profile && (
          <>
            {/* vital pills */}
            <div style={mc.vitals}>
              {profile.date_of_birth && (() => {
                const d = new Date(profile.date_of_birth + 'T12:00:00');
                const today = new Date();
                let age = today.getFullYear() - d.getFullYear();
                if ((today.getMonth() * 100 + today.getDate()) < (d.getMonth() * 100 + d.getDate())) age--;
                return <span style={mc.vPill}>🎂 {age} лет</span>;
              })()}
              {profile.blood_type && <span style={{ ...mc.vPill, background: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5', fontWeight: 700 }}>🩸 {profile.blood_type}</span>}
            </div>

            {/* allergy warning */}
            {profile.allergies && profile.allergies.toLowerCase() !== 'нет' && profile.allergies.trim() && (
              <div style={mc.allergyWarn}>
                ⚠️ <strong>АЛЛЕРГИЯ:</strong> {profile.allergies}
              </div>
            )}

            <div style={mc.sections}>
              {[
                { icon: '🏥', title: 'Хронические заболевания', text: profile.chronic_diseases, bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
                { icon: '💊', title: 'Текущие препараты',       text: profile.current_medications, bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
                { icon: '📋', title: 'История болезней',         text: profile.previous_diagnoses, plain: true },
              ].map(({ icon, title, text, bg, color, border, plain }) => (
                <div key={title} style={mc.section}>
                  <div style={mc.sTitle}>{icon} {title}</div>
                  {plain
                    ? <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{text || <span style={{ color: '#9ca3af' }}>Не указано</span>}</p>
                    : <Badges text={text} bg={bg} color={color} border={border} />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const mc = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  box: { background: '#fff', borderRadius: 20, padding: '28px 32px', width: '90%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  patientRow: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0 },
  patientName: { fontWeight: 700, fontSize: 16, color: '#1a1a1a' },
  patientSub: { fontSize: 12, color: '#9ca3af' },
  closeBtn: { background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16, color: '#6b7280' },
  vitals: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  vPill: { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 999, padding: '4px 14px', fontSize: 13 },
  allergyWarn: { background: '#fff7ed', border: '1.5px solid #fb923c', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#c2410c', fontWeight: 600, marginBottom: 16, lineHeight: 1.5 },
  sections: { display: 'flex', flexDirection: 'column', gap: 14 },
  section: { background: '#f9fafb', borderRadius: 12, padding: '14px 16px' },
  sTitle: { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 },
  errorBox: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: 14 },
};

function StatusBadge({ status }) {
  const cfg = STATUS[status] ?? { label: status, bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' };
  return (
    <span style={{ ...s.badge, background: cfg.bg, color: cfg.color }}>
      <span style={{ ...s.dot, background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medCard, setMedCard] = useState(null); // { patientId, patientName }
  const isDoctor = user?.role === 'doctor';

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentsApi.my();
      setAppointments(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (id, status) => {
    await appointmentsApi.update(id, status);
    fetchAll();
  };

  if (loading) return <div style={s.loading}>Загрузка…</div>;

  const upcoming = appointments.filter(a => ['pending','confirmed'].includes(a.status));
  const past     = appointments.filter(a => ['completed','cancelled'].includes(a.status));

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>{isDoctor ? 'Мои пациенты' : 'Мои записи'}</h2>
        <p style={s.sub}>
          {isDoctor
            ? 'Управляйте записями своих пациентов'
            : 'История и предстоящие визиты к врачам'}
        </p>
      </div>

      {medCard && <MedCardModal patientId={medCard.patientId} patientName={medCard.patientName} onClose={() => setMedCard(null)} />}

      {appointments.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>{isDoctor ? '📋' : '🗓️'}</div>
          <h3 style={{ marginBottom: 8 }}>Записей пока нет</h3>
          <p style={{ color: '#9ca3af' }}>
            {isDoctor ? 'К вам ещё никто не записался.' : 'Запишитесь к врачу, чтобы увидеть визиты здесь.'}
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <Section title="Предстоящие" appointments={upcoming} isDoctor={isDoctor} onUpdate={updateStatus} onMedCard={setMedCard} />
          )}
          {past.length > 0 && (
            <Section title="Прошедшие" appointments={past} isDoctor={isDoctor} onUpdate={updateStatus} onMedCard={setMedCard} dimmed />
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, appointments, isDoctor, onUpdate, onMedCard, dimmed }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h3 style={s.sectionTitle}>{title} <span style={s.sectionCount}>{appointments.length}</span></h3>
      <div style={s.list}>
        {appointments.map(a => (
          <AppointmentCard key={a.id} a={a} isDoctor={isDoctor} onUpdate={onUpdate} onMedCard={onMedCard} dimmed={dimmed} />
        ))}
      </div>
    </div>
  );
}

function AppointmentCard({ a, isDoctor, onUpdate, onMedCard, dimmed }) {
  const dt = new Date(a.start_time + (a.start_time.includes('T') && !a.start_time.includes('+') ? '' : ''));
  const displayDate = new Date(a.start_time.split('T')[0] + 'T12:00:00')
    .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const displayTime = a.start_time.split('T')[1]?.slice(0, 5) ?? '—';

  const personName    = isDoctor ? (a.patient_name ?? `Пациент #${a.patient_id}`) : (a.doctor_name ?? `Врач #${a.doctor_id}`);
  const personInitial = personName.charAt(0);
  const personSub     = isDoctor ? 'Пациент' : a.doctor_specialty;

  return (
    <div style={{ ...s.card, opacity: dimmed ? 0.75 : 1 }}>
      <div style={s.cardLeft}>
        {/* date block */}
        <div style={s.dateBlock}>
          <div style={s.dateDay}>{new Date(a.start_time.split('T')[0] + 'T12:00:00').getDate()}</div>
          <div style={s.dateMon}>
            {new Date(a.start_time.split('T')[0] + 'T12:00:00')
              .toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}
          </div>
        </div>

        {/* person */}
        <div style={s.avatarWrap}>
          <div style={{ ...s.avatar, background: isDoctor ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'linear-gradient(135deg,#1D9E75,#0F6E56)' }}>
            {personInitial}
          </div>
        </div>

        <div style={s.cardInfo}>
          <div style={s.personName}>{personName}</div>
          {personSub && <div style={s.personSub}>{personSub}</div>}
          <div style={s.timeRow}>
            <span style={s.timeIcon}>🕐</span>
            <span style={s.timeText}>{displayTime}</span>
            <span style={s.dateFull}>{displayDate}</span>
          </div>
          {a.notes && <div style={s.notes}>💬 {a.notes}</div>}
        </div>
      </div>

      <div style={s.cardRight}>
        <StatusBadge status={a.status} />

        <div style={s.actions}>
          {isDoctor && (
            <button style={s.btnMedCard} onClick={() => onMedCard({ patientId: a.patient_id, patientName: a.patient_name ?? `Пациент #${a.patient_id}` })}>
              📋 Медкарта
            </button>
          )}
          {isDoctor && a.status === 'pending' && (
            <>
              <button style={s.btnConfirm} onClick={() => onUpdate(a.id, 'confirmed')}>Подтвердить</button>
              <button style={s.btnCancel}  onClick={() => onUpdate(a.id, 'cancelled')}>Отменить</button>
            </>
          )}
          {isDoctor && a.status === 'confirmed' && (
            <>
              <button style={s.btnComplete} onClick={() => onUpdate(a.id, 'completed')}>Завершить</button>
              <button style={s.btnCancel}   onClick={() => onUpdate(a.id, 'cancelled')}>Отменить</button>
            </>
          )}
          {!isDoctor && ['pending','confirmed'].includes(a.status) && (
            <button style={s.btnCancel} onClick={() => onUpdate(a.id, 'cancelled')}>Отменить</button>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: 820, margin: '0 auto', padding: '32px 32px 64px' },
  loading: { textAlign: 'center', padding: 64, color: '#6b7280', fontSize: 16 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, color: '#1a1a1a', marginBottom: 6 },
  sub: { color: '#6b7280', fontSize: 15 },
  empty: { textAlign: 'center', padding: '80px 0', color: '#6b7280' },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
  sectionCount: { background: '#f3f4f6', color: '#6b7280', borderRadius: 999, padding: '1px 10px', fontSize: 13, fontWeight: 600 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },

  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s' },
  cardLeft: { display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 },
  dateBlock: { textAlign: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '8px 12px', minWidth: 48, flexShrink: 0 },
  dateDay: { fontSize: 22, fontWeight: 800, color: '#1D9E75', lineHeight: 1 },
  dateMon: { fontSize: 11, color: '#6b7280', textTransform: 'capitalize', marginTop: 2 },
  avatarWrap: { flexShrink: 0 },
  avatar: { width: 44, height: 44, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800 },
  cardInfo: { flex: 1, minWidth: 0 },
  personName: { fontWeight: 700, fontSize: 15, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  personSub: { fontSize: 12, color: '#1D9E75', fontWeight: 600, marginBottom: 4 },
  timeRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' },
  timeIcon: { fontSize: 13 },
  timeText: { fontWeight: 700, color: '#374151' },
  dateFull: { color: '#9ca3af' },
  notes: { fontSize: 12, color: '#9ca3af', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 },

  cardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 },
  dot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  actions: { display: 'flex', gap: 8 },

  btnMedCard:  { padding: '6px 14px', background: '#f0fdf4', color: '#1D9E75', border: '1.5px solid #a7e5ce', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  btnConfirm:  { padding: '7px 16px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnComplete: { padding: '7px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnCancel:   { padding: '7px 14px', background: '#fff', color: '#ef4444', border: '1.5px solid #fca5a5', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
};
