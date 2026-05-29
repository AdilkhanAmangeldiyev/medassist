from datetime import date
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Literal, Optional, Any
from sqlalchemy.orm import Session

from app.services.ai_service import chat
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.doctor import DoctorProfile
from app.models.patient_profile import PatientProfile

router = APIRouter(prefix="/ai", tags=["ai"])


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]


class ChatResponse(BaseModel):
    reply: str
    action: Optional[dict[str, Any]] = None


def _calc_age(dob_str: str) -> int:
    if not dob_str:
        return 0
    try:
        dob = date.fromisoformat(dob_str)
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except ValueError:
        return 0


@router.post("/chat", response_model=ChatResponse)
def ai_chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # fetch doctor roster
    rows = (
        db.query(User, DoctorProfile)
        .join(DoctorProfile, User.id == DoctorProfile.user_id)
        .filter(User.role == "doctor")
        .all()
    )
    doctors = [
        {"id": u.id, "name": u.name, "specialty": p.specialty,
         "bio": p.bio, "work_start": p.work_start, "work_end": p.work_end}
        for u, p in rows
    ]

    # fetch patient profile if requester is a patient
    patient_ctx: dict | None = None
    if current_user.role == "patient":
        profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if profile:
            patient_ctx = {
                "name": current_user.name,
                "age": _calc_age(profile.date_of_birth),
                "blood_type": profile.blood_type,
                "chronic_diseases": profile.chronic_diseases,
                "allergies": profile.allergies,
                "current_medications": profile.current_medications,
            }

    messages = [m.model_dump() for m in body.messages]
    result = chat(messages, doctors, patient_ctx)
    return ChatResponse(reply=result["reply"], action=result.get("action"))
