from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    specialty = Column(String(64), nullable=False)
    bio = Column(String(1024), default="")
    photo_url = Column(String(512), default="")
    consultation_duration = Column(Integer, default=30)  # minutes
    work_start = Column(String(5), default="09:00")      # "HH:MM"
    work_end = Column(String(5), default="17:00")
    # ISO weekdays: 1=Mon … 7=Sun, comma-separated
    work_days = Column(String(20), default="1,2,3,4,5")

    user = relationship("User", back_populates="doctor_profile")
