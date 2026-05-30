from collections.abc import Generator

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


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
