from pydantic import BaseModel
from typing import Optional


class PatientProfileUpdate(BaseModel):
    date_of_birth: Optional[str] = None
    blood_type: Optional[str] = None
    chronic_diseases: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None
    previous_diagnoses: Optional[str] = None
    notes: Optional[str] = None


class PatientProfileOut(BaseModel):
    id: int
    user_id: int
    date_of_birth: str
    blood_type: str
    chronic_diseases: str
    allergies: str
    current_medications: str
    previous_diagnoses: str
    notes: str

    class Config:
        from_attributes = True


class PatientProfileForDoctorOut(PatientProfileOut):
    patient_name: str
