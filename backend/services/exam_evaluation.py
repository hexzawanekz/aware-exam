import httpx
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from core.config import settings
from models.exam import ExamSession, ProctoringLog, Candidate

logger = logging.getLogger(__name__)

class ExamEvaluationService:
    def __init__(self):
        self.n8n_webhook_url = f"{settings.N8N_WEBHOOK_URL}/exam-complete"
        
    async def process_exam_completion(self, session_id: str, db: Session) -> Dict[str, Any]:
        """Process exam completion and trigger evaluation workflow"""
        try:
            # Get exam session details
            session = db.query(ExamSession).filter(ExamSession.session_id == session_id).first()
            if not session:
                raise ValueError(f"Exam session {session_id} not found")
            
            # Trigger N8N workflow for evaluation
            workflow_result = await self._trigger_evaluation_workflow(session_id)
            
            if workflow_result.get("success"):
                logger.info(f"Exam evaluation completed successfully for session {session_id}")
                return {
                    "success": True,
                    "message": "Exam evaluation completed successfully",
                    "session_id": session_id,
                    "evaluation_results": workflow_result
                }
            else:
                # Fallback to local evaluation if N8N fails
                logger.warning(f"N8N workflow failed for session {session_id}, using fallback evaluation")
                return await self._fallback_evaluation(session, db)
                
        except Exception as e:
            logger.error(f"Error processing exam completion: {str(e)}")
            # Fallback evaluation
            session = db.query(ExamSession).filter(ExamSession.session_id == session_id).first()
            if session:
                return await self._fallback_evaluation(session, db)
            else:
                return {
                    "success": False,
                    "message": f"Failed to process exam completion: {str(e)}"
                }
    
    async def _trigger_evaluation_workflow(self, session_id: str) -> Dict[str, Any]:
        """Trigger N8N evaluation workflow"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "session_id": session_id,
                    "event_type": "exam_completed",
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                response = await client.post(
                    self.n8n_webhook_url,
                    json=payload,
                    timeout=60
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"N8N workflow failed with status {response.status_code}")
                    return {"success": False, "error": f"HTTP {response.status_code}"}
                    
        except httpx.TimeoutException:
            logger.error("N8N workflow timeout")
            return {"success": False, "error": "Workflow timeout"}
        except Exception as e:
            logger.error(f"N8N workflow error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _fallback_evaluation(self, session: ExamSession, db: Session) -> Dict[str, Any]:
        """Fallback evaluation when N8N is not available"""
        try:
            # Basic scoring
            score_result = self._calculate_basic_score(session)
            
            # Basic proctoring analysis
            proctoring_result = await self._analyze_proctoring_events(session, db)
            
            # Update session with results
            session.score = score_result["percentage_score"]
            session.status = "passed" if score_result["percentage_score"] >= 60 and proctoring_result["cheating_probability"] < 50 else "failed"
            
            # Store evaluation metadata
            evaluation_data = {
                "cheating_probability": proctoring_result["cheating_probability"],
                "ai_confidence": proctoring_result["ai_confidence"],
                "suspicious_events": proctoring_result["suspicious_events"],
                "evaluation_method": "fallback",
                "evaluation_timestamp": datetime.utcnow().isoformat()
            }
            
            if not session.suspicious_activities:
                session.suspicious_activities = {}
            session.suspicious_activities.update(evaluation_data)
            
            db.commit()
            
            return {
                "success": True,
                "message": "Exam evaluated using fallback method",
                "session_id": session.session_id,
                "results": {
                    "score": session.score,
                    "status": session.status,
                    "evaluation_method": "fallback"
                }
            }
            
        except Exception as e:
            logger.error(f"Fallback evaluation failed: {str(e)}")
            return {
                "success": False,
                "message": f"Evaluation failed: {str(e)}"
            }
    
    def _calculate_basic_score(self, session: ExamSession) -> Dict[str, Any]:
        """Calculate basic score from answers"""
        if not session.randomized_questions or not session.answers:
            return {"total_score": 0, "max_score": 0, "percentage_score": 0}
        
        questions = session.randomized_questions
        answers = session.answers
        
        total_score = 0
        max_score = 0
        
        for question in questions:
            question_id = str(question.get("id", ""))
            user_answer = answers.get(question_id)
            question_score = question.get("score", 10)
            max_score += question_score
            
            if question.get("type") == "multiple_choice":
                if user_answer and user_answer == question.get("correct_answer"):
                    total_score += question_score
            elif question.get("type") in ["code", "coding"]:
                # Basic code evaluation - give partial credit for attempts
                if user_answer and len(str(user_answer).strip()) > 10:
                    if len(str(user_answer)) > 50:
                        total_score += int(question_score * 0.7)
                    else:
                        total_score += int(question_score * 0.3)
        
        percentage_score = int((total_score / max_score) * 100) if max_score > 0 else 0
        
        return {
            "total_score": total_score,
            "max_score": max_score,
            "percentage_score": percentage_score
        }
    
    async def _analyze_proctoring_events(self, session: ExamSession, db: Session) -> Dict[str, Any]:
        """Analyze proctoring events for cheating probability"""
        # Get proctoring logs
        logs = db.query(ProctoringLog).filter(ProctoringLog.exam_session_id == session.id).all()
        
        # Event weights for cheating calculation
        event_weights = {
            "face_lost": 0.3,
            "multiple_faces": 0.8,
            "phone_detected": 0.9,
            "tab_switch": 0.7,
            "fullscreen_exit": 0.6,
            "suspicious_movement": 0.4,
            "poor_lighting": 0.2
        }
        
        cheating_score = 0
        suspicious_events = []
        
        for log in logs:
            weight = event_weights.get(log.event_type, 0.3)
            confidence = log.confidence or 0.7
            event_score = weight * confidence
            cheating_score += event_score
            
            if event_score > 0.4:
                suspicious_events.append({
                    "timestamp": log.timestamp.strftime("%H:%M:%S"),
                    "event_type": log.event_type,
                    "description": self._get_event_description(log.event_type),
                    "severity": "high" if event_score > 0.7 else "medium" if event_score > 0.4 else "low",
                    "duration": log.event_metadata.get("duration", "1 วินาที") if log.event_metadata else "1 วินาที"
                })
        
        # Normalize cheating probability
        cheating_probability = min(100, int(cheating_score * 25))
        
        # Calculate AI confidence
        ai_confidence = 85
        if len(logs) > 10:
            ai_confidence += 10
        if len(suspicious_events) < 3:
            ai_confidence += 5
        ai_confidence = min(95, ai_confidence)
        
        return {
            "cheating_probability": cheating_probability,
            "ai_confidence": ai_confidence,
            "suspicious_events": suspicious_events,
            "total_events": len(logs)
        }
    
    def _get_event_description(self, event_type: str) -> str:
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

# Global service instance
exam_evaluation_service = ExamEvaluationService() 