from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.models.doctor import DoctorProfile
from app.models.patient_profile import PatientProfile

# schedule presets  (work_start, work_end, work_days)
MORNING  = ("08:00", "14:00", "1,2,3,4,5")
DAY      = ("10:00", "17:00", "1,2,3,4,5")
EVENING  = ("14:00", "20:00", "1,2,3,4,5")
WEEKEND  = ("09:00", "13:00", "6,7")

SEED_DOCTORS = [
    {"name": "Иванов Сергей Петрович",    "email": "doctor@medassist.kz", "password": "doctor123",
     "specialty": "Кардиолог",  "bio": "Кардиолог высшей категории, 15 лет опыта. ИБС, аритмии, гипертония.", "schedule": DAY},
    {"name": "Нурланов Асхат Болатович",  "email": "nurlanov@demo.com",   "password": "demo1234",
     "specialty": "Кардиолог",  "bio": "Кардиолог первой категории. УЗИ сердца, ЭКГ, нарушения ритма.",        "schedule": MORNING},
    {"name": "Лебедева Татьяна Владимировна","email": "lebedeva@demo.com", "password": "demo1234",
     "specialty": "Кардиолог",  "bio": "Профилактическая кардиология, реабилитация после инфаркта.",           "schedule": EVENING},
    {"name": "Петрова Анна Викторовна",   "email": "petrova@demo.com",    "password": "demo1234",
     "specialty": "Невролог",   "bio": "Невролог, к.м.н. Головные боли, нарушения сна, остеохондроз.",        "schedule": MORNING},
    {"name": "Абенов Данияр Серікұлы",    "email": "abenov@demo.com",     "password": "demo1234",
     "specialty": "Невролог",   "bio": "Эпилепсия, рассеянный склероз. Дневной приём.",                       "schedule": DAY},
    {"name": "Захарова Елена Николаевна", "email": "zakharova@demo.com",  "password": "demo1234",
     "specialty": "Невролог",   "bio": "Невролог-вертебролог. Боли в спине, грыжи диска. Вечерний приём.",    "schedule": EVENING},
    {"name": "Сейткали Айгерим",          "email": "seitkali@demo.com",   "password": "demo1234",
     "specialty": "Терапевт",   "bio": "Терапевт первой категории. Внутренние болезни, профосмотры.",          "schedule": DAY},
    {"name": "Ержанов Нурлан Маратович",  "email": "yerzhanov@demo.com",  "password": "demo1234",
     "specialty": "Терапевт",   "bio": "Хронические болезни лёгких, аллергия. Утренний приём.",               "schedule": MORNING},
    {"name": "Морозова Светлана Игоревна","email": "morozova@demo.com",   "password": "demo1234",
     "specialty": "Терапевт",   "bio": "Терапевт-эндокринолог. Диабет, щитовидная железа.",                   "schedule": DAY},
    {"name": "Джаксыбеков Марат Нурланович","email": "dzhaksybekov@demo.com","password": "demo1234",
     "specialty": "Педиатр",    "bio": "Педиатр, 10 лет опыта. Дети до 18 лет, вакцинация.",                  "schedule": DAY},
    {"name": "Тастанова Жанар Асыловна",  "email": "tastanova@demo.com",  "password": "demo1234",
     "specialty": "Педиатр",    "bio": "Детские инфекции, аллергология. Дневной приём.",                       "schedule": DAY},
    {"name": "Козлов Алексей Дмитриевич", "email": "kozlov@demo.com",     "password": "demo1234",
     "specialty": "Педиатр",    "bio": "Педиатр-неонатолог. Новорождённые, ранний возраст. Вечерний приём.",  "schedule": EVENING},
    {"name": "Ким Александр Сергеевич",   "email": "kim@demo.com",        "password": "demo1234",
     "specialty": "Хирург",     "bio": "Хирург высшей категории. Лапароскопия, общая хирургия.",               "schedule": DAY},
    {"name": "Досмағамбетов Берік Ахметұлы","email": "dosmagambetov@demo.com","password": "demo1234",
     "specialty": "Хирург",     "bio": "Абдоминальная хирургия, аппендэктомия. Утренний приём.",              "schedule": MORNING},
    {"name": "Никитина Ольга Сергеевна",  "email": "nikitina@demo.com",   "password": "demo1234",
     "specialty": "Хирург",     "bio": "Малоинвазивная и амбулаторная хирургия. Выходные.",                    "schedule": WEEKEND},
]

SEED_PATIENTS = [
    {
        "name": "Демо Пациент", "email": "patient@demo.com", "password": "demo1234",
        "profile": None,
    },
    {
        "name": "Сейткали Дина Маратовна", "email": "dina@demo.kz", "password": "demo1234",
        "profile": {
            "date_of_birth": "1985-03-15",
            "blood_type": "B+",
            "chronic_diseases": "Гипертония 2 степени, Сахарный диабет 2 типа",
            "allergies": "Пенициллин, Аспирин",
            "current_medications": "Метформин 500мг (2 р/день), Эналаприл 10мг (1 р/день)",
            "previous_diagnoses": "Инфаркт миокарда 2019г, гипертонический криз 2022г",
            "notes": "",
        },
    },
    {
        "name": "Ахметов Нурлан Бекович", "email": "nurlan@demo.kz", "password": "demo1234",
        "profile": {
            "date_of_birth": "1992-07-22",
            "blood_type": "O+",
            "chronic_diseases": "Мигрень, Остеохондроз шейного отдела",
            "allergies": "Нет",
            "current_medications": "Суматриптан 50мг (по необходимости)",
            "previous_diagnoses": "Частые мигрени с 2015г, МРТ 2023г без патологий",
            "notes": "",
        },
    },
    {
        "name": "Жакупова Айгерим Сериковна", "email": "aigerim@demo.kz", "password": "demo1234",
        "profile": {
            "date_of_birth": "2001-11-10",
            "blood_type": "A+",
            "chronic_diseases": "Бронхиальная астма лёгкой степени",
            "allergies": "Пыльца растений, домашняя пыль, кошки",
            "current_medications": "Сальбутамол ингалятор (по необходимости)",
            "previous_diagnoses": "Астма с детства, госпитализация 2020г по поводу астматического статуса",
            "notes": "",
        },
    },
]


def seed(db: Session) -> None:
    # patients
    for p in SEED_PATIENTS:
        if db.query(User).filter(User.email == p["email"]).first():
            continue
        user = User(name=p["name"], email=p["email"],
                    hashed_password=hash_password(p["password"]), role="patient")
        db.add(user)
        db.flush()
        if p["profile"]:
            db.add(PatientProfile(user_id=user.id, **p["profile"]))

    # doctors — idempotent per email
    for d in SEED_DOCTORS:
        if db.query(User).filter(User.email == d["email"]).first():
            continue
        user = User(name=d["name"], email=d["email"],
                    hashed_password=hash_password(d["password"]), role="doctor")
        db.add(user)
        db.flush()
        work_start, work_end, work_days = d["schedule"]
        db.add(DoctorProfile(
            user_id=user.id, specialty=d["specialty"], bio=d["bio"],
            consultation_duration=30, work_start=work_start,
            work_end=work_end, work_days=work_days,
        ))

    db.commit()
