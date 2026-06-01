from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import JSON, Column, LargeBinary
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    """Usuário do app — autenticação por email + senha."""

    # Tabela explicitamente "users" (plural) para evitar colisão com a palavra
    # reservada USER em alguns dialetos SQL.
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Analysis(SQLModel, table=True):
    """Entidade única que concentra o ciclo de vida de uma análise."""

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    job_title: str
    job_description: str
    # Nullable para suportar migração de linhas legadas (criadas antes da coluna).
    company_name: str | None = Field(default=None)
    resume: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    resume_text: str

    # Dono da análise. Nullable para suportar linhas legadas (criadas antes da
    # coluna) — análises órfãs ficam inacessíveis (ninguém as vê).
    user_id: str | None = Field(default=None, foreign_key="users.id", index=True)

    summary: dict | None = Field(default=None, sa_column=Column(JSON))
    roadmap: list | None = Field(default=None, sa_column=Column(JSON))
    code_challenges: list | None = Field(default=None, sa_column=Column(JSON))
    pitch: list | None = Field(default=None, sa_column=Column(JSON))
    interview_questions: dict | None = Field(default=None, sa_column=Column(JSON))
    # Histórico das rodadas da entrevista (até 3), alimentado a cada avaliação e
    # consumido pelo resumo final. Cada item segue o schema InterviewRound.
    interview_rounds: list | None = Field(default=None, sa_column=Column(JSON))
    strategic_questions: list | None = Field(default=None, sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LeetcodeProblem(SQLModel, table=True):
    """Catálogo curado de problemas LeetCode — fonte única de verdade dos links."""

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    slug: str = Field(unique=True, index=True)
    title: str
    description: str
    difficulty: str  # Easy | Medium | Hard
    category: str
    url: str
