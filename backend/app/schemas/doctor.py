from pydantic import BaseModel
from typing import Optional


class DoctorProfileOut(BaseModel):
    id: int
    specialty: str
    bio: str
    photo_url: str
    consultation_duration: int
    work_start: str
    work_end: str
    work_days: str   # e.g. "1,2,3,4,5"  or  "6,7"

    class Config:
        from_attributes = True


class DoctorOut(BaseModel):
    id: int
    name: str
    email: str
    doctor_profile: Optional[DoctorProfileOut]

    class Config:
        from_attributes = True


class TimeSlot(BaseModel):
    start: str   # ISO datetime string
    end: str
    available: bool
