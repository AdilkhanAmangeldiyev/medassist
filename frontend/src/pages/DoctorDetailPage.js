import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doctorsApi, appointmentsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function toDateStr(d) { return d.toISOString().split('T')[0]; }
function mockRating(id)  { return (4.5 + (id % 6) * 0.1).toFixed(1); }
function mockReviews(id) { return 20 + (id * 13 + 3) % 61; }

function parseWorkDays(raw) {
  if (!raw) return new Set([1,2,3,4,5]);
  return new Set(raw.split(',').map(Number));
}
function isoWeekday(dateStr) {
  const d = new Date(dateStr + 'T12:00:00').getDay();
  return d === 0 ? 7 : d;
}
function findNextWorkDay(workDays) {
  const d = new Date();
  for (let i = 0; i < 14; i++) {
    const s = toDateStr(d);
    if (workDays.has(isoWeekday(s))) return s;
    d.setDate(d.getDate() + 1);
  }
  return toDateStr(new Date());
}
const DAY_LABELS = {
  '1,2,3,4,5':     'Понедельник – Пятница',
  '6,7':           'Суббота – Воскресенье',
  '1,2,3,4,5,6,7': 'Ежедневно',
};
function workDaysLabel(raw) {
  if (!raw) return 'Пн – Пт';
  return DAY_LABELS[raw] ?? raw.split(',').map(n => ['','Пн','Вт','Ср','Чт','Пт','Сб','Вс'][+n]).join(', ');
}

function Stars({ rating }) {
  const full = Math.floor(rating);
  return <span style={{ color: '#f59e0b', fontSize: 16 }}>{'★'.repeat(full)}{'☆'.repeat(5-full)}</span>;
}

