from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from app.db.session import get_db
from app.models.user import User
from app.schemas.doctor import DoctorOut, TimeSlot
from app.services.schedule_service import get_slots

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("", response_model=list[DoctorOut])
def list_doctors(specialty: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(User).filter(User.role == "doctor").options(joinedload(User.doctor_profile))
    if specialty:
        from app.models.doctor import DoctorProfile
        query = query.join(DoctorProfile).filter(DoctorProfile.specialty == specialty)
    return query.all()


@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException, status
    doctor = db.query(User).filter(User.id == doctor_id, User.role == "doctor").options(joinedload(User.doctor_profile)).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return doctor


@router.get("/{doctor_id}/slots", response_model=list[TimeSlot])
def doctor_slots(doctor_id: int, date: date = Query(...), db: Session = Depends(get_db)):
    return get_slots(doctor_id, date, db)
