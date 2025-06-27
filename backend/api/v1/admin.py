from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
import json
import httpx

from core.database import get_db
from models.exam import Company, Department, Position, ProgrammingLanguage, ExamTemplate, Candidate, ExamSession
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

# Pydantic models for request/response
class CompanyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None

class CompanyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    company_id: int

class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    company_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PositionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    department_id: int
    programming_language_id: Optional[int] = None

class PositionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    department_id: int
    programming_language_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProgrammingLanguageCreate(BaseModel):
    name: str
    description: Optional[str] = None
    version: Optional[str] = None
    is_active: bool = True

class ProgrammingLanguageResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    version: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_companies: int
    total_departments: int
    total_positions: int
    total_exam_templates: int
    total_candidates: int
    total_exam_sessions: int
    active_exams: int
    recent_candidates: int

# Pydantic models for AI Exam Generation
class AIExamQuestion(BaseModel):
    id: Optional[int] = None
    type: str  # "multiple_choice" or "coding"
    question: str
    Criteria: Optional[str] = None  # AI-generated criteria for skill measurement
    options: Optional[List[Dict[str, str]]] = None  # สำหรับ multiple choice
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    description: Optional[str] = None  # สำหรับ coding questions
    sample_input: Optional[str] = None
    sample_output: Optional[str] = None
    expected_output: Optional[str] = None  # For coding questions
    points: int = 10  # AI-assigned points (should sum to 100)
    score: Optional[int] = None  # Backward compatibility

class AIExamData(BaseModel):
    exam_title: str
    description: str
    duration_minutes: int
    questions: List[AIExamQuestion]
    metadata: Optional[Dict[str, Any]] = None

class N8NWebhookResponse(BaseModel):
    success: bool
    exam_data: Optional[AIExamData] = None
    error: Optional[str] = None
    processing_time: Optional[float] = None
    timestamp: str

# Add Candidate Management after the AI Exam endpoints

class CandidateCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None

class CandidateUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position_id: Optional[int] = None
    programming_language_id: Optional[int] = None

class CandidateResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime
    status: Optional[str] = None
    position: Optional[str] = None
    
    class Config:
        from_attributes = True

# Dashboard Statistics
@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics for admin interface"""
    
    # Get recent candidates (last 7 days)
    recent_date = datetime.utcnow() - timedelta(days=7)
    recent_candidates = db.query(Candidate).filter(
        Candidate.created_at >= recent_date
    ).count()
    
    # Get active exams
    active_exams = db.query(ExamTemplate).filter(
        ExamTemplate.is_active == True
    ).count()
    
    stats = DashboardStats(
        total_companies=db.query(Company).count(),
        total_departments=db.query(Department).count(),
        total_positions=db.query(Position).count(),
        total_exam_templates=db.query(ExamTemplate).count(),
        total_candidates=db.query(Candidate).count(),
        total_exam_sessions=db.query(ExamSession).count(),
        active_exams=active_exams,
        recent_candidates=recent_candidates
    )
    
    return stats

# Company Management
@router.post("/companies", response_model=CompanyResponse)
async def create_company(company: CompanyCreate, db: Session = Depends(get_db)):
    """Create a new company"""
    db_company = Company(
        name=company.name,
        description=company.description,
        logo_url=company.logo_url
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

@router.get("/companies", response_model=List[CompanyResponse])
async def list_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List all companies with pagination"""
    companies = db.query(Company).offset(skip).limit(limit).all()
    return companies

@router.get("/companies/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: int, db: Session = Depends(get_db)):
    """Get company by ID"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.put("/companies/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: int, 
    company_update: CompanyCreate, 
    db: Session = Depends(get_db)
):
    """Update company"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company.name = company_update.name
    company.description = company_update.description
    company.logo_url = company_update.logo_url
    
    db.commit()
    db.refresh(company)
    return company

@router.delete("/companies/{company_id}")
async def delete_company(company_id: int, db: Session = Depends(get_db)):
    """Delete company"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db.delete(company)
    db.commit()
    return {"message": "Company deleted successfully"}

# Department Management
@router.post("/companies/{company_id}/departments", response_model=DepartmentResponse)
async def create_department(
    company_id: int, 
    department: DepartmentCreate, 
    db: Session = Depends(get_db)
):
    """Create a new department"""
    # Verify company exists
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db_department = Department(
        name=department.name,
        description=department.description,
        company_id=company_id
    )
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department

@router.get("/companies/{company_id}/departments")
async def list_company_departments(company_id: int, db: Session = Depends(get_db)):
    """List all departments for a company with company information"""
    departments = db.query(Department).filter(Department.company_id == company_id).all()
    
    result = []
    for dept in departments:
        result.append({
            "id": dept.id,
            "name": dept.name,
            "description": dept.description,
            "company_id": dept.company_id,
            "company_name": dept.company.name if dept.company else None,
            "created_at": dept.created_at.isoformat() if dept.created_at else None
        })
    
    return result

@router.get("/departments")
async def list_all_departments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List all departments with pagination and company information"""
    departments = db.query(Department).offset(skip).limit(limit).all()
    
    result = []
    for dept in departments:
        result.append({
            "id": dept.id,
            "name": dept.name,
            "description": dept.description,
            "company_id": dept.company_id,
            "company_name": dept.company.name if dept.company else None,
            "created_at": dept.created_at.isoformat() if dept.created_at else None
        })
    
    return result

@router.put("/departments/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: int, 
    department_update: DepartmentCreate, 
    db: Session = Depends(get_db)
):
    """Update department"""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Verify company exists if company_id is being changed
    if department_update.company_id != department.company_id:
        company = db.query(Company).filter(Company.id == department_update.company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
    
    department.name = department_update.name
    department.description = department_update.description
    department.company_id = department_update.company_id
    
    db.commit()
    db.refresh(department)
    return department

@router.delete("/departments/{department_id}")
async def delete_department(department_id: int, db: Session = Depends(get_db)):
    """Delete department"""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    db.delete(department)
    db.commit()
    return {"message": "Department deleted successfully"}

# Position Management
@router.post("/positions", response_model=PositionResponse)
async def create_position_general(
    position: PositionCreate, 
    db: Session = Depends(get_db)
):
    """Create a new position with department_id in body"""
    # Verify department exists
    department = db.query(Department).filter(Department.id == position.department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Verify programming language exists if provided
    if position.programming_language_id:
        programming_language = db.query(ProgrammingLanguage).filter(
            ProgrammingLanguage.id == position.programming_language_id
        ).first()
        if not programming_language:
            raise HTTPException(status_code=404, detail="Programming language not found")
    
    db_position = Position(
        name=position.name,
        description=position.description,
        department_id=position.department_id,
        programming_language_id=position.programming_language_id
    )
    db.add(db_position)
    db.commit()
    db.refresh(db_position)
    return db_position

@router.post("/departments/{department_id}/positions", response_model=PositionResponse)
async def create_position(
    department_id: int, 
    position: PositionCreate, 
    db: Session = Depends(get_db)
):
    """Create a new position"""
    # Verify department exists
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Verify programming language exists if provided
    if position.programming_language_id:
        programming_language = db.query(ProgrammingLanguage).filter(
            ProgrammingLanguage.id == position.programming_language_id
        ).first()
        if not programming_language:
            raise HTTPException(status_code=404, detail="Programming language not found")
    
    db_position = Position(
        name=position.name,
        description=position.description,
        department_id=department_id,
        programming_language_id=position.programming_language_id
    )
    db.add(db_position)
    db.commit()
    db.refresh(db_position)
    return db_position

@router.get("/departments/{department_id}/positions", response_model=List[PositionResponse])
async def list_department_positions(department_id: int, db: Session = Depends(get_db)):
    """List all positions for a department"""
    positions = db.query(Position).filter(Position.department_id == department_id).all()
    return positions

@router.get("/positions")
async def list_all_positions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List all positions with pagination"""
    positions = db.query(Position).offset(skip).limit(limit).all()
    
    result = []
    for position in positions:
        result.append({
            "id": position.id,
            "name": position.name,
            "description": position.description,
            "department_id": position.department_id,
            "department_name": position.department.name if position.department else None,
            "company_name": position.department.company.name if position.department and position.department.company else None,
            "programming_language_id": position.programming_language_id,
            "programming_language_name": position.programming_language.name if position.programming_language else None,
            "programming_language_version": position.programming_language.version if position.programming_language else None,
            "created_at": position.created_at.isoformat() if position.created_at else None
        })
    
    return result

@router.put("/positions/{position_id}", response_model=PositionResponse)
async def update_position(
    position_id: int, 
    position_update: PositionCreate, 
    db: Session = Depends(get_db)
):
    """Update position"""
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    # Verify programming language exists if provided
    if position_update.programming_language_id:
        programming_language = db.query(ProgrammingLanguage).filter(
            ProgrammingLanguage.id == position_update.programming_language_id
        ).first()
        if not programming_language:
            raise HTTPException(status_code=404, detail="Programming language not found")
    
    position.name = position_update.name
    position.description = position_update.description
    position.department_id = position_update.department_id
    position.programming_language_id = position_update.programming_language_id
    
    db.commit()
    db.refresh(position)
    return position

@router.delete("/positions/{position_id}")
async def delete_position(position_id: int, db: Session = Depends(get_db)):
    """Delete position"""
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    db.delete(position)
    db.commit()
    return {"message": "Position deleted successfully"}

# Programming Language Management
@router.post("/programming-languages", response_model=ProgrammingLanguageResponse)
async def create_programming_language(
    programming_language: ProgrammingLanguageCreate, 
    db: Session = Depends(get_db)
):
    """Create a new programming language"""
    db_programming_language = ProgrammingLanguage(
        name=programming_language.name,
        description=programming_language.description,
        version=programming_language.version,
        is_active=programming_language.is_active
    )
    db.add(db_programming_language)
    db.commit()
    db.refresh(db_programming_language)
    return db_programming_language

@router.get("/programming-languages")
async def list_programming_languages(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    active_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """List all programming languages with pagination"""
    query = db.query(ProgrammingLanguage)
    
    if active_only:
        query = query.filter(ProgrammingLanguage.is_active == True)
    
    programming_languages = query.offset(skip).limit(limit).all()
    
    result = []
    for lang in programming_languages:
        # Count positions using this language
        position_count = db.query(Position).filter(Position.programming_language_id == lang.id).count()
        
        result.append({
            "id": lang.id,
            "name": lang.name,
            "description": lang.description,
            "version": lang.version,
            "is_active": lang.is_active,
            "position_count": position_count,
            "created_at": lang.created_at.isoformat() if lang.created_at else None
        })
    
    return result

@router.get("/programming-languages/{language_id}", response_model=ProgrammingLanguageResponse)
async def get_programming_language(language_id: int, db: Session = Depends(get_db)):
    """Get programming language by ID"""
    language = db.query(ProgrammingLanguage).filter(ProgrammingLanguage.id == language_id).first()
    if not language:
        raise HTTPException(status_code=404, detail="Programming language not found")
    return language

@router.put("/programming-languages/{language_id}", response_model=ProgrammingLanguageResponse)
async def update_programming_language(
    language_id: int, 
    language_update: ProgrammingLanguageCreate, 
    db: Session = Depends(get_db)
):
    """Update programming language"""
    language = db.query(ProgrammingLanguage).filter(ProgrammingLanguage.id == language_id).first()
    if not language:
        raise HTTPException(status_code=404, detail="Programming language not found")
    
    language.name = language_update.name
    language.description = language_update.description
    language.version = language_update.version
    language.is_active = language_update.is_active
    
    db.commit()
    db.refresh(language)
    return language

@router.delete("/programming-languages/{language_id}")
async def delete_programming_language(language_id: int, db: Session = Depends(get_db)):
    """Delete programming language"""
    language = db.query(ProgrammingLanguage).filter(ProgrammingLanguage.id == language_id).first()
    if not language:
        raise HTTPException(status_code=404, detail="Programming language not found")
    
    # Check if language is being used by positions
    position_count = db.query(Position).filter(Position.programming_language_id == language_id).count()
    if position_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete programming language. It is being used by {position_count} position(s)."
        )
    
    db.delete(language)
    db.commit()
    return {"message": "Programming language deleted successfully"}

@router.post("/exam-templates/generate-ai")
async def generate_ai_exam_template(
    config: Dict,
    db: Session = Depends(get_db)
):
    """Generate AI exam template via n8n workflow"""
    import httpx
    import asyncio
    
    try:
        # Validate required fields (handle both camelCase and snake_case)
        required_mappings = {
            "company": ["company_id", "company"],
            "department": ["department_id", "department"], 
            "position": ["position_id", "position"],
            "programming_language": ["programming_language", "programmingLanguage"],
            "level": ["level", "difficultyLevel"]
        }
        
        for field_name, field_options in required_mappings.items():
            if not any(config.get(option) for option in field_options):
                raise HTTPException(status_code=400, detail=f"Field {field_name} is required (tried: {field_options})")
        
        # Get company, department, position data (handle both field name formats)
        company_id = config.get("company_id") or config.get("company")
        department_id = config.get("department_id") or config.get("department") 
        position_id = config.get("position_id") or config.get("position")
        
        company = db.query(Company).filter(Company.id == company_id).first()
        department = db.query(Department).filter(Department.id == department_id).first()
        position = db.query(Position).filter(Position.id == position_id).first()
        
        if not company or not department or not position:
            raise HTTPException(status_code=404, detail="Company, department, or position not found")
        
        # Step 1: Create draft exam in database first
        programming_language = config.get("programming_language") or config.get("programmingLanguage")
        level = config.get("level") or config.get("difficultyLevel")
        duration_minutes = config.get("duration_minutes") or config.get("examDuration", 60)
        
        draft_exam = ExamTemplate(
            position_id=position_id,
            name=f"{programming_language} {level} Level Exam - {position.name}",
            description=f"AI-generated exam for {position.name} position at {level} level",
            programming_language=programming_language,
            duration_minutes=duration_minutes,
            questions=[],  # Empty initially
            is_active=False,  # Draft mode
            exam_metadata={
                "status": "generating",
                "created_via": "ai_generation",
                "config": config
            }
        )
        
        db.add(draft_exam)
        db.commit()
        db.refresh(draft_exam)
        
        logger.info(f"✅ Draft exam created with ID: {draft_exam.id}")
        
        # Step 2: Prepare data for AI workflow (simplified payload)
        ai_payload = {
            "exam_id": draft_exam.id,
            "config": {
                "company_name": company.name,
                "department_name": department.name,
                "position_name": position.name,
                "programming_language": programming_language,
                "level": level,
                "multiple_choice_count": config.get("multiple_choice_count") or config.get("multipleChoiceCount", 10),
                "coding_question_count": config.get("coding_question_count") or config.get("codingQuestionCount", 2),
                "duration_minutes": duration_minutes,
                "additional_requirements": config.get("additional_requirements", "")
            }
        }
        
        # Use N8N Workflow for AI Generation
        logger.info(f"🤖 Using N8N Workflow for exam_id: {draft_exam.id}")
        
        # Prepare N8N webhook payload
        n8n_payload = {
            "exam_id": draft_exam.id,
            "company_name": company.name,
            "department_name": department.name,
            "position_name": position.name,
            "programmingLanguage": programming_language,
            "difficultyLevel": level,
            "multipleChoiceCount": config.get("multiple_choice_count") or config.get("multipleChoiceCount", 10),
            "codingQuestionCount": config.get("coding_question_count") or config.get("codingQuestionCount", 2),
            "examDuration": duration_minutes,
            "additional_requirements": config.get("additional_requirements", "")
        }
        
        logger.info(f"📝 N8N payload: {json.dumps(n8n_payload, indent=2)}")
        
        # Call N8N webhook - Updated for criteria workflow
        # Try localhost first, then fallback to Docker internal networking
        n8n_urls = [
            "http://localhost:5678/webhook/generate-exam-with-criteria",
            "http://host.docker.internal:5678/webhook/generate-exam-with-criteria"
        ]
        
        result = None
        last_error = None
        
        # Try each N8N URL until one works
        for n8n_url in n8n_urls:
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    logger.info(f"📡 Trying N8N workflow: {n8n_url}")
                    n8n_response = await client.post(
                        n8n_url, 
                        json=n8n_payload,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if n8n_response.status_code == 200:
                        n8n_result = n8n_response.json()
                        logger.info(f"✅ N8N workflow response: {json.dumps(n8n_result, indent=2)}")
                        
                        # Check if N8N workflow was successful
                        if n8n_result.get("success"):
                            result = {
                                "success": True,
                                "questions": [],  # Will be updated by N8N workflow callback
                                "ai_metadata": n8n_result.get("ai_metadata", {}),
                                "processing_time": n8n_result.get("processing_time", 0),
                                "workflow_version": n8n_result.get("workflow_version", "v5-criteria"),
                                "n8n_response": n8n_result
                            }
                            logger.info(f"✅ N8N workflow successful, exam_id: {n8n_result.get('exam_id')}")
                            break  # Success, exit the loop
                        else:
                            logger.error(f"❌ N8N workflow failed: {n8n_result.get('error', 'Unknown error')}")
                            last_error = f"N8N workflow failed: {n8n_result.get('error', 'Unknown error')}"
                    else:
                        logger.error(f"❌ N8N webhook error: {n8n_response.status_code}")
                        last_error = f"N8N webhook error: {n8n_response.status_code} - {n8n_response.text}"
                        
            except httpx.ConnectError as e:
                logger.warning(f"⚠️ Cannot connect to {n8n_url}: {str(e)}")
                last_error = f"Cannot connect to N8N at {n8n_url}: {str(e)}"
                continue  # Try next URL
            except httpx.TimeoutException as e:
                logger.error(f"❌ N8N workflow timeout at {n8n_url}: {str(e)}")
                last_error = f"N8N workflow timeout at {n8n_url}: {str(e)}"
                break  # Don't try other URLs for timeout
            except Exception as e:
                logger.error(f"❌ N8N workflow call failed at {n8n_url}: {str(e)}")
                last_error = f"N8N workflow request failed at {n8n_url}: {str(e)}"
                continue  # Try next URL
        
        # If no URL worked, set the result to failed
        if not result or not result.get("success"):
            result = {
                "success": False,
                "error": last_error or "All N8N endpoints failed"
            }

        
        # Check if N8N workflow was successful
        if not result or not result.get("success"):
            logger.error("❌ N8N workflow failed")
            logger.error(f"❌ N8N result: {result}")
            db.delete(draft_exam)
            db.commit()
            
            error_msg = "N8N workflow failed."
            if result and result.get("error"):
                error_msg += f" Error: {result['error']}"
            
            raise HTTPException(status_code=500, detail=error_msg)
        
        # N8N workflow will handle the database updates asynchronously
        # The exam is created in draft mode and will be updated by the workflow
        logger.info(f"✅ N8N workflow initiated successfully for exam ID: {draft_exam.id}")
        logger.info(f"🔄 Workflow will update exam with AI-generated questions")
        
        # Update draft exam metadata to indicate N8N processing
        draft_exam.exam_metadata = {
            "status": "processing_via_n8n",
            "created_via": "ai_generation_n8n",
            "config": config,
            "n8n_workflow_version": result.get("workflow_version", "v2"),
            "processing_started": datetime.utcnow().isoformat()
        }
        db.commit()
        db.refresh(draft_exam)
        
        exam_template = draft_exam  # Use the draft exam (will be updated by N8N)
        
        return {
            "success": True,
            "message": "N8N workflow initiated successfully - exam will be generated asynchronously",
            "exam_template": {
                "id": exam_template.id,
                "name": exam_template.name,
                "description": exam_template.description,
                "programming_language": exam_template.programming_language,
                "duration_minutes": exam_template.duration_minutes,
                "questions_count": 0,  # Will be updated by N8N workflow
                "position_name": position.name,
                "department_name": department.name,
                "company_name": company.name,
                "status": "processing_via_n8n"
            },
            "ai_metadata": result.get("ai_metadata", {}),
            "processing_time": result.get("processing_time", 0),
            "exam_id": exam_template.id,
            "questions": [],  # Will be populated by N8N workflow
            "workflow_info": {
                "version": result.get("workflow_version", "v2"),
                "status": "initiated",
                "note": "Questions will be generated and saved automatically by the N8N workflow"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating AI exam: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/exam-generation/config-options")
async def get_exam_generation_config_options(db: Session = Depends(get_db)):
    """Get configuration options for exam generation"""
    try:
        # Get companies, departments, positions
        companies = db.query(Company).all()
        
        config_options = {
            "companies": [
                {"id": c.id, "name": c.name, "departments": [
                    {"id": d.id, "name": d.name, "positions": [
                        {"id": p.id, "name": p.name} for p in d.positions
                    ]} for d in c.departments
                ]} for c in companies
            ],
            "programming_languages": [
                "JavaScript", "Python", "Java", "C#", "PHP", "Go", "Rust", 
                "TypeScript", "React", "Vue.js", "Angular", "Node.js", 
                "Django", "Flask", "Spring Boot", "Laravel"
            ],
            "levels": [
                {"value": "junior", "label": "Junior (0-2 years)", "description": "0-2 years experience"},
                {"value": "senior", "label": "Senior (3-5 years)", "description": "3-5 years experience"},
                {"value": "specialist", "label": "Specialist (5+ years)", "description": "5+ years experience"}
            ],
            "question_types": [
                {"type": "multiple_choice", "label": "Multiple Choice (4 options)", "default_count": 10, "max_count": 50},
                {"type": "coding", "label": "Coding Problems", "default_count": 3, "max_count": 10}
            ],
            "duration_options": [30, 45, 60, 90, 120, 180]  # minutes
        }
        
        return config_options
        
    except Exception as e:
        logger.error(f"Error getting config options: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/exam-templates")
async def create_exam_template(
    exam_data: Dict,
    db: Session = Depends(get_db)
):
    """สร้างข้อสอบใหม่"""
    try:
        # ตรวจสอบข้อมูลที่จำเป็น
        required_fields = ["name", "position_id"]
        for field in required_fields:
            if not exam_data.get(field):
                raise HTTPException(status_code=400, detail=f"ข้อมูล {field} จำเป็นต้องระบุ")
        
        # ตรวจสอบว่า position มีอยู่จริง
        position = db.query(Position).filter(Position.id == exam_data["position_id"]).first()
        if not position:
            raise HTTPException(status_code=404, detail="ไม่พบตำแหน่งที่ระบุ")
        
        # สร้าง exam template
        exam_template = ExamTemplate(
            position_id=exam_data["position_id"],
            name=exam_data["name"],
            description=exam_data.get("description", ""),
            programming_language=exam_data.get("programming_language", ""),
            duration_minutes=exam_data.get("duration_minutes", 60),
            questions=exam_data.get("questions", []),
            is_active=exam_data.get("is_active", True)
        )
        
        db.add(exam_template)
        db.commit()
        db.refresh(exam_template)
        
        return {
            "id": exam_template.id,
            "name": exam_template.name,
            "description": exam_template.description,
            "programming_language": exam_template.programming_language,
            "duration_minutes": exam_template.duration_minutes,
            "questions_count": len(exam_template.questions or []),
            "position": {
                "id": position.id,
                "name": position.name,
                "department_name": position.department.name,
                "company_name": position.department.company.name
            },
            "is_active": exam_template.is_active,
            "created_at": exam_template.created_at.isoformat() if exam_template.created_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"เกิดข้อผิดพลาดในการสร้างข้อสอบ: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

@router.get("/exam-templates")
async def get_exam_templates(db: Session = Depends(get_db)):
    """Get all exam templates"""
    try:
        exam_templates = db.query(ExamTemplate).filter(ExamTemplate.is_active == True).all()
        
        result = []
        for template in exam_templates:
            result.append({
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "programming_language": template.programming_language,
                "duration_minutes": template.duration_minutes,
                "questions_count": len(template.questions or []),
                "position": {
                    "id": template.position.id,
                    "name": template.position.name,
                    "department_name": template.position.department.name,
                    "company_name": template.position.department.company.name
                } if template.position else None,
                "is_active": template.is_active,
                "created_at": template.created_at.isoformat() if template.created_at else None,
                "updated_at": template.updated_at.isoformat() if template.updated_at else None
            })
        
        return {
            "success": True,
            "data": result,
            "total": len(result)
        }
        
    except Exception as e:
        logger.error(f"Error fetching exam templates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/exam-templates/{exam_id}")
async def get_exam_template_details(exam_id: int, db: Session = Depends(get_db)):
    """Get detailed exam template with questions"""
    try:
        template = db.query(ExamTemplate).filter(
            ExamTemplate.id == exam_id,
            ExamTemplate.is_active == True
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Exam template not found")
        
        return {
            "success": True,
            "data": {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "programming_language": template.programming_language,
                "duration_minutes": template.duration_minutes,
                "questions": template.questions or [],
                "questions_count": len(template.questions or []),
                "position": {
                    "id": template.position.id,
                    "name": template.position.name,
                    "department_name": template.position.department.name,
                    "company_name": template.position.department.company.name
                } if template.position else None,
                "is_active": template.is_active,
                "created_at": template.created_at.isoformat() if template.created_at else None,
                "updated_at": template.updated_at.isoformat() if template.updated_at else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching exam template details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.delete("/exam-templates/{exam_id}")
async def delete_exam_template(exam_id: int, db: Session = Depends(get_db)):
    """Delete exam template (soft delete)"""
    try:
        template = db.query(ExamTemplate).filter(ExamTemplate.id == exam_id).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Exam template not found")
        
        template.is_active = False
        db.commit()
        
        return {
            "success": True,
            "message": "Exam template deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting exam template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/exam-templates/save-draft")
async def save_exam_draft(
    draft_data: Dict,
    db: Session = Depends(get_db)
):
    """Save exam template draft before AI generation"""
    try:
        logger.info(f"💾 Saving exam draft: {draft_data.get('name', 'Unknown')}")
        logger.info(f"📝 Draft data received: {draft_data}")
        
        # Extract position_id from metadata if available
        position_id = draft_data.get("position_id")
        metadata = draft_data.get("metadata", {})
        config = metadata.get("config", {})
        
        # If position_id not provided directly, try to find it from config
        if not position_id:
            # Look for position name in config and find the position_id
            position_name = config.get("position_name")
            if position_name:
                position = db.query(Position).join(Department).join(Company).filter(
                    Position.name == position_name,
                    Department.name == config.get("department_name"),
                    Company.name == config.get("company_name")
                ).first()
                if position:
                    position_id = position.id
                else:
                    logger.error(f"Position not found: {position_name}")
        
        # Validate required fields
        if not draft_data.get("name"):
            raise HTTPException(status_code=400, detail="Name is required")
        
        if not position_id:
            raise HTTPException(status_code=400, detail="Position ID is required")
        
        # Create exam template with empty questions (draft status)
        exam_template = ExamTemplate(
            name=draft_data.get("name"),
            description=draft_data.get("description"),
            position_id=position_id,
            programming_language=draft_data.get("programming_language"),
            duration_minutes=draft_data.get("duration_minutes", 60),
            questions=[],  # Empty questions array
            is_active=False,  # Draft status
            exam_metadata=metadata
        )
        
        db.add(exam_template)
        db.commit()
        db.refresh(exam_template)
        
        logger.info(f"✅ Draft exam saved with ID: {exam_template.id}")
        
        return {
            "success": True,
            "id": exam_template.id,
            "name": exam_template.name,
            "description": exam_template.description,
            "programming_language": exam_template.programming_language,
            "duration_minutes": exam_template.duration_minutes,
            "position_id": exam_template.position_id,
            "status": "draft",
            "created_at": exam_template.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error saving exam draft: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save exam draft: {str(e)}")

@router.put("/exam-templates/{exam_id}/update-with-questions")
async def update_exam_with_questions(
    exam_id: int,
    update_data: Dict,
    db: Session = Depends(get_db)
):
    """Update exam template with AI-generated questions"""
    try:
        logger.info(f"🔄 Updating exam ID {exam_id} with AI-generated questions")
        
        # Verify exam_id matches
        if update_data.get("exam_id") != exam_id:
            raise HTTPException(
                status_code=400, 
                detail=f"Exam ID mismatch: URL has {exam_id}, data has {update_data.get('exam_id')}"
            )
        
        # Find the exam template
        exam_template = db.query(ExamTemplate).filter(ExamTemplate.id == exam_id).first()
        if not exam_template:
            raise HTTPException(status_code=404, detail=f"Exam template with ID {exam_id} not found")
        
        # Update exam with AI-generated content
        if update_data.get("exam_title"):
            exam_template.name = update_data["exam_title"]
        
        if update_data.get("description"):
            exam_template.description = update_data["description"]
        
        if update_data.get("questions"):
            exam_template.questions = update_data["questions"]
        
        if update_data.get("metadata"):
            # Merge existing metadata with new metadata
            existing_metadata = exam_template.exam_metadata or {}
            # Convert to dict if it's not already
            if not isinstance(existing_metadata, dict):
                existing_metadata = {}
            # Create new metadata dict
            new_metadata = existing_metadata.copy()
            new_metadata.update(update_data["metadata"])
            exam_template.exam_metadata = new_metadata
        
        # Activate the exam (no longer draft)
        exam_template.is_active = update_data.get("is_active", True)
        
        # Update timestamp
        exam_template.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(exam_template)
        
        logger.info(f"✅ Exam ID {exam_id} updated successfully with {len(update_data.get('questions', []))} questions")
        
        return {
            "success": True,
            "id": exam_template.id,
            "name": exam_template.name,
            "description": exam_template.description,
            "programming_language": exam_template.programming_language,
            "duration_minutes": exam_template.duration_minutes,
            "questions": exam_template.questions,
            "metadata": exam_template.exam_metadata,
            "is_active": exam_template.is_active,
            "created_at": exam_template.created_at.isoformat(),
            "updated_at": exam_template.updated_at.isoformat() if exam_template.updated_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating exam ID {exam_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update exam: {str(e)}")

@router.put("/exam-templates/{exam_id}/update-with-criteria-questions")
async def update_exam_with_criteria_questions(
    exam_id: int,
    update_data: Dict,
    db: Session = Depends(get_db)
):
    """Update exam template with AI-generated questions including criteria and points"""
    try:
        logger.info(f"🔄 Updating exam ID {exam_id} with criteria-enhanced AI questions")
        
        # Verify exam_id matches
        if update_data.get("exam_id") != exam_id:
            raise HTTPException(
                status_code=400, 
                detail=f"Exam ID mismatch: URL has {exam_id}, data has {update_data.get('exam_id')}"
            )
        
        # Find the exam template
        exam_template = db.query(ExamTemplate).filter(ExamTemplate.id == exam_id).first()
        if not exam_template:
            raise HTTPException(status_code=404, detail=f"Exam template with ID {exam_id} not found")
        
        # Process questions with criteria and points
        questions = update_data.get("questions", [])
        
        # Validate total points sum to 100
        total_points = sum(q.get("points", 0) for q in questions)
        if total_points != 100:
            logger.warning(f"⚠️ Total points ({total_points}) does not equal 100 for exam {exam_id}")
        
        # Enhanced question processing
        processed_questions = []
        criteria_stats = {}
        
        for q in questions:
            criteria = q.get("Criteria", "General Knowledge")
            points = q.get("points", 10)
            
            # Track criteria statistics
            if criteria not in criteria_stats:
                criteria_stats[criteria] = {"count": 0, "total_points": 0}
            criteria_stats[criteria]["count"] += 1
            criteria_stats[criteria]["total_points"] += points
            
            question_dict = {
                "id": q.get("id", len(processed_questions) + 1),
                "type": q.get("type"),
                "question": q.get("question"),
                "Criteria": criteria,
                "points": points,
                "score": points  # Backward compatibility
            }
            
            if q.get("type") == "multiple_choice":
                question_dict.update({
                    "options": q.get("options", []),
                    "correct_answer": q.get("correct_answer"),
                    "explanation": q.get("explanation")
                })
            elif q.get("type") == "coding":
                question_dict.update({
                    "description": q.get("description"),
                    "sample_input": q.get("sample_input"),
                    "sample_output": q.get("sample_output"),
                    "expected_output": q.get("expected_output")
                })
            
            processed_questions.append(question_dict)
        
        # Update exam template
        exam_template.questions = processed_questions
        
        # Handle is_active field - activate exam when questions are added successfully
        if "is_active" in update_data:
            exam_template.is_active = update_data.get("is_active", True)
            logger.info(f"🔄 Setting exam {exam_id} is_active = {exam_template.is_active}")
        
        # Update metadata with criteria analysis
        existing_metadata = exam_template.exam_metadata or {}
        enhanced_metadata = existing_metadata.copy()
        enhanced_metadata.update({
            "criteria_analysis": {
                "unique_criteria": list(criteria_stats.keys()),
                "criteria_distribution": criteria_stats,
                "total_points": total_points,
                "questions_count": len(processed_questions)
            },
            "ai_generation": update_data.get("metadata", {}).get("ai_generation", {}),
            "last_updated": datetime.utcnow().isoformat()
        })
        exam_template.exam_metadata = enhanced_metadata
        
        # Update timestamp
        exam_template.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(exam_template)
        
        logger.info(f"✅ Exam ID {exam_id} updated with {len(processed_questions)} criteria-enhanced questions")
        
        return {
            "success": True,
            "id": exam_template.id,
            "name": exam_template.name,
            "description": exam_template.description,
            "programming_language": exam_template.programming_language,
            "duration_minutes": exam_template.duration_minutes,
            "questions": exam_template.questions,
            "metadata": exam_template.exam_metadata,
            "scoring_summary": {
                "total_points": total_points,
                "questions_count": len(processed_questions),
                "criteria_count": len(criteria_stats),
                "point_distribution": [
                    {
                        "question": q["question"][:50] + "..." if len(q["question"]) > 50 else q["question"],
                        "criteria": q["Criteria"],
                        "type": q["type"],
                        "points": q["points"]
                    } for q in processed_questions
                ]
            },
            "criteria_analysis": criteria_stats,
            "is_active": exam_template.is_active,
            "created_at": exam_template.created_at.isoformat(),
            "updated_at": exam_template.updated_at.isoformat() if exam_template.updated_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating exam ID {exam_id} with criteria: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update exam with criteria: {str(e)}")

@router.post("/exam-templates/save-ai-generated")
async def save_ai_generated_exam(
    request_data: Dict,
    db: Session = Depends(get_db)
):
    """Save AI-generated exam from n8n webhook to database"""
    try:
        logger.info(f"Received AI exam data: {request_data}")
        
        # Extract data from request
        if not request_data.get("success") or not request_data.get("exam_data"):
            raise HTTPException(
                status_code=400, 
                detail=f"AI exam generation failed: {request_data.get('error', 'Unknown error')}"
            )
        
        exam_data = request_data["exam_data"]
        metadata = exam_data.get("metadata", {})
        config = metadata.get("config", {})
        
        # Get configuration from metadata
        company_name = config.get("company_name", "Test Company")
        department_name = config.get("department_name", "IT Department")
        position_name = config.get("position_name", "Software Developer")
        programming_language = config.get("programming_language", "JavaScript")
        
        # Find or create company, department, position
        company = db.query(Company).filter(Company.name == company_name).first()
        if not company:
            company = Company(name=company_name, description="Auto-created company")
            db.add(company)
            db.commit()
            db.refresh(company)
        
        department = db.query(Department).filter(
            Department.name == department_name,
            Department.company_id == company.id
        ).first()
        if not department:
            department = Department(
                name=department_name, 
                description="Auto-created department",
                company_id=company.id
            )
            db.add(department)
            db.commit()
            db.refresh(department)
        
        position = db.query(Position).filter(
            Position.name == position_name,
            Position.department_id == department.id
        ).first()
        if not position:
            position = Position(
                name=position_name,
                description="Auto-created position", 
                department_id=department.id
            )
            db.add(position)
            db.commit()
            db.refresh(position)
        
        # Convert exam questions to database format with new Criteria and points fields
        questions_json = []
        for q in exam_data["questions"]:
            question_dict = {
                "id": q.get("id"),
                "type": q.get("type"),
                "question": q.get("question"),
                "Criteria": q.get("Criteria", "General Knowledge"),  # AI-generated criteria
                "points": q.get("points", q.get("score", 10)),  # Use points or fallback to score
                "score": q.get("score", q.get("points", 10))  # Backward compatibility
            }
            
            if q.get("type") == "multiple_choice":
                question_dict.update({
                    "options": q.get("options", []),
                    "correct_answer": q.get("correct_answer"),
                    "explanation": q.get("explanation")
                })
            elif q.get("type") == "coding":
                question_dict.update({
                    "description": q.get("description"),
                    "sample_input": q.get("sample_input"),
                    "sample_output": q.get("sample_output"),
                    "expected_output": q.get("expected_output")
                })
            
            questions_json.append(question_dict)
        
        # Create exam template
        exam_template = ExamTemplate(
            position_id=position.id,
            name=exam_data.get("exam_title", f"{programming_language} Exam"),
            description=exam_data.get("description", "AI-generated programming exam"),
            programming_language=programming_language,
            duration_minutes=exam_data.get("duration_minutes", 60),
            questions=questions_json,
            is_active=True
        )
        
        db.add(exam_template)
        db.commit()
        db.refresh(exam_template)
        
        return {
            "success": True,
            "message": "AI-generated exam saved successfully",
            "exam_template": {
                "id": exam_template.id,
                "name": exam_template.name,
                "description": exam_template.description,
                "programming_language": exam_template.programming_language,
                "duration_minutes": exam_template.duration_minutes,
                "questions_count": len(questions_json),
                "position": {
                    "id": position.id,
                    "name": position.name,
                    "department_name": department.name,
                    "company_name": company.name
                }
            },
            "ai_metadata": metadata,
            "processing_time": request_data.get("processing_time"),
            "created_at": exam_template.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving AI-generated exam: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Candidate Management Endpoints
@router.get("/candidates")
async def list_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List all candidates with their latest exam status"""
    candidates = db.query(Candidate).offset(skip).limit(limit).all()
    
    candidate_list = []
    for candidate in candidates:
        # Get latest exam session to determine status and position
        latest_session = db.query(ExamSession).filter(
            ExamSession.candidate_id == candidate.id
        ).order_by(ExamSession.created_at.desc()).first()
        
        status = "รอสอบ"  # Default status
        position = "ไม่ระบุ"
        
        if latest_session:
            if latest_session.status == "completed":
                # Check if passed based on score
                if latest_session.score and latest_session.score >= 70:
                    status = "ผ่านการสอบ"
                else:
                    status = "ไม่ผ่านการสอบ"
            elif latest_session.status == "in_progress":
                status = "กำลังสอบ"
            elif latest_session.status == "cancelled":
                status = "ยกเลิก"
            
            # Get position from exam template
            if latest_session.exam_template and latest_session.exam_template.position:
                position = latest_session.exam_template.position.name
        
        candidate_list.append({
            "id": candidate.id,
            "first_name": candidate.first_name,
            "last_name": candidate.last_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "position": position,
            "status": status,
            "created_at": candidate.created_at.strftime("%Y-%m-%d")
        })
    
    return candidate_list

@router.post("/candidates", response_model=CandidateResponse)
async def create_candidate(candidate: CandidateCreate, db: Session = Depends(get_db)):
    """Create a new candidate"""
    # Check if email already exists
    existing_candidate = db.query(Candidate).filter(Candidate.email == candidate.email).first()
    if existing_candidate:
        raise HTTPException(status_code=400, detail="อีเมลนี้มีอยู่ในระบบแล้ว")
    
    db_candidate = Candidate(
        first_name=candidate.first_name,
        last_name=candidate.last_name,
        email=candidate.email,
        phone=candidate.phone
    )
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate

@router.get("/candidates/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Get candidate by ID"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="ไม่พบผู้สมัคร")
    return candidate

@router.put("/candidates/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: int, 
    candidate_update: CandidateUpdate, 
    db: Session = Depends(get_db)
):
    """Update candidate (supports position and programming language assignment)"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="ไม่พบผู้สมัคร")
    
    # Check if email is taken by another candidate (if email is being updated)
    if candidate_update.email and candidate_update.email != candidate.email:
        existing_candidate = db.query(Candidate).filter(
            Candidate.email == candidate_update.email,
            Candidate.id != candidate_id
        ).first()
        if existing_candidate:
            raise HTTPException(status_code=400, detail="อีเมลนี้มีอยู่ในระบบแล้ว")
    
    # Update basic fields if provided
    if candidate_update.first_name:
        candidate.first_name = candidate_update.first_name
    if candidate_update.last_name:
        candidate.last_name = candidate_update.last_name
    if candidate_update.email:
        candidate.email = candidate_update.email
    if candidate_update.phone is not None:  # Allow empty string
        candidate.phone = candidate_update.phone
    
    # Handle position assignment
    if candidate_update.position_id:
        position = db.query(Position).filter(Position.id == candidate_update.position_id).first()
        if not position:
            raise HTTPException(status_code=404, detail="ไม่พบตำแหน่งที่ระบุ")
        # Note: If you want to store position_id in Candidate model, you'll need to add it to the database schema
        # For now, we'll just validate that the position exists
    
    # Handle programming language assignment  
    if candidate_update.programming_language_id:
        programming_language = db.query(ProgrammingLanguage).filter(
            ProgrammingLanguage.id == candidate_update.programming_language_id
        ).first()
        if not programming_language:
            raise HTTPException(status_code=404, detail="ไม่พบภาษาโปรแกรมมิ่งที่ระบุ")
        # Note: If you want to store programming_language_id in Candidate model, you'll need to add it to the database schema
    
    db.commit()
    db.refresh(candidate)
    return candidate

@router.delete("/candidates/{candidate_id}")
async def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Delete candidate"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="ไม่พบผู้สมัคร")
    
    # Check if candidate has active exam sessions
    active_sessions = db.query(ExamSession).filter(
        ExamSession.candidate_id == candidate_id,
        ExamSession.status.in_(["scheduled", "in_progress"])
    ).count()
    
    if active_sessions > 0:
        raise HTTPException(
            status_code=400, 
            detail="ไม่สามารถลบผู้สมัครที่มีการสอบที่กำลังดำเนินการอยู่"
        )
    
    db.delete(candidate)
    db.commit()
    return {"message": "ลบผู้สมัครเรียบร้อยแล้ว"} 