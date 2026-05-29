from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(16), nullable=False)  # "patient" | "doctor"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor_profile  = relationship("DoctorProfile",  back_populates="user", uselist=False)
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False)
    appointments_as_patient = relationship("Appointment", foreign_keys="Appointment.patient_id", back_populates="patient")
    appointments_as_doctor = relationship("Appointment", foreign_keys="Appointment.doctor_id", back_populates="doctor")
