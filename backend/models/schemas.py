from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


# ── Analyze ──────────────────────────────────────────────────────────────────

class Gap(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    skill: str
    level: Literal["critical", "moderate"]
    reason: str


class AnalyzeResponse(BaseModel):
    match_score: int = Field(ge=0, le=100)
    gaps: list[Gap]
    summary: str


# ── Analysis (novo contrato) ──────────────────────────────────────────────────

class AnalysisCreateResponse(BaseModel):
    analysis_id: str


class AnalysisDetailResponse(BaseModel):
    job_title: str
    job_description: str
    resume: str  # PDF original codificado em base64


class EvaluateSolutionRequest(BaseModel):
    analysis_id: str
    slug: str
    title: str
    description: str
    solution: str
    language: str


class EvaluateInterviewAnswerRequest(BaseModel):
    question: str
    transcript: str
    gaps: list[str]


# ── Roadmap ───────────────────────────────────────────────────────────────────

class RoadmapRequest(BaseModel):
    session_id: str
    gaps: list[Gap]
    job_title: str


class RoadmapTask(BaseModel):
    day: int = Field(ge=1, le=7)
    gap_id: str
    task: str
    minutes: int
    category: Literal["conceito", "pratica", "revisao"]


# ── Context ───────────────────────────────────────────────────────────────────

class ContextResponse(BaseModel):
    title: str
    definition: str
    relevance: str
    how_to_show: str


# ── LeetCode ──────────────────────────────────────────────────────────────────

class LeetCodeProblem(BaseModel):
    slug: str
    title: str
    difficulty: Literal["Easy", "Medium", "Hard"]
    category: str
    reason: str


class LeetCodeEvaluateRequest(BaseModel):
    slug: str
    title: str
    description: str
    solution: str
    language: str


class LeetCodeEvaluateResponse(BaseModel):
    correct: bool
    time_complexity: str
    space_complexity: str
    strengths: list[str]
    improvements: list[str]
    optimal_hint: str


# ── Pitch ─────────────────────────────────────────────────────────────────────

class PitchRequest(BaseModel):
    candidate_json: dict
    job_json: dict


class PitchCard(BaseModel):
    project: str
    situation: str
    task: str
    action: str
    result: str
    vaga_connection: str
    relevance: str


# ── Interview ─────────────────────────────────────────────────────────────────

class InterviewStartRequest(BaseModel):
    gaps: list[str]
    session_id: str


class InterviewStartResponse(BaseModel):
    questions: list[str]


class TTSRequest(BaseModel):
    question_text: str = Field(..., min_length=1, max_length=4096)
    voice: Literal["alloy", "nova"] = "alloy"


class InterviewEvaluateRequest(BaseModel):
    question: str
    transcript: str
    gaps: list[str]
    round: int


class InterviewEvaluateResponse(BaseModel):
    score_1_5: int = Field(ge=1, le=5)
    strengths: list[str]
    improvements: list[str]
    tip: str
