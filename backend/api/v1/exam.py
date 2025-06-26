from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
import json
import uuid
import asyncio
from datetime import datetime, timedelta
import random

from core.database import get_db
from models.exam import ExamSession, ExamTemplate, Candidate, ProctoringLog, Company, Department, Position
from services.face_detection_lite import face_detection_service
from services.face_detection_yolo11 import yolo11_pose_service
from services.google_forms import google_forms_service
from services.n8n_integration import n8n_service
from utils.websocket_manager import WebSocketManager

router = APIRouter()
security = HTTPBearer()
websocket_manager = WebSocketManager()

def get_detection_service(session_id: str):
    """Select detection service - YOLO11 is now the default for all sessions including demo sessions"""
    # YOLO11 pose + segmentation is now the default for ALL sessions (demo and real)
    print(f"🤖 [BACKEND] Using YOLO11 detection service for session: {session_id}")
    return yolo11_pose_service

@router.post("/sessions/{session_id}/start")
async def start_exam_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """เริ่มการสอบ"""
    session = db.query(ExamSession).filter(ExamSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="ไม่พบเซสชันการสอบ")
    
    if session.status not in ["pending", "scheduled"]:
        raise HTTPException(status_code=400, detail="ไม่สามารถเริ่มการสอบได้ เซสชันอยู่ในสถานะ: " + session.status)
    
    # โหลดข้อสอบและ random คำถาม
    exam_template = session.exam_template
    questions = exam_template.questions or []
    
    # Random คำถาม
    randomized_questions = random.sample(questions, len(questions)) if questions else []
    
    # อัพเดทสถานะเซสชัน
    session.status = "in_progress"
    # Only set start_time if it's not already set (don't reset for resume)
    if session.start_time is None:
        session.start_time = datetime.utcnow()
    session.randomized_questions = randomized_questions
    
    # โหลดใบหน้าผู้สมัครสำหรับ face recognition
    if session.candidate.face_image_url:
        await face_detection_service.load_candidate_face(
            session.candidate_id, 
            session.candidate.face_image_url
        )
    
    db.commit()
    
    return {
        "message": "เริ่มการสอบเรียบร้อยแล้ว",
        "session_id": session_id,
        "name": exam_template.name,
        "description": exam_template.description,
        "status": session.status,
        "questions": randomized_questions,
        "duration_minutes": exam_template.duration_minutes,
        "remaining_time_seconds": exam_template.duration_minutes * 60,
        "start_time": session.start_time.isoformat(),
        "candidate_id": session.candidate_id,
        "candidate_name": f"{session.candidate.first_name} {session.candidate.last_name}",
        "answers": session.answers or {}
    }

@router.post("/verify-face")
async def verify_face_direct(
    request_data: Dict,
    db: Session = Depends(get_db)
):
    """ตรวจสอบใบหน้าแบบ real-time (Direct API)"""
    candidate_id = request_data.get("candidate_id")
    frame_data = request_data.get("frame_data")
    session_id = request_data.get("session_id", "real-session-1")  # Default to session 1
    
    if not candidate_id or not frame_data:
        raise HTTPException(status_code=400, detail="กรุณาระบุ candidate_id และ frame_data")
    
    # Select appropriate detection service
    detection_service = get_detection_service(session_id)
    
    # ตรวจสอบใบหน้า
    result = await detection_service.verify_face_from_frame(
        candidate_id,
        frame_data
    )
    
    return result

@router.post("/sessions/{session_id}/verify-face")
async def verify_face(
    session_id: str,
    frame_data: Dict,
    db: Session = Depends(get_db)
):
    """ตรวจสอบใบหน้าแบบ real-time"""
    session = db.query(ExamSession).filter(ExamSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="ไม่พบเซสชันการสอบ")
    
    # Select appropriate detection service
    detection_service = get_detection_service(session_id)
    
    # ตรวจสอบใบหน้า
    result = await detection_service.verify_face_from_frame(
        session.candidate_id,
        frame_data.get("frame")
    )
    
    # บันทึกผลการตรวจสอบ
    if not result["face_detected"]:
        session.absent_frames_count += 1
        
        # บันทึก log
        log = ProctoringLog(
            exam_session_id=session.id,
            event_type="face_lost",
            confidence=result.get("confidence", 0.0),
            event_metadata=result
        )
        db.add(log)
    
    # ตรวจสอบกิจกรรมน่าสงสัย
    if result["suspicious_activity"]:
        for activity in result["suspicious_activity"]:
            log = ProctoringLog(
                exam_session_id=session.id,
                event_type=activity,
                confidence=result.get("confidence", 0.0),
                event_metadata=result
            )
            db.add(log)
    
    session.face_verification_count += 1
    db.commit()
    
    # ส่งข้อมูลไปที่ n8n สำหรับการวิเคราะห์
    await n8n_service.send_proctoring_data(session_id, result)
    
    return result

