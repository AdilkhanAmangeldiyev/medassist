from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.appointment import Appointment
from app.models.doctor import DoctorProfile

router = APIRouter(prefix="/stats", tags=["stats"])


class StatsOut(BaseModel):
    doctors: int
    specialties: int
    appointments: int


@router.get("", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    doctors = db.query(User).filter(User.role == "doctor").count()
    specialties = db.query(DoctorProfile.specialty).distinct().count()
    appointments = db.query(Appointment).count()
    return StatsOut(doctors=doctors, specialties=specialties, appointments=appointments)
