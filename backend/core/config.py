from pydantic_settings import BaseSettings
from typing import List, Union
import os

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ระบบสอบเข้าเพื่อสมัครงาน"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://recruitment_user:recruitment_pass@localhost:5432/recruitment_db")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Qdrant Vector Database
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    
    # Security
    SECRET_KEY: str = os.getenv("JWT_SECRET", "your_jwt_secret_key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:5173",
    ]
    
    # Google APIs
    GOOGLE_CREDENTIALS_PATH: str = os.getenv("GOOGLE_CREDENTIALS_PATH", "/app/credentials/google-credentials.json")
    
    # File Upload
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".mp4", ".webm"]
    
    # Face Detection
    FACE_DETECTION_MODEL_PATH: str = "/app/models/yolo/yolov4.h5"
    FACE_RECOGNITION_TOLERANCE: float = 0.6
    
    # n8n Integration
    N8N_API_URL: str = os.getenv("N8N_API_URL", "http://n8n:5678")
    N8N_WEBHOOK_URL: str = os.getenv("N8N_WEBHOOK_URL", "http://n8n:5678/webhook")
    
    # Exam Settings
    DEFAULT_EXAM_DURATION: int = 60  # minutes
    MIN_FACE_CONFIDENCE: float = 0.8
    MAX_ABSENT_PERCENTAGE: float = 20.0  # %
    SUSPICIOUS_ACTIVITY_THRESHOLD: float = 30.0  # %
    
    class Config:
        case_sensitive = True

settings = Settings() 