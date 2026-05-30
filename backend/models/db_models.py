from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import JSON, Column, LargeBinary
from sqlmodel import Field, SQLModel


class Analysis(SQLModel, table=True):
    """Entidade única que concentra o ciclo de vida de uma análise."""

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    job_title: str
    job_description: str
    # Nullable para suportar migração de linhas legadas (criadas antes da coluna).
    company_name: str | None = Field(default=None)
    resume: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    resume_text: str

    summary: dict | None = Field(default=None, sa_column=Column(JSON))
    roadmap: list | None = Field(default=None, sa_column=Column(JSON))
    code_challenges: list | None = Field(default=None, sa_column=Column(JSON))
    pitch: list | None = Field(default=None, sa_column=Column(JSON))
    interview_questions: dict | None = Field(default=None, sa_column=Column(JSON))
    strategic_questions: list | None = Field(default=None, sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
