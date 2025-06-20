from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ระบบสอบเข้าเพื่อสมัครงาน",
    description="Simple API for testing",
    version="1.0.0"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "ระบบสอบเข้าเพื่อสมัครงาน",
        "status": "พร้อมใช้งาน",
        "version": "1.0.0",
        "mode": "simple"
    }

@app.get("/health")
async def health_check():
    return {"status": "สุขภาพดี", "mode": "simple"}

@app.get("/test-google-forms")
async def test_google_forms():
    return {
        "message": "Google Forms API Integration",
        "status": "พร้อมใช้งาน",
        "endpoints": {
            "import": "/import-google-form",
            "preview": "/google-form/{form_id}/preview",
            "sync": "/google-form/{form_id}/sync"
        }
    }

@app.post("/import-google-form")
async def test_import():
    return {
        "message": "ฟีเจอร์ import Google Forms",
        "note": "ต้องมี Google credentials ก่อน",
        "status": "testing_mode"
    } 