/* ── Success modal ─────────────────────────────────────────── */
function SuccessModal({ booking, onClose }) {
  if (!booking) return null;
  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.box} onClick={e => e.stopPropagation()}>
        {/* big green checkmark */}
        <div style={m.checkWrap}>
          <div style={m.check}>✓</div>
        </div>
        <h2 style={m.title}>Вы успешно записаны!</h2>
        <p style={m.sub}>Ждём вас на приёме. Не забудьте взять документы.</p>

        <div style={m.rows}>
          {[
            ['👨‍⚕️ Врач',         booking.doctorName],
            ['🩺 Специальность', booking.specialty],
            ['📅 Дата',          booking.date],
            ['🕐 Время',         booking.time],
          ].map(([l, v]) => (
            <div key={l} style={m.row}>
              <span style={m.lbl}>{l}</span>
              <span style={m.val}>{v}</span>
            </div>
          ))}
        </div>

        <div style={m.btns}>
          <Link to="/appointments" style={m.btnGreen}>Мои записи</Link>
          <Link to="/" style={m.btnOutline}>На главную</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function DoctorDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor,   setDoctor]   = useState(null);
  const [date,     setDate]     = useState(toDateStr(new Date()));
  const [slots,    setSlots]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes,    setNotes]    = useState('');
  const [error,    setError]    = useState('');
  const [booking,  setBooking]  = useState(null);

  useEffect(() => { doctorsApi.get(id).then(r => setDoctor(r.data)); }, [id]);

  useEffect(() => {
    if (!doctor) return;
    const wd = parseWorkDays(doctor.doctor_profile?.work_days);
    setDate(findNextWorkDay(wd));
  }, [doctor]);

  const workDays = useMemo(() => parseWorkDays(doctor?.doctor_profile?.work_days), [doctor]);
  const selectedIsWorkDay = doctor ? workDays.has(isoWeekday(date)) : true;

  useEffect(() => {
    if (!date || !selectedIsWorkDay) { setSlots([]); return; }
    doctorsApi.slots(id, date).then(r => setSlots(r.data));
  }, [id, date, selectedIsWorkDay]);

  const visibleSlots = useMemo(() => {
    const isToday = date === toDateStr(new Date());
    if (!isToday) return slots;
    const now = new Date();
    const nowHHMM = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    return slots.filter(s => (s.start.split('T')[1] ?? '') > nowHHMM);
  }, [slots, date]);

  const book = async () => {
    if (!user) { navigate('/login'); return; }
    if (!selected) return;
    setError('');
    try {
      await appointmentsApi.book({ doctor_id: parseInt(id), start_time: selected.start, notes });
      const slotTime = selected.start.split('T')[1] ?? '';
      const dateFormatted = new Date(date + 'T12:00:00')
        .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      setBooking({ doctorName: doctor.name, specialty: doctor.doctor_profile?.specialty, date: dateFormatted, time: slotTime });
      setSelected(null); setNotes('');
      doctorsApi.slots(id, date).then(r => setSlots(r.data));
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при записи. Попробуйте снова.');
    }
  };

  if (!doctor) return <div style={s.loading}>Загрузка…</div>;

  const rating  = parseFloat(mockRating(doctor.id));
  const reviews = mockReviews(doctor.id);
  const profile = doctor.doctor_profile;

  return (
    <div style={s.page}>
      <SuccessModal booking={booking} onClose={() => setBooking(null)} />

      {/* ── Profile card ───────────────────────────────────── */}
      <div style={s.profileCard}>
        <div style={s.avatarWrap}>
          <div style={s.avatar}>{doctor.name.charAt(0)}</div>
        </div>
        <div style={s.profileInfo}>
          <div style={s.specBadge}>{profile?.specialty}</div>
          <h2 style={s.docName}>{doctor.name}</h2>
          <div style={s.ratingRow}>
            <Stars rating={rating} />
            <span style={s.ratingNum}>{rating}</span>
            <span style={s.ratingCnt}>({reviews} отзывов)</span>
          </div>
          <p style={s.bio}>{profile?.bio}</p>
          <div style={s.infoRow}>
            <span style={s.infoPill}>🕐 {profile?.work_start} – {profile?.work_end}</span>
            <span style={s.infoPill}>📅 {workDaysLabel(profile?.work_days)}</span>
          </div>
        </div>
      </div>

      {/* ── Booking section ────────────────────────────────── */}
      <div style={s.bookSection}>
        <h3 style={s.bookTitle}>Записаться на приём</h3>

        <div style={s.dateRow}>
          <label style={s.dateLabel}>Выберите дату:</label>
          <input
            type="date" value={date}
            min={toDateStr(new Date())}
            onChange={e => { setDate(e.target.value); setSelected(null); setError(''); }}
            style={s.dateInput}
          />
        </div>

        {!selectedIsWorkDay ? (
          <div style={s.dayWarning}>
            ⚠️ Врач не работает в этот день. Рабочие дни: <strong>{workDaysLabel(profile?.work_days)}</strong>
          </div>
        ) : (
          <div style={s.slotGrid}>
            {visibleSlots.map(slot => (
              <button
                key={slot.start}
                disabled={!slot.available}
                onClick={() => setSelected(slot)}
                style={{
                  ...s.slot,
                  ...(slot.available ? {} : s.slotBusy),
                  ...(selected?.start === slot.start ? s.slotSelected : {}),
                }}
              >
                {slot.start.split('T')[1]}
              </button>
            ))}
            {visibleSlots.length === 0 && (
              <p style={s.noSlots}>
                {slots.length > 0 ? 'Все слоты на сегодня уже прошли.' : 'Нет доступных слотов.'}
              </p>
            )}
          </div>
        )}

        {selected && user?.role === 'patient' && (
          <div style={s.confirmBox}>
            <div style={s.confirmInfo}>
              <span style={s.confirmIcon}>📅</span>
              <div>
                <div style={s.confirmDate}>{new Date(date + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</div>
                <div style={s.confirmTime}>{selected.start.split('T')[1]}</div>
              </div>
            </div>
            <textarea
              style={s.textarea}
              placeholder="Примечания к записи (необязательно)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <button style={s.bookBtn} onClick={book}>Подтвердить запись</button>
          </div>
        )}
        {selected && !user && (
          <p style={{ marginTop: 16, color: '#6b7280' }}>
            Пожалуйста, <Link to="/login">войдите</Link>, чтобы записаться.
          </p>
        )}
        {error && <div style={s.errorBox}>{error}</div>}
      </div>
    </div>
  );
}

/* modal */
const m = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)' },
  box: { background:'#fff', borderRadius:24, padding:'44px 40px', maxWidth:440, width:'90%', textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,0.18)' },
  checkWrap: { display:'flex', justifyContent:'center', marginBottom:20 },
  check: { width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', color:'#fff', fontSize:40, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(29,158,117,0.35)' },
  title: { fontSize:24, fontWeight:800, marginBottom:6, color:'#1a1a1a' },
  sub: { fontSize:14, color:'#9ca3af', marginBottom:24 },
  rows: { textAlign:'left', marginBottom:28, background:'#f9fafb', borderRadius:14, overflow:'hidden' },
  row: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid #f3f4f6' },
  lbl: { color:'#6b7280', fontSize:13 },
  val: { fontWeight:700, fontSize:14, color:'#1a1a1a', textAlign:'right', maxWidth:'60%' },
  btns: { display:'flex', gap:12, justifyContent:'center' },
  btnGreen: { padding:'12px 28px', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', color:'#fff', borderRadius:10, fontWeight:700, fontSize:14, boxShadow:'0 4px 12px rgba(29,158,117,0.3)' },
  btnOutline: { padding:'12px 28px', background:'#fff', color:'#1D9E75', border:'2px solid #1D9E75', borderRadius:10, fontWeight:700, fontSize:14 },
};

/* page */
const s = {
  page: { maxWidth:860, margin:'0 auto', padding:'32px 32px 64px' },
  loading: { textAlign:'center', padding:64, color:'#6b7280', fontSize:16 },

  profileCard: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:20, padding:'32px', display:'flex', gap:28, alignItems:'flex-start', marginBottom:28, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
  avatarWrap: { flexShrink:0 },
  avatar: { width:96, height:96, borderRadius:'50%', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:42, fontWeight:800 },
  profileInfo: { flex:1 },
  specBadge: { display:'inline-block', background:'#E6F7F2', color:'#0F6E56', borderRadius:999, padding:'4px 16px', fontSize:13, fontWeight:700, marginBottom:8 },
  docName: { fontSize:24, marginBottom:8, color:'#1a1a1a' },
  ratingRow: { display:'flex', alignItems:'center', gap:6, marginBottom:10 },
  ratingNum: { fontSize:14, fontWeight:700, color:'#374151' },
  ratingCnt: { fontSize:12, color:'#9ca3af' },
  bio: { color:'#6b7280', fontSize:14, lineHeight:1.6, marginBottom:14 },
  infoRow: { display:'flex', gap:10, flexWrap:'wrap' },
  infoPill: { background:'#f3f4f6', color:'#374151', borderRadius:999, padding:'5px 14px', fontSize:13 },

  bookSection: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:20, padding:'28px 32px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
  bookTitle: { fontSize:20, marginBottom:20, color:'#1a1a1a' },
  dateRow: { display:'flex', alignItems:'center', gap:14, marginBottom:20 },
  dateLabel: { fontSize:14, color:'#374151', fontWeight:500, whiteSpace:'nowrap' },
  dateInput: { padding:'9px 14px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:14 },
  dayWarning: { background:'#fffbeb', border:'1px solid #fde68a', borderRadius:12, padding:'14px 18px', fontSize:14, color:'#92400e', marginBottom:16 },

  slotGrid: { display:'flex', flexWrap:'wrap', gap:10, marginBottom:24 },
  slot: { padding:'9px 18px', borderRadius:999, border:'2px solid #1D9E75', background:'#fff', color:'#1D9E75', cursor:'pointer', fontSize:14, fontWeight:600, transition:'all 0.15s' },
  slotBusy: { border:'2px solid #e5e7eb', color:'#d1d5db', background:'#f9fafb', cursor:'not-allowed' },
  slotSelected: { background:'linear-gradient(135deg,#1D9E75,#0F6E56)', color:'#fff', border:'2px solid transparent', boxShadow:'0 4px 12px rgba(29,158,117,0.35)' },
  noSlots: { color:'#9ca3af', fontSize:14 },

  confirmBox: { background:'#F0FBF7', border:'1px solid #A7E5CE', borderRadius:14, padding:22 },
  confirmInfo: { display:'flex', alignItems:'center', gap:14, marginBottom:14 },
  confirmIcon: { fontSize:32 },
  confirmDate: { fontWeight:700, fontSize:16, color:'#1a1a1a' },
  confirmTime: { fontSize:22, fontWeight:800, color:'#1D9E75' },
  textarea: { display:'block', width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #c8ead9', fontSize:14, minHeight:70, resize:'vertical', marginBottom:14, boxSizing:'border-box' },
  bookBtn: { padding:'12px 32px', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:'0 4px 14px rgba(29,158,117,0.35)', transition:'all 0.2s' },
  errorBox: { marginTop:14, background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:10, padding:'12px 16px', color:'#dc2626', fontSize:14 },
};
