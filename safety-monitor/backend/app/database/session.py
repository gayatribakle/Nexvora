import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator

from app.config.settings import settings

# Create local data dir as fallback for SQLite compatibility
os.makedirs("data", exist_ok=True)

_connect_args = {}
# Only add check_same_thread for SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    _connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=_connect_args,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from app.database.models import Base

    # Enable pgvector extension for PostgreSQL
    if settings.DATABASE_URL.startswith("postgresql"):
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()

    Base.metadata.create_all(bind=engine)

    # SQLite-specific column additions (for backward compatibility)
    if settings.DATABASE_URL.startswith("sqlite"):
        for column_name, column_type in [
            ("needs_review", "BOOLEAN DEFAULT 0"),
            ("face_confidence", "FLOAT"),
            ("face_gap", "FLOAT"),
            ("confidence_level", "VARCHAR(20)"),
        ]:
            try:
                with engine.connect() as conn:
                    conn.execute(
                        text(f"ALTER TABLE violations ADD COLUMN {column_name} {column_type}")
                    )
                    conn.commit()
            except Exception:
                pass
