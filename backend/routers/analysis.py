from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import APIRouter, Depends, Form, HTTPException, Response, UploadFile
from sqlmodel import Session, select

from core.database import get_session
from core.security import get_current_user
from models.db_models import Analysis, LeetcodeProblem, User
from models.schemas import (
    AnalysisCreateResponse,
    AnalysisDetailResponse,
    AnalysisListItem,
    AnalyzeResponse,
    EvaluateInterviewAnswerRequest,
    Gap,
    InterviewEvaluateResponse,
    InterviewRound,
    InterviewStartResponse,
    InterviewSummaryResponse,
    LeetCodeProblem,
    PitchCard,
    ResumeMeta,
    RoadmapTask,
    StrategicQuestion,
)
from services.llm_service import LLMService
from services.pdf_service import PDFService

router = APIRouter(tags=["analysis"])


def _get_analysis_or_404(db: Session, analysis_id: str, current_user: User) -> Analysis:
    analysis = db.get(Analysis, analysis_id)
    # Mesmo 404 para análise inexistente OU de outro usuário — não vazar a
    # existência de análises alheias.
    if analysis is None or analysis.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Análise não encontrada.")
    return analysis


async def get_or_generate(
    db: Session,
    analysis_id: str,
    field_name: str,
    generate_fn: Callable[[Analysis], Awaitable[Any]],
    current_user: User,
) -> Any:
    analysis = _get_analysis_or_404(db, analysis_id, current_user)

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
    current_user: User = Depends(get_current_user),
) -> AnalysisCreateResponse:
    resume_text, contents = await pdf_svc.extract_with_bytes(resume)

    analysis = Analysis(
        job_title=job_title,
        job_description=job_description,
        company_name=company_name,
        resume=contents,
        resume_text=resume_text,
        user_id=current_user.id,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return AnalysisCreateResponse(analysis_id=analysis.id)


@router.get("/analysis", response_model=list[AnalysisListItem])
def list_analyses(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[AnalysisListItem]:
    rows = db.exec(
        select(Analysis)
        .where(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
    ).all()
    return [
        AnalysisListItem(
            analysis_id=a.id,
            job_title=a.job_title,
            company_name=a.company_name,
            created_at=a.created_at,
            # match_score deriva do summary já gerado; null se ainda não existe.
            match_score=(a.summary or {}).get("match_score"),
        )
        for a in rows
    ]


@router.get("/analysis/{analysis_id}", response_model=AnalysisDetailResponse)
def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> AnalysisDetailResponse:
    analysis = _get_analysis_or_404(db, analysis_id, current_user)

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
    current_user: User = Depends(get_current_user),
) -> Response:
    analysis = _get_analysis_or_404(db, analysis_id, current_user)
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
    current_user: User = Depends(get_current_user),
) -> Any:
    async def generate(analysis: Analysis) -> dict:
        result = await llm.summarize_analysis(
            resume_text=analysis.resume_text,
            job_title=analysis.job_title,
            job_description=analysis.job_description,
        )
        return result.model_dump()

    return await get_or_generate(db, analysis_id, "summary", generate, current_user)


@router.get("/analysis/{analysis_id}/roadmap", response_model=list[RoadmapTask])
async def get_roadmap(
    analysis_id: str,
    llm: LLMService = Depends(),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    async def generate(analysis: Analysis) -> list[dict]:
        gaps = await _ensure_gaps(db, analysis, llm)
        tasks = await llm.generate_roadmap(gaps, analysis.job_title)
        return [t.model_dump() for t in tasks]

    return await get_or_generate(db, analysis_id, "roadmap", generate, current_user)


_TARGET_MIN = 6
_TARGET_MAX = 8


def _load_catalog(db: Session) -> dict[str, LeetcodeProblem]:
    rows = db.exec(select(LeetcodeProblem)).all()
    return {r.slug: r for r in rows}


def _canonical(row: LeetcodeProblem, reason: str) -> dict:
    return {
        "slug": row.slug,
        "title": row.title,
        "difficulty": row.difficulty,
        "category": row.category,
        "url": row.url,
        "description": row.description,
        "reason": reason,
    }


def _generic_reason(row: LeetcodeProblem) -> str:
    return f"Selecionado por cobrir {row.category}, alinhado aos seus gaps."


def _fallback_fill(
    selected: list[dict],
    catalog: dict[str, LeetcodeProblem],
    gaps_str: str,
) -> None:
    """Preenche `selected` até _TARGET_MIN: primeiro por match de categoria com os
    gaps (case-insensitive), depois pela ordem restante do catálogo."""
    chosen = {p["slug"] for p in selected}
    gaps_lower = gaps_str.lower()
    remaining = [r for slug, r in catalog.items() if slug not in chosen]

    by_match = [r for r in remaining if r.category.lower() in gaps_lower]
    others = [r for r in remaining if r.category.lower() not in gaps_lower]

    for row in by_match + others:
        if len(selected) >= _TARGET_MIN:
            break
        selected.append(_canonical(row, _generic_reason(row)))


async def _generate_problems(
    db: Session,
    analysis: Analysis,
    llm: LLMService,
    catalog: dict[str, LeetcodeProblem],
) -> list[dict]:
    gaps = await _ensure_gaps(db, analysis, llm)
    gaps_str = ", ".join(g.skill for g in gaps)
    compact = [
        {"slug": r.slug, "title": r.title, "difficulty": r.difficulty, "category": r.category}
        for r in catalog.values()
    ]

    try:
        raw = await llm.get_leetcode_problems(compact, gaps_str)
    except HTTPException:
        raw = []

    selected: list[dict] = []
    seen: set[str] = set()
    for item in raw:
        slug = item.get("slug")
        if slug in catalog and slug not in seen:
            seen.add(slug)
            reason = item.get("reason") or _generic_reason(catalog[slug])
            selected.append(_canonical(catalog[slug], reason))

    selected = selected[:_TARGET_MAX]
    if len(selected) < _TARGET_MIN:
        _fallback_fill(selected, catalog, gaps_str)
    return selected


def _hydrate(
    cached: list[dict],
    catalog: dict[str, LeetcodeProblem],
) -> tuple[list[dict], bool]:
    """Hidrata itens cacheados contra o catálogo por slug. Retorna
    (hidratados, stale). stale=True se algum item não tem url e não casa no catálogo."""
    hydrated: list[dict] = []
    for item in cached:
        row = catalog.get(item.get("slug"))
        if row is not None:
            hydrated.append(_canonical(row, item.get("reason") or _generic_reason(row)))
        elif item.get("url"):
            hydrated.append(item)
        else:
            return [], True
    return hydrated, False


@router.get("/analysis/{analysis_id}/code-challenges", response_model=list[LeetCodeProblem])
async def get_code_challenges(
    analysis_id: str,
    llm: LLMService = Depends(),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    catalog = _load_catalog(db)
    if not catalog:
        raise HTTPException(status_code=503, detail="catálogo LeetCode vazio")

    analysis = _get_analysis_or_404(db, analysis_id, current_user)
    cached = analysis.code_challenges

    if cached:
        hydrated, stale = _hydrate(cached, catalog)
        if not stale:
            if hydrated != cached:
                analysis.code_challenges = hydrated
                db.add(analysis)
                db.commit()
                db.refresh(analysis)
            return hydrated

    problems = await _generate_problems(db, analysis, llm, catalog)
    analysis.code_challenges = problems
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return problems


@router.get("/analysis/{analysis_id}/pitch", response_model=list[PitchCard])
async def get_pitch(
    analysis_id: str,
    llm: LLMService = Depends(),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    async def generate(analysis: Analysis) -> list[dict]:
        candidate_json = {"resume": analysis.resume_text}
        job_json = {"title": analysis.job_title, "description": analysis.job_description}
        cards = await llm.generate_pitch(candidate_json, job_json)
        return [c.model_dump() for c in cards]

    return await get_or_generate(db, analysis_id, "pitch", generate, current_user)


@router.get("/analysis/{analysis_id}/interview-questions", response_model=InterviewStartResponse)
async def get_interview_questions(
    analysis_id: str,
    llm: LLMService = Depends(),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    async def generate(analysis: Analysis) -> dict:
        gaps = await _ensure_gaps(db, analysis, llm)
        result = await llm.generate_interview_questions(
            [g.skill for g in gaps],
            analysis.id,
        )
        return result.model_dump()

    return await get_or_generate(
        db, analysis_id, "interview_questions", generate, current_user
    )


@router.get("/analysis/{analysis_id}/strategic-questions", response_model=list[StrategicQuestion])
async def get_strategic_questions(
    analysis_id: str,
    refresh: bool = False,
    llm: LLMService = Depends(),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
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
        analysis = _get_analysis_or_404(db, analysis_id, current_user)
        analysis.strategic_questions = await generate(analysis)
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis.strategic_questions

    return await get_or_generate(
        db, analysis_id, "strategic_questions", generate, current_user
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
    current_user: User = Depends(get_current_user),
) -> InterviewEvaluateResponse:
    analysis = _get_analysis_or_404(db, analysis_id, current_user)

    evaluation = await llm.evaluate_interview(
        req.question, req.transcript, req.gaps, round=req.round
    )

    # Upsert por round no histórico: refazer uma rodada substitui o item antigo
    # em vez de duplicar, mantendo no máximo 3 rodadas ordenadas.
    record = InterviewRound(
        round=req.round,
        question=req.question,
        transcript=req.transcript,
        evaluation=evaluation,
    ).model_dump()
    rounds = [r for r in (analysis.interview_rounds or []) if r["round"] != req.round]
    rounds.append(record)
    analysis.interview_rounds = sorted(rounds, key=lambda r: r["round"])
    db.add(analysis)
    db.commit()

    return evaluation


@router.get(
    "/analysis/{analysis_id}/interview-summary",
    response_model=InterviewSummaryResponse,
)
async def get_interview_summary(
    analysis_id: str,
    llm: LLMService = Depends(),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> InterviewSummaryResponse:
    analysis = _get_analysis_or_404(db, analysis_id, current_user)

    rounds = analysis.interview_rounds or []
    if not rounds:
        raise HTTPException(
            status_code=409,
            detail="Nenhuma rodada avaliada ainda — responda ao menos uma pergunta.",
        )

    # Gerado sob demanda (sem cache): refazer uma rodada deve refletir no resumo.
    return await llm.summarize_interview([InterviewRound(**r) for r in rounds])
