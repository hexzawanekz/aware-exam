from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
import json

from core.database import get_db
from models.exam import Candidate, ExamSession, ExamTemplate, Position, Department, Company
from pydantic import BaseModel
from services.exam_evaluation import ScoreCalculationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/candidate", tags=["candidate"])

# Pydantic models
class CandidateLogin(BaseModel):
    email: str
    phone: str

class CandidateResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    
    class Config:
        from_attributes = True

class ExamAssignmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    duration_minutes: int
    position_name: Optional[str] = None
    department_name: Optional[str] = None
    company_name: Optional[str] = None
    status: str
    scheduled_date: Optional[str] = None
    questions_count: int

# Helper function to normalize phone number
def normalize_phone(phone: str) -> str:
    """Remove all non-digit characters from phone number"""
    import re
    return re.sub(r'[^\d]', '', phone)

# Candidate Authentication
@router.post("/login")
async def candidate_login(login_data: CandidateLogin, db: Session = Depends(get_db)):
    """Authenticate candidate using email and phone number"""
    # Normalize phone number (remove dashes, spaces, parentheses, etc.)
    normalized_input_phone = normalize_phone(login_data.phone)
    logger.info(f"Login attempt - Email: '{login_data.email}', Phone: '{login_data.phone}' (normalized: '{normalized_input_phone}')")
    
    # Get all candidates with matching email first
    candidates = db.query(Candidate).filter(Candidate.email == login_data.email).all()
    
    candidate = None
    for c in candidates:
        normalized_db_phone = normalize_phone(c.phone or "")
        logger.info(f"Comparing phones: input='{normalized_input_phone}' vs db='{normalized_db_phone}'")
        if normalized_input_phone == normalized_db_phone:
            candidate = c
            break
    
    if not candidate:
        logger.warning(f"Login failed - No candidate found for email: '{login_data.email}', phone: '{login_data.phone}'")
        # Debug: Check all candidates
        all_candidates = db.query(Candidate).all()
        logger.info(f"Total candidates in DB: {len(all_candidates)}")
        for c in all_candidates:
            logger.info(f"DB candidate: email='{c.email}', phone='{c.phone}'")
        raise HTTPException(status_code=401, detail="อีเมลหรือเบอร์โทรศัพท์ไม่ถูกต้อง")
    
    return {
        "message": "เข้าสู่ระบบสำเร็จ",
        "candidate": {
            "id": candidate.id,
            "first_name": candidate.first_name,
            "last_name": candidate.last_name,
            "email": candidate.email,
            "phone": candidate.phone
        }
    }

