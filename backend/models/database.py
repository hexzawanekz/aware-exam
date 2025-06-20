from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    departments = relationship("Department", back_populates="company", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="departments")
    positions = relationship("Position", back_populates="department", cascade="all, delete-orphan")

class Position(Base):
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    department = relationship("Department", back_populates="positions")
    exam_templates = relationship("ExamTemplate", back_populates="position", cascade="all, delete-orphan")

class ExamTemplate(Base):
    __tablename__ = "exam_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    position_id = Column(Integer, ForeignKey("positions.id"), nullable=False)
    programming_language = Column(String(100), nullable=True)
    duration_minutes = Column(Integer, default=60)
    questions = Column(JSON, nullable=True)  # Store questions as JSON
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    position = relationship("Position", back_populates="exam_templates")
    exam_sessions = relationship("ExamSession", back_populates="exam_template")

class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    exam_sessions = relationship("ExamSession", back_populates="candidate")

class ExamSession(Base):
    __tablename__ = "exam_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    exam_template_id = Column(Integer, ForeignKey("exam_templates.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="scheduled")  # scheduled, in_progress, completed, cancelled
    answers = Column(JSON, nullable=True)  # Store answers as JSON
    score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    candidate = relationship("Candidate", back_populates="exam_sessions")
    exam_template = relationship("ExamTemplate", back_populates="exam_sessions")
    proctoring_logs = relationship("ProctoringLog", back_populates="exam_session")

class ProctoringLog(Base):
    __tablename__ = "proctoring_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_session_id = Column(Integer, ForeignKey("exam_sessions.id"), nullable=False)
    event_type = Column(String(100), nullable=False)  # face_detection, tab_switch, copy_paste, etc.
    event_data = Column(JSON, nullable=True)  # Additional event data
    timestamp = Column(DateTime, default=datetime.utcnow)
    severity = Column(String(20), default="info")  # info, warning, critical
    
    # Relationships
    exam_session = relationship("ExamSession", back_populates="proctoring_logs")

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 