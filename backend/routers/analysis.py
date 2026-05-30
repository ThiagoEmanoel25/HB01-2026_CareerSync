from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import APIRouter, Depends, Form, HTTPException, Response, UploadFile
from sqlmodel import Session

from core.database import get_session
from models.db_models import Analysis
from models.schemas import (
    AnalysisCreateResponse,
    AnalysisDetailResponse,
    AnalyzeResponse,
    EvaluateInterviewAnswerRequest,
    EvaluateSolutionRequest,
    Gap,
    InterviewEvaluateResponse,
    InterviewStartResponse,
    LeetCodeEvaluateResponse,
    LeetCodeProblem,
    PitchCard,
    ResumeMeta,
    RoadmapTask,
    StrategicQuestion,
)
from services.llm_service import LLMService
from services.pdf_service import PDFService

router = APIRouter(tags=["analysis"])


def _get_analysis_or_404(db: Session, analysis_id: str) -> Analysis:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Análise não encontrada.")
    return analysis


async def get_or_generate(
    db: Session,
    analysis_id: str,
    field_name: str,
    generate_fn: Callable[[Analysis], Awaitable[Any]],
) -> Any:
    analysis = _get_analysis_or_404(db, analysis_id)

    cached = getattr(analysis, field_name)
    if cached is not None:
        return cached

    result = await generate_fn(analysis)
    setattr(analysis, field_name, result)
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return getattr(analysis, field_name)


async def _ensure_summary(db: Session, analysis: Analysis, llm: LLMService) -> dict:
    if analysis.summary is None:
        result = await llm.summarize_analysis(
            resume_text=analysis.resume_text,
            job_title=analysis.job_title,
            job_description=analysis.job_description,
        )
        analysis.summary = result.model_dump()
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
    return analysis.summary


async def _ensure_gaps(db: Session, analysis: Analysis, llm: LLMService) -> list[Gap]:
    summary = await _ensure_summary(db, analysis, llm)
    return [Gap(**g) for g in summary["gaps"]]


@router.post("/analysis", response_model=AnalysisCreateResponse, status_code=201)
async def create_analysis(
    resume: UploadFile,
    job_title: str = Form(...),
    job_description: str = Form(...),
    company_name: str = Form(...),
    pdf_svc: PDFService = Depends(),
    db: Session = Depends(get_session),
) -> AnalysisCreateResponse:
    resume_text, contents = await pdf_svc.extract_with_bytes(resume)

    analysis = Analysis(
        job_title=job_title,
        job_description=job_description,
        company_name=company_name,
        resume=contents,
        resume_text=resume_text,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return AnalysisCreateResponse(analysis_id=analysis.id)


@router.get("/analysis/{analysis_id}", response_model=AnalysisDetailResponse)
def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_session),
) -> AnalysisDetailResponse:
    analysis = _get_analysis_or_404(db, analysis_id)

    return AnalysisDetailResponse(
        job_title=analysis.job_title,
        job_description=analysis.job_description,
        resume=ResumeMeta(
            filename="resume.pdf",
            content_type="application/pdf",
            url=f"/analysis/{analysis.id}/resume",
        ),
    )


@router.get("/analysis/{analysis_id}/resume")
def get_resume(
    analysis_id: str,
    db: Session = Depends(get_session),
) -> Response:
    analysis = _get_analysis_or_404(db, analysis_id)
    return Response(
        content=analysis.resume,
        media_type="application/pdf",
        headers={"Content-Disposition": 'inline; filename="resume.pdf"'},
    )


@router.get("/analysis/{analysis_id}/summary", response_model=AnalyzeResponse)
async def get_summary(
    analysis_id: str,
    llm: LLMService = Depends(),
    db: Session = Depends(get_session),
) -> Any:
    async def generate(analysis: Analysis) -> dict:
        result = await llm.summarize_analysis(
            resume_text=analysis.resume_text,
            job_title=analysis.job_title,
            job_description=analysis.job_description,
        )
        return result.model_dump()

    return await get_or_generate(db, analysis_id, "summary", generate)