# Get assigned exams for candidate
@router.get("/exams/{candidate_id}")
async def get_candidate_exams(candidate_id: int, db: Session = Depends(get_db)):
    """Get all assigned exams for a candidate - Shows ALL attempts for retake management"""
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="ไม่พบผู้สมัคร")
        
        # Get ALL exam sessions for this candidate (including multiple attempts)
        # Order by created_at desc to show latest attempts first
        exam_sessions = db.query(ExamSession).filter(
            ExamSession.candidate_id == candidate_id
        ).order_by(ExamSession.created_at.desc()).all()
        
        assigned_exams = []
        
        # Count attempts for each exam template to show attempt numbers
        attempt_counters = {}
        
        for session in exam_sessions:
            try:
                # Get exam template
                exam_template = db.query(ExamTemplate).filter(
                    ExamTemplate.id == session.exam_template_id
                ).first()
                
                if not exam_template:
                    logger.warning(f"No exam template found for session {session.id}")
                    continue
                
                # Count attempt number for this exam template
                if session.exam_template_id not in attempt_counters:
                    attempt_counters[session.exam_template_id] = 0
                attempt_counters[session.exam_template_id] += 1
                attempt_number = attempt_counters[session.exam_template_id]
                
                # Get position, department, company info safely
                position_name = "ไม่ระบุ"
                department_name = "ไม่ระบุ"
                company_name = "ไม่ระบุ"
                
                if exam_template.position_id:
                    position = db.query(Position).filter(Position.id == exam_template.position_id).first()
                    if position:
                        position_name = position.name
                        
                        if position.department_id:
                            department = db.query(Department).filter(Department.id == position.department_id).first()
                            if department:
                                department_name = department.name
                                
                                if department.company_id:
                                    company = db.query(Company).filter(Company.id == department.company_id).first()
                                    if company:
                                        company_name = company.name
                
                # Count questions safely
                questions_count = 0
                if exam_template.questions:
                    questions_count = len(exam_template.questions)
                
                # Determine status based on session
                status_map = {
                    "scheduled": "รอสอบ",
                    "in_progress": "กำลังสอบ", 
                    "completed": "เสร็จสิ้น",
                    "cancelled": "ยกเลิก"
                }
                status = status_map.get(session.status, "ไม่ทราบสถานะ")
                
                # If completed, check score for pass/fail
                if session.status == "completed" and session.score is not None:
                    if session.score >= 70:  # Assuming 70% is passing
                        status = "ผ่านการสอบ"
                    else:
                        status = "ไม่ผ่านการสอบ"
                
                scheduled_date = None
                if session.start_time:
                    scheduled_date = session.start_time.strftime("%Y-%m-%d %H:%M:%S")
                
                # Create exam name with attempt number for retakes
                exam_display_name = exam_template.name
                if attempt_number > 1:
                    exam_display_name = f"{exam_template.name} (ครั้งที่ {attempt_number})"
                
                assigned_exams.append({
                    "id": exam_template.id,  # Use template ID for frontend
                    "template_id": exam_template.id,
                    "session_id": session.id,  # Database session ID for backend operations
                    "session_id_string": session.session_id,  # String session ID for exam operations
                    "name": exam_display_name,
                    "original_name": exam_template.name,  # Keep original name for reference
                    "description": exam_template.description or "",
                    "duration_minutes": exam_template.duration_minutes,
                    "position_name": position_name,
                    "department_name": department_name,
                    "company_name": company_name,
                    "status": status,
                    "scheduled_date": scheduled_date,
                    "questions_count": questions_count,
                    "score": session.score,
                    "attempt_number": attempt_number,
                    "is_retake": attempt_number > 1,
                    "can_start": session.status in ["scheduled", "in_progress"],
                    "can_resume": session.status == "in_progress"
                })
                
            except Exception as e:
                logger.error(f"Error processing exam session {session.id}: {str(e)}")
                continue
        
        return {
            "candidate": {
                "id": candidate.id,
                "name": f"{candidate.first_name} {candidate.last_name}",
                "email": candidate.email
            },
            "exams": assigned_exams
        }
        
    except Exception as e:
        logger.error(f"Error in get_candidate_exams: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Create exam assignment
@router.post("/assign-exam")
async def assign_exam_to_candidate(
    assignment_data: Dict,
    db: Session = Depends(get_db)
):
    """Assign an exam to a candidate (for admin use)"""
    candidate_id = assignment_data.get("candidate_id")
    exam_template_id = assignment_data.get("exam_template_id")
    start_time = assignment_data.get("start_time")  # Optional scheduled time
    
    # Validate candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="ไม่พบผู้สมัคร")
    
    # Validate exam template exists
    exam_template = db.query(ExamTemplate).filter(ExamTemplate.id == exam_template_id).first()
    if not exam_template:
        raise HTTPException(status_code=404, detail="ไม่พบแม่แบบข้อสอบ")
    
    # Check if already assigned - Allow retakes by checking if previous session is completed
    existing_session = db.query(ExamSession).filter(
        ExamSession.candidate_id == candidate_id,
        ExamSession.exam_template_id == exam_template_id,
        ExamSession.status.in_(["scheduled", "in_progress"])  # Only prevent if still active
    ).first()
    
    if existing_session:
        raise HTTPException(status_code=400, detail="ผู้สมัครมีข้อสอบนี้ที่ยังไม่เสร็จสิ้น กรุณาทำข้อสอบให้เสร็จก่อนหรือยกเลิกข้อสอบเก่า")
    
    # Create exam session
    exam_session = ExamSession(
        candidate_id=candidate_id,
        exam_template_id=exam_template_id,
        session_id=f"session_{candidate_id}_{exam_template_id}_{int(datetime.now().timestamp())}",
        start_time=datetime.fromisoformat(start_time) if start_time else datetime.utcnow(),
        status="scheduled"
    )
    
    db.add(exam_session)
    db.commit()
    db.refresh(exam_session)
    
    return {
        "message": "มอบหมายข้อสอบให้ผู้สมัครเรียบร้อยแล้ว",
        "session_id": exam_session.id,
        "candidate_name": f"{candidate.first_name} {candidate.last_name}",
        "exam_name": exam_template.name
    }

# Start exam session
@router.post("/start-exam")
async def start_exam_session(
    session_data: Dict,
    db: Session = Depends(get_db)
):
    """Start/Resume an exam session for a candidate - ONLY works with pre-assigned exams"""
    try:
        candidate_id = session_data.get("candidate_id")
        template_id = session_data.get("template_id")
        
        if not candidate_id or not template_id:
            raise HTTPException(status_code=400, detail="candidate_id และ template_id จำเป็นต้องระบุ")
        
        # Validate candidate exists
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="ไม่พบผู้สมัคร")
        
        # Validate exam template exists
        exam_template = db.query(ExamTemplate).filter(ExamTemplate.id == template_id).first()
        if not exam_template:
            raise HTTPException(status_code=404, detail="ไม่พบแบบฟอร์มข้อสอบ")
        
        # CRITICAL: Check if there's an assigned session for this candidate and template
        # Get the most recent session for this candidate and template
        existing_session = db.query(ExamSession).filter(
            ExamSession.candidate_id == candidate_id,
            ExamSession.exam_template_id == template_id
        ).order_by(ExamSession.created_at.desc()).first()
        
        if not existing_session:
            # No assigned exam found - cannot start
            raise HTTPException(
                status_code=403, 
                detail="ไม่พบการมอบหมายข้อสอบนี้ให้กับผู้สมัคร กรุณาติดต่อผู้ดูแลระบบ"
            )
        
        # Check if exam is already completed
        if existing_session.status == "completed":
            raise HTTPException(
                status_code=400, 
                detail="ข้อสอบนี้ได้ทำเสร็จสิ้นแล้ว ไม่สามารถเริ่มใหม่ได้"
            )
        
        # Check if exam is cancelled
        if existing_session.status == "cancelled":
            raise HTTPException(
                status_code=400, 
                detail="ข้อสอบนี้ถูกยกเลิกแล้ว"
            )
        
        # Resume/Start the exam (update status to in_progress if needed)
        if existing_session.status in ["scheduled", "in_progress"]:
            existing_session.status = "in_progress"
            if not existing_session.start_time:
                existing_session.start_time = datetime.now()
            db.commit()
            
            return {
                "message": "เริ่มข้อสอบสำเร็จ" if existing_session.status == "scheduled" else "กลับมาสอบต่อ",
                "session_id": existing_session.session_id,
                "exam_name": exam_template.name,
                "duration_minutes": exam_template.duration_minutes,
                "resume": existing_session.status == "in_progress"
            }
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error starting exam session: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการเริ่มข้อสอบ: {str(e)}")

# Cancel exam session to allow retake
@router.post("/cancel-exam-session")
async def cancel_exam_session(
    session_data: Dict,
    db: Session = Depends(get_db)
):
    """Cancel an exam session to allow retake assignment"""
    try:
        session_id = session_data.get("session_id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id จำเป็นต้องระบุ")
        
        # Find the session
        exam_session = db.query(ExamSession).filter(
            ExamSession.id == session_id
        ).first()
        
        if not exam_session:
            raise HTTPException(status_code=404, detail="ไม่พบข้อสอบ")
        
        # Can only cancel scheduled or in_progress sessions
        if exam_session.status not in ["scheduled", "in_progress"]:
            raise HTTPException(
                status_code=400, 
                detail="สามารถยกเลิกได้เฉพาะข้อสอบที่อยู่ในสถานะ 'รอสอบ' หรือ 'กำลังสอบ' เท่านั้น"
            )
        
        # Update status to cancelled
        exam_session.status = "cancelled"
        exam_session.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "message": "ยกเลิกข้อสอบเรียบร้อยแล้ว สามารถมอบหมายข้อสอบใหม่ได้",
            "session_id": exam_session.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling exam session: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการยกเลิกข้อสอบ: {str(e)}")

@router.get("/available-exams")
async def get_available_exam_templates(db: Session = Depends(get_db)):
    """Get all available exam templates for assignment"""
    exam_templates = db.query(ExamTemplate).filter(
        ExamTemplate.is_active == True
    ).all()
    
    available_exams = []
    for exam in exam_templates:
        position_name = exam.position.name if exam.position else "ไม่ระบุ"
        department_name = exam.position.department.name if exam.position and exam.position.department else "ไม่ระบุ"
        company_name = exam.position.department.company.name if exam.position and exam.position.department and exam.position.department.company else "ไม่ระบุ"
        questions_count = len(exam.questions) if exam.questions else 0
        
        available_exams.append({
            "id": exam.id,
            "name": exam.name,
            "description": exam.description,
            "duration_minutes": exam.duration_minutes,
            "position_name": position_name,
            "department_name": department_name,
            "company_name": company_name,
            "questions_count": questions_count,
            "programming_language": exam.programming_language,
            "is_active": exam.is_active
        })
    
    return available_exams

