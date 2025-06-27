from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
import os
import uvicorn
from datetime import datetime
import asyncio

# Import routers and modules
from api.v1 import exam
from api.v1 import admin
from api.v1 import candidate
from core.database import engine, SessionLocal, get_db, Base
from models.exam import ExamSession, Candidate
from services.face_detection import FaceDetectionService
from services.proctoring import ProctoringService
from utils.websocket_manager import WebSocketManager

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Recruitment Exam System API",
    description="API for managing recruitment exams with anti-cheat capabilities",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API routers
app.include_router(exam.router, prefix="/api/v1/exam")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(candidate.router, prefix="/api/v1")

# Initialize services
face_detection_service = FaceDetectionService()
proctoring_service = ProctoringService()

# Initialize WebSocket manager
websocket_manager = WebSocketManager()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.exam_sessions: Dict[str, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.exam_sessions[session_id] = {
            "websocket": websocket,
            "start_time": datetime.now(),
            "violations": []
        }

    def disconnect(self, websocket: WebSocket, session_id: str):
        self.active_connections.remove(websocket)
        if session_id in self.exam_sessions:
            del self.exam_sessions[session_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "Recruitment Exam System API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.websocket("/ws/admin/{candidate_id}")
async def websocket_admin_endpoint(websocket: WebSocket, candidate_id: str):
    """WebSocket endpoint for admin real-time monitoring"""
    admin_channel = f"admin_candidate_{candidate_id}"
    await websocket_manager.connect(websocket, admin_channel)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle ping/pong for connection health
            if message.get("type") == "ping":
                await websocket_manager.send_personal_message(admin_channel, {"type": "pong"})
                
    except WebSocketDisconnect:
        websocket_manager.disconnect(admin_channel)
    except Exception as e:
        logger.error(f"WebSocket error for admin {candidate_id}: {str(e)}")
        websocket_manager.disconnect(admin_channel)

@app.websocket("/ws/exam/{session_id}")
async def websocket_exam_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for exam interface real-time communication"""
    await websocket_manager.connect(websocket, session_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ping":
                await websocket_manager.send_personal_message(session_id, {"type": "pong"})
            elif message.get("type") == "evidence_update":
                # Handle evidence updates from exam interface
                pass
                
    except WebSocketDisconnect:
        websocket_manager.disconnect(session_id)
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {str(e)}")
        websocket_manager.disconnect(session_id)

@app.post("/api/v1/start-exam")
async def start_exam(
    exam_data: dict,
    db: Session = Depends(get_db)
):
    """Start a new exam session"""
    try:
        # Create exam session
        session = ExamSession(
            candidate_id=exam_data.get("candidate_id"),
            exam_template_id=exam_data.get("exam_template_id"),
            start_time=datetime.now(),
            status="in_progress"
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return {
            "session_id": session.id,
            "status": "started",
            "message": "Exam session started successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start exam: {str(e)}")

@app.post("/api/v1/submit-exam")
async def submit_exam(
    submission_data: dict,
    db: Session = Depends(get_db)
):
    """Submit exam answers"""
    try:
        session_id = submission_data.get("session_id")
        answers = submission_data.get("answers")
        
        # Update exam session
        session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Exam session not found")
        
        session.end_time = datetime.now()
        session.status = "completed"
        session.answers = json.dumps(answers)
        
        db.commit()
        
        return {
            "status": "submitted",
            "message": "Exam submitted successfully",
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit exam: {str(e)}")

# Add JSON response with UTF-8 encoding
@app.middleware("http")
async def ensure_utf8_response(request, call_next):
    response = await call_next(request)
    if hasattr(response, 'headers') and response.headers.get('content-type', '').startswith('application/json'):
        response.charset = 'utf-8'
    return response

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 