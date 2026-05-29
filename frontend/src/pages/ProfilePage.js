import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientsApi } from '../services/api';

const BLOOD_TYPES = ['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob + 'T12:00:00');
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  if ((today.getMonth() * 100 + today.getDate()) < (d.getMonth() * 100 + d.getDate())) age--;
  return age;
}

function formatDate(dob) {
  if (!dob) return '—';
  const d = new Date(dob + 'T12:00:00');
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Badges({ text, color, emptyLabel = 'Не указано' }) {
  if (!text || text.trim() === '' || text.toLowerCase() === 'нет') {
    return <span style={{ color: '#9ca3af', fontSize: 13 }}>{text || emptyLabel}</span>;
  }
  const items = text.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map((item, i) => (
        <span key={i} style={{ ...s.badge, background: color.bg, color: color.text, border: `1px solid ${color.border}` }}>
          {item}
        </span>
      ))}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionHeader}>
        <span style={s.sectionIcon}>{icon}</span>
        <h3 style={s.sectionTitle}>{title}</h3>
      </div>
      <div style={s.sectionBody}>{children}</div>
    </div>
  );
}

/* ── Edit modal ─────────────────────────────────────────────── */
function EditModal({ profile, onSave, onClose }) {
  const [form, setForm] = useState({ ...profile });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div style={em.overlay} onClick={onClose}>
      <div style={em.box} onClick={e => e.stopPropagation()}>
        <div style={em.header}>
          <h3 style={em.title}>Редактировать медкарту</h3>
          <button style={em.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} style={em.form}>
          <div style={em.row}>
            <div style={em.field}>
              <label style={em.label}>Дата рождения</label>
              <input type="date" style={em.input} value={form.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)} />
            </div>
            <div style={em.field}>
              <label style={em.label}>Группа крови</label>
              <select style={em.input} value={form.blood_type || ''} onChange={e => set('blood_type', e.target.value)}>
                {BLOOD_TYPES.map(t => <option key={t} value={t}>{t || '— не указана —'}</option>)}
              </select>
            </div>
          </div>
          {[
            { key: 'chronic_diseases', label: 'Хронические заболевания', placeholder: 'через запятую' },
            { key: 'allergies', label: 'Аллергии', placeholder: 'через запятую, или "Нет"' },
            { key: 'current_medications', label: 'Текущие препараты', placeholder: 'название, дозировка' },
            { key: 'previous_diagnoses', label: 'История болезней', placeholder: 'диагнозы и даты' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={em.field}>
              <label style={em.label}>{label}</label>
              <textarea style={em.textarea} placeholder={placeholder} value={form[key] || ''} onChange={e => set(key, e.target.value)} rows={2} />
            </div>
          ))}
          <div style={em.actions}>
            <button type="submit" style={em.saveBtn} disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</button>
            <button type="button" style={em.cancelBtn} onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientsApi.getProfile()
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (data) => {
    const { data: updated } = await patientsApi.updateProfile(data);
    setProfile(updated);
  };

  if (loading) return <div style={s.loading}>Загрузка…</div>;

  const age = calcAge(profile?.date_of_birth);
  const hasAllergies = profile?.allergies && profile.allergies.toLowerCase() !== 'нет' && profile.allergies.trim() !== '';

  return (
    <div style={s.page}>
      {editing && <EditModal profile={profile} onSave={save} onClose={() => setEditing(false)} />}

      {/* header card */}
      <div style={s.headerCard}>
        <div style={s.avatar}>{user?.name?.charAt(0)}</div>
        <div style={s.headerInfo}>
          <h2 style={s.name}>{user?.name}</h2>
          <div style={s.headerMeta}>
            {age && <span style={s.metaPill}>🎂 {age} лет</span>}
            {profile?.date_of_birth && <span style={s.metaPill}>📅 {formatDate(profile.date_of_birth)}</span>}
            {profile?.blood_type && (
              <span style={{ ...s.metaPill, background: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5', fontWeight: 700 }}>
                🩸 {profile.blood_type}
              </span>
            )}
          </div>
        </div>
        <button style={s.editBtn} onClick={() => setEditing(true)}>✏️ Редактировать</button>
      </div>

      {/* allergy warning */}
      {hasAllergies && (
        <div style={s.allergyBanner}>
          ⚠️ <strong>Аллергия:</strong> {profile.allergies}
        </div>
      )}

      {/* sections */}
      <div style={s.grid}>
        <Section icon="🏥" title="Хронические заболевания">
          <Badges text={profile?.chronic_diseases} color={{ bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' }} emptyLabel="Не заполнено" />
        </Section>

        <Section icon="⚠️" title="Аллергии">
          <Badges text={profile?.allergies} color={{ bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' }} emptyLabel="Не заполнено" />
        </Section>

        <Section icon="💊" title="Текущие препараты">
          <Badges text={profile?.current_medications} color={{ bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }} emptyLabel="Не заполнено" />
        </Section>

        <Section icon="📋" title="История болезней">
          {profile?.previous_diagnoses
            ? <p style={s.textContent}>{profile.previous_diagnoses}</p>
            : <span style={{ color: '#9ca3af', fontSize: 13 }}>Не заполнено</span>}
        </Section>
      </div>

      {!profile?.date_of_birth && !profile?.blood_type && (
        <div style={s.emptyHint}>
          <span style={{ fontSize: 32 }}>📝</span>
          <p>Медкарта не заполнена. Нажмите <strong>«Редактировать»</strong>, чтобы добавить данные — ИИ-ассистент будет учитывать их при рекомендациях.</p>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { maxWidth: 860, margin: '0 auto', padding: '32px 32px 80px' },
  loading: { textAlign: 'center', padding: 64, color: '#6b7280' },

  headerCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  avatar: { width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#1D9E75,#0F6E56)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, flexShrink: 0 },
  headerInfo: { flex: 1 },
  name: { fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 },
  headerMeta: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  metaPill: { background: '#f3f4f6', color: '#374151', borderRadius: 999, padding: '4px 14px', fontSize: 13, border: '1px solid #e5e7eb' },
  editBtn: { padding: '9px 20px', background: 'linear-gradient(135deg,#1D9E75,#0F6E56)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14, flexShrink: 0 },

  allergyBanner: { background: '#fff7ed', border: '1.5px solid #fb923c', borderRadius: 12, padding: '12px 18px', fontSize: 14, color: '#c2410c', marginBottom: 20, lineHeight: 1.5 },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  section: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a1a' },
  sectionBody: {},
  badge: { borderRadius: 999, padding: '4px 14px', fontSize: 13, fontWeight: 600 },
  textContent: { fontSize: 14, color: '#374151', lineHeight: 1.7 },

  emptyHint: { background: '#f0fdf4', border: '1px solid #a7e5ce', borderRadius: 16, padding: '24px 28px', textAlign: 'center', marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#374151', fontSize: 14, lineHeight: 1.6 },
};

// edit modal styles
const em = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  box: { background: '#fff', borderRadius: 20, padding: '32px 36px', width: '90%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 800, color: '#1a1a1a' },
  closeBtn: { background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16, color: '#6b7280' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14 },
  textarea: { padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' },
  actions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
  saveBtn: { padding: '10px 28px', background: 'linear-gradient(135deg,#1D9E75,#0F6E56)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  cancelBtn: { padding: '10px 22px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
};
