from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "AI Career Advisor"
    environment: str = "development"
    log_level: str = "INFO"

    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4o"
    openai_embedding_model: str = "text-embedding-3-small"

    # Gemini
    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "models/text-embedding-004"

    # Tavily
    tavily_api_key: str

    # Database — PostgreSQL handles everything (sessions + vectors + cache)
    database_url: str = "postgresql+asyncpg://career_user:career_pass@localhost:5432/career_db"
    database_url_sync: str = "postgresql://career_user:career_pass@localhost:5432/career_db"

    # Tavily cache TTL (stored in PostgreSQL market_cache table)
    market_cache_ttl_hours: int = 24

    # Vector
    embedding_dimension: int = 1536

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
