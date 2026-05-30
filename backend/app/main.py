from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import Base, engine
from app.db.init_db import seed
from app.db.session import SessionLocal
from app.api.routes import auth, doctors, appointments, ai, stats, patients

# import models so SQLAlchemy registers them before create_all
import app.models.user            # noqa
import app.models.doctor          # noqa
import app.models.appointment     # noqa
import app.models.patient_profile # noqa

Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    seed(db)

app = FastAPI(title="Medical Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://medassist-myzg.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/api/v1")
app.include_router(doctors.router,      prefix="/api/v1")
app.include_router(appointments.router, prefix="/api/v1")
app.include_router(ai.router,           prefix="/api/v1")
app.include_router(stats.router,        prefix="/api/v1")
app.include_router(patients.router,     prefix="/api/v1")


@app.get("/")
def root():
    return {"status": "ok", "docs": "/docs"}
