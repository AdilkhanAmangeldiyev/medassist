"""
Скрипт для построения FAISS-индекса из PDF-протоколов МЗ РК.

Запуск из папки backend/:
    python scripts/build_index.py

Входные данные : backend/rag-docs/*.pdf
Выходной индекс: backend/faiss_index/
"""

import os
import sys
import time
from pathlib import Path

# ── пути ─────────────────────────────────────────────────────
BASE_DIR  = Path(__file__).resolve().parent.parent   # backend/
DOCS_DIR  = BASE_DIR / "rag-docs"
INDEX_DIR = Path("faiss_index")


def main() -> None:
    # проверяем зависимости заранее, чтобы дать понятную ошибку
    try:
        from langchain_community.document_loaders import PyPDFLoader
        from langchain_community.vectorstores import FAISS
        from langchain_community.embeddings import HuggingFaceEmbeddings
        from langchain_text_splitters import RecursiveCharacterTextSplitter
    except ImportError as e:
        print(f"[ERROR] Не установлены зависимости: {e}")
        print("Установите: pip install langchain-community faiss-cpu sentence-transformers pypdf")
        sys.exit(1)

    # ── 1. Поиск PDF ─────────────────────────────────────────
    pdf_files = sorted(DOCS_DIR.glob("*.pdf"))
    if not pdf_files:
        print(f"[ERROR] В папке {DOCS_DIR} нет PDF-файлов.")
        print("Положите туда протоколы МЗ РК и запустите скрипт снова.")
        sys.exit(1)

    print(f"Найдено PDF-файлов: {len(pdf_files)}")
    for p in pdf_files:
        print(f"  • {p.name}")

    # ── 2. Загрузка и разбивка на чанки ──────────────────────
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", " ", ""],
    )

    all_chunks = []
    for pdf_path in pdf_files:
        print(f"\n[{pdf_path.name}] загрузка...", end=" ", flush=True)
        try:
            loader = PyPDFLoader(str(pdf_path))
            pages  = loader.load()
            chunks = splitter.split_documents(pages)
            all_chunks.extend(chunks)
            print(f"{len(pages)} стр. → {len(chunks)} чанков")
        except Exception as e:
            print(f"ОШИБКА: {e} — пропускаем файл")

    if not all_chunks:
        print("\n[ERROR] Не удалось извлечь текст ни из одного PDF.")
        sys.exit(1)

    print(f"\nИтого чанков для индексации: {len(all_chunks)}")

    # ── 3. Создание эмбеддингов ───────────────────────────────
    model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    print(f"\nЗагрузка модели эмбеддингов: {model_name}")
    print("(первый запуск скачивает ~120 МБ — подождите...)")
    t0 = time.time()
    embeddings = HuggingFaceEmbeddings(model_name=model_name)
    print(f"Модель загружена за {time.time() - t0:.1f} с")

    # ── 4. Построение FAISS-индекса ───────────────────────────
    print(f"\nПостроение векторного индекса ({len(all_chunks)} чанков)...")
    t0 = time.time()
    vectorstore = FAISS.from_documents(all_chunks, embeddings)
    print(f"Индекс построен за {time.time() - t0:.1f} с")

    # ── 5. Сохранение ─────────────────────────────────────────
    os.makedirs("faiss_index", exist_ok=True)
    vectorstore.save_local("faiss_index")
    print(f"\n✓ Индекс сохранён в: {INDEX_DIR}")

    # итоговая статистика
    print("\n" + "─" * 50)
    print(f"  PDF-файлов обработано : {len(pdf_files)}")
    print(f"  Чанков в индексе      : {len(all_chunks)}")
    print(f"  Путь к индексу        : {INDEX_DIR}")
    print("─" * 50)
    print("Теперь перезапустите бэкенд — RAG будет активирован автоматически.")


if __name__ == "__main__":
    main()
