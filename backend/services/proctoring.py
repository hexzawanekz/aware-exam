import json
import logging
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.database import ProctoringLog

logger = logging.getLogger(__name__)

class ProctoringService:
    def __init__(self):
        """Initialize proctoring service"""
        self.violation_weights = {
            "no_face": 3,
            "multiple_faces": 5,
            "tab_switch": 4,
            "copy_paste": 3,
            "right_click": 2,
            "fullscreen_exit": 4,
            "suspicious_movement": 2,
            "unknown_person": 5
        }
        logger.info("Proctoring service initialized")
    
    async def log_event(self, session_id: str, event_type: str, event_data: Dict[str, Any]) -> bool:
        """
        Log a proctoring event to the database
        
        Args:
            session_id: Exam session ID
            event_type: Type of event (face_detection, tab_switch, etc.)
            event_data: Additional event data
            
        Returns:
            Boolean indicating success
        """
        try:
            db = SessionLocal()
            
            # Determine severity based on event type
            severity = self._determine_severity(event_type, event_data)
            
            # Create proctoring log entry
            log_entry = ProctoringLog(
                exam_session_id=int(session_id),
                event_type=event_type,
                event_data=event_data,
                severity=severity,
                timestamp=datetime.utcnow()
            )
            
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            
            logger.info(f"Logged proctoring event: {event_type} for session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to log proctoring event: {e}")
            return False
        finally:
            db.close()
    
    def _determine_severity(self, event_type: str, event_data: Dict[str, Any]) -> str:
        """Determine the severity of an event"""
        
        # Face detection events
        if event_type == "face_detection":
            face_count = event_data.get("face_count", 0)
            if face_count == 0:
                return "warning"
            elif face_count > 1:
                return "critical"
            else:
                return "info"
        
        # Browser events
        elif event_type in ["tab_switch", "fullscreen_exit"]:
            return "warning"
        
        # Input events
        elif event_type in ["copy_paste", "right_click"]:
            return "warning"
        
        # Identity verification
        elif event_type == "identity_verification":
            verified = event_data.get("identity_verified", False)
            if not verified:
                return "critical"
            else:
                return "info"
        
        # Default
        else:
            return "info"
    
    async def get_session_violations(self, session_id: int) -> List[Dict[str, Any]]:
        """Get all violations for a specific exam session"""
        try:
            db = SessionLocal()
            
            violations = db.query(ProctoringLog).filter(
                ProctoringLog.exam_session_id == session_id,
                ProctoringLog.severity.in_(["warning", "critical"])
            ).order_by(ProctoringLog.timestamp.desc()).all()
            
            result = []
            for violation in violations:
                result.append({
                    "id": violation.id,
                    "event_type": violation.event_type,
                    "event_data": violation.event_data,
                    "severity": violation.severity,
                    "timestamp": violation.timestamp.isoformat()
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get session violations: {e}")
            return []
        finally:
            db.close()
    
    async def calculate_violation_score(self, session_id: int) -> float:
        """Calculate a violation score for the session"""
        try:
            violations = await self.get_session_violations(session_id)
            
            total_score = 0
            for violation in violations:
                event_type = violation["event_type"]
                severity = violation["severity"]
                
                # Base weight from event type
                weight = self.violation_weights.get(event_type, 1)
                
                # Multiply by severity
                if severity == "critical":
                    weight *= 2
                elif severity == "warning":
                    weight *= 1.5
                
                total_score += weight
            
            return min(total_score, 100)  # Cap at 100
            
        except Exception as e:
            logger.error(f"Failed to calculate violation score: {e}")
            return 0
    
    async def is_session_suspicious(self, session_id: int, threshold: float = 15.0) -> bool:
        """Check if a session is considered suspicious based on violation score"""
        score = await self.calculate_violation_score(session_id)
        return score >= threshold
    
    async def get_real_time_alerts(self, session_id: int, last_check: datetime = None) -> List[Dict[str, Any]]:
        """Get real-time alerts for active monitoring"""
        try:
            db = SessionLocal()
            
            query = db.query(ProctoringLog).filter(
                ProctoringLog.exam_session_id == session_id,
                ProctoringLog.severity == "critical"
            )
            
            if last_check:
                query = query.filter(ProctoringLog.timestamp > last_check)
            
            alerts = query.order_by(ProctoringLog.timestamp.desc()).limit(10).all()
            
            result = []
            for alert in alerts:
                result.append({
                    "id": alert.id,
                    "event_type": alert.event_type,
                    "message": self._get_alert_message(alert.event_type, alert.event_data),
                    "timestamp": alert.timestamp.isoformat(),
                    "severity": alert.severity
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get real-time alerts: {e}")
            return []
        finally:
            db.close()
    
    def _get_alert_message(self, event_type: str, event_data: Dict[str, Any]) -> str:
        """Generate human-readable alert messages"""
        messages = {
            "no_face": "ไม่พบใบหน้าของผู้สอบ",
            "multiple_faces": f"พบใบหน้าหลายคน ({event_data.get('face_count', 0)} คน)",
            "tab_switch": "ผู้สอบเปลี่ยนแท็บเบราว์เซอร์",
            "fullscreen_exit": "ผู้สอบออกจากโหมดเต็มจอ",
            "copy_paste": "ผู้สอบใช้คำสั่ง Copy/Paste",
            "right_click": "ผู้สอบคลิกขวา",
            "unknown_person": "พบบุคคลที่ไม่ใช่ผู้สอบ"
        }
        
        return messages.get(event_type, f"เหตุการณ์: {event_type}") 