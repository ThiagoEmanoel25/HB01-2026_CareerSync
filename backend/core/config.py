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

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
