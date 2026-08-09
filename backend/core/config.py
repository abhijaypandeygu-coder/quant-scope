from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    environment: str = "development"
    database_url: str = "sqlite:///./quantscope.db"
    
    ai_provider: str = "gemini"
    ai_api_key: str | None = None
    
    fmp_api_key: str | None = None
    alpha_vantage_api_key: str | None = None
    polygon_api_key: str | None = None

    class Config:
        env_file = "../.env"

settings = Settings()
