from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    date_of_birth = Column(String(10), default="")        # YYYY-MM-DD
    blood_type = Column(String(5), default="")            # A+, B-, O+, AB+, ...
    chronic_diseases = Column(Text, default="")
    allergies = Column(Text, default="")
    current_medications = Column(Text, default="")
    previous_diagnoses = Column(Text, default="")
    notes = Column(Text, default="")                      # врачебные заметки

    user = relationship("User", back_populates="patient_profile")