# Debug endpoint to check database candidates
@router.get("/debug/candidates")
async def debug_candidates(db: Session = Depends(get_db)):
    """Debug endpoint to check what candidates exist in database"""
    candidates = db.query(Candidate).all()
    
    debug_info = []
    for c in candidates:
        debug_info.append({
            "id": c.id,
            "email": c.email,
            "phone": c.phone,
            "name": f"{c.first_name} {c.last_name}",
            "normalized_phone": normalize_phone(c.phone or "")
        })
    
    return {
        "total_candidates": len(candidates),
        "candidates": debug_info
    }

@router.get("/{candidate_id}/exam-results-detailed")
async def get_candidate_detailed_results(
    candidate_id: int, 
    session_id: str = None,
    db: Session = Depends(get_db)
):
    """Get detailed exam results with comprehensive scoring breakdown for admin interface"""
    try:
        # Get candidate
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Get the latest exam session or specific session
        query = db.query(ExamSession).filter(
            ExamSession.candidate_id == candidate_id
        )
        
        if session_id:
            query = query.filter(ExamSession.session_id == session_id)
        
        exam_session = query.order_by(ExamSession.start_time.desc()).first()
        
        if not exam_session:
            raise HTTPException(status_code=404, detail="No exam sessions found for this candidate")
        
        # Extract AI results from suspicious_activities field
        suspicious_data = exam_session.suspicious_activities or {}
        
        # Handle both string (from DB) and dict formats
        if isinstance(suspicious_data, str):
            try:
                suspicious_data = json.loads(suspicious_data)
            except json.JSONDecodeError:
                suspicious_data = {}
        
        ai_results = suspicious_data.get("ai_evaluation", {})
        
        # Check if AI results exist
        if not ai_results:
            return {
                "status": "processing",
                "message": "Exam results are still being processed",
                "candidate_id": candidate_id,
                "session_id": exam_session.session_id
            }
        
        # Calculate detailed scores using the new service
        detailed_scores = ScoreCalculationService.calculate_detailed_scores(
            ai_results=ai_results,
            candidate_session={
                'session_id': exam_session.session_id,
                'start_time': exam_session.start_time.isoformat() if exam_session.start_time else None,
                'completion_time': exam_session.end_time.isoformat() if exam_session.end_time else None,
                'candidate_info': {
                    'candidate_id': candidate.id,
                    'candidate_name': f"{candidate.first_name} {candidate.last_name}",
                    'email': candidate.email
                },
                'exam_template': {
                    'name': exam_session.exam_template.name if exam_session.exam_template else 'Unknown',
                    'programming_language': exam_session.exam_template.programming_language if exam_session.exam_template else 'Unknown'
                }
            }
        )
        
        # Generate admin summary
        admin_summary = ScoreCalculationService.generate_admin_summary(
            candidate_session={
                'session_id': exam_session.session_id,
                'start_time': exam_session.start_time.isoformat() if exam_session.start_time else None,
                'completion_time': exam_session.end_time.isoformat() if exam_session.end_time else None,
                'candidate_info': {
                    'candidate_id': candidate.id,
                    'candidate_name': f"{candidate.first_name} {candidate.last_name}",
                    'email': candidate.email
                },
                'exam_template': {
                    'name': exam_session.exam_template.name if exam_session.exam_template else 'Unknown',
                    'programming_language': exam_session.exam_template.programming_language if exam_session.exam_template else 'Unknown'
                }
            },
            detailed_scores=detailed_scores
        )
        
        return {
            "status": "success",
            "candidate_id": candidate_id,
            "session_id": exam_session.session_id,
            "candidate_basic_info": {
                "id": candidate.id,
                "name": f"{candidate.first_name} {candidate.last_name}",
                "email": candidate.email,
                "position": getattr(candidate, 'position', None),
                "department": getattr(candidate, 'department', None),
                "company": getattr(candidate, 'company', None)
            },
            "exam_summary": admin_summary,
            "detailed_breakdown": detailed_scores,
            "raw_ai_results": ai_results,  # For debugging
            "last_updated": exam_session.end_time.isoformat() if exam_session.end_time else None
        }
        
    except Exception as e:
        logger.error(f"Error getting detailed candidate results {candidate_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get detailed results: {str(e)}")

