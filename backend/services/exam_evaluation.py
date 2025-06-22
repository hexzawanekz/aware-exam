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
            
            # Prepare evaluation data for Google AI
            evaluation_data = await self._prepare_evaluation_data(session, db)
            
            # Trigger N8N workflow for evaluation with enhanced data
            workflow_result = await self._trigger_evaluation_workflow(session_id, evaluation_data)
            
            if workflow_result.get("success"):
                logger.info(f"Exam evaluation completed successfully for session {session_id}")
                
                # Update session with AI results if available
                if "ai_results" in workflow_result:
                    await self._update_session_with_ai_results(session, workflow_result["ai_results"], db)
                
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
    
    async def _prepare_evaluation_data(self, session: ExamSession, db: Session) -> Dict[str, Any]:
        """Prepare comprehensive evaluation data for Google AI"""
        # Calculate multiple choice score (exact scoring)
        mc_score_data = self._calculate_multiple_choice_score(session)
        
        # Prepare coding questions for AI evaluation
        coding_questions = self._prepare_coding_questions_for_ai(session)
        
        # Get proctoring analysis
        proctoring_data = await self._analyze_proctoring_events(session, db)
        
        # Prepare candidate information
        candidate_info = {
            "candidate_id": session.candidate_id,
            "candidate_name": f"{session.candidate.first_name} {session.candidate.last_name}",
            "email": session.candidate.email,
            "exam_duration": (session.end_time - session.start_time).total_seconds() / 60 if session.end_time and session.start_time else 0
        }
        
        return {
            "session_id": session.session_id,
            "candidate_info": candidate_info,
            "multiple_choice_score": mc_score_data,
            "coding_questions": coding_questions,
            "proctoring_analysis": proctoring_data,
            "exam_template": {
                "name": session.exam_template.name,
                "description": session.exam_template.description,
                "programming_language": session.exam_template.programming_language,
                "duration_minutes": session.exam_template.duration_minutes
            },
            "evaluation_timestamp": datetime.utcnow().isoformat()
        }

    def _calculate_multiple_choice_score(self, session: ExamSession) -> Dict[str, Any]:
        """Calculate exact multiple choice scores (correct = full points, wrong = 0)"""
        # Fallback to exam template questions if randomized_questions is missing
        questions = session.randomized_questions or (session.exam_template.questions if session.exam_template else [])
        
        # Enhanced debugging for answer collection
        logger.info(f"🔍 MC Score Calculation for session {session.session_id}")
        logger.info(f"📝 Available answers: {list(session.answers.keys()) if session.answers else 'None'}")
        logger.info(f"❓ Available questions: {len(questions) if questions else 0}")
        
        if questions:
            mc_questions_debug = [q for q in questions if q.get('type') == 'multiple_choice']
            logger.info(f"✅ Multiple choice questions found: {len(mc_questions_debug)}")
            for q in mc_questions_debug:
                q_id = str(q.get('id', ''))
                user_answer = session.answers.get(q_id) if session.answers else None
                logger.info(f"   Question {q_id}: Answer = {user_answer}")

        if not questions or not session.answers:
            logger.warning(f"⚠️ Missing data - Questions: {bool(questions)}, Answers: {bool(session.answers)}")
            return {
                "total_mc_score": 0,
                "max_mc_score": 0,
                "mc_percentage": 0,
                "mc_questions": [],
                "criteria_breakdown": {}
            }
        answers = session.answers
        
        total_mc_score = 0
        max_mc_score = 0
        mc_questions = []
        criteria_breakdown = {}
        
        for question in questions:
            if question.get("type") != "multiple_choice":
                continue
                
            question_id = str(question.get("id", ""))
            user_answer_data = answers.get(question_id, {})
            
            # Handle both old and new answer formats
            if isinstance(user_answer_data, dict):
                user_answer = user_answer_data.get("answer")
            else:
                user_answer = user_answer_data
            
            # Log missing answers for debugging
            if user_answer is None:
                logger.warning(f"⚠️ Missing answer for MC question {question_id} in session {session.session_id}")
            else:
                logger.info(f"✅ Found answer for MC question {question_id}: {user_answer}")
            
            question_points = question.get("points", question.get("score", 10))
            max_mc_score += question_points
            
            # Track criteria performance - use capitalized "Criteria" for consistency
            criteria = question.get("Criteria", question.get("criteria", "General Knowledge"))
            if criteria not in criteria_breakdown:
                criteria_breakdown[criteria] = {
                    "total_points": 0,
                    "earned_points": 0,
                    "questions_count": 0,
                    "correct_count": 0
                }
            
            criteria_breakdown[criteria]["total_points"] += question_points
            criteria_breakdown[criteria]["questions_count"] += 1
            
            # Exact scoring: correct = full points, wrong = 0
            is_correct = user_answer == question.get("correct_answer")
            question_score = question_points if is_correct else 0
            
            if is_correct:
                criteria_breakdown[criteria]["correct_count"] += 1
                total_mc_score += question_score
                criteria_breakdown[criteria]["earned_points"] += question_score
            
            mc_questions.append({
                "id": question_id,
                "question": question.get("question", ""),
                "user_answer": user_answer,
                "correct_answer": question.get("correct_answer"),
                "options": question.get("options", []),
                "is_correct": is_correct,
                "points": question_points,
                "earned_points": question_score,
                "criteria": criteria,
                "Criteria": criteria  # Include both for consistency
            })
        
        # Calculate percentage for each criteria
        for criteria in criteria_breakdown:
            total_pts = criteria_breakdown[criteria]["total_points"]
            earned_pts = criteria_breakdown[criteria]["earned_points"]
            criteria_breakdown[criteria]["percentage"] = int((earned_pts / total_pts) * 100) if total_pts > 0 else 0
        
        mc_percentage = int((total_mc_score / max_mc_score) * 100) if max_mc_score > 0 else 0
        
        return {
            "total_mc_score": total_mc_score,
            "max_mc_score": max_mc_score,
            "mc_percentage": mc_percentage,
            "mc_questions": mc_questions,
            "criteria_breakdown": criteria_breakdown
        }

    def _prepare_coding_questions_for_ai(self, session: ExamSession) -> List[Dict[str, Any]]:
        """Prepare coding questions and answers for Google AI evaluation"""
        # Fallback to exam template questions if randomized_questions is missing
        questions = session.randomized_questions or (session.exam_template.questions if session.exam_template else [])
        
        # Enhanced debugging for coding questions
        logger.info(f"🔍 Coding Questions Preparation for session {session.session_id}")
        if questions:
            coding_questions_debug = [q for q in questions if q.get('type') in ['code', 'coding']]
            logger.info(f"💻 Coding questions found: {len(coding_questions_debug)}")
        
        if not questions or not session.answers:
            logger.warning(f"⚠️ Missing data for coding - Questions: {bool(questions)}, Answers: {bool(session.answers)}")
            return []
        
        coding_questions = []
        answers = session.answers
        
        for question in questions:
            if question.get("type") not in ["code", "coding"]:
                continue
                
            question_id = str(question.get("id", ""))
            user_answer_data = answers.get(question_id, {})
            
            # Handle both old and new answer formats
            if isinstance(user_answer_data, dict):
                user_answer = user_answer_data.get("answer")
            else:
                user_answer = user_answer_data
            
            # Log coding answers for debugging
            if not user_answer or len(str(user_answer).strip()) == 0:
                logger.warning(f"⚠️ Missing coding answer for question {question_id} in session {session.session_id}")
            else:
                logger.info(f"✅ Found coding answer for question {question_id}: {len(str(user_answer))} characters")
            
            # Ensure criteria format consistency - support both formats
            criteria = question.get("Criteria", question.get("criteria", "Programming Skills"))
            
            coding_question = {
                "id": question_id,
                "question": question.get("question", ""),
                "description": question.get("description", ""),
                "criteria": criteria,  # lowercase for backend consistency
                "Criteria": criteria,  # capitalized for Google AI consistency
                "points": question.get("points", question.get("score", 20)),
                "sample_input": question.get("sample_input", ""),
                "sample_output": question.get("sample_output", ""),
                "expected_approach": question.get("expected_approach", ""),
                "difficulty_level": question.get("difficulty", "medium"),
                "programming_language": session.exam_template.programming_language,
                "user_answer": user_answer or "",
                "answer_length": len(str(user_answer or "")),
                "has_code_structure": self._analyze_code_structure(user_answer or "")
            }
            
            coding_questions.append(coding_question)
        
        return coding_questions

    def _analyze_code_structure(self, code: str) -> Dict[str, bool]:
        """Basic analysis of code structure for AI context"""
        code_lower = code.lower()
        return {
            "has_functions": "def " in code_lower or "function" in code_lower,
            "has_loops": any(keyword in code_lower for keyword in ["for", "while", "foreach"]),
            "has_conditionals": any(keyword in code_lower for keyword in ["if", "else", "elif", "switch", "case"]),
            "has_comments": "//" in code or "#" in code or "/*" in code,
            "has_imports": any(keyword in code_lower for keyword in ["import", "require", "include", "using"]),
            "appears_complete": len(code.strip()) > 50 and "{" in code and "}" in code
        }
    
    async def _trigger_evaluation_workflow(self, session_id: str, evaluation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger N8N evaluation workflow with comprehensive data"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "session_id": session_id,
                    "event_type": "exam_completed",
                    "timestamp": datetime.utcnow().isoformat(),
                    "evaluation_data": evaluation_data  # Include all prepared data
                }
                
                response = await client.post(
                    self.n8n_webhook_url,
                    json=payload,
                    timeout=120  # Increased timeout for AI processing
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"N8N workflow failed with status {response.status_code}: {response.text}")
                    return {"success": False, "error": f"HTTP {response.status_code}"}
                    
        except httpx.TimeoutException:
            logger.error("N8N workflow timeout")
            return {"success": False, "error": "Workflow timeout"}
        except Exception as e:
            logger.error(f"N8N workflow error: {str(e)}")
            return {"success": False, "error": str(e)}

    async def _update_session_with_ai_results(self, session: ExamSession, ai_results: Dict[str, Any], db: Session):
        """Update session with AI evaluation results"""
        try:
            # Update basic score
            if "total_score" in ai_results:
                session.score = ai_results["total_score"]
            
            # Update status based on AI evaluation
            if "status" in ai_results:
                session.status = ai_results["status"]
            elif session.score is not None:
                # Fallback status logic
                session.status = "passed" if session.score >= 60 else "failed"
            
            # Store detailed AI evaluation in suspicious_activities JSON field
            if not session.suspicious_activities:
                session.suspicious_activities = {}
            
            session.suspicious_activities.update({
                "ai_evaluation": ai_results,
                "ai_evaluation_timestamp": datetime.utcnow().isoformat(),
                "evaluation_method": "google_ai"
            })
            
            db.commit()
            logger.info(f"Updated session {session.session_id} with AI results")
            
        except Exception as e:
            logger.error(f"Error updating session with AI results: {str(e)}")
    
    async def _fallback_evaluation(self, session: ExamSession, db: Session) -> Dict[str, Any]:
        """Enhanced fallback evaluation when N8N is not available"""
        try:
            # Calculate multiple choice score with exact scoring
            mc_score_data = self._calculate_multiple_choice_score(session)
            
            # Basic coding evaluation
            coding_score_data = self._calculate_coding_score_fallback(session)
            
            # Combine scores
            total_score = mc_score_data["total_mc_score"] + coding_score_data["total_coding_score"] 
            max_score = mc_score_data["max_mc_score"] + coding_score_data["max_coding_score"]
            percentage_score = int((total_score / max_score) * 100) if max_score > 0 else 0
            
            # Basic proctoring analysis
            proctoring_result = await self._analyze_proctoring_events(session, db)
            
            # Update session with results
            session.score = percentage_score
            session.status = "passed" if percentage_score >= 60 and proctoring_result["cheating_probability"] < 50 else "failed"
            
            # Store evaluation metadata
            evaluation_data = {
                "multiple_choice_score": mc_score_data,
                "coding_score": coding_score_data,
                "total_score": total_score,
                "max_score": max_score,
                "percentage_score": percentage_score,
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
                "message": "Exam evaluated using enhanced fallback method",
                "session_id": session.session_id,
                "results": {
                    "score": session.score,
                    "status": session.status,
                    "evaluation_method": "fallback",
                    "detailed_results": evaluation_data
                }
            }
            
        except Exception as e:
            logger.error(f"Fallback evaluation failed: {str(e)}")
            return {
                "success": False,
                "message": f"Evaluation failed: {str(e)}"
            }
    
    def _calculate_coding_score_fallback(self, session: ExamSession) -> Dict[str, Any]:
        """Calculate coding score with enhanced logic for fallback evaluation"""
        # Fallback to exam template questions if randomized_questions is missing
        questions = session.randomized_questions or (session.exam_template.questions if session.exam_template else [])
        
        if not questions or not session.answers:
            return {"total_coding_score": 0, "max_coding_score": 0, "coding_questions": []}
        
        total_coding_score = 0
        max_coding_score = 0
        coding_questions = []
        answers = session.answers
        
        for question in questions:
            if question.get("type") not in ["code", "coding"]:
                continue
                
            question_id = str(question.get("id", ""))
            user_answer_data = answers.get(question_id, {})
            
            if isinstance(user_answer_data, dict):
                user_answer = user_answer_data.get("answer")
            else:
                user_answer = user_answer_data
            
            question_points = question.get("points", question.get("score", 20))
            max_coding_score += question_points
            
            question_score = self._score_coding_question(user_answer or "", question)
            total_coding_score += question_score
            
            coding_questions.append({
                "id": question_id,
                "question": question.get("question", "")[:100] + "...",
                "user_answer_length": len(str(user_answer or "")),
                "max_points": question_points,
                "earned_points": question_score,
                "criteria": question.get("Criteria", "Programming"),
                "has_substantial_code": len(str(user_answer or "").strip()) > 50
            })
        
        return {
            "total_coding_score": total_coding_score,
            "max_coding_score": max_coding_score,
            "coding_questions": coding_questions
        }

    def _score_coding_question(self, user_answer: str, question: Dict) -> int:
        """Enhanced coding question scoring logic"""
        if not user_answer or len(user_answer.strip()) < 10:
            return 0
        
        max_points = question.get("points", question.get("score", 20))
        answer_length = len(user_answer.strip())
        code_structure = self._analyze_code_structure(user_answer)
        
        # Base score from length
        if answer_length > 200:  # Substantial code
            score = int(max_points * 0.7)
        elif answer_length > 100:  # Moderate code
            score = int(max_points * 0.5)
        elif answer_length > 50:   # Basic attempt
            score = int(max_points * 0.3)
        else:  # Minimal attempt
            score = int(max_points * 0.1)
        
        # Bonus points for code structure
        bonus = 0
        if code_structure["has_functions"]:
            bonus += int(max_points * 0.1)
        if code_structure["has_loops"] or code_structure["has_conditionals"]:
            bonus += int(max_points * 0.1)
        if code_structure["appears_complete"]:
            bonus += int(max_points * 0.1)
        
        return min(max_points, score + bonus)
    
    async def _analyze_proctoring_events(self, session: ExamSession, db: Session) -> Dict[str, Any]:
        """Enhanced proctoring analysis with more detailed scoring"""
        # Get proctoring logs
        logs = db.query(ProctoringLog).filter(ProctoringLog.exam_session_id == session.id).all()
        
        # Enhanced event weights for cheating calculation
        event_weights = {
            "face_lost": 0.4,
            "multiple_faces": 0.9,
            "phone_detected": 1.0,
            "mobile_phone_detected": 1.0,
            "tab_switch": 0.8,
            "fullscreen_exit": 0.7,
            "head_turned_away": 0.5,
            "head_down_detected": 0.6,
            "looking_away_detected": 0.4,
            "suspicious_movement": 0.5,
            "poor_lighting": 0.2
        }
        
        cheating_score = 0
        suspicious_events = []
        event_summary = {}
        
        for log in logs:
            event_type = log.event_type
            weight = event_weights.get(event_type, 0.3)
            confidence = log.confidence or 0.7
            event_score = weight * confidence
            cheating_score += event_score
            
            # Count events by type
            if event_type not in event_summary:
                event_summary[event_type] = {"count": 0, "total_score": 0}
            event_summary[event_type]["count"] += 1
            event_summary[event_type]["total_score"] += event_score
            
            if event_score > 0.3:  # Lower threshold for more comprehensive logging
                suspicious_events.append({
                    "timestamp": log.timestamp.strftime("%H:%M:%S"),
                    "event_type": event_type,
                    "description": self._get_event_description(event_type),
                    "severity": "high" if event_score > 0.7 else "medium" if event_score > 0.4 else "low",
                    "confidence": confidence,
                    "score": round(event_score, 2)
                })
        
        # Normalize cheating probability (0-100)
        cheating_probability = min(100, int(cheating_score * 20))
        
        # Enhanced AI confidence calculation
        ai_confidence = 80
        if len(logs) > 20:  # More data = higher confidence
            ai_confidence += 10
        if len(suspicious_events) < 5:  # Fewer violations = higher confidence
            ai_confidence += 5
        if session.face_verification_count > 10:  # Good face detection = higher confidence
            ai_confidence += 5
            
        ai_confidence = min(95, ai_confidence)
        
        return {
            "cheating_probability": cheating_probability,
            "ai_confidence": ai_confidence,
            "suspicious_events": suspicious_events,
            "event_summary": event_summary,
            "total_events": len(logs),
            "analysis_details": {
                "face_verification_attempts": session.face_verification_count,
                "absent_frames": session.absent_frames_count,
                "tab_switches": session.tab_switch_count,
                "fullscreen_exits": session.fullscreen_exit_count
            }
        }
    
    def _get_event_description(self, event_type: str) -> str:
        """Get Thai description for event type with enhanced descriptions"""
        descriptions = {
            "face_lost": "ไม่พบใบหน้าในกรอบ",
            "multiple_faces": "พบใบหน้ามากกว่า 1 คน",
            "phone_detected": "พบวัตถุคล้ายมือถือ",
            "mobile_phone_detected": "ตรวจพบมือถือในบริเวณสอบ",
            "tab_switch": "เปลี่ยนแท็บเบราว์เซอร์",
            "fullscreen_exit": "ออกจากโหมดเต็มจอ",
            "head_turned_away": "หันหน้าไปทางอื่น",
            "head_down_detected": "ก้มหน้าลง",
            "looking_away_detected": "มองไปทางอื่น",
            "suspicious_movement": "ความเคลื่อนไหวน่าสงสัย",
            "poor_lighting": "แสงไม่เพียงพอ"
        }
        return descriptions.get(event_type, f"กิจกรรมน่าสงสัย: {event_type}")

