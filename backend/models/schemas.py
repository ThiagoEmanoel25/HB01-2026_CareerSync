from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class Gap(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    skill: str
    level: Literal["critical", "moderate"]
    reason: str


class AnalyzeResponse(BaseModel):
    match_score: int = Field(ge=0, le=100)
    gaps: list[Gap]
    summary: str


class AnalysisCreateResponse(BaseModel):
    analysis_id: str


class ResumeMeta(BaseModel):
    filename: str
    content_type: str
    url: str


class AnalysisDetailResponse(BaseModel):
    job_title: str
    job_description: str
    resume: ResumeMeta


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


class ContextResponse(BaseModel):
    title: str
    definition: str
    relevance: str
    how_to_show: str


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


class ChallengeExample(BaseModel):
    input: dict
    expected: object
    explanation: str | None = None


class ChallengeSummary(BaseModel):
    slug: str
    title: str
    difficulty: Literal["Easy", "Medium", "Hard"]
    category: str
    reason: str


class ChallengeDetail(ChallengeSummary):
    description: str
    function_name: str
    signature: str
    examples: list[ChallengeExample]
    constraints: list[str]


class ChallengeSubmitRequest(BaseModel):
    code: str


class ChallengeTestFailure(BaseModel):
    input: dict
    expected: object
    actual: object


class ChallengeSubmitResponse(BaseModel):
    passed: bool
    status: Literal["passed", "failed", "error", "timeout"]
    total_tests: int
    passed_count: int
    first_failure: ChallengeTestFailure | None = None
    error: str | None = None


class ChallengeHintRequest(BaseModel):
    code: str


class ChallengeHintResponse(BaseModel):
    hint: str


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


class InterviewStartRequest(BaseModel):
    gaps: list[str]
    session_id: str


class InterviewStartResponse(BaseModel):
    questions: list[str]


class TTSRequest(BaseModel):
    question_text: str
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
