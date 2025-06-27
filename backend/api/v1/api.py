from fastapi import APIRouter

from api.v1.exam import router as exam_router

api_router = APIRouter()

# รวม API routers ทั้งหมด
api_router.include_router(exam_router, prefix="/exam", tags=["exam"])

@api_router.get("/")
async def api_root():
    return {
        "message": "API v1 - ระบบสอบเข้าเพื่อสมัครงาน",
        "endpoints": {
            "exam": "/exam",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    } 