@router.post("/sessions/{session_id}/save-answer")
async def save_answer(
    session_id: str,
    answer_data: Dict,
    db: Session = Depends(get_db)
):
    """บันทึกคำตอบของผู้สมัคร (auto-save)"""
    # Enhanced debugging
    print(f"🔍 SAVE ANSWER DEBUG - Session: {session_id}")
    print(f"📝 Answer data received: {answer_data}")
    
    session = db.query(ExamSession).filter(ExamSession.session_id == session_id).first()
    if not session:
        print(f"❌ Session not found: {session_id}")
        raise HTTPException(status_code=404, detail="ไม่พบเซสชันการสอบ")
    
    # อัพเดทคำตอบ - Fix SQLite JSON detection issue
    current_answers = session.answers or {}
    question_id = str(answer_data.get("question_id"))
    answer = answer_data.get("answer")
    timestamp = answer_data.get("timestamp", datetime.utcnow().isoformat())
    
    print(f"📋 Current answers before save: {list(current_answers.keys())}")
    print(f"🔢 Question ID: {question_id}")
    print(f"✏️ Answer: {answer}")
    print(f"⏰ Timestamp: {timestamp}")
    
    # Create a new dictionary to ensure SQLAlchemy detects the change
    new_answers = dict(current_answers)  # Copy existing answers
    new_answers[question_id] = {
        "answer": answer,
        "timestamp": timestamp
    }
    
    session.answers = new_answers  # Assign the new dictionary
    session.updated_at = datetime.utcnow()
    
    # Force SQLAlchemy to detect the change
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(session, "answers")
    
    try:
        db.commit()
        print(f"✅ Successfully saved answer for question {question_id}")
        print(f"📊 Total answers now: {list(current_answers.keys())}")
    except Exception as e:
        print(f"❌ Failed to save answer: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"ไม่สามารถบันทึกคำตอบได้: {str(e)}")
    
    return {
        "message": "บันทึกคำตอบเรียบร้อยแล้ว",
        "question_id": question_id,
        "timestamp": timestamp,
        "total_answers": len(current_answers)
    }

@router.post("/sessions/{session_id}/submit")
async def submit_exam(
    session_id: str,
    answers: Dict,
    db: Session = Depends(get_db)
):
    """ส่งข้อสอบและเริ่มกระบวนการประเมินผล"""
    from services.exam_evaluation import exam_evaluation_service
    
    session = db.query(ExamSession).filter(ExamSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="ไม่พบเซสชันการสอบ")
    
    if session.status != "in_progress":
        raise HTTPException(status_code=400, detail="ไม่สามารถส่งข้อสอบได้ เซสชันไม่ได้อยู่ในระหว่างการสอบ")
    
    # บันทึกคำตอบ (รองรับทั้งรูปแบบเก่าและใหม่)
    submitted_answers = answers.get("answers", {})
    current_answers = session.answers or {}
    
    # Merge submitted answers with existing answers
    for question_id, answer in submitted_answers.items():
        if isinstance(answer, dict) and "answer" in answer:
            # Already in new format
            current_answers[question_id] = answer
        else:
            # Convert old format to new format
            current_answers[question_id] = {
                "answer": answer,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    session.answers = current_answers
    session.end_time = datetime.utcnow()
    session.status = "submitted"  # Changed from "completed" to "submitted"
    
    db.commit()
    
    # ประมวลผลและประเมินข้อสอบผ่าน N8N workflow หรือ fallback
    evaluation_result = await exam_evaluation_service.process_exam_completion(session_id, db)
    
    return {
        "message": "ส่งข้อสอบเรียบร้อยแล้ว กำลังประมวลผลคะแนน",
        "session_id": session_id,
        "submission_time": session.end_time.isoformat(),
        "evaluation_status": evaluation_result.get("success", False),
        "next_steps": "ผลการสอบจะพร้อมใช้งานภายในไม่กี่นาที"
    }

@router.post("/sessions/{session_id}/log-activity")
async def log_suspicious_activity(
    session_id: str,
    activity_data: Dict,
    db: Session = Depends(get_db)
):
    """บันทึกกิจกรรมน่าสงสัย เช่น การสลับ tab, การออกจาก fullscreen"""
    session = db.query(ExamSession).filter(ExamSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="ไม่พบเซสชันการสอบ")
    
    activity_type = activity_data.get("type")
    
    # อัพเดท counter ตาม activity type
    if activity_type == "tab_switch":
        session.tab_switch_count += 1
    elif activity_type == "fullscreen_exit":
        session.fullscreen_exit_count += 1
    
    # บันทึก log
    log = ProctoringLog(
        exam_session_id=session.id,
        event_type=activity_type,
        event_metadata=activity_data
    )
    db.add(log)
    db.commit()
    
    # ส่งข้อมูลไปที่ n8n
    await n8n_service.send_proctoring_data(session_id, activity_data)
    
    return {"message": "บันทึกกิจกรรมเรียบร้อยแล้ว"}

@router.websocket("/sessions/{session_id}/ws")
async def websocket_endpoint(websocket: WebSocket, session_id: str, db: Session = Depends(get_db)):
    """WebSocket สำหรับการติดต่อแบบ real-time"""
    await websocket_manager.connect(websocket, session_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # ประมวลผลข้อมูลที่ได้รับ
            if data.get("type") == "face_frame":
                # ตรวจสอบใบหน้า
                result = await verify_face(session_id, data, db)
                await websocket_manager.send_personal_message(session_id, {
                    "type": "face_verification",
                    "data": result
                })
                
            elif data.get("type") == "activity_log":
                # บันทึกกิจกรรม
                await log_suspicious_activity(session_id, data, db)
                
    except WebSocketDisconnect:
        websocket_manager.disconnect(session_id)

@router.get("/sessions")
async def get_available_exam_sessions(
    db: Session = Depends(get_db)
):
    """Get list of available exam sessions"""
    try:
        # Get all active exam sessions that are available for taking
        sessions = db.query(ExamSession).filter(
            ExamSession.status.in_(["pending", "in_progress"])
        ).all()
        
        session_list = []
        for session in sessions:
            session_data = {
                "id": session.session_id,
                "name": f"🤖 {session.exam_template.title} - {session.candidate.full_name}",
                "duration": session.exam_template.duration_minutes,
                "status": session.status,
                "candidate_name": session.candidate.full_name,
                "exam_title": session.exam_template.title,
                "created_at": session.created_at.isoformat() if session.created_at else None
            }
            session_list.append(session_data)
        
        # If no sessions found, create a default test session
        if not session_list:
            session_list = [
                {
                    "id": "test-session-1", 
                    "name": "🤖 ระบบตรวจจับการโกง (YOLO11 AI)", 
                    "duration": 30,
                    "status": "pending",
                    "candidate_name": "Test Candidate",
                    "exam_title": "AI Proctoring Test",
                    "created_at": datetime.utcnow().isoformat()
                }
            ]
        
        return session_list
        
    except Exception as e:
        print(f"Error getting exam sessions: {e}")
        # Return default session if database error
        return [
            {
                "id": "test-session-1", 
                "name": "🤖 ระบบตรวจจับการโกง (YOLO11 AI)", 
                "duration": 30,
                "status": "pending",
                "candidate_name": "Test Candidate", 
                "exam_title": "AI Proctoring Test",
                "created_at": datetime.utcnow().isoformat()
            }
        ]

@router.get("/sessions/{session_id}/status")
async def get_exam_status(
    session_id: str,
    db: Session = Depends(get_db)
):
    """ดูสถานะการสอบปัจจุบัน"""
    session = db.query(ExamSession).filter(ExamSession.session_id == session_id).first()
    
    # If session not found and it's a real session, create a mock response
    if not session and session_id.startswith("real-"):
        return {
            "session_id": session_id,
            "name": "ข้อสอบจริง - Real Exam Session",
            "duration_minutes": 60,
            "candidate_id": 1,
            "status": "pending",
            "questions": [
                {
                    "id": 1,
                    "type": "multiple_choice",
                    "text": "ข้อสอบนี้ใช้ระบบตรวจจับใบหน้าจริง - This exam uses real face detection",
                    "options": [
                        {"id": "a", "text": "ใช่ - Yes"},
                        {"id": "b", "text": "ไม่ใช่ - No"},
                        {"id": "c", "text": "ไม่แน่ใจ - Not sure"},
                        {"id": "d", "text": "ไม่ทราบ - Don't know"}
                    ],
                    "score": 10
                },
                {
                    "id": 2,
                    "type": "multiple_choice", 
                    "text": "ระบบกำลังตรวจสอบใบหน้าของคุณแบบ real-time หรือไม่?",
                    "options": [
                        {"id": "a", "text": "ใช่ กำลังตรวจสอบ"},
                        {"id": "b", "text": "ไม่ใช่"},
                        {"id": "c", "text": "ไม่แน่ใจ"},
                        {"id": "d", "text": "ไม่เห็นกล้อง"}
                    ],
                    "score": 10
                },
                {
                    "id": 3,
                    "type": "text",
                    "text": "อธิบายความรู้สึกของคุณเมื่อใช้ระบบตรวจจับใบหน้าแบบจริง",
                    "score": 20
                }
            ],
            "remaining_time_seconds": 3600,
            "face_verification_count": 0,
            "suspicious_activities": {
                "absent_frames": 0,
                "tab_switches": 0,
                "fullscreen_exits": 0,
                "phone_detections": 0
            }
        }
    
    if not session:
        raise HTTPException(status_code=404, detail="ไม่พบเซสชันการสอบ")
    
    # คำนวณเวลาที่เหลือ
    remaining_time = None
    if session.start_time and session.status in ["in_progress", "failed"]:
        # Calculate remaining time for any session that has started
        exam_duration = timedelta(minutes=session.exam_template.duration_minutes)
        elapsed_time = datetime.utcnow() - session.start_time
        remaining_time = max(0, (exam_duration - elapsed_time).total_seconds())
    elif session.status in ["pending", "scheduled"]:
        # For pending/scheduled sessions, show full duration
        remaining_time = session.exam_template.duration_minutes * 60
    else:
        # For other statuses (completed, submitted), show 0
        remaining_time = 0
    
    # Get exam questions (use randomized if available, otherwise original)
    questions = session.randomized_questions if session.randomized_questions else session.exam_template.questions or []
    
    return {
        "session_id": session_id,
        "name": session.exam_template.name,
        "description": session.exam_template.description,
        "status": session.status,
        "start_time": session.start_time.isoformat() if session.start_time else None,
        "duration_minutes": session.exam_template.duration_minutes,
        "remaining_time_seconds": remaining_time,
        "questions": questions,
        "candidate_id": session.candidate_id,
        "candidate_name": f"{session.candidate.first_name} {session.candidate.last_name}",
        "answers": session.answers or {},
        "face_verification_count": session.face_verification_count,
        "suspicious_activities": {
            "absent_frames": session.absent_frames_count,
            "tab_switches": session.tab_switch_count,
            "fullscreen_exits": session.fullscreen_exit_count,
            "phone_detections": session.phone_detection_count
        }
    }

@router.post("/import-google-form")
async def import_google_form(
    form_data: Dict,
    db: Session = Depends(get_db)
):
    """นำเข้าข้อสอบจาก Google Forms"""
    try:
        form_id = form_data.get("form_id")
        company_id = form_data.get("company_id")
        department_id = form_data.get("department_id")
        position_id = form_data.get("position_id")
        programming_language = form_data.get("programming_language", "general")
        
        if not form_id:
            raise HTTPException(status_code=400, detail="กรุณาระบุ Form ID")
        
        # ตรวจสอบว่าสามารถเข้าถึง Google Form ได้หรือไม่
        can_access = await google_forms_service.validate_form_access(form_id)
        if not can_access:
            raise HTTPException(
                status_code=400, 
                detail="ไม่สามารถเข้าถึง Google Form ได้ กรุณาตรวจสอบ Form ID และสิทธิ์การเข้าถึง"
            )
        
        # แปลง Google Form เป็นรูปแบบข้อสอบ
        exam_data = await google_forms_service.convert_to_exam_format(form_id, programming_language)
        if not exam_data:
            raise HTTPException(status_code=400, detail="ไม่สามารถแปลงข้อมูลจาก Google Form ได้")
        
        # สร้าง ExamTemplate ใหม่
        exam_template = ExamTemplate(
            name=exam_data["name"],
            description=exam_data["description"],
            company_id=company_id,
            department_id=department_id,
            position_id=position_id,
            programming_language=exam_data["programming_language"],
            duration_minutes=exam_data["duration_minutes"],
            questions=exam_data["questions"],
            google_form_id=form_id,
            created_at=datetime.utcnow()
        )
        
        db.add(exam_template)
        db.commit()
        db.refresh(exam_template)
        
        return {
            "message": "นำเข้าข้อสอบจาก Google Forms เรียบร้อยแล้ว",
            "exam_template_id": exam_template.id,
            "form_title": exam_data["name"],
            "total_questions": len(exam_data["questions"]),
            "questions_preview": exam_data["questions"][:3]  # แสดง 3 ข้อแรก
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

@router.get("/google-form/{form_id}/preview")
async def preview_google_form(
    form_id: str,
    db: Session = Depends(get_db)
):
    """ดูตัวอย่างข้อสอบจาก Google Forms ก่อนนำเข้า"""
    try:
        # ตรวจสอบสิทธิ์การเข้าถึง
        can_access = await google_forms_service.validate_form_access(form_id)
        if not can_access:
            raise HTTPException(
                status_code=400, 
                detail="ไม่สามารถเข้าถึง Google Form ได้"
            )
        
        # ดึงโครงสร้างของ Form
        form_structure = await google_forms_service.get_form_structure(form_id)
        if not form_structure:
            raise HTTPException(status_code=400, detail="ไม่สามารถดึงข้อมูล Form ได้")
        
        return {
            "form_info": {
                "title": form_structure["title"],
                "description": form_structure["description"],
                "total_questions": form_structure["total_questions"]
            },
            "questions_preview": form_structure["questions"][:5],  # แสดง 5 ข้อแรก
            "question_types": list(set([q["type"] for q in form_structure["questions"]]))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

@router.post("/google-form/{form_id}/sync")
async def sync_google_form(
    form_id: str,
    exam_template_id: int,
    db: Session = Depends(get_db)
):
    """ซิงค์ข้อสอบที่นำเข้าแล้วกับ Google Form (อัพเดทข้อมูล)"""
    try:
        # หา exam template
        exam_template = db.query(ExamTemplate).filter(
            ExamTemplate.id == exam_template_id,
            ExamTemplate.google_form_id == form_id
        ).first()
        
        if not exam_template:
            raise HTTPException(status_code=404, detail="ไม่พบข้อสอบที่ต้องการซิงค์")
        
        # ดึงข้อมูลใหม่จาก Google Form
        updated_data = await google_forms_service.convert_to_exam_format(
            form_id, 
            exam_template.programming_language
        )
        
        if not updated_data:
            raise HTTPException(status_code=400, detail="ไม่สามารถดึงข้อมูลใหม่ได้")
        
        # อัพเดทข้อมูล
        exam_template.name = updated_data["name"]
        exam_template.description = updated_data["description"]
        exam_template.questions = updated_data["questions"]
        exam_template.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "message": "ซิงค์ข้อมูลเรียบร้อยแล้ว",
            "updated_questions": len(updated_data["questions"]),
            "sync_time": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

@router.post("/upload-face")
async def upload_candidate_face(
    file: UploadFile = File(...),
    candidate_id: int = None,
    db: Session = Depends(get_db)
):
    """อัพโหลดภาพใบหน้าผู้สมัคร"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="ไฟล์ต้องเป็นรูปภาพเท่านั้น")
    
    # บันทึกไฟล์
    import os
    import shutil
    
    upload_dir = "/app/face_recognition_data"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, f"candidate_{candidate_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # อัพเดทข้อมูลผู้สมัคร
    if candidate_id:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if candidate:
            candidate.face_image_url = file_path
            
            # สร้าง face encoding
            success = await face_detection_service.load_candidate_face(candidate_id, file_path)
            if success:
                # เก็บ face encoding ในฐานข้อมูล
                import face_recognition
                image = face_recognition.load_image_file(file_path)
                encodings = face_recognition.face_encodings(image)
                if encodings:
                    candidate.face_encoding = encodings[0].tolist()
                    
            db.commit()
    
    return {
        "message": "อัพโหลดภาพใบหน้าเรียบร้อยแล้ว",
        "file_path": file_path
    }

@router.post("/companies")
async def create_company(
    company_data: Dict,
    db: Session = Depends(get_db)
):
    """สร้างบริษัท"""
    company = Company(
        name=company_data["name"],
        description=company_data.get("description"),
        logo_url=company_data.get("logo_url")
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    
    return {
        "message": "สร้างบริษัทเรียบร้อยแล้ว",
        "company": {
            "id": company.id,
            "name": company.name,
            "description": company.description
        }
    }

@router.post("/companies/{company_id}/departments")
async def create_department(
    company_id: int,
    department_data: Dict,
    db: Session = Depends(get_db)
):
    """สร้างแผนกภายใต้บริษัท"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="ไม่พบบริษัท")
    
    department = Department(
        company_id=company_id,
        name=department_data["name"],
        description=department_data.get("description")
    )
    db.add(department)
    db.commit()
    db.refresh(department)
    
    return {
        "message": "สร้างแผนกเรียบร้อยแล้ว",
        "department": {
            "id": department.id,
            "name": department.name,
            "company_name": company.name
        }
    }

@router.post("/departments/{department_id}/positions")
async def create_position(
    department_id: int,
    position_data: Dict,
    db: Session = Depends(get_db)
):
    """สร้างตำแหน่งงานภายใต้แผนก"""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="ไม่พบแผนก")
    
    position = Position(
        department_id=department_id,
        name=position_data["name"],
        description=position_data.get("description"),
        programming_languages=position_data.get("programming_languages", []),
        required_skills=position_data.get("required_skills", [])
    )
    db.add(position)
    db.commit()
    db.refresh(position)
    
    return {
        "message": "สร้างตำแหน่งเรียบร้อยแล้ว",
        "position": {
            "id": position.id,
            "name": position.name,
            "department_name": department.name
        }
    }

@router.post("/positions/{position_id}/exam-templates")
async def create_exam_template(
    position_id: int,
    exam_data: Dict,
    db: Session = Depends(get_db)
):
    """สร้างแม่แบบข้อสอบสำหรับตำแหน่ง"""
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="ไม่พบตำแหน่ง")
    
    exam_template = ExamTemplate(
        position_id=position_id,
        name=exam_data["name"],
        description=exam_data.get("description"),
        programming_language=exam_data["programming_language"],
        duration_minutes=exam_data.get("duration_minutes", 60),
        questions=exam_data.get("questions", []),
        is_active=exam_data.get("is_active", True)
    )
    db.add(exam_template)
    db.commit()
    db.refresh(exam_template)
    
    return {
        "message": "สร้างแม่แบบข้อสอบเรียบร้อยแล้ว",
        "exam_template": {
            "id": exam_template.id,
            "name": exam_template.name,
            "position_name": position.name,
            "questions_count": len(exam_data.get("questions", []))
        }
    }

@router.put("/exam-templates/{template_id}")
async def update_exam_template(
    template_id: int,
    exam_data: Dict,
    db: Session = Depends(get_db)
):
    """อัพเดทแม่แบบข้อสอบ"""
    exam_template = db.query(ExamTemplate).filter(ExamTemplate.id == template_id).first()
    if not exam_template:
        raise HTTPException(status_code=404, detail="ไม่พบแม่แบบข้อสอบ")
    
    # อัพเดทข้อมูล
    if "name" in exam_data:
        exam_template.name = exam_data["name"]
    if "description" in exam_data:
        exam_template.description = exam_data["description"]
    if "programming_language" in exam_data:
        exam_template.programming_language = exam_data["programming_language"]
    if "duration_minutes" in exam_data:
        exam_template.duration_minutes = exam_data["duration_minutes"]
    if "questions" in exam_data:
        exam_template.questions = exam_data["questions"]
    if "is_active" in exam_data:
        exam_template.is_active = exam_data["is_active"]
    
    db.commit()
    db.refresh(exam_template)
    
    return {
        "message": "อัพเดทแม่แบบข้อสอบเรียบร้อยแล้ว",
        "exam_template": {
            "id": exam_template.id,
            "name": exam_template.name,
            "questions_count": len(exam_template.questions or [])
        }
    }

@router.get("/exam-templates")
async def get_exam_templates(
    position_id: Optional[int] = None,
    programming_language: Optional[str] = None,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db)
):
    """ดึงรายการแม่แบบข้อสอบ"""
    query = db.query(ExamTemplate)
    
    if position_id:
        query = query.filter(ExamTemplate.position_id == position_id)
    if programming_language:
        query = query.filter(ExamTemplate.programming_language == programming_language)
    if is_active is not None:
        query = query.filter(ExamTemplate.is_active == is_active)
    
    templates = query.all()
    
    return {
        "exam_templates": [
            {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "programming_language": template.programming_language,
                "duration_minutes": template.duration_minutes,
                "questions_count": len(template.questions or []),
                "position_name": template.position.name if template.position else None,
                "is_active": template.is_active
            }
            for template in templates
        ]
    }

@router.get("/exam-templates/{template_id}")
async def get_exam_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """ดึงข้อมูลแม่แบบข้อสอบพร้อมคำถาม"""
    exam_template = db.query(ExamTemplate).filter(ExamTemplate.id == template_id).first()
    if not exam_template:
        raise HTTPException(status_code=404, detail="ไม่พบแม่แบบข้อสอบ")
    
    return {
        "id": exam_template.id,
        "name": exam_template.name,
        "description": exam_template.description,
        "programming_language": exam_template.programming_language,
        "duration_minutes": exam_template.duration_minutes,
        "questions": exam_template.questions or [],
        "position": {
            "id": exam_template.position.id,
            "name": exam_template.position.name,
            "department_name": exam_template.position.department.name,
            "company_name": exam_template.position.department.company.name
        } if exam_template.position else None,
        "is_active": exam_template.is_active
    }

@router.post("/candidates")
async def create_candidate(
    candidate_data: Dict,
    db: Session = Depends(get_db)
):
    """สร้างผู้สมัคร"""
    # ตรวจสอบ email ซ้ำ
    existing_candidate = db.query(Candidate).filter(Candidate.email == candidate_data["email"]).first()
    if existing_candidate:
        raise HTTPException(status_code=400, detail="อีเมลนี้มีอยู่ในระบบแล้ว")
    
    candidate = Candidate(
        first_name=candidate_data["first_name"],
        last_name=candidate_data["last_name"],
        email=candidate_data["email"],
        phone=candidate_data.get("phone")
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    return {
        "message": "สร้างผู้สมัครเรียบร้อยแล้ว",
        "candidate": {
            "id": candidate.id,
            "name": f"{candidate.first_name} {candidate.last_name}",
            "email": candidate.email
        }
    }

@router.post("/exam-templates/{template_id}/sessions")
async def create_exam_session(
    template_id: int,
    session_data: Dict,
    db: Session = Depends(get_db)
):
    """สร้างเซสชั่นการสอบ"""
    exam_template = db.query(ExamTemplate).filter(ExamTemplate.id == template_id).first()
    if not exam_template:
        raise HTTPException(status_code=404, detail="ไม่พบแม่แบบข้อสอบ")
    
    candidate = db.query(Candidate).filter(Candidate.id == session_data["candidate_id"]).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="ไม่พบผู้สมัคร")
    
    session = ExamSession(
        candidate_id=session_data["candidate_id"],
        exam_template_id=template_id,
        status="pending"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "message": "สร้างเซสชั่นการสอบเรียบร้อยแล้ว",
        "session": {
            "session_id": session.session_id,
            "candidate_name": f"{candidate.first_name} {candidate.last_name}",
            "exam_name": exam_template.name,
            "status": session.status
        }
    }

@router.get("/sessions/{session_id}/details")
async def get_exam_session_details(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed exam session information for evaluation"""
    session = db.query(ExamSession).filter(ExamSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Exam session not found")
    
    return {
        "session_id": session_id,
        "candidate_id": session.candidate_id,
        "exam_template_id": session.exam_template_id,
        "status": session.status,
        "start_time": session.start_time.isoformat() if session.start_time else None,
        "end_time": session.end_time.isoformat() if session.end_time else None,
        "answers": session.answers,
        "randomized_questions": session.randomized_questions,
        "current_score": session.score
    }

@router.get("/sessions/{session_id}/questions")
async def get_exam_session_questions(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get exam questions for a specific session"""
    session = db.query(ExamSession).filter(ExamSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Exam session not found")
    
    # Return randomized questions if available, otherwise use template questions
    questions = session.randomized_questions or (session.exam_template.questions if session.exam_template else [])
    
    return {
        "session_id": session_id,
        "questions": questions,
        "total_questions": len(questions) if questions else 0,
        "exam_template_id": session.exam_template_id,
        "exam_name": session.exam_template.name if session.exam_template else "Unknown"
    }

@router.get("/sessions/{session_id}/proctoring-logs")
async def get_proctoring_logs(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get proctoring logs for analysis"""
    session = db.query(ExamSession).filter(ExamSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Exam session not found")
    
    logs = db.query(ProctoringLog).filter(ProctoringLog.exam_session_id == session.id).all()
    
    proctoring_logs = []
    for log in logs:
        proctoring_logs.append({
            "timestamp": log.timestamp.isoformat(),
            "event_type": log.event_type,
            "confidence": log.confidence,
            "event_metadata": log.event_metadata
        })
    
    return {
        "session_id": session_id,
        "proctoring_logs": proctoring_logs,
        "total_events": len(proctoring_logs)
    }

@router.post("/sessions/{session_id}/update-results")
async def update_exam_results(
    session_id: str,
    results_data: Dict,
    db: Session = Depends(get_db)  
):
    """Update exam session with comprehensive AI evaluation results from N8N workflow"""
    session = db.query(ExamSession).filter(ExamSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Exam session not found")
    
    # Extract AI results from the payload
    ai_results = results_data.get("ai_results", {})
    evaluation_method = results_data.get("evaluation_method", "unknown")
    
    # Update basic session data
    if "total_score" in ai_results:
        session.score = ai_results["total_score"]
    if "status" in ai_results:
        session.status = ai_results["status"]
    
    # Store comprehensive AI evaluation results
    if not session.suspicious_activities:
        session.suspicious_activities = {}
    
    # Create a NEW dictionary to force SQLAlchemy to detect the change (JSON field tracking issue)
    updated_activities = dict(session.suspicious_activities) if session.suspicious_activities else {}
    updated_activities["ai_evaluation"] = ai_results  # Store AI results directly
    updated_activities["evaluation_method"] = evaluation_method
    updated_activities["last_updated"] = datetime.utcnow().isoformat()
    updated_activities["ai_processing_timestamp"] = results_data.get("timestamp", datetime.utcnow().isoformat())
    
    # Reassign the entire field to force SQLAlchemy change detection
    session.suspicious_activities = updated_activities
    
    db.commit()
    
    return {
        "message": "Comprehensive AI evaluation results updated successfully",
        "session_id": session_id,
        "score": session.score,
        "status": session.status,
        "evaluation_method": evaluation_method,
        "ai_total_score": ai_results.get("total_score"),
        "update_timestamp": datetime.utcnow().isoformat()
    }

@router.get("/candidates/{candidate_id}/results")
async def get_candidate_results(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    """Get comprehensive candidate exam results with AI evaluation for admin interface"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Get latest exam session
    exam_session = db.query(ExamSession).filter(
        ExamSession.candidate_id == candidate_id
    ).order_by(ExamSession.created_at.desc()).first()
    
    if not exam_session:
        raise HTTPException(status_code=404, detail="No exam sessions found for candidate")
    
    # Get proctoring events
    proctoring_logs = db.query(ProctoringLog).filter(
        ProctoringLog.exam_session_id == exam_session.id
    ).all()
    
    # Format proctoring events for frontend
    proctoring_events = []
    for log in proctoring_logs:
        proctoring_events.append({
            "timestamp": log.timestamp.strftime("%H:%M:%S"),
            "event_type": log.event_type,
            "description": get_event_description(log.event_type),
            "severity": get_event_severity(log.event_type),
            "duration": log.event_metadata.get("duration", "1 วินาที") if log.event_metadata else "1 วินาที"
        })
    
    # Get suspicious activities and AI evaluation data
    suspicious_data = exam_session.suspicious_activities or {}
    ai_evaluation = suspicious_data.get("ai_evaluation", {})
    
    # Enhanced debug logging
    print(f"🔍 Debug - Candidate {candidate_id} AI evaluation check:")
    print(f"   - Has suspicious_data: {bool(suspicious_data)}")
    if suspicious_data:
        print(f"   - Suspicious data keys: {list(suspicious_data.keys())}")
        print(f"   - Evaluation method: {suspicious_data.get('evaluation_method')}")
    print(f"   - Has ai_evaluation: {bool(ai_evaluation)}")
    if ai_evaluation:
        print(f"   - AI evaluation keys: {list(ai_evaluation.keys())}")
        if ai_evaluation.get("total_score"):
            print(f"   - Has direct total_score: {ai_evaluation.get('total_score')}")
        if ai_evaluation.get("evaluation_metadata"):
            print(f"   - Has evaluation_metadata: {ai_evaluation.get('evaluation_metadata')}")
    print(f"   - Session ID: {exam_session.session_id}")
    
    # Debug the actual suspicious_activities data
    if exam_session.suspicious_activities:
        print(f"   - Raw suspicious_activities keys: {list(exam_session.suspicious_activities.keys())}")
        if 'ai_evaluation' in exam_session.suspicious_activities:
            ai_eval_data = exam_session.suspicious_activities['ai_evaluation']
            print(f"   - AI evaluation data type: {type(ai_eval_data)}")
            if isinstance(ai_eval_data, dict):
                print(f"   - AI evaluation direct keys: {list(ai_eval_data.keys()) if ai_eval_data else 'Empty dict'}")
            else:
                print(f"   - AI evaluation data: {str(ai_eval_data)[:100]}...")
    else:
        print(f"   - No suspicious_activities data found")
    
    # Prepare AI-generated results or fallback data
    # Check if we have AI evaluation data (either from real workflow or inserted data)
    has_ai_results = ai_evaluation and (
        ai_evaluation.get("ai_results") or  # New structure with ai_results
        ai_evaluation.get("total_score") or  # Direct structure
        ai_evaluation.get("evaluation_metadata", {}).get("processing_method") == "google_ai"  # Original check
    )
    
    if has_ai_results:
        # Extract AI results - handle both old and new data structures
        ai_results_data = ai_evaluation.get("ai_results", ai_evaluation)  # New structure or direct
        
        # Use real AI evaluation results
        exam_results = {
            "overall_score": ai_results_data.get("total_score", 0),
            "status": "ผ่านการสอบ" if ai_results_data.get("status") == "passed" else "ไม่ผ่านการสอบ",
            "ai_recommendation": ai_results_data.get("recommendation", "ต้องการการประเมินเพิ่มเติม"),
            "overall_feedback": ai_results_data.get("overall_feedback", "ไม่มีความเห็นเพิ่มเติม"),
            
            # Score breakdown
            "score_breakdown": ai_results_data.get("score_breakdown", {}),
            "multiple_choice_score": ai_results_data.get("multiple_choice_score", {}),
            "coding_scores": ai_results_data.get("coding_scores", []),
            
            # Criteria analysis (วิเคราะห์ผลการสอบตามหัวข้อ) - try both locations
            "criteria_analysis": (
                ai_results_data.get("multiple_choice_score", {}).get("criteria_breakdown", {}) or
                ai_results_data.get("criteria_analysis", {})
            ),
            
            # Detailed analysis (รายละเอียดข้อสอบ)
            "detailed_analysis": {
                "strengths": ai_results_data.get("detailed_analysis", {}).get("strengths", []),
                "weaknesses": ai_results_data.get("detailed_analysis", {}).get("weaknesses", []),
                "suggestions": ai_results_data.get("detailed_analysis", {}).get("suggestions", [])
            },
            
            # Evaluation metadata
            "evaluation_method": suspicious_data.get("evaluation_method", "google_ai"),
            "ai_model": ai_evaluation.get("evaluation_metadata", {}).get("ai_model", "gemini-1.5-pro"),
            "evaluation_timestamp": suspicious_data.get("ai_processing_timestamp", "ไม่ระบุ")
        }
    else:
        # Fallback to basic evaluation
        basic_score = int(exam_session.score) if exam_session.score else 0
        exam_results = {
            "overall_score": basic_score,
            "status": "ผ่านการสอบ" if exam_session.status == "passed" else "ไม่ผ่านการสอบ",
            "ai_recommendation": "แนะนำให้รับเข้าทำงาน" if basic_score >= 70 else "พิจารณาเพิ่มเติม" if basic_score >= 50 else "ไม่แนะนำ",
            "overall_feedback": "ผลการประเมินจากระบบอัตโนมัติ - ต้องการการตรวจสอบเพิ่มเติมจาก AI",
            
            "score_breakdown": {
                "total": basic_score,
                "total_max": 100,
                "percentage": basic_score
            },
            "multiple_choice_score": {"score": 0, "max_score": 0, "percentage": 0},
            "coding_scores": [],
            
            "criteria_analysis": {
                "programming_fundamentals": {
                    "score": int(basic_score * 0.4),
                    "max_score": 40,
                    "feedback": "ต้องการการประเมินเพิ่มเติมจาก AI"
                },
                "problem_solving": {
                    "score": int(basic_score * 0.3),
                    "max_score": 30,
                    "feedback": "ต้องการการประเมินเพิ่มเติมจาก AI"
                },
                "code_quality": {
                    "score": int(basic_score * 0.3),
                    "max_score": 30,
                    "feedback": "ต้องการการประเมินเพิ่มเติมจาก AI"
                }
            },
            
            "detailed_analysis": {
                "strengths": ["ส่งงานตรงเวลา", "ครบถ้วนตามที่กำหนด"],
                "weaknesses": ["ต้องการการประเมินจาก AI เพื่อความแม่นยำ"],
                "suggestions": ["รอการประเมินจาก Google AI", "ติดต่อผู้ดูแลระบบหากมีปัญหา"]
            },
            
            "evaluation_method": "fallback",
            "ai_model": "basic_evaluation",
            "evaluation_timestamp": exam_session.updated_at.isoformat() if exam_session.updated_at else "ไม่ระบุ"
        }
    
    # Calculate cheating analysis
    cheating_probability = suspicious_data.get("cheating_probability", 0)
    ai_confidence = suspicious_data.get("ai_confidence", 85)
    
    return {
        "id": candidate.id,
        "first_name": candidate.first_name,
        "last_name": candidate.last_name,
        "email": candidate.email,
        "phone": candidate.phone,
        "position": exam_session.exam_template.position.name if exam_session.exam_template else "ไม่ระบุ",
        "exam_template_name": exam_session.exam_template.name if exam_session.exam_template else "ไม่ระบุ",
        "programming_language": exam_session.exam_template.programming_language if exam_session.exam_template else "ไม่ระบุ",
        
        # Basic info
        "exam_date": exam_session.start_time.strftime("%Y-%m-%d %H:%M:%S") if exam_session.start_time else "ไม่ระบุ",
        "exam_duration": f"{exam_session.exam_template.duration_minutes} นาที" if exam_session.exam_template else "60 นาที",
        
        # Main results (ผลการสอบ)
        "exam_results": exam_results,
        
        # Anti-cheat analysis
        "proctoring_analysis": {
            "cheating_percentage": cheating_probability,
            "ai_confidence": ai_confidence,
            "total_events": len(proctoring_events),
            "proctoring_events": proctoring_events,
            "video_segments": generate_mock_video_segments(proctoring_events)
        },
        
        # Session metadata
        "session_metadata": {
            "session_id": exam_session.session_id,
            "status": exam_session.status,
            "evaluation_method": suspicious_data.get("evaluation_method", "basic"),
            "last_updated": suspicious_data.get("last_updated", exam_session.updated_at.isoformat() if exam_session.updated_at else "ไม่ระบุ")
        }
    }

def get_event_description(event_type: str) -> str:
    """Get Thai description for event type"""
    descriptions = {
        "face_lost": "ไม่พบใบหน้าในกรอบ",
        "multiple_faces": "พบใบหน้ามากกว่า 1 คน", 
        "phone_detected": "พบวัตถุคล้ายมือถือ",
        "tab_switch": "เปลี่ยนแท็บเบราว์เซอร์",
        "fullscreen_exit": "ออกจากโหมดเต็มจอ",
        "suspicious_movement": "ความเคลื่อนไหวน่าสงสัย",
        "poor_lighting": "แสงไม่เพียงพอ"
    }
    return descriptions.get(event_type, "กิจกรรมน่าสงสัย")

def get_event_severity(event_type: str) -> str:
    """Get severity level for event type"""
    high_severity = ["phone_detected", "multiple_faces", "tab_switch"]
    medium_severity = ["face_lost", "fullscreen_exit"]
    
    if event_type in high_severity:
        return "high"
    elif event_type in medium_severity:
        return "medium"
    else:
        return "low"

def generate_mock_video_segments(events: List[Dict]) -> List[Dict]:
    """Generate mock video segments based on events"""
    segments = []
    for i, event in enumerate(events[:3]):  # Limit to 3 segments
        segments.append({
            "timestamp": event["timestamp"],
            "url": f"/videos/candidate_1_segment_{i+1}.mp4"
        })
    return segments 