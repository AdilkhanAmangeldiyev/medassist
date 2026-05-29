from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AppointmentCreate(BaseModel):
    doctor_id: int
    start_time: datetime
    notes: Optional[str] = ""


class AppointmentStatusUpdate(BaseModel):
    status: str  # confirmed | completed | cancelled


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    start_time: datetime
    end_time: datetime
    status: str
    notes: str
    created_at: datetime
    # enriched fields — populated by the route, null when not relevant
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialty: Optional[str] = None

    class Config:
        from_attributes = True
