from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base
from typing import Optional
import uuid

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    departments = relationship("Department", back_populates="company")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    company = relationship("Company", back_populates="departments")
    positions = relationship("Position", back_populates="department")

class Position(Base):
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    programming_languages = Column(JSON, nullable=True)  # ["Python", "JavaScript", "Java"]
    required_skills = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    department = relationship("Department", back_populates="positions")
    exam_templates = relationship("ExamTemplate", back_populates="position")

class ExamTemplate(Base):
    __tablename__ = "exam_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    position_id = Column(Integer, ForeignKey("positions.id"))
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    programming_language = Column(String(50), nullable=False, index=True)
    duration_minutes = Column(Integer, default=60)
    google_form_id = Column(String(255), nullable=True)  # สำหรับ import จาก Google Form
    questions = Column(JSON, nullable=True)  # เก็บข้อสอบ
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    position = relationship("Position", back_populates="exam_templates")
    exam_sessions = relationship("ExamSession", back_populates="exam_template")

class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    face_encoding = Column(JSON, nullable=True)  # เก็บ face encoding สำหรับ face recognition
    face_image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    exam_sessions = relationship("ExamSession", back_populates="candidate")

class ExamSession(Base):
    __tablename__ = "exam_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    exam_template_id = Column(Integer, ForeignKey("exam_templates.id"))
    
    # Exam Status
    status = Column(String(20), default="pending")  # pending, in_progress, completed, terminated
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    score = Column(Float, nullable=True)
    
    # Anti-Cheat Data
    video_recording_url = Column(String(500), nullable=True)
    suspicious_activities = Column(JSON, nullable=True)  # เก็บ timestamps ของกิจกรรมน่าสงสัย
    face_verification_count = Column(Integer, default=0)
    absent_frames_count = Column(Integer, default=0)
    phone_detection_count = Column(Integer, default=0)
    tab_switch_count = Column(Integer, default=0)
    fullscreen_exit_count = Column(Integer, default=0)
    
    # Answers
    answers = Column(JSON, nullable=True)
    randomized_questions = Column(JSON, nullable=True)  # คำถามที่ random แล้ว
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    candidate = relationship("Candidate", back_populates="exam_sessions")
    exam_template = relationship("ExamTemplate", back_populates="exam_sessions")
    proctoring_logs = relationship("ProctoringLog", back_populates="exam_session")

class ProctoringLog(Base):
    __tablename__ = "proctoring_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_session_id = Column(Integer, ForeignKey("exam_sessions.id"))
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    event_type = Column(String(50), nullable=False)  # face_lost, phone_detected, tab_switch, etc.
    confidence = Column(Float, nullable=True)
    event_metadata = Column(JSON, nullable=True)  # เพิ่มเติมข้อมูลต่างๆ
    screenshot_url = Column(String(500), nullable=True)
    
    exam_session = relationship("ExamSession", back_populates="proctoring_logs")

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 