class ScoreCalculationService:
    """Service for calculating comprehensive exam scores and generating detailed result summaries"""
    
    @staticmethod
    def calculate_detailed_scores(ai_results: dict, candidate_session: dict) -> dict:
        """Calculate detailed scores with criteria breakdown and individual question analysis"""
        
        # Extract basic score data
        mc_score = ai_results.get('multiple_choice_score', {})
        coding_scores = ai_results.get('coding_scores', [])
        score_breakdown = ai_results.get('score_breakdown', {})
        
        # Calculate individual question scores
        mc_questions = []
        mc_criteria_breakdown = mc_score.get('criteria_breakdown', {})
        
        for criteria, breakdown in mc_criteria_breakdown.items():
            mc_questions.append({
                'criteria': criteria,
                'score': breakdown.get('earned_points', 0),
                'max_score': breakdown.get('total_points', 0),
                'percentage': breakdown.get('percentage', 0),
                'questions_answered': breakdown.get('correct_answers', 0),
                'total_questions': breakdown.get('total_questions', 0)
            })
        
        # Process coding question scores
        coding_questions = []
        for coding_score in coding_scores:
            coding_questions.append({
                'question_id': coding_score.get('question_id'),
                'criteria': coding_score.get('Criteria', coding_score.get('criteria', 'Programming')),
                'score': coding_score.get('score', 0),
                'max_score': coding_score.get('max_score', 0),
                'percentage': round((coding_score.get('score', 0) / max(coding_score.get('max_score', 1), 1)) * 100),
                'feedback': coding_score.get('feedback', ''),
                'strengths': coding_score.get('strengths', []),
                'improvements': coding_score.get('improvements', [])
            })
        
        # Calculate total scores by criteria
        criteria_totals = {}
        
        # Add MC criteria
        for mc_q in mc_questions:
            criteria = mc_q['criteria']
            if criteria not in criteria_totals:
                criteria_totals[criteria] = {'score': 0, 'max_score': 0, 'type': ['multiple_choice']}
            criteria_totals[criteria]['score'] += mc_q['score']
            criteria_totals[criteria]['max_score'] += mc_q['max_score']
            
        # Add coding criteria
        for coding_q in coding_questions:
            criteria = coding_q['criteria']
            if criteria not in criteria_totals:
                criteria_totals[criteria] = {'score': 0, 'max_score': 0, 'type': ['coding']}
            else:
                if 'coding' not in criteria_totals[criteria]['type']:
                    criteria_totals[criteria]['type'].append('coding')
                    
            criteria_totals[criteria]['score'] += coding_q['score']
            criteria_totals[criteria]['max_score'] += coding_q['max_score']
        
        # Calculate percentages for criteria
        for criteria in criteria_totals:
            max_score = criteria_totals[criteria]['max_score']
            criteria_totals[criteria]['percentage'] = round(
                (criteria_totals[criteria]['score'] / max(max_score, 1)) * 100
            )
        
        return {
            'summary': {
                'total_score': score_breakdown.get('total', 0),
                'total_max_score': score_breakdown.get('total_max', 100),
                'final_percentage': score_breakdown.get('percentage', 0),
                'status': ai_results.get('status', 'unknown'),
                'multiple_choice_score': score_breakdown.get('multiple_choice', 0),
                'coding_score': score_breakdown.get('coding', 0)
            },
            'criteria_breakdown': criteria_totals,
            'multiple_choice_questions': mc_questions,
            'coding_questions': coding_questions,
            'recommendations': {
                'overall_feedback': ai_results.get('overall_feedback', ''),
                'recommendation': ai_results.get('recommendation', ''),
                'strengths': ai_results.get('detailed_analysis', {}).get('strengths', []),
                'weaknesses': ai_results.get('detailed_analysis', {}).get('weaknesses', []),
                'suggestions': ai_results.get('detailed_analysis', {}).get('suggestions', [])
            },
            'metadata': {
                'evaluation_timestamp': ai_results.get('evaluation_metadata', {}).get('evaluation_timestamp'),
                'ai_model': ai_results.get('evaluation_metadata', {}).get('ai_model'),
                'processing_method': ai_results.get('evaluation_metadata', {}).get('processing_method'),
                'tokens_used': ai_results.get('evaluation_metadata', {}).get('tokens_used', 0)
            }
        }
    
    @staticmethod
    def generate_admin_summary(candidate_session: dict, detailed_scores: dict) -> dict:
        """Generate comprehensive summary for admin interface"""
        
        candidate_info = candidate_session.get('candidate_info', {})
        exam_template = candidate_session.get('exam_template', {})
        
        # Calculate time spent
        start_time = candidate_session.get('start_time')
        completion_time = candidate_session.get('completion_time')
        time_spent_minutes = 0
        
        if start_time and completion_time:
            try:
                from datetime import datetime
                start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                end_dt = datetime.fromisoformat(completion_time.replace('Z', '+00:00'))
                time_spent_minutes = int((end_dt - start_dt).total_seconds() / 60)
            except:
                time_spent_minutes = candidate_info.get('exam_duration', 0)
        
        # Performance indicators
        summary = detailed_scores['summary']
        performance_level = "Excellent" if summary['final_percentage'] >= 80 else \
                           "Good" if summary['final_percentage'] >= 70 else \
                           "Fair" if summary['final_percentage'] >= 60 else \
                           "Needs Improvement"
        
        # Criteria performance analysis
        criteria_performance = []
        for criteria, data in detailed_scores['criteria_breakdown'].items():
            performance_rating = "Strong" if data['percentage'] >= 75 else \
                               "Moderate" if data['percentage'] >= 50 else \
                               "Weak"
            
            criteria_performance.append({
                'criteria': criteria,
                'score': data['score'],
                'max_score': data['max_score'],
                'percentage': data['percentage'],
                'performance_rating': performance_rating,
                'question_types': data['type']
            })
        
        # Sort by percentage descending
        criteria_performance.sort(key=lambda x: x['percentage'], reverse=True)
        
        return {
            'candidate_id': candidate_info.get('candidate_id'),
            'candidate_name': candidate_info.get('candidate_name', 'Unknown'),
            'position': candidate_info.get('position', 'Unknown'),
            'department': candidate_info.get('department', 'Unknown'),
            'company': candidate_info.get('company', 'Unknown'),
            'exam_title': exam_template.get('title', 'Unknown Exam'),
            'programming_language': exam_template.get('programming_language', 'Unknown'),
            
            'exam_session': {
                'session_id': candidate_session.get('session_id'),
                'start_time': start_time,
                'completion_time': completion_time,
                'time_spent_minutes': time_spent_minutes,
                'exam_duration_limit': candidate_info.get('exam_duration', 0),
                'completed_on_time': time_spent_minutes <= candidate_info.get('exam_duration', 0) if candidate_info.get('exam_duration') else True
            },
            
            'score_summary': {
                'total_score': summary['total_score'],
                'total_max_score': summary['total_max_score'],
                'final_percentage': summary['final_percentage'],
                'performance_level': performance_level,
                'status': summary['status'],
                'passed': summary['status'] == 'passed'
            },
            
            'detailed_scores': {
                'multiple_choice': {
                    'score': summary['multiple_choice_score'],
                    'questions_count': len(detailed_scores['multiple_choice_questions']),
                    'percentage': round((summary['multiple_choice_score'] / max(sum(q['max_score'] for q in detailed_scores['multiple_choice_questions']), 1)) * 100) if detailed_scores['multiple_choice_questions'] else 0
                },
                'coding': {
                    'score': summary['coding_score'],
                    'questions_count': len(detailed_scores['coding_questions']),
                    'percentage': round((summary['coding_score'] / max(sum(q['max_score'] for q in detailed_scores['coding_questions']), 1)) * 100) if detailed_scores['coding_questions'] else 0
                }
            },
            
            'criteria_performance': criteria_performance,
            
            'ai_evaluation': {
                'overall_feedback': detailed_scores['recommendations']['overall_feedback'],
                'recommendation': detailed_scores['recommendations']['recommendation'],
                'strengths': detailed_scores['recommendations']['strengths'],
                'areas_for_improvement': detailed_scores['recommendations']['weaknesses'],
                'suggestions': detailed_scores['recommendations']['suggestions']
            },
            
            'technical_details': {
                'ai_model': detailed_scores['metadata']['ai_model'],
                'processing_method': detailed_scores['metadata']['processing_method'],
                'evaluation_timestamp': detailed_scores['metadata']['evaluation_timestamp'],
                'tokens_used': detailed_scores['metadata']['tokens_used']
            }
        }

# Global service instance
exam_evaluation_service = ExamEvaluationService() 