# МедАссист

Полнофункциональное медицинское веб-приложение для пациентов и врачей с ИИ-ассистентом на базе Claude API и RAG по протоколам МЗ РК.

---

## Стек технологий

| Компонент | Технология |
|-----------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Backend | FastAPI (Python 3.11+), SQLAlchemy, SQLite |
| Auth | JWT (access + refresh токены) |
| AI | Anthropic Claude API (claude-sonnet-4-5) |
| RAG | FAISS + HuggingFace Embeddings + LangChain |

---

## Требования

| Инструмент | Версия |
|-----------|--------|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Быстрый старт (локально)

### 1. Клонировать / войти в проект

```bash
cd medical-assistant
```

### 2. Настройка бэкенда

```bash
cd backend

# Создать и активировать виртуальное окружение
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt

# Создать файл окружения
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux

# Вставить ANTHROPIC_API_KEY в .env, затем запустить:
uvicorn app.main:app --reload --port 8000
```

API: **http://localhost:8000**  
Swagger: **http://localhost:8000/docs**

### 3. Настройка фронтенда

```bash
cd frontend
npm install
npm start
```

Приложение откроется на **http://localhost:3000**

---

## Тестовые аккаунты

После первого запуска база данных заполняется демо-данными:

| Роль | Email | Пароль |
|------|-------|--------|
| Пациент | dina@example.com | patient123 |
| Пациент | nurlan@example.com | patient123 |
| Врач | doctor@medassist.kz | doctor123 |

---

## RAG — клинические протоколы МЗ РК

ИИ-ассистент отвечает строго на основе протоколов МЗ РК. Для активации:

```bash
# 1. Положить PDF-протоколы в папку:
backend/rag-docs/

# 2. Запустить построение FAISS-индекса (из папки backend/):
cd backend
python scripts/build_index.py

# 3. Перезапустить бэкенд — RAG активируется автоматически
```

Если индекс отсутствует — ИИ сообщает об отсутствии данных и рекомендует обратиться к врачу.

---

## Деплой на Railway

### Бэкенд

1. Создать новый проект на [railway.app](https://railway.app)
2. Подключить репозиторий, указать `Root Directory: backend`
3. Railway автоматически прочитает `Procfile`:
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
4. Добавить переменные окружения в Railway Dashboard:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   SECRET_KEY=случайная-строка-32+-символа
   DATABASE_URL=sqlite:///./medical.db
   CORS_ORIGINS=https://твой-фронтенд.vercel.app
   ```

### Фронтенд

1. Развернуть на [Vercel](https://vercel.com) или Netlify, `Root Directory: frontend`
2. Перед деплоем обновить `frontend/.env.production`:
   ```
   REACT_APP_API_URL=https://твой-бэкенд.railway.app/api/v1
   ```

---

## Структура проекта

```
medical-assistant/
├── backend/
│   ├── app/
│   │   ├── api/routes/     # auth, doctors, appointments, ai, patients, stats
│   │   ├── core/           # config, security, dependencies
│   │   ├── db/             # engine, session, init_db (seed)
│   │   ├── models/         # SQLAlchemy модели
│   │   ├── schemas/        # Pydantic схемы
│   │   └── services/       # ai_service, auth_service, schedule_service
│   ├── scripts/
│   │   └── build_index.py  # построение FAISS-индекса из PDF
│   ├── rag-docs/           # PDF-протоколы МЗ РК (не коммитятся)
│   ├── faiss_index/        # векторный индекс (генерируется локально)
│   ├── Procfile            # Railway/Heroku entry point
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/     # Navbar, DoctorCard, AppointmentCard, ...
    │   ├── pages/          # HomePage, DoctorsPage, AiPage, ProfilePage, ...
    │   ├── services/       # Axios API-клиент
    │   └── context/        # AuthContext
    ├── .env.production     # URL бэкенда для prod-сборки
    └── package.json
```

---

## Переменные окружения

### Backend (`backend/.env`)

```env
DATABASE_URL=sqlite:///./medical.db
SECRET_KEY=your_secret_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ANTHROPIC_API_KEY=your_key_here
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

### Frontend production (`frontend/.env.production`)

```env
REACT_APP_API_URL=https://твой-бэкенд.railway.app/api/v1
```

---

## Остановка серверов

Нажать `Ctrl+C` в каждом терминале.
