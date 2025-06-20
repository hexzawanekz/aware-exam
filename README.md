# 🎯 AI Exam Generation System

**Production-ready AI-powered exam generation system** for recruitment/hiring purposes using Google AI (Gemini 1.5 Pro).

## 📖 **Complete Documentation**

**👉 See [AI_EXAM_SYSTEM_COMPLETE_GUIDE.md](./AI_EXAM_SYSTEM_COMPLETE_GUIDE.md) for the comprehensive guide with:**

- ✅ **Complete Setup Instructions**
- ✅ **Fixed N8N Workflow Solution**
- ✅ **Testing & Validation**
- ✅ **API Integration Examples**
- ✅ **Troubleshooting Guide**
- ✅ **Performance Metrics**

## 🚀 **Quick Start**

```bash
# 1. Start all services
docker-compose up -d

# 2. Import N8N workflow
# Go to http://localhost:5678
# Import: improved_ai_exam_workflow_fixed_final.json

# 3. Test the system
python test_improved_workflow.py
```

## ✅ **System Status: FULLY OPERATIONAL**

- 🎯 **AI Exam Generation**: Working with Google Gemini 1.5 Pro
- 🔧 **N8N Workflow**: Fixed and production-ready
- 📊 **Complete Testing**: Comprehensive test suite included
- 🛡️ **Error Handling**: Robust error recovery mechanisms

---

## 🏗️ **Original System Features**

## ✨ คุณสมบัติหลัก

### 🎯 ระบบสอบออนไลน์

- **สร้างข้อสอบ**: Admin สามารถสร้างข้อสอบตามบริษัท แผนก ตำแหน่ง และภาษาโปรแกรมมิ่ง
- **Import Google Forms**: นำเข้าข้อสอบจาก Google Forms ได้โดยตรง
- **Random ข้อสอบ**: ข้อสอบจะถูก random ทุกครั้งที่มีการสอบ
- **Timer**: จับเวลาการสอบแบบ real-time

### 🛡️ ระบบป้องกันการโกง (Anti-Cheat)

1. **Fullscreen Mode**: บังคับใช้โหมดเต็มจอตลอดการสอบ
2. **Tab Switching Detection**: ตรวจจับการเปลี่ยนแท็บหรือหน้าต่าง
3. **Copy/Paste Prevention**: ปิดการใช้งาน Copy/Paste
4. **Developer Tools Detection**: ตรวจจับการเปิด Developer Tools
5. **Face Detection & Recognition**:
   - ตรวจจับใบหน้าแบบ real-time
   - ยืนยันตัวตนด้วย Face Recognition
   - บันทึกวิดีโอการสอบ
   - ตรวจจับการก้มหน้าหรือกิจกรรมน่าสงสัย

### 🤖 AI Automation ด้วย n8n

- **การวิเคราะห์การโกง**: วิเคราะห์พฤติกรรมน่าสงสัยด้วย AI
- **การตรวจข้อสอบ**: ตรวจข้อสอบอัตโนมัติ
- **การจัดอันดับ**: เปรียบเทียบผู้สมัครในตำแหน่งเดียวกัน
- **รายงานผล**: สร้างรายงานและส่งผลทางอีเมล

### 📊 Dashboard สำหรับ Admin

- ดูข้อมูลการสอบแบบ real-time
- จัดการบริษัท แผนก ตำแหน่ง
- สร้างและจัดการข้อสอบ
- ตรวจสอบผลการสอบและการโกง

## 🏗️ สถาปัตยกรรมระบบ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React.js      │    │   FastAPI       │    │   PostgreSQL    │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebRTC        │    │   Face Detection│    │   Qdrant        │
│   WebSocket     │    │   OpenCV/YOLO   │    │   Vector DB     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │      n8n        │    │     Redis       │
                       │   Automation    │    │     Cache       │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 การติดตั้งและใช้งาน

### ข้อกำหนดเบื้องต้น

- Docker และ Docker Compose
- Git
- Port ที่ว่าง: 3000, 5678, 8000, 6333, 6379, 5432

### ขั้นตอนการติดตั้ง

1. **Clone Repository**

```bash
git clone <repository-url>
cd n8n
```

2. **ตั้งค่า Environment Variables**

```bash
cp config.env.example config.env
# แก้ไขค่าต่างๆ ใน config.env
```

3. **ตั้งค่า Google Credentials**

   - สร้าง Project ใน Google Cloud Console
   - เปิดใช้งาน Google Forms API
   - สร้าง Service Account Key
   - วางไฟล์ในโฟลเดอร์ `credentials/`

4. **รันระบบ**

```bash
docker-compose up -d
```

5. **ตรวจสอบการทำงาน**

```bash
# ตรวจสอบสถานะ containers
docker-compose ps

# ดู logs
docker-compose logs -f backend
```

### URL การเข้าถึง

- **Frontend (React)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **n8n Automation**: http://localhost:5678
- **Qdrant Vector DB**: http://localhost:6333
- **PostgreSQL**: localhost:5432

## 📁 โครงสร้างไฟล์

```
.
├── backend/                 # FastAPI Backend
│   ├── api/                # API Routes
│   ├── core/               # Core Configuration
│   ├── models/             # Database Models
│   ├── services/           # Business Logic
│   └── utils/              # Utilities
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # React Components
│   │   ├── services/       # API Services
│   │   └── i18n/          # Localization
├── face-detection/         # Face Detection System
│   └── Student-Online-Exam-AntiCheat-Tool/
├── workflows/              # n8n Workflows
├── credentials/            # API Credentials
└── docker-compose.yml      # Docker Configuration
```

## 🔧 การใช้งาน

### สำหรับ Admin

1. **เข้าสู่ระบบ Admin**

   - ไปที่ http://localhost:3000/admin
   - ใช้ username/password ที่ตั้งไว้

2. **สร้างข้อมูลพื้นฐาน**

   - สร้างบริษัท แผนก ตำแหน่ง
   - กำหนดภาษาโปรแกรมมิ่งและทักษะที่ต้องการ

3. **สร้างข้อสอบ**

   - สร้างข้อสอบใหม่หรือ import จาก Google Forms
   - กำหนดเวลาและการตั้งค่า

4. **จัดการผู้สมัคร**
   - เพิ่มผู้สมัครและอัพโหลดภาพใบหน้า
   - สร้าง exam session

### สำหรับผู้สมัคร

1. **เข้าสู่ระบบ**

   - ใช้ลิงก์ที่ admin ส่งให้
   - อนุญาตการใช้กล้อง

2. **เริ่มการสอบ**

   - ระบบจะตรวจสอบใบหน้าก่อนเริ่มสอบ
   - เข้าสู่โหมดเต็มจอ

3. **ทำข้อสอบ**
   - ตอบคำถามตามลำดับ
   - ระบบจะตรวจสอบการโกงตลอดเวลา

## 🔍 การตรวจสอบและ Debug

### ดู Logs

```bash
# Backend logs
docker-compose logs -f backend

# Face detection logs
docker-compose logs -f backend | grep "face_detection"

# n8n logs
docker-compose logs -f n8n
```

### ตรวจสอบ Database

```bash
# เข้าสู่ PostgreSQL
docker-compose exec postgres psql -U recruitment_user -d recruitment_db

# ดูตารางการสอบ
SELECT * FROM exam_sessions ORDER BY created_at DESC LIMIT 10;
```

### ตรวจสอบ Vector Database

```bash
# ดูข้อมูลใน Qdrant
curl http://localhost:6333/collections/exam_results/points/scroll
```

## 🛠️ การพัฒนาและปรับแต่ง

### เพิ่มภาษาโปรแกรมมิ่งใหม่

1. เพิ่มในฐานข้อมูล positions
2. สร้าง exam template สำหรับภาษานั้น
3. อัพเดท frontend dropdown

### ปรับแต่งระบบ Face Detection

- แก้ไขค่า confidence threshold ใน `core/config.py`
- เพิ่ม anti-cheat rules ใน `services/face_detection.py`

### เพิ่ม n8n Workflow

1. เข้า n8n UI ที่ http://localhost:5678
2. สร้าง workflow ใหม่
3. Export เป็น JSON และเก็บใน `workflows/`

## 🔐 ความปลอดภัย

### การป้องกันข้อมูล

- ข้อมูลผู้สมัครเข้ารหัส
- Face encodings เก็บใน vector database
- Video recordings มี retention policy

### การติดตาม

- ทุก activity ถูกบันทึก
- Suspicious behavior alerts
- Admin notifications

## 📞 การสนับสนุน

### FAQ

1. **Q: ระบบไม่สามารถตรวจจับใบหน้าได้**

   - A: ตรวจสอบการอนุญาตกล้อง และแสงในห้อง

2. **Q: Google Forms import ไม่ทำงาน**

   - A: ตรวจสอบ Google API credentials และ permissions

3. **Q: n8n workflow ไม่ทำงาน**
   - A: ตรวจสอบ webhook URLs และ database connections

### การติดต่อ

- Issues: สร้าง GitHub Issue
- Email: admin@recruitment-system.com

## 📝 License

MIT License - ดู LICENSE file สำหรับรายละเอียด

## 🙏 Credits

- Face Detection: Student-Online-Exam-AntiCheat-Tool
- n8n: Automation Platform
- React.js: Frontend Framework
- FastAPI: Backend Framework
