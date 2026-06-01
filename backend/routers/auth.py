"""Rotas de autenticação: registro, login e perfil do usuário logado."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from core.database import get_session
from core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from models.db_models import User
from models.schemas import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserPublic,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _normalize_email(email: str) -> str:
    # Normaliza para evitar contas duplicadas por caixa/espaços (User@X vs user@x).
    return email.strip().lower()


def _auth_response(user: User) -> AuthResponse:
    return AuthResponse(
        access_token=create_access_token(user.id),
        user=UserPublic(id=user.id, email=user.email),
    )


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(
    body: RegisterRequest,
    db: Session = Depends(get_session),
) -> AuthResponse:
    email = _normalize_email(body.email)
    existing = db.exec(select(User).where(User.email == email)).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="Email já cadastrado.")

    user = User(email=email, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return _auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login(
    body: LoginRequest,
    db: Session = Depends(get_session),
) -> AuthResponse:
    email = _normalize_email(body.email)
    user = db.exec(select(User).where(User.email == email)).first()
    # Mensagem genérica: não revelar se o email existe ou se a senha está errada.
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")
    return _auth_response(user)


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)) -> UserPublic:
    return UserPublic(id=current_user.id, email=current_user.email)
