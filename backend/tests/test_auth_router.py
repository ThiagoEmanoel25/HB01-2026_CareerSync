import os
import unittest
from datetime import datetime, timedelta, timezone

os.environ.setdefault("OPENAI_API_KEY", "test-key")
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("JWT_SECRET", "test-secret")

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from core.config import settings
from core.database import get_session
from models.schemas import AnalyzeResponse, Gap
from routers import auth, context, interview
from routers.analysis import router as analysis_router
from services.llm_service import LLMService
from services.pdf_service import PDFService


class FakePDFService:
    async def extract_with_bytes(self, pdf_file: UploadFile) -> tuple[str, bytes]:
        contents = await pdf_file.read()
        return "Python developer resume text", contents


class FakeLLMService:
    async def summarize_analysis(self, resume_text, job_title, job_description) -> AnalyzeResponse:
        return AnalyzeResponse(
            match_score=82,
            gaps=[Gap(skill="SQLModel", level="moderate", reason="lacuna")],
            summary="resumo",
        )


class AuthRouterTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        SQLModel.metadata.create_all(self.engine)

        app = FastAPI()
        app.include_router(auth.router)
        app.include_router(analysis_router)
        app.include_router(context.router)
        app.include_router(interview.router)

        def get_test_session():
            with Session(self.engine) as session:
                yield session

        app.dependency_overrides[get_session] = get_test_session
        app.dependency_overrides[PDFService] = lambda: FakePDFService()
        app.dependency_overrides[LLMService] = lambda: FakeLLMService()

        self.client = TestClient(app)

    # --- helpers ---
    def _register(self, email="user@example.com", password="supersecret") -> dict:
        res = self.client.post("/auth/register", json={"email": email, "password": password})
        return res

    def _auth_header(self, token: str) -> dict:
        return {"Authorization": f"Bearer {token}"}

    def _create_analysis(self, token: str) -> str:
        res = self.client.post(
            "/analysis",
            headers=self._auth_header(token),
            data={
                "job_title": "Backend Engineer",
                "job_description": "Build FastAPI services",
                "company_name": "Acme",
            },
            files={"resume": ("resume.pdf", b"%PDF data", "application/pdf")},
        )
        self.assertEqual(res.status_code, 201)
        return res.json()["analysis_id"]

    # --- register ---
    def test_register_success_returns_token_and_user(self) -> None:
        res = self._register()
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertTrue(body["access_token"])
        self.assertEqual(body["token_type"], "bearer")
        self.assertEqual(body["user"]["email"], "user@example.com")

    def test_register_normalizes_email(self) -> None:
        self._register(email="  User@Example.com  ")
        # Mesmo email com caixa/espaço diferente é considerado duplicado.
        res = self._register(email="user@example.com")
        self.assertEqual(res.status_code, 409)

    def test_register_duplicate_email_returns_409(self) -> None:
        self._register()
        res = self._register()
        self.assertEqual(res.status_code, 409)
        self.assertEqual(res.json()["detail"], "Email já cadastrado.")

    def test_register_short_password_returns_422(self) -> None:
        res = self._register(password="short")
        self.assertEqual(res.status_code, 422)

    # --- login ---
    def test_login_success(self) -> None:
        self._register()
        res = self.client.post(
            "/auth/login", json={"email": "user@example.com", "password": "supersecret"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["access_token"])

    def test_login_wrong_password_returns_401(self) -> None:
        self._register()
        res = self.client.post(
            "/auth/login", json={"email": "user@example.com", "password": "wrongpass1"}
        )
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.json()["detail"], "Credenciais inválidas.")

    def test_login_unknown_email_returns_401(self) -> None:
        res = self.client.post(
            "/auth/login", json={"email": "nobody@example.com", "password": "supersecret"}
        )
        self.assertEqual(res.status_code, 401)

    # --- get_current_user ---
    def test_me_requires_auth(self) -> None:
        self.assertEqual(self.client.get("/auth/me").status_code, 401)

    def test_malformed_header_returns_401(self) -> None:
        res = self.client.get("/auth/me", headers={"Authorization": "Token abc"})
        self.assertEqual(res.status_code, 401)

    def test_expired_token_returns_401(self) -> None:
        token = jwt.encode(
            {"sub": "any", "exp": datetime.now(timezone.utc) - timedelta(days=1)},
            settings.jwt_secret,
            algorithm="HS256",
        )
        res = self.client.get("/auth/me", headers=self._auth_header(token))
        self.assertEqual(res.status_code, 401)

    def test_token_for_nonexistent_user_returns_401(self) -> None:
        token = jwt.encode(
            {"sub": "ghost", "exp": datetime.now(timezone.utc) + timedelta(days=1)},
            settings.jwt_secret,
            algorithm="HS256",
        )
        res = self.client.get("/auth/me", headers=self._auth_header(token))
        self.assertEqual(res.status_code, 401)

    # --- protected routes ---
    def test_protected_routes_require_auth(self) -> None:
        self.assertEqual(self.client.get("/analysis").status_code, 401)
        self.assertEqual(self.client.get("/context/some-gap").status_code, 401)
        self.assertEqual(
            self.client.post("/interview/tts", json={"question_text": "oi"}).status_code,
            401,
        )

    # --- isolation ---
    def test_user_cannot_access_other_users_analysis(self) -> None:
        token_a = self._register(email="a@example.com").json()["access_token"]
        token_b = self._register(email="b@example.com").json()["access_token"]
        analysis_id = self._create_analysis(token_a)

        # B não vê a análise de A (mesmo 404 que análise inexistente).
        for path in (f"/analysis/{analysis_id}", f"/analysis/{analysis_id}/summary"):
            res = self.client.get(path, headers=self._auth_header(token_b))
            self.assertEqual(res.status_code, 404)

        # A acessa normalmente.
        res = self.client.get(f"/analysis/{analysis_id}", headers=self._auth_header(token_a))
        self.assertEqual(res.status_code, 200)

    def test_list_returns_only_own_analyses(self) -> None:
        token_a = self._register(email="a@example.com").json()["access_token"]
        token_b = self._register(email="b@example.com").json()["access_token"]
        analysis_id = self._create_analysis(token_a)

        list_a = self.client.get("/analysis", headers=self._auth_header(token_a)).json()
        self.assertEqual([i["analysis_id"] for i in list_a], [analysis_id])

        list_b = self.client.get("/analysis", headers=self._auth_header(token_b)).json()
        self.assertEqual(list_b, [])


if __name__ == "__main__":
    unittest.main()
