from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models.db_models  # noqa: F401 — registers SQLModel table metadata
from core.database import create_db_and_tables
from routers import analysis, challenges, context, interview


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Prep AI", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router)
app.include_router(challenges.router)
app.include_router(context.router)
app.include_router(interview.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
