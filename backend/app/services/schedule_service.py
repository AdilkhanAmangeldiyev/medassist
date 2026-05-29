from datetime import date, datetime
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.doctor import DoctorProfile
from app.schemas.doctor import TimeSlot


def _parse_work_days(raw: str | None) -> set[int]:
    """1=Mon … 7=Sun"""
    if not raw:
        return {1, 2, 3, 4, 5}
    return {int(d) for d in raw.split(",") if d.strip().isdigit()}


def _to_min(hhmm: str) -> int:
    h, m = map(int, hhmm.split(":"))
    return h * 60 + m


def _from_min(total: int) -> str:
    return f"{total // 60:02d}:{total % 60:02d}"


def get_slots(doctor_id: int, for_date: date, db: Session) -> list[TimeSlot]:
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == doctor_id).first()
    if not profile:
        return []

    # 1. work-day check (ISO: 1=Mon … 7=Sun)
    if for_date.isoweekday() not in _parse_work_days(profile.work_days):
        return []

    start_min = _to_min(profile.work_start)
    end_min   = _to_min(profile.work_end)
    duration  = profile.consultation_duration   # minutes
    date_str  = for_date.strftime("%Y-%m-%d")

    # 2. past-slot cutoff — server local time, no UTC conversion
    cutoff_min: int | None = None
    if for_date == date.today():
        now = datetime.now()                    # local time, no tz
        cutoff_min = now.hour * 60 + now.minute

    # 3. already-booked slots → set of "HH:MM" strings for this date
    booked_rows = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status.in_(["pending", "confirmed"]),
    ).all()

    booked_hhmm: set[str] = set()
    for a in booked_rows:
        st = a.start_time
        # strip tz if stored with UTC info (backward compat)
        if st.tzinfo is not None:
            st = st.replace(tzinfo=None)
        if st.date() == for_date:
            booked_hhmm.add(f"{st.hour:02d}:{st.minute:02d}")

    # 4. generate — plain "YYYY-MM-DDTHH:MM" strings, no timezone suffix
    slots: list[TimeSlot] = []
    cur = start_min
    while cur + duration <= end_min:
        if cutoff_min is None or cur > cutoff_min:   # skip past
            t = _from_min(cur)
            slots.append(TimeSlot(
                start=f"{date_str}T{t}",
                end=f"{date_str}T{_from_min(cur + duration)}",
                available=t not in booked_hhmm,
            ))
        cur += duration

    return slots
