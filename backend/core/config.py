from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str
    supabase_url: str = ""
    supabase_key: str = ""
    database_url: str = ""
    environment: str = "development"
    code_runner: str = "local"
    max_code_bytes: int = 10000
    code_runner_timeout_seconds: float = 5.0
    max_runner_output_bytes: int = 20000
    # Timeout (segundos, httpx) aplicado a todas as chamadas LLM/TTS da OpenAI.
    llm_timeout_seconds: float = 30.0
    # Observabilidade — opcional no hackathon. Vazio = Sentry desativado.
    sentry_dsn: str = ""
    # Auth JWT (HS256). jwt_secret é obrigatório; jwt_expire_days controla a
    # validade do access token (sem refresh token — ver design da auth).
    jwt_secret: str
    jwt_expire_days: int = 7

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
