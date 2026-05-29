from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.patient_profile import PatientProfile
from app.schemas.patient_profile import PatientProfileOut, PatientProfileUpdate, PatientProfileForDoctorOut
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/patients", tags=["patients"])


def _get_or_create_profile(user_id: int, db: Session) -> PatientProfile:
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == user_id).first()
    if not profile:
        profile = PatientProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/profile", response_model=PatientProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Только для пациентов")
    return _get_or_create_profile(current_user.id, db)


@router.put("/profile", response_model=PatientProfileOut)
def update_my_profile(
    data: PatientProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Только для пациентов")
    profile = _get_or_create_profile(current_user.id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{patient_id}/profile", response_model=PatientProfileForDoctorOut)
def get_patient_profile(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Только для врачей")
    patient = db.query(User).filter(User.id == patient_id, User.role == "patient").first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пациент не найден")
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == patient_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Медкарта не заполнена")
    return PatientProfileForDoctorOut(
        **PatientProfileOut.model_validate(profile).model_dump(),
        patient_name=patient.name,
    )