@router.get("/analysis/{analysis_id}/roadmap", response_model=list[RoadmapTask])
async def get_roadmap(
    analysis_id: str,
    llm: LLMService = Depends(),
    db: Session = Depends(get_session),
) -> Any:
    async def generate(analysis: Analysis) -> list[dict]:
        gaps = await _ensure_gaps(db, analysis, llm)
        tasks = await llm.generate_roadmap(gaps, analysis.job_title)
        return [t.model_dump() for t in tasks]

    return await get_or_generate(db, analysis_id, "roadmap", generate)


@router.get("/analysis/{analysis_id}/code-challenges", response_model=list[LeetCodeProblem])
async def get_code_challenges(
    analysis_id: str,
    llm: LLMService = Depends(),
    db: Session = Depends(get_session),
) -> Any:
    async def generate(analysis: Analysis) -> list[dict]:
        gaps = await _ensure_gaps(db, analysis, llm)
        gaps_str = ", ".join(g.skill for g in gaps)
        problems = await llm.get_leetcode_problems(
            stack=analysis.job_title,
            seniority="",
            gaps=gaps_str,
        )
        return [p.model_dump() for p in problems]

    return await get_or_generate(db, analysis_id, "code_challenges", generate)


@router.get("/analysis/{analysis_id}/pitch", response_model=list[PitchCard])
async def get_pitch(
    analysis_id: str,
    llm: LLMService = Depends(),
    db: Session = Depends(get_session),
) -> Any:
    async def generate(analysis: Analysis) -> list[dict]:
        candidate_json = {"resume": analysis.resume_text}
        job_json = {"title": analysis.job_title, "description": analysis.job_description}
        cards = await llm.generate_pitch(candidate_json, job_json)
        return [c.model_dump() for c in cards]

    return await get_or_generate(db, analysis_id, "pitch", generate)


@router.get("/analysis/{analysis_id}/interview-questions", response_model=InterviewStartResponse)
async def get_interview_questions(
    analysis_id: str,
    llm: LLMService = Depends(),
    db: Session = Depends(get_session),
) -> Any:
    async def generate(analysis: Analysis) -> dict:
        gaps = await _ensure_gaps(db, analysis, llm)
        result = await llm.generate_interview_questions(
            [g.skill for g in gaps],
            analysis.id,
        )
        return result.model_dump()

    return await get_or_generate(db, analysis_id, "interview_questions", generate)


@router.get("/analysis/{analysis_id}/strategic-questions", response_model=list[StrategicQuestion])
async def get_strategic_questions(
    analysis_id: str,
    refresh: bool = False,
    llm: LLMService = Depends(),
    db: Session = Depends(get_session),
) -> Any:
    async def generate(analysis: Analysis) -> list[dict]:
        questions = await llm.generate_strategic_questions(
            job_title=analysis.job_title,
            job_description=analysis.job_description,
            company_name=analysis.company_name or "",
        )
        return [q.model_dump() for q in questions]

    # refresh=true ignora o cache e regenera (usado pelo botão "Regenerar").
    if refresh:
        analysis = _get_analysis_or_404(db, analysis_id)
        analysis.strategic_questions = await generate(analysis)
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis.strategic_questions

    return await get_or_generate(db, analysis_id, "strategic_questions", generate)


@router.post("/evaluate-solution", response_model=LeetCodeEvaluateResponse)
async def evaluate_solution(
    req: EvaluateSolutionRequest,
    llm: LLMService = Depends(),
) -> LeetCodeEvaluateResponse:
    return await llm.evaluate_leetcode(
        req.slug,
        req.title,
        req.description,
        req.solution,
        req.language,
    )


@router.post(
    "/analysis/{analysis_id}/evaluate-interview-answer",
    response_model=InterviewEvaluateResponse,
)
async def evaluate_interview_answer(
    analysis_id: str,
    req: EvaluateInterviewAnswerRequest,
    llm: LLMService = Depends(),
    db: Session = Depends(get_session),
) -> InterviewEvaluateResponse:
    _get_analysis_or_404(db, analysis_id)
    return await llm.evaluate_interview(req.question, req.transcript, req.gaps, round=1)
