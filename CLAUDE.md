# Medical Assistant — CLAUDE.md

## Project Overview

A full-stack medical web application for patients and doctors.

**Stack:**
- Frontend: React (Create React App), React Router v6, Axios
- Backend: FastAPI (Python 3.11+), SQLAlchemy (ORM), SQLite
- AI: Anthropic Claude API (claude-sonnet-4-6) for the AI assistant
- Auth: JWT tokens (access + refresh)

---

## Architecture

```
medical-assistant/
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── api/routes/    # Route handlers (auth, doctors, appointments, ai)
│   │   ├── core/          # Config, security (JWT), dependencies
│   │   ├── db/            # Database engine, session, init
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # Business logic (auth, AI, scheduling)
│   │   └── main.py        # FastAPI app entry point
│   ├── requirements.txt
│   └── .env               # Backend env vars (never commit)
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── auth/      # Login, Register forms
│   │   │   ├── common/    # Navbar, Layout, Spinner
│   │   │   ├── doctor/    # DoctorCard, DoctorRoster, Schedule
│   │   │   ├── patient/   # AppointmentCard, PatientDashboard
│   │   │   └── ai/        # AIChatWidget
│   │   ├── pages/         # Page-level components (routes)
│   │   ├── services/      # Axios API client + per-feature services
│   │   ├── context/       # AuthContext (global auth state)
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Date formatters, validators
│   ├── public/
│   └── package.json
└── README.md
```

---

## Key Domain Rules

- **Two account types:** `patient` and `doctor`. Role is set at registration and stored in JWT.
- **Doctor profile** has: specialty, bio, photo_url, consultation_duration (minutes).
- **Appointment** states: `pending → confirmed → completed | cancelled`.
- **Time slots** are generated server-side based on doctor's working hours; a slot is busy if an appointment already exists for that time.
- **AI assistant** uses Claude API with a system prompt that enforces: first-aid guidance, specialty recommendation, and safe "consult a doctor" disclaimers. It never diagnoses.

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=sqlite:///./medical.db
SECRET_KEY=change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ANTHROPIC_API_KEY=your-key-here
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env`)
```
REACT_APP_API_URL=http://localhost:8000/api/v1
```

---

## API Structure

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/auth/register | Register patient or doctor |
| POST | /api/v1/auth/login | Login, returns JWT pair |
| POST | /api/v1/auth/refresh | Refresh access token |
| GET | /api/v1/doctors | List doctors (filter by specialty) |
| GET | /api/v1/doctors/{id} | Doctor detail |
| GET | /api/v1/doctors/{id}/slots | Available time slots |
| POST | /api/v1/appointments | Book appointment (patient) |
| GET | /api/v1/appointments/my | List own appointments |
| PATCH | /api/v1/appointments/{id} | Update status (doctor) |
| POST | /api/v1/ai/chat | Send message to AI assistant |

---

## Development Notes

- Run `uvicorn app.main:app --reload` from the `backend/` directory.
- Run `npm start` from the `frontend/` directory.
- SQLite DB file is created automatically at `backend/medical.db` on first run.
- Seed data (test doctors) is inserted via `backend/app/db/init_db.py`.
- Frontend proxy is set to `http://localhost:8000` in `package.json` for dev.
