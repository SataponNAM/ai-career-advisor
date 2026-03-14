from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"  # ป้องกัน error ถ้า .env มี variable อื่น
    )
    
    # App
    app_name: str = "AI Career Advisor"
    environment: str = "development"
    log_level: str = "INFO"

    # Gemini
    gemini_api_key: str
    gemini_model: str = "gemini-3.1-flash-lite"
    gemini_embedding_model: str = "models/text-embedding-004"

    # Tavily
    tavily_api_key: str

    # In-memory Tavily cache TTL (resets on restart)
    cache_ttl_seconds: int = 86400  # 24hr
   

@lru_cache()
def get_settings() -> Settings:
    return Settings()

print("Settings loaded successfully")