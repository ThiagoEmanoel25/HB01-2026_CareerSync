import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from sqlmodel import Session

import models.db_models  # noqa: F401 — registers SQLModel table metadata
from core.config import settings
from core.database import create_db_and_tables, engine
from data.leetcode_seed import seed_leetcode
from routers import analysis, auth, context, interview

logger = logging.getLogger("prepai")


def _init_observability() -> None:
    """Configura logging e, havendo DSN, inicializa o Sentry (opcional)."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    if not settings.sentry_dsn:
        return
    try:
        import sentry_sdk

        # A integração de logging do Sentry captura logger.exception() (com
        # traceback) automaticamente — não é preciso chamar capture_exception.
        sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.0)
        logger.info("Sentry inicializado.")
    except ImportError:
        logger.warning("SENTRY_DSN definido, mas o pacote sentry-sdk não está instalado.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _init_observability()
    create_db_and_tables()
    with Session(engine) as session:
        seed_leetcode(session)
    yield


app = FastAPI(title="Prep AI", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    # CORSMiddleware faz match EXATO em allow_origins (sem curinga). Para liberar
    # todos os subdomínios da Vercel (preview + produção) usamos allow_origin_regex.
    allow_origins=["http://localhost:5173"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def _validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    # Input inválido → 422 com detail em STRING (não a lista padrão do FastAPI),
    # casando com o frontend que lê err.detail como texto (lib/api.ts).
    errors = exc.errors()
    if errors:
        first = errors[0]
        loc = ".".join(
            str(p) for p in first.get("loc", []) if p not in ("body", "query")
        )
        msg = first.get("msg", "Entrada inválida.")
        detail = f"{loc}: {msg}" if loc else msg
    else:
        detail = "Entrada inválida."
    return JSONResponse(status_code=422, content={"detail": detail})


@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Rede de segurança: loga o traceback completo (capturado pelo Sentry, se ativo)
    # e responde 500 padronizado em {detail}, casando com o frontend (lib/api.ts).
    logger.exception("Erro inesperado em %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor. Tente novamente."},
    )


app.include_router(auth.router)
app.include_router(analysis.router)
app.include_router(context.router)
app.include_router(interview.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
