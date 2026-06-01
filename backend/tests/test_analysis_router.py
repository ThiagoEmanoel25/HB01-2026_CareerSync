import os
import unittest

os.environ.setdefault("OPENAI_API_KEY", "test-key")
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("JWT_SECRET", "test-secret")

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from core.database import get_session
from core.security import get_current_user
from models.db_models import User
from models.schemas import AnalyzeResponse, Gap
from routers.analysis import router
from services.llm_service import LLMService
from services.pdf_service import PDFService

TEST_USER = User(id="test-user-id", email="tester@example.com", password_hash="x")


class FakePDFService:
    async def extract_with_bytes(self, pdf_file: UploadFile) -> tuple[str, bytes]:
        contents = await pdf_file.read()
        if not contents:
            raise HTTPException(status_code=422, detail="PDF enviado está vazio.")
        return "Python developer resume text", contents


class FakeLLMService:
    def __init__(self) -> None:
        self.calls = 0

    async def summarize_analysis(
        self,
        resume_text: str,
        job_title: str,
        job_description: str,
    ) -> AnalyzeResponse:
        self.calls += 1
        if resume_text != "Python developer resume text":
            raise AssertionError("summary must use stored extracted resume text")
        if job_title != "Backend Engineer":
            raise AssertionError("summary must use stored job title")
        if job_description != "Build FastAPI services":
            raise AssertionError("summary must use stored job description")

        return AnalyzeResponse(
            match_score=82,
            gaps=[
                Gap(
                    skill="SQLModel",
                    level="moderate",
                    reason="Currículo não demonstra uso direto de SQLModel.",
                )
            ],
            summary="Boa aderência para backend Python, com lacuna moderada em SQLModel.",
        )


class AnalysisRouterTest(unittest.TestCase):
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
        app.dependency_overrides[get_current_user] = lambda: TEST_USER

        self.client = TestClient(app)

    def create_analysis(self) -> str:
        response = self.client.post(
            "/analysis",
            data={
                "job_title": "Backend Engineer",
                "job_description": "Build FastAPI services",
                "company_name": "Acme Corp",
            },
            files={
                "resume": ("resume.pdf", b"%PDF lightweight resume", "application/pdf"),
            },
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertRegex(
            body["analysis_id"],
            r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
        )
        return body["analysis_id"]

    def test_create_analysis_persists_resume_metadata_and_download(self) -> None:
        analysis_id = self.create_analysis()

        detail_response = self.client.get(f"/analysis/{analysis_id}")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json(), {
            "job_title": "Backend Engineer",
            "job_description": "Build FastAPI services",
            "resume": {
                "filename": "resume.pdf",
                "content_type": "application/pdf",
                "url": f"/analysis/{analysis_id}/resume",
            },
        })

        resume_response = self.client.get(f"/analysis/{analysis_id}/resume")
        self.assertEqual(resume_response.status_code, 200)
        self.assertEqual(resume_response.headers["content-type"], "application/pdf")
        self.assertEqual(resume_response.content, b"%PDF lightweight resume")

    def test_summary_is_generated_once_and_cached(self) -> None:
        analysis_id = self.create_analysis()

        first_response = self.client.get(f"/analysis/{analysis_id}/summary")
        second_response = self.client.get(f"/analysis/{analysis_id}/summary")

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 200)
        self.assertEqual(first_response.json(), second_response.json())
        self.assertEqual(first_response.json()["match_score"], 82)
        self.assertEqual(first_response.json()["gaps"][0]["skill"], "SQLModel")
        self.assertEqual(self.fake_llm.calls, 1)

    def test_unknown_analysis_returns_404(self) -> None:
        response = self.client.get("/analysis/00000000-0000-0000-0000-000000000000")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Análise não encontrada.")

    def test_empty_pdf_returns_422(self) -> None:
        response = self.client.post(
            "/analysis",
            data={
                "job_title": "Backend Engineer",
                "job_description": "Build FastAPI services",
                "company_name": "Acme Corp",
            },
            files={
                "resume": ("resume.pdf", b"", "application/pdf"),
            },
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["detail"], "PDF enviado está vazio.")


if __name__ == "__main__":
    unittest.main()
