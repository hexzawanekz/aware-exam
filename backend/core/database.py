from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.config import settings
import os

# Force SQLite for now since PostgreSQL is not available
print("🔄 Using SQLite database")
sqlite_url = "sqlite:///./recruitment_exam.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

# Commented out PostgreSQL connection for now
# try:
#     # Try PostgreSQL first
#     engine = create_engine(settings.DATABASE_URL)
#     # Test connection
#     with engine.connect() as conn:
#         pass
#     print("✅ Connected to PostgreSQL database")
# except Exception as e:
#     print(f"⚠️ PostgreSQL connection failed: {e}")
#     print("🔄 Falling back to SQLite database")
#     # Use SQLite as fallback
#     sqlite_url = "sqlite:///./recruitment_exam.db"
#     engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 