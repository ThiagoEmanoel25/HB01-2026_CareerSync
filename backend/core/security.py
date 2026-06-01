"""Segurança de autenticação: hash de senha (bcrypt) e JWT (HS256).

Módulo isolado consumido por `routers/auth.py` e pelas rotas protegidas via a
dependency `get_current_user`. Sem refresh token — o access token vale
`settings.jwt_expire_days` dias (ver design da auth).
"""

from datetime import datetime, timedelta, timezone

from fastapi import Depends, Header, HTTPException
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session

from core.config import settings
from core.database import get_session
from models.db_models import User

_ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_expire_days)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=_ALGORITHM)


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_session),
) -> User:
    """Dependency de autenticação.

    Lê o header `Authorization: Bearer <token>`, decodifica o JWT e busca o
    usuário pelo claim `sub`. Retorna 401 (detail string, padrão do app) para
    qualquer falha — sem distinguir o motivo, para não vazar informação.
    """
    unauthorized = HTTPException(status_code=401, detail="Não autenticado.")

    if not authorization or not authorization.startswith("Bearer "):
        raise unauthorized
    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[_ALGORITHM])
    except JWTError:
        raise unauthorized

    user_id = payload.get("sub")
    if not user_id:
        raise unauthorized

    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    return user
