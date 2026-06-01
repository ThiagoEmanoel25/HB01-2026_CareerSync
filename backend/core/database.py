from collections.abc import Generator

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

from core.config import settings

# SQLite exige check_same_thread=False para uso com o pool de threads do FastAPI;
# para Postgres e demais dialetos o connect_args fica vazio (sem efeito).
connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)
engine = create_engine(
    settings.database_url,
    echo=settings.environment == "development",
    connect_args=connect_args,
)

# Colunas adicionadas após a criação inicial da tabela. Como o projeto não usa
# Alembic e create_all() não faz ALTER em tabelas existentes, garantimos sua
# presença de forma idempotente no startup. Em produção (Postgres) o tipo JSON
# é nativo; o SQLite aceita "JSON" como sinônimo de TEXT.
_ANALYSIS_COLUMNS_TO_ENSURE: dict[str, str] = {
    "company_name": "VARCHAR",
    "strategic_questions": "JSON",
    "interview_rounds": "JSON",
    "user_id": "VARCHAR",
}


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
    _ensure_columns()


def _ensure_columns() -> None:
    """Migração leve e idempotente para colunas novas.

    create_all() cria tabelas que faltam, mas NÃO altera tabelas já existentes.
    Como o projeto não usa Alembic, garantimos aqui as colunas adicionadas
    depois que a tabela `analysis` já existia em produção, sem destruir dados.
    Tipo JSON funciona em SQLite e Postgres.
    """
    inspector = inspect(engine)
    if "analysis" not in inspector.get_table_names():
        return  # create_all acabou de criá-la com o schema completo.
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