# Delete all exam assignments for a candidate
@router.delete("/{candidate_id}/exams")
async def delete_all_candidate_exams(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    """Delete all exam assignments for a specific candidate (Admin function)"""
    try:
        # Validate candidate exists
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="ไม่พบผู้สมัคร")
        
        # Get all exam sessions for this candidate
        exam_sessions = db.query(ExamSession).filter(
            ExamSession.candidate_id == candidate_id
        ).all()
        
        if not exam_sessions:
            return {
                "message": "ไม่พบข้อสอบที่มอบหมายให้ผู้สมัครคนนี้",
                "candidate_id": candidate_id,
                "deleted_count": 0
            }
        
        # Collect information before deletion for logging
        deleted_exams = []
        for session in exam_sessions:
            exam_template = db.query(ExamTemplate).filter(
                ExamTemplate.id == session.exam_template_id
            ).first()
            
            deleted_exams.append({
                "session_id": session.id,
                "session_id_string": session.session_id,
                "exam_name": exam_template.name if exam_template else "Unknown",
                "status": session.status,
                "start_time": session.start_time.isoformat() if session.start_time else None
            })
        
        # Delete all exam sessions
        deleted_count = db.query(ExamSession).filter(
            ExamSession.candidate_id == candidate_id
        ).delete()
        
        db.commit()
        
        logger.info(f"Deleted {deleted_count} exam assignments for candidate {candidate_id}")
        
        return {
            "message": f"ลบการมอบหมายข้อสอบทั้งหมดสำเร็จ ({deleted_count} รายการ)",
            "candidate_id": candidate_id,
            "candidate_name": f"{candidate.first_name} {candidate.last_name}",
            "deleted_count": deleted_count,
            "deleted_exams": deleted_exams
        }
        
    except Exception as e:
        logger.error(f"Error deleting candidate exams for candidate {candidate_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการลบข้อสอบ: {str(e)}") 