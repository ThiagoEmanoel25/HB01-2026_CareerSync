# Autenticação por email + senha (JWT) — Design

**Data:** 2026-05-31
**Status:** Aprovado para planejamento

## Objetivo

Adicionar registro e login simples (apenas email + senha) ao Prep AI, protegendo o
app com JWT. Após o registro, o usuário é redirecionado para a tela de fazer
análise (`/new`). As análises passam a ser **por usuário**: cada usuário só vê e
acessa as próprias análises.

## Decisões (travadas com o usuário)

| Tópico | Decisão |
|--------|---------|
| Escopo | Dados por usuário — `Analysis` ganha `user_id` (dono) |
| Token storage (frontend) | `localStorage` + header `Authorization: Bearer` |
| Validade do token | Access token único, expira em 7 dias, sem refresh token |
| Regras de senha | Mínimo 8 caracteres, hash bcrypt |
| Histórico | Novo `GET /analysis` server-side filtrando por `user_id` |
| Dados legados | `user_id` nullable — análises antigas ficam órfãs (ninguém vê) |
| Libs backend | `passlib[bcrypt]` (hash) + `python-jose` (JWT HS256) |
| Arquitetura | Abordagem A — módulo de auth isolado |

## Stack atual (contexto)

- **Backend:** FastAPI + SQLModel, estrutura `core/` `models/` `routers/` `services/`.
  Sem auth hoje. Migração leve idempotente via `core/database.py::_ensure_columns()`
  (projeto não usa Alembic).
- **Frontend:** Vite + React 19 + TypeScript + Tailwind, React Router v6,
  React Query, Zustand (persist em localStorage). Cliente HTTP central em
  `frontend/src/lib/api.ts` (`apiRequest`, retry 1x em GET, `ApiError`).

## Arquitetura — Abordagem A (módulo isolado)

Novos arquivos backend:
- `core/security.py` — hash de senha, criação/decodificação de JWT, dependency
  `get_current_user`.
- `routers/auth.py` — rotas `/auth/register`, `/auth/login`, `/auth/me`.
- `models/user.py` (ou adicionar `User` em `models/db_models.py`).
- Schemas de auth em `models/schemas.py`.

Novos arquivos frontend:
- `store/auth.ts` — estado de autenticação (zustand persist).
- `pages/Login/index.tsx`, `pages/Register/index.tsx`.

---

## Seção 1 — Modelo de dados & migração

**Nova tabela `User`:**

```python
class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

**`Analysis` ganha dono:**

```python
user_id: str | None = Field(default=None, foreign_key="user.id", index=True)
```

- Nullable → análises legadas viram órfãs, zero migração de dados.
- Coluna garantida de forma idempotente: adicionar `"user_id": "VARCHAR"` ao dict
  `_ANALYSIS_COLUMNS_TO_ENSURE` em `core/database.py`.
- A tabela `user` é criada por `SQLModel.metadata.create_all()` (já chamado no
  lifespan). Garantir que `models.user` seja importado antes de `create_all`
  (como já é feito com `import models.db_models` em `main.py`).

## Seção 2 — Segurança / JWT (`core/security.py`)

- `hash_password(plain) -> str` e `verify_password(plain, hash) -> bool` via
  passlib `CryptContext(schemes=["bcrypt"])`.
- `create_access_token(user_id: str) -> str` — JWT HS256, claims `sub=user_id`,
  `exp=now + jwt_expire_days`. Assinado com `settings.jwt_secret`.
- `get_current_user(authorization: header, db: Session) -> User` — dependency:
  lê `Authorization: Bearer <token>`, decodifica, busca o `User` pelo `sub`.
  Retorna 401 (`detail` string, padrão do app) se: header ausente/malformado,
  token inválido, token expirado, ou usuário inexistente.

**Novos settings** (`core/config.py`):
- `jwt_secret: str` (obrigatório).
- `jwt_expire_days: int = 7`.
- `.env.example` ganha `JWT_SECRET=`.

## Seção 3 — Rotas de auth (`routers/auth.py`)

Prefixo `/auth`, registrado em `main.py` via `app.include_router(auth.router)`.

- `POST /auth/register` — body `{ email, password }`.
  - Valida formato de email (pydantic `EmailStr`) e senha ≥ 8 chars.
  - Email já existente → **409**.
  - Cria usuário (senha com hash), retorna
    `{ access_token, token_type: "bearer", user: { id, email } }`.
- `POST /auth/login` — body `{ email, password }`.
  - Credenciais inválidas (email não existe OU senha errada) → **401**, mesma
    mensagem genérica (não revelar qual falhou).
  - Sucesso → mesmo shape do register.
- `GET /auth/me` — `Depends(get_current_user)` → `{ id, email }`.

Schemas novos em `models/schemas.py`: `RegisterRequest`, `LoginRequest`,
`AuthResponse`, `UserPublic`.

`requirements.txt`: adicionar `passlib[bcrypt]`, `python-jose[cryptography]`,
`email-validator` (para `EmailStr`).

## Seção 4 — Analysis por usuário (`routers/analysis.py`)

- `POST /analysis` ganha `Depends(get_current_user)` e grava `user_id` na criação.
- `_get_analysis_or_404` passa a receber o `current_user` e valida
  `analysis.user_id == current_user.id`; caso contrário → **404** (não vaza
  existência de análise de outro usuário). Todas as rotas `/analysis/{id}` e
  `/analysis/{id}/*` aplicam essa checagem.
- **Novo** `GET /analysis` → lista análises do usuário logado, ordenadas por
  `created_at desc`. Cada item: `{ analysis_id, job_title, company_name,
  created_at, match_score }` (match_score derivado de `summary`, `null` se ainda
  não gerado).

## Seção 5 — Frontend

- `store/auth.ts` (zustand persist, key `prep-ai-auth`): estado `token`, `user`;
  ações `setAuth(token, user)`, `logout()`.
- `lib/api.ts`:
  - Helper que injeta `Authorization: Bearer <token>` (lido do store) em toda
    requisição.
  - Resposta **401** → `logout()` + redirect para `/login`.
  - Novos hooks: `useRegister`, `useLogin`, `useMe`, `useAnalysisList`.
- `pages/Login` e `pages/Register`: form email + senha, estilo Tailwind existente
  (`#171717` / `#202020` / `#3ecf8e`). Erros via toast (padrão atual). Register
  com sucesso → `setAuth` → redirect **`/new`**. Login com sucesso → `/new`.
  Link cruzado entre as duas telas.
- `router.tsx`:
  - `RequireAuth` (novo) — sem token → `<Navigate to="/login">`. Envolve o grupo
    de rotas do app. `RequireAnalysis` permanece aninhado dentro.
  - Rotas públicas `/login` e `/register` (fora do `Layout` autenticado).
- `components/Sidebar`: mostra email do usuário + botão logout.
- `HistoryList`: consome `useAnalysisList` (server) em vez do `history` do
  localStorage. O `history` local do `store/session.ts` deixa de ser fonte de
  verdade da lista.

## Testes (backend, pytest)

- **register:** sucesso (201/200 + token); email duplicado → 409; senha < 8 → 422.
- **login:** sucesso; senha errada → 401; email inexistente → 401.
- **get_current_user:** sem header → 401; token malformado → 401; token expirado
  → 401; usuário inexistente → 401.
- **isolamento:** usuário A não acessa (`GET /analysis/{id}` e sub-rotas) análise
  criada por usuário B → 404; `GET /analysis` só retorna as próprias.

## Fora de escopo (YAGNI)

- Refresh token, logout server-side / blacklist de tokens.
- Reset de senha, verificação de email, OAuth/social login.
- Roles/permissões além de "dono da análise".
- Migração de análises órfãs para usuários.
