import os
import unittest

os.environ.setdefault("OPENAI_API_KEY", "test-key")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from core.database import get_session
from data.leetcode_seed import SEED_PROBLEMS, seed_leetcode
from models.db_models import Analysis, LeetcodeProblem
from models.schemas import AnalyzeResponse, Gap
from routers.analysis import router
from services.llm_service import LLMService
from services.pdf_service import PDFService


class FakePDFService:
    async def extract_with_bytes(self, pdf_file: UploadFile) -> tuple[str, bytes]:
        contents = await pdf_file.read()
        return "Python developer resume text", contents


class FakeLLMService:
    """LLM falso: retorna o que `problems_to_return` definir (lista de {slug, reason}).
    Se `raise_error` for True, levanta HTTPException como o serviço real faria."""

    def __init__(self) -> None:
        self.problems_to_return: list[dict] = []
        self.raise_error = False
        self.last_catalog: list[dict] | None = None

    async def summarize_analysis(self, resume_text, job_title, job_description) -> AnalyzeResponse:
        return AnalyzeResponse(
            match_score=70,
            gaps=[Gap(skill="Arrays", level="critical", reason="lacuna em arrays")],
            summary="resumo",
        )

    async def get_leetcode_problems(self, catalog: list[dict], gaps: str) -> list[dict]:
        self.last_catalog = catalog
        if self.raise_error:
            raise HTTPException(status_code=503, detail="IA indisponível")
        return self.problems_to_return


class CodeChallengesTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        SQLModel.metadata.create_all(self.engine)

        self.fake_llm = FakeLLMService()
        app = FastAPI()
        app.include_router(router)

        def get_test_session():
            with Session(self.engine) as session:
                yield session

        app.dependency_overrides[get_session] = get_test_session
        app.dependency_overrides[PDFService] = lambda: FakePDFService()
        app.dependency_overrides[LLMService] = lambda: self.fake_llm

        self.client = TestClient(app)

    def _seed(self) -> None:
        with Session(self.engine) as session:
            seed_leetcode(session)

    def _create_analysis(self) -> str:
        with Session(self.engine) as session:
            analysis = Analysis(
                job_title="Backend Engineer",
                job_description="Build services",
                resume=b"%PDF",
                resume_text="Python developer resume text",
            )
            session.add(analysis)
            session.commit()
            session.refresh(analysis)
            return analysis.id

    # --- Empty catalog -> 503 ---
    def test_empty_catalog_returns_503(self) -> None:
        analysis_id = self._create_analysis()
        response = self.client.get(f"/analysis/{analysis_id}/code-challenges")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "catálogo LeetCode vazio")

    # --- Invalid slug dropped + canonical fields from catalog ---
    def test_invalid_slug_dropped_and_canonical_fields(self) -> None:
        self._seed()
        analysis_id = self._create_analysis()
        # Um slug válido (com title falso da LLM) + um inválido.
        self.fake_llm.problems_to_return = [
            {"slug": "two-sum", "title": "TÍTULO FALSO DA LLM", "reason": "ajuda em arrays"},
            {"slug": "slug-que-nao-existe", "reason": "deve ser descartado"},
        ]
        response = self.client.get(f"/analysis/{analysis_id}/code-challenges")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        slugs = [p["slug"] for p in body]
        self.assertIn("two-sum", slugs)
        self.assertNotIn("slug-que-nao-existe", slugs)
        two_sum = next(p for p in body if p["slug"] == "two-sum")
        # Campos canônicos vêm do catálogo, não do payload da LLM.
        self.assertEqual(two_sum["title"], "Two Sum")
        self.assertEqual(two_sum["url"], "https://leetcode.com/problems/two-sum/")
        self.assertEqual(two_sum["reason"], "ajuda em arrays")

    # --- Deterministic fallback fills to target when LLM returns too few ---
    def test_fallback_fills_to_minimum(self) -> None:
        self._seed()
        analysis_id = self._create_analysis()
        self.fake_llm.problems_to_return = [
            {"slug": "two-sum", "reason": "ajuda"},
        ]
        response = self.client.get(f"/analysis/{analysis_id}/code-challenges")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertGreaterEqual(len(body), 6)
        # nenhum slug duplicado
        slugs = [p["slug"] for p in body]
        self.assertEqual(len(slugs), len(set(slugs)))

    # --- LLM error -> fallback still produces results ---
    def test_llm_error_falls_back(self) -> None:
        self._seed()
        analysis_id = self._create_analysis()
        self.fake_llm.raise_error = True
        response = self.client.get(f"/analysis/{analysis_id}/code-challenges")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 6)

    # --- Cache hydration: old item without url -> hydrated with canonical url ---
    def test_cache_hydration_adds_url(self) -> None:
        self._seed()
        analysis_id = self._create_analysis()
        # Simula cache antigo sem url/description.
        with Session(self.engine) as session:
            analysis = session.get(Analysis, analysis_id)
            analysis.code_challenges = [
                {"slug": "two-sum", "title": "Two Sum", "difficulty": "Easy",
                 "category": "Arrays", "reason": "antigo"}
            ]
            session.add(analysis)
            session.commit()

        response = self.client.get(f"/analysis/{analysis_id}/code-challenges")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body), 1)
        self.assertEqual(body[0]["url"], "https://leetcode.com/problems/two-sum/")
        self.assertEqual(body[0]["description"], "Encontre os índices de dois números que somam um alvo.")

    # --- Stale cache (no url, no catalog match) -> regenerated ---
    def test_stale_cache_regenerated(self) -> None:
        self._seed()
        analysis_id = self._create_analysis()
        with Session(self.engine) as session:
            analysis = session.get(Analysis, analysis_id)
            analysis.code_challenges = [
                {"slug": "slug-fantasma", "title": "Fantasma", "difficulty": "Easy",
                 "category": "Arrays", "reason": "sem url e sem catálogo"}
            ]
            session.add(analysis)
            session.commit()

        self.fake_llm.problems_to_return = [{"slug": "two-sum", "reason": "regenerado"}]
        response = self.client.get(f"/analysis/{analysis_id}/code-challenges")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        slugs = [p["slug"] for p in body]
        self.assertNotIn("slug-fantasma", slugs)
        self.assertIn("two-sum", slugs)
        self.assertTrue(all(p["url"] for p in body))

    # --- Seed idempotency ---
    def test_seed_idempotent(self) -> None:
        self._seed()
        self._seed()
        with Session(self.engine) as session:
            rows = session.exec(select(LeetcodeProblem)).all()
        self.assertEqual(len(rows), len(SEED_PROBLEMS))


if __name__ == "__main__":
    unittest.main()
