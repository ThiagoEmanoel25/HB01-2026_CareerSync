from collections.abc import Generator

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

from core.config import settings

engine = create_engine(settings.database_url, echo=settings.environment == "development")

# Colunas adicionadas após a criação inicial da tabela. Como o projeto não usa
# Alembic e create_all() não faz ALTER em tabelas existentes, garantimos sua
# presença de forma idempotente no startup. Em produção (Postgres) o tipo JSON
# é nativo; o SQLite aceita "JSON" como sinônimo de TEXT.
_ANALYSIS_COLUMNS_TO_ENSURE: dict[str, str] = {
    "company_name": "VARCHAR",
    "strategic_questions": "JSON",
}


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
    _ensure_columns()


def _ensure_columns() -> None:
    inspector = inspect(engine)
    if "analysis" not in inspector.get_table_names():
        return
    existing = {col["name"] for col in inspector.get_columns("analysis")}
    missing = {name: ddl for name, ddl in _ANALYSIS_COLUMNS_TO_ENSURE.items() if name not in existing}
    if not missing:
        return
    with engine.begin() as conn:
        for name, ddl in missing.items():
            conn.execute(text(f"ALTER TABLE analysis ADD COLUMN {name} {ddl}"))


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
