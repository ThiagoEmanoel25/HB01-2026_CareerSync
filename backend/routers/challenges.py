from fastapi import APIRouter, Depends

from models.schemas import (
    ChallengeDetail,
    ChallengeExample,
    ChallengeHintRequest,
    ChallengeHintResponse,
    ChallengeSubmitRequest,
    ChallengeSubmitResponse,
    ChallengeSummary,
    ChallengeTestFailure,
)
from services.challenges import CHALLENGES, Challenge, LocalPythonSubprocessRunner, RunResult, get_challenge
from services.llm_service import LLMService

router = APIRouter(prefix="/challenges", tags=["challenges"])


def _summary(challenge: Challenge) -> ChallengeSummary:
    return ChallengeSummary(
        slug=challenge.slug,
        title=challenge.title,
        difficulty=challenge.difficulty,
        category=challenge.category,
        reason=challenge.reason,
    )


def _detail(challenge: Challenge) -> ChallengeDetail:
    return ChallengeDetail(
        **_summary(challenge).model_dump(),
        description=challenge.description,
        function_name=challenge.function_name,
        signature=challenge.signature,
        examples=[
            ChallengeExample(input=example.input, expected=example.expected, explanation=example.explanation)
            for example in challenge.examples
        ],
        constraints=challenge.constraints,
    )


def _submit_response(result: RunResult) -> ChallengeSubmitResponse:
    return ChallengeSubmitResponse(
        passed=result.passed,
        status=result.status,
        total_tests=result.total_tests,
        passed_count=result.passed_count,
        first_failure=(
            ChallengeTestFailure(
                input=result.first_failure.input,
                expected=result.first_failure.expected,
                actual=result.first_failure.actual,
            )
            if result.first_failure is not None
            else None
        ),
        error=result.error,
    )


def get_runner() -> LocalPythonSubprocessRunner:
    return LocalPythonSubprocessRunner()


@router.get("", response_model=list[ChallengeSummary])
def list_challenges() -> list[ChallengeSummary]:
    return [_summary(challenge) for challenge in CHALLENGES]


@router.get("/{slug}", response_model=ChallengeDetail)
def challenge_detail(slug: str) -> ChallengeDetail:
    return _detail(get_challenge(slug))


@router.post("/{slug}/submit", response_model=ChallengeSubmitResponse)
def submit_challenge(
    slug: str,
    req: ChallengeSubmitRequest,
    runner: LocalPythonSubprocessRunner = Depends(get_runner),
) -> ChallengeSubmitResponse:
    challenge = get_challenge(slug)
    return _submit_response(runner.run(req.code, challenge))


@router.post("/{slug}/hint", response_model=ChallengeHintResponse)
async def challenge_hint(
    slug: str,
    req: ChallengeHintRequest,
    llm: LLMService = Depends(),
) -> ChallengeHintResponse:
    challenge = get_challenge(slug)
    hint = await llm.generate_challenge_hint(challenge, req.code)
    return ChallengeHintResponse(hint=hint)
