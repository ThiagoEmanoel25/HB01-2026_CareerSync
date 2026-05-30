import json
import logging
from collections import Counter

from fastapi import HTTPException
from openai import AsyncOpenAI, OpenAIError

from core.config import settings
from models.schemas import (
    AnalyzeResponse,
    ContextResponse,
    Gap,
    InterviewEvaluateResponse,
    InterviewStartResponse,
    LeetCodeEvaluateResponse,
    LeetCodeProblem,
    PitchCard,
    RoadmapTask,
    StrategicQuestion,
)
from services.prompts import (
    ANALYZE_SYSTEM_PROMPT,
    CONTEXT_SYSTEM_PROMPT,
    INTERVIEW_EVAL_SYSTEM_PROMPT,
    INTERVIEW_QUESTIONS_SYSTEM_PROMPT,
    LEETCODE_EVAL_SYSTEM_PROMPT,
    LEETCODE_SYSTEM_PROMPT,
    PITCH_SYSTEM_PROMPT,
    ROADMAP_SYSTEM_PROMPT,
    STRATEGIC_QUESTIONS_SYSTEM_PROMPT,
)

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self) -> None:
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4o-mini"

    async def _chat_json(self, system: str, user: str) -> dict:
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                timeout=30,
            )
            choice = response.choices[0]

            # finish_reason "length" ou "content_filter" resulta em content=None.
            # A SDK não lança exceção nesses casos — precisamos detectar explicitamente.
            if choice.message.content is None:
                finish_reason = choice.finish_reason
                raise HTTPException(
                    status_code=502,
                    detail=f"Resposta truncada ou bloqueada pelo serviço de IA (finish_reason={finish_reason}).",
                )

            return json.loads(choice.message.content)
        except OpenAIError:
            raise HTTPException(status_code=503, detail="Serviço de IA indisponível. Tente novamente.")
        except json.JSONDecodeError:
            raise HTTPException(status_code=502, detail="Resposta inválida do serviço de IA.")

    async def analyze(self, candidate_text: str, job_text: str) -> AnalyzeResponse:
        data = await self._chat_json(
            ANALYZE_SYSTEM_PROMPT,
            f"Candidato:\n{candidate_text}\n\nVaga:\n{job_text}",
        )
        return AnalyzeResponse(**data)

    async def summarize_analysis(
        self,
        resume_text: str,
        job_title: str,
        job_description: str,
    ) -> AnalyzeResponse:
        data = await self._chat_json(
            ANALYZE_SYSTEM_PROMPT,
            "\n\n".join([
                f"<job_title>\n{job_title}\n</job_title>",
                f"<job_description>\n{job_description}\n</job_description>",
                f"<user_resume>\n{resume_text}\n</user_resume>",
            ]),
        )
        return AnalyzeResponse(**data)

    def _validate_roadmap(self, tasks: list[RoadmapTask], gaps: list[Gap]) -> None:
        valid_categories = {"conceito", "pratica", "revisao"}
        valid_gap_ids = {g.id for g in gaps}

        tasks_per_day: Counter[int] = Counter(t.day for t in tasks)
        for day, count in tasks_per_day.items():
            if count > 2:
                logger.warning("Roadmap inválido: dia %d tem %d tarefas", day, count)
                raise HTTPException(
                    status_code=502,
                    detail=f"Roadmap inválido: dia {day} tem {count} tarefas (máximo 2).",
                )

        critical_ids = {g.id for g in gaps if g.level == "critical"}
        covered_ids = {t.gap_id for t in tasks}
        missing = critical_ids - covered_ids
        if missing:
            logger.warning("Roadmap inválido: gaps críticos ausentes: %s", missing)
            raise HTTPException(
                status_code=502,
                detail="Roadmap inválido: nem todos os gaps críticos foram cobertos.",
            )

        for t in tasks:
            if t.category not in valid_categories:
                logger.warning("Roadmap inválido: categoria '%s'", t.category)
                raise HTTPException(
                    status_code=502,
                    detail=f"Roadmap inválido: categoria '{t.category}' não é permitida.",
                )
            if t.gap_id not in valid_gap_ids:
                logger.warning("Roadmap inválido: gap_id '%s' não corresponde a nenhum gap", t.gap_id)
                raise HTTPException(
                    status_code=502,
                    detail=f"Roadmap inválido: gap_id '{t.gap_id}' não corresponde a nenhum gap de entrada.",
                )

    async def generate_roadmap(self, gaps: list[Gap], job_title: str) -> list[RoadmapTask]:
        gaps_json = json.dumps([g.model_dump() for g in gaps], ensure_ascii=False)
        data = await self._chat_json(
            ROADMAP_SYSTEM_PROMPT,
            f"Job title: {job_title}\n\nGaps:\n{gaps_json}",
        )
        tasks = [RoadmapTask(**t) for t in data.get("tasks", [])]
        self._validate_roadmap(tasks, gaps)
        return tasks

    async def get_context(self, skill: str) -> ContextResponse:
        data = await self._chat_json(
            CONTEXT_SYSTEM_PROMPT,
            f"Skill: {skill}",
        )
        return ContextResponse(**data)

    async def get_leetcode_problems(self, stack: str, seniority: str, gaps: str) -> list[LeetCodeProblem]:
        data = await self._chat_json(
            LEETCODE_SYSTEM_PROMPT,
            f"Stack: {stack}\nSeniority: {seniority}\nGaps: {gaps}",
        )
        # Chave "problems" agora é explícita no prompt — contrato determinista.
        problems = data.get("problems", [])
        return [LeetCodeProblem(**p) for p in problems]

    async def evaluate_leetcode(self, slug: str, title: str, description: str, solution: str, language: str) -> LeetCodeEvaluateResponse:
        data = await self._chat_json(
            LEETCODE_EVAL_SYSTEM_PROMPT,
            f"Problem: {title} ({slug})\nDescription:\n{description}\nLanguage: {language}\nSolution:\n{solution}",
        )
        return LeetCodeEvaluateResponse(**data)

    async def generate_pitch(self, candidate_json: dict, job_json: dict) -> list[PitchCard]:
        # json já está importado no topo do módulo — import local era desnecessário.
        data = await self._chat_json(
            PITCH_SYSTEM_PROMPT,
            f"Candidato:\n{json.dumps(candidate_json, ensure_ascii=False)}\n\nVaga:\n{json.dumps(job_json, ensure_ascii=False)}",
        )
        # Chave "cards" agora é explícita no prompt — contrato determinista.
        cards = data.get("cards", [])
        return [PitchCard(**c) for c in cards]

    async def generate_strategic_questions(
        self,
        job_title: str,
        job_description: str,
        company_name: str,
    ) -> list[StrategicQuestion]:
        data = await self._chat_json(
            STRATEGIC_QUESTIONS_SYSTEM_PROMPT,
            "\n\n".join([
                f"<company_name>\n{company_name}\n</company_name>",
                f"<job_title>\n{job_title}\n</job_title>",
                f"<job_description>\n{job_description}\n</job_description>",
            ]),
        )
        # Chave "questions" é explícita no prompt — contrato determinista.
        questions = data.get("questions", [])
        return [StrategicQuestion(**q) for q in questions]

    async def generate_interview_questions(self, gaps: list[str], session_id: str) -> InterviewStartResponse:
        data = await self._chat_json(
            INTERVIEW_QUESTIONS_SYSTEM_PROMPT,
            f"Session: {session_id}\nGaps: {', '.join(gaps)}",
        )
        return InterviewStartResponse(**data)

    async def evaluate_interview(self, question: str, transcript: str, gaps: list[str], round: int) -> InterviewEvaluateResponse:
        data = await self._chat_json(
            INTERVIEW_EVAL_SYSTEM_PROMPT,
            f"Round: {round}\nGaps: {', '.join(gaps)}\nQuestion: {question}\nAnswer: {transcript}",
        )
        return InterviewEvaluateResponse(**data)
