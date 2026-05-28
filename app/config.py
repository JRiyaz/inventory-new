from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "sqlite+aiosqlite:///data/inventory.db"
    JWT_SECRET: str = "8f4a7c2e9b0d1e3f5a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    ENVIRONMENT: str = "development"
    PORT: int = 3000

    # Configurable Database bootstrapping flags
    DB_CREATE_TABLES: bool = True
    DB_OVERWRITE_TABLES: bool = False

    # Configurable Rate limiter settings
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 120
    RATE_LIMIT_WINDOW_SECONDS: int = 60


settings = Settings()
