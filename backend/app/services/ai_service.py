import re
import json
import logging
import anthropic
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)

FAISS_INDEX = "faiss_index"

# ── FAISS / RAG (загружается один раз при старте) ─────────────
_vectorstore = None

def _load_vectorstore():
    global _vectorstore
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        from langchain_community.vectorstores import FAISS

        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        )
        _vectorstore = FAISS.load_local(
            FAISS_INDEX,
            embeddings,
            allow_dangerous_deserialization=True,
        )
        logger.info("FAISS index loaded: %s", FAISS_INDEX)
    except FileNotFoundError:
        logger.warning("FAISS index not found at '%s' — RAG disabled.", FAISS_INDEX)
    except ImportError as e:
        logger.warning("RAG dependencies missing (%s) — RAG disabled.", e)
    except Exception as e:
        logger.warning("Failed to load FAISS index: %s — RAG disabled.", e)

_load_vectorstore()


def _rag_context(query: str, k: int = 3) -> str:
    """Return relevant fragments from the MZ RK protocol index, or empty string."""
    if _vectorstore is None or not query.strip():
        return ""
    try:
        results = _vectorstore.similarity_search(query, k=k)
        return "\n\n".join(doc.page_content for doc in results)
    except Exception as e:
        logger.warning("RAG search failed: %s", e)
        return ""


# ── System prompt ─────────────────────────────────────────────

def _specialty_map(doctors: list[dict]) -> str:
    """Build specialty → doctor IDs map for the system prompt."""
    groups: dict[str, list[int]] = {}
    for d in doctors:
        groups.setdefault(d["specialty"], []).append(d["id"])
    return "\n".join(
        f"  {spec}: doctor_ids = {ids}"
        for spec, ids in sorted(groups.items())
    )


def _build_system_prompt(doctors: list[dict], patient: dict | None = None) -> str:
    roster = "\n".join(
        f"  ID:{d['id']} | {d['name']} | {d['specialty']} | {d['work_start']}–{d['work_end']}"
        for d in doctors
    )
    spec_map = _specialty_map(doctors)

    # ── patient section ───────────────────────────────────────
    patient_section = ""
    if patient:
        name    = patient.get("name", "Пациент")
        age     = patient.get("age", "—")
        blood   = patient.get("blood_type", "не указана")
        chronic = patient.get("chronic_diseases") or "нет"
        allerg  = patient.get("allergies") or "нет"
        meds    = patient.get("current_medications") or "нет"

        allergy_warning = ""
        if allerg.lower() not in ("нет", ""):
            allergy_warning = (
                f"\n⚠️  АЛЛЕРГИИ — КРИТИЧНО: {allerg}. "
                "НИКОГДА не рекомендуй препараты из этих групп!"
            )

        patient_section = f"""
ВАЖНО: Ты разговариваешь с конкретным пациентом.
Имя: {name}, Возраст: {age} лет, Группа крови: {blood}
Хронические заболевания: {chronic}
Аллергии: {allerg}{allergy_warning}
Текущие препараты: {meds}
НЕ придумывай других пациентов или ситуации. Обращайся к пациенту по имени ({name}).
Если симптом связан с хроническими заболеваниями — обязательно упомяни это.
"""

    # ── RAG section ───────────────────────────────────────────
    rag_instruction = ""
    if _vectorstore is not None:
        rag_instruction = """
ИСТОЧНИК ЗНАНИЙ:
Тебе предоставляются фрагменты из клинических протоколов МЗ РК.
Отвечай ТОЛЬКО на основе этих фрагментов.

КРИТИЧЕСКОЕ ПРАВИЛО:
Если в предоставленных фрагментах протоколов МЗ РК нет информации по заданному вопросу —
ты ОБЯЗАН сказать только следующее:

"К сожалению, в базе клинических протоколов МЗ РК нашей системы нет информации по данному вопросу. Пожалуйста, обратитесь к соответствующему специалисту или позвоните на горячую линию здравоохранения."

НЕ давай никаких рекомендаций, советов или информации из общих знаний если её нет в протоколах.
НЕ додумывай и НЕ дополняй ответ своими знаниями.
Единственное исключение — при экстренных симптомах всегда говори звонить 103.
"""

    return f"""Ты медицинский ИИ-ассистент МедАссист. Отвечай ТОЛЬКО на русском языке.{rag_instruction}{patient_section}
ПРАВИЛА:
- Никогда не ставь диагнозы
- При экстренных симптомах (боль в груди, потеря сознания, признаки инсульта) — немедленно пиши "СРОЧНО звоните 103"
- Рекомендуй специалиста из ростера

ВРАЧИ ПЛАТФОРМЫ:
{roster}

ПРАВИЛО ЗАПИСИ К ВРАЧУ (ОБЯЗАТЕЛЬНО):
Когда пациент описывает симптомы ИЛИ просит найти врача ИЛИ хочет записаться —
ты ОБЯЗАН добавить в самом конце ответа блок:

<BOOKING_ACTION>
{{"action": "suggest_doctors", "specialty": "СПЕЦИАЛЬНОСТЬ", "doctor_ids": [ID1, ID2]}}
</BOOKING_ACTION>

Специальности и их ID врачей (используй ТОЛЬКО эти значения):
{spec_map}"""


# ── Main chat function ────────────────────────────────────────

def chat(messages: list[dict], doctors: list[dict], patient: dict | None = None) -> dict:
    last_user_msg = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )
    rag_ctx = _rag_context(last_user_msg)

    system = _build_system_prompt(doctors, patient)

    # inject RAG context and response instruction into the last user message
    api_messages = []
    for i, m in enumerate(messages):
        content = m["content"]
        if m["role"] == "user" and i == len(messages) - 1:
            if rag_ctx:
                content = (
                    f"Фрагменты из протоколов МЗ РК:\n{rag_ctx}\n\n"
                    f"Вопрос пациента: {content}"
                )
            content += (
                "\n\nДай развёрнутый ответ минимум 3-4 предложения: "
                "сначала объясни симптомы, потом дай советы первой помощи, "
                "потом порекомендуй специалиста."
            )
        api_messages.append({"role": m["role"], "content": content})

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1000,
            system=system,
            messages=api_messages,
        )
        raw_text = response.content[0].text

    except anthropic.APIConnectionError:
        raise HTTPException(status_code=503, detail="Anthropic API недоступен")
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Превышен лимит запросов Anthropic API")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ошибка Anthropic API: {str(e)}")

    # extract BOOKING_ACTION block if present
    action = None
    match = re.search(r"<BOOKING_ACTION>\s*(.*?)\s*</BOOKING_ACTION>", raw_text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(1))
            ids = data.get("doctor_ids", [])
            matched = [d for d in doctors if d["id"] in ids]
            if matched:
                action = {
                    "type": "suggest_doctors",
                    "specialty": data.get("specialty", ""),
                    "doctors": matched,
                }
        except (json.JSONDecodeError, KeyError):
            pass
        raw_text = re.sub(
            r"\s*<BOOKING_ACTION>.*?</BOOKING_ACTION>", "", raw_text, flags=re.DOTALL
        ).strip()

    return {"reply": raw_text, "action": action}
