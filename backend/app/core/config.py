from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hospital Operations Management System"
    DATABASE_URL: str = "postgresql://postgres:postgres123@127.0.0.1:5432/hospital_ops"
    SECRET_KEY: str = "your-super-secret-key-that-should-be-changed"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "admin@hospital.com"
    PUBLIC_URL: str = "http://localhost:5173" # Default to frontend local url for now, but will be overridden in prod

    class Config:
        env_file = ".env"

settings = Settings()
