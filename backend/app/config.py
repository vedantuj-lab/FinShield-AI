"""
Configuration settings for FinShield AI backend
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/finshield_db"

    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API Keys
    GEMINI_API_KEY: str = ""

    # Admin Setup
    ADMIN_EMAIL: str = "admin@finshield.ai"
    ADMIN_PASSWORD: str = "admin123"

    # URLs
    FRONTEND_URL: str = "http://localhost:5173"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
