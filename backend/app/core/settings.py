from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "SEOSmartReport"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "sqlite:///./dev.db"

    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: "Optional[str]" = None
    celery_result_backend: "Optional[str]" = None

    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_exp_minutes: int = 60 * 24

    # OAuth placeholders
    yandex_client_id: "Optional[str]" = None
    yandex_client_secret: "Optional[str]" = None
    google_client_id: "Optional[str]" = None
    google_client_secret: "Optional[str]" = None

    # Storage placeholders
    s3_endpoint: "Optional[str]" = None
    s3_bucket: "Optional[str]" = None
    reports_dir: str = "storage/reports"

    # AI provider placeholders
    llm_provider: str = "openai"
    llm_api_key: "Optional[str]" = None
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str = "https://api.openai.com/v1"

    topvisor_user_id: "Optional[str]" = None
    topvisor_api_key: "Optional[str]" = None


settings = Settings()
