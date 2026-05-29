# Medical Assistant

Web application for connecting patients with doctors, with an AI-powered first-aid and doctor-selection assistant.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Quick Start

### 1. Clone / enter the project

```bash
cd medical-assistant
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux

# Edit .env and set your ANTHROPIC_API_KEY
# Then start the server:
uvicorn app.main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend

npm install
npm start
```

The app will open at **http://localhost:3000**

---

## Default Test Accounts

After first run, the database is seeded with demo data:

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@demo.com | demo1234 |
| Doctor | doctor@demo.com | demo1234 |

---

## Features

- **Auth** — Register and log in as a patient or doctor. JWT-based session.
- **Doctor Roster** — Browse doctors filtered by specialty (Therapist, Cardiologist, Neurologist, etc.).
- **Scheduling** — View a doctor's available time slots and book an appointment as a patient.
- **Doctor Dashboard** — Doctors see their upcoming appointments and can confirm or cancel them.
- **AI Assistant** — Chat widget powered by Claude API for first-aid guidance and specialty recommendations.

---

## Project Structure

```
medical-assistant/
├── backend/
│   ├── app/
│   │   ├── api/routes/     # auth, doctors, appointments, ai
│   │   ├── core/           # config, security, dependencies
│   │   ├── db/             # engine, session, seed data
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # business logic
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/     # auth, common, doctor, patient, ai
    │   ├── pages/          # page-level route components
    │   ├── services/       # API client
    │   ├── context/        # AuthContext
    │   └── hooks/
    └── package.json
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=sqlite:///./medical.db
SECRET_KEY=change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ANTHROPIC_API_KEY=sk-ant-...
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

---

## Stopping the servers

Press `Ctrl+C` in each terminal window.
