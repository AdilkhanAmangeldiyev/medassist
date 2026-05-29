from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.db.session import get_db
from app.models.user import User
from app.models.appointment import Appointment
from app.models.doctor import DoctorProfile
from app.schemas.appointment import AppointmentCreate, AppointmentStatusUpdate, AppointmentOut
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _build(a: Appointment, *, patient_name=None, doctor_name=None, doctor_specialty=None) -> AppointmentOut:
    return AppointmentOut(
        id=a.id,
        patient_id=a.patient_id,
        doctor_id=a.doctor_id,
        start_time=a.start_time,
        end_time=a.end_time,
        status=a.status,
        notes=a.notes,
        created_at=a.created_at,
        patient_name=patient_name,
        doctor_name=doctor_name,
        doctor_specialty=doctor_specialty,
    )


@router.post("", response_model=AppointmentOut, status_code=201)
def book_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Только пациенты могут записываться")

    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == data.doctor_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Врач не найден")

    end_time = data.start_time + timedelta(minutes=profile.consultation_duration)

    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == data.doctor_id,
        Appointment.start_time == data.start_time,
        Appointment.status.in_(["pending", "confirmed"]),
    ).first()
    if conflict:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Этот слот уже занят")

    a = Appointment(
        patient_id=current_user.id,
        doctor_id=data.doctor_id,
        start_time=data.start_time,
        end_time=end_time,
        notes=data.notes or "",
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return _build(a)


@router.get("/my", response_model=list[AppointmentOut])
def my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "patient":
        # join doctor user + profile to get name and specialty
        rows = (
            db.query(Appointment, User, DoctorProfile)
            .join(User, Appointment.doctor_id == User.id)
            .join(DoctorProfile, Appointment.doctor_id == DoctorProfile.user_id)
            .filter(Appointment.patient_id == current_user.id)
            .order_by(Appointment.start_time)
            .all()
        )
        return [_build(a, doctor_name=u.name, doctor_specialty=p.specialty) for a, u, p in rows]

    # doctor: join patient user to get name
    rows = (
        db.query(Appointment, User)
        .join(User, Appointment.patient_id == User.id)
        .filter(Appointment.doctor_id == current_user.id)
        .order_by(Appointment.start_time)
        .all()
    )
    return [_build(a, patient_name=u.name) for a, u in rows]


@router.patch("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: int,
    data: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    a = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запись не найдена")
    if current_user.role == "doctor" and a.doctor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Чужая запись")
    if current_user.role == "patient" and a.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Чужая запись")

    a.status = data.status
    db.commit()
    db.refresh(a)
    return _build(a)
