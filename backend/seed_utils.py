from __future__ import annotations

import hashlib
import os
from pathlib import Path
from typing import Any

from sqlalchemy import MetaData, Table, create_engine, inspect, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker


ROOT_DIR = Path(__file__).resolve().parent


def load_env() -> None:
    for env_path in (ROOT_DIR / ".env", ROOT_DIR.parent / ".env"):
        if not env_path.exists():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def get_database_url() -> str:
    load_env()
    direct = os.getenv("DATABASE_URL") or os.getenv("SQLALCHEMY_DATABASE_URL")
    user = os.getenv("POSTGRES_USER") or os.getenv("DB_USER") or "postgres"
    password = os.getenv("POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD") or "password"
    host = os.getenv("POSTGRES_HOST") or os.getenv("DB_HOST") or "localhost"
    port = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT") or "5432"
    database = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME") or "postgres"
    auth = f"{user}:{password}" if password else user
    fallback = f"postgresql://{auth}@{host}:{port}/{database}"
    
    url = direct or fallback
    if url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql+asyncpg://", "postgresql://")
    return url


def get_engine() -> Engine:
    return create_engine(get_database_url(), pool_pre_ping=True, future=True)


def get_session() -> Session:
    return sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, future=True)()


def reflect_table(engine: Engine, candidates: list[str]) -> Table:
    inspector = inspect(engine)
    available = set(inspector.get_table_names())
    for name in candidates:
        if name in available:
            metadata = MetaData()
            return Table(name, metadata, autoload_with=engine)
    raise RuntimeError(f"None of these tables exist: {', '.join(candidates)}")


def first_existing(table: Table, candidates: list[str]) -> str | None:
    columns = set(table.c.keys())
    for name in candidates:
        if name in columns:
            return name
    return None


def row_by_column(session: Session, table: Table, column_name: str, value: Any) -> Any | None:
    return session.execute(select(table).where(table.c[column_name] == value)).mappings().first()


def hash_password(password: str) -> str:
    try:
        from passlib.context import CryptContext

        return CryptContext(schemes=["bcrypt"], deprecated="auto").hash(password)
    except Exception:
        try:
            import bcrypt

            return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        except Exception as exc:
            raise RuntimeError("Install passlib[bcrypt] or bcrypt to seed user passwords.") from exc


def deterministic_embedding(text: str, dimensions: int = 384) -> list[float]:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    values: list[float] = []
    while len(values) < dimensions:
        for byte in digest:
            values.append((byte / 127.5) - 1.0)
            if len(values) == dimensions:
                break
        digest = hashlib.sha256(digest).digest()
    return values


def insert_dynamic(session: Session, table: Table, values: dict[str, Any]) -> Any:
    clean = {key: value for key, value in values.items() if key in table.c}
    result = session.execute(table.insert().values(**clean))
    session.flush()
    return result.inserted_primary_key[0] if result.inserted_primary_key else None


def update_or_insert_by_unique(
    session: Session,
    table: Table,
    unique_column: str,
    unique_value: Any,
    values: dict[str, Any],
) -> Any:
    existing = row_by_column(session, table, unique_column, unique_value)
    clean = {key: value for key, value in values.items() if key in table.c}
    if existing:
        session.execute(
            table.update()
            .where(table.c[unique_column] == unique_value)
            .values(**clean)
        )
        return existing.get("id") or existing.get(f"{table.name[:-1]}_id")
    return insert_dynamic(session, table, clean)

