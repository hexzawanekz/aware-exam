import httpx
import json
import logging
from typing import Dict, Any, List
from core.config import settings

logger = logging.getLogger(__name__)

class N8nService:
    def __init__(self):
        self.n8n_url = settings.N8N_API_URL
        self.webhook_url = settings.N8N_WEBHOOK_URL
        
    async def send_proctoring_data(self, session_id: str, data: Dict[str, Any]) -> bool:
        """ส่งข้อมูลการ proctor ไปยัง n8n"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "session_id": session_id,
                    "proctoring_data": data,
                    "timestamp": data.get("timestamp"),
                    "event_type": "proctoring_update"
                }
                
                response = await client.post(
                    f"{self.webhook_url}/proctoring",
                    json=payload,
                    timeout=30
                )
                
                return response.status_code == 200
                
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง n8n: {str(e)}")
            return False
    
    async def process_exam_completion(self, session_id: str) -> bool:
        """ประมวลผลข้อสอบที่เสร็จสิ้น"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "session_id": session_id,
                    "event_type": "exam_completed"
                }
                
                response = await client.post(
                    f"{self.webhook_url}/exam-complete",
                    json=payload,
                    timeout=30
                )
                
                return response.status_code == 200
                
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการประมวลผลข้อสอบ: {str(e)}")
            return False

    async def generate_exam_questions(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """เรียก n8n workflow เพื่อสร้างข้อสอบด้วย AI"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "event_type": "generate_exam",
                    "config": {
                        "company_name": config.get("company_name"),
                        "department_name": config.get("department_name"),
                        "position_name": config.get("position_name"),
                        "programming_language": config.get("programming_language"),
                        "level": config.get("level"),  # junior, senior, specialist
                        "multiple_choice_count": config.get("multiple_choice_count", 10),
                        "coding_question_count": config.get("coding_question_count", 3),
                        "duration_minutes": config.get("duration_minutes", 60),
                        "additional_requirements": config.get("additional_requirements", "")
                    },
                    "timestamp": json.dumps({"timestamp": "now"}, default=str)
                }
                
                response = await client.post(
                    f"{self.webhook_url}/generate-exam-simple",
                    json=payload,
                    timeout=120  # เพิ่มเวลา timeout เพราะ AI ใช้เวลานาน
                )
                
                if response.status_code == 200:
                    try:
                        result = response.json()
                        return {
                            "success": True,
                            "questions": result.get("questions", []),
                            "exam_metadata": result.get("metadata", {}),
                            "processing_time": result.get("processing_time", 0)
                        }
                    except json.JSONDecodeError:
                        logger.error("Invalid JSON response from n8n")
                        return self._generate_fallback_questions(config)
                else:
                    logger.error(f"n8n workflow failed with status: {response.status_code}")
                    return self._generate_fallback_questions(config)
                
        except httpx.ConnectError:
            logger.error("Cannot connect to n8n - using fallback")
            return self._generate_fallback_questions(config)
        except httpx.TimeoutException:
            logger.error("Timeout while generating exam questions - using fallback")
            return self._generate_fallback_questions(config)
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการสร้างข้อสอบ: {str(e)} - using fallback")
            return self._generate_fallback_questions(config)

    def _generate_fallback_questions(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """สร้างข้อสอบ fallback เมื่อ n8n ไม่ทำงาน"""
        from datetime import datetime
        
        programming_language = config.get("programming_language", "JavaScript")
        level = config.get("level", "junior")
        mc_count = config.get("multiple_choice_count", 5)
        code_count = config.get("coding_question_count", 2)
        
        questions = []
        question_id = 1
        
        # สร้างข้อสอบปรนัย
        mc_templates = [
            {
                "question": f"What is the primary paradigm of {programming_language}?",
                "options": [
                    {"id": "a", "text": "Object-oriented"},
                    {"id": "b", "text": "Functional"},
                    {"id": "c", "text": "Procedural"},
                    {"id": "d", "text": "Multi-paradigm"}
                ],
                "correct_answer": "d"
            },
            {
                "question": f"Which of the following is a key feature of {programming_language}?",
                "options": [
                    {"id": "a", "text": "Dynamic typing"},
                    {"id": "b", "text": "Static typing"},
                    {"id": "c", "text": "Memory management"},
                    {"id": "d", "text": "All of the above"}
                ],
                "correct_answer": "d"
            },
            {
                "question": f"What is the best practice for error handling in {programming_language}?",
                "options": [
                    {"id": "a", "text": "Try-catch blocks"},
                    {"id": "b", "text": "Return error codes"},
                    {"id": "c", "text": "Ignore errors"},
                    {"id": "d", "text": "Log and continue"}
                ],
                "correct_answer": "a"
            }
        ]
        
        for i in range(min(mc_count, len(mc_templates))):
            questions.append({
                "id": question_id,
                "type": "multiple_choice",
                **mc_templates[i],
                "score": 10
            })
            question_id += 1
        
        # สร้างข้อสอบเขียนโปรแกรม
        code_templates = [
            {
                "question": f"Write a function in {programming_language} to calculate factorial of a number",
                "expected_output": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }"
            },
            {
                "question": f"Write a function in {programming_language} to reverse a string",
                "expected_output": "function reverseString(str) { return str.split('').reverse().join(''); }"
            }
        ]
        
        for i in range(min(code_count, len(code_templates))):
            questions.append({
                "id": question_id,
                "type": "code",
                **code_templates[i],
                "score": 20
            })
            question_id += 1
        
        return {
            "success": True,
            "questions": questions,
            "exam_metadata": {
                "total_questions": len(questions),
                "total_score": sum(q["score"] for q in questions),
                "difficulty": level,
                "language": programming_language,
                "generated_at": datetime.now().isoformat(),
                "source": "fallback_generator"
            },
            "processing_time": 0.5
        }

    async def validate_generated_questions(self, questions: List[Dict]) -> Dict[str, Any]:
        """ตรวจสอบความถูกต้องของข้อสอบที่ AI สร้าง"""
        try:
            validation_result = {
                "is_valid": True,
                "errors": [],
                "warnings": [],
                "statistics": {
                    "total_questions": len(questions),
                    "multiple_choice": 0,
                    "coding": 0,
                    "essay": 0,
                    "true_false": 0
                }
            }
            
            for i, question in enumerate(questions):
                # ตรวจสอบ required fields
                if not question.get("question"):
                    validation_result["errors"].append(f"คำถามที่ {i+1}: ไม่มีเนื้อหาคำถาม")
                    validation_result["is_valid"] = False
                
                if not question.get("type"):
                    validation_result["errors"].append(f"คำถามที่ {i+1}: ไม่ระบุประเภทคำถาม")
                    validation_result["is_valid"] = False
                
                # นับประเภทคำถาม
                question_type = question.get("type", "")
                if question_type in validation_result["statistics"]:
                    validation_result["statistics"][question_type] += 1
                
                # ตรวจสอบตามประเภทคำถาม
                if question_type == "multiple_choice":
                    if not question.get("options") or len(question.get("options", [])) < 2:
                        validation_result["errors"].append(f"คำถามที่ {i+1}: ตัวเลือกไม่เพียงพอ")
                        validation_result["is_valid"] = False
                    
                    if not question.get("correct_answer"):
                        validation_result["errors"].append(f"คำถามที่ {i+1}: ไม่ระบุคำตอบที่ถูกต้อง")
                        validation_result["is_valid"] = False
                
                elif question_type == "code":
                    if not question.get("expected_output") and not question.get("expected_code"):
                        validation_result["warnings"].append(f"คำถามที่ {i+1}: ควรระบุผลลัพธ์ที่คาดหวัง")
            
            return validation_result
            
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการตรวจสอบข้อสอบ: {str(e)}")
            return {
                "is_valid": False,
                "errors": [f"เกิดข้อผิดพลาดในการตรวจสอบ: {str(e)}"],
                "warnings": [],
                "statistics": {}
            }

# สร้าง singleton instance
n8n_service = N8nService() 