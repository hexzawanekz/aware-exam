"""
Script to seed sample data for Admin Dashboard testing
Run this script to populate the database with sample companies, departments, positions, and exam templates
"""

import requests
import json
from datetime import datetime

# Backend API URL
BASE_URL = "http://localhost:8000/api/v1"

def create_sample_data():
    """Create sample data for testing admin dashboard"""
    
    print("🌱 เริ่มสร้างข้อมูลตัวอย่าง...")
    
    # Sample companies
    companies = [
        {
            "name": "บริษัท เทคโนโลยี จำกัด",
            "description": "บริษัทพัฒนาซอฟต์แวร์และเทคโนโลยี",
            "logo_url": "https://via.placeholder.com/150x150?text=TECH"
        },
        {
            "name": "บริษัท การเงิน จำกัด", 
            "description": "บริษัทให้บริการทางการเงินและธนาคาร",
            "logo_url": "https://via.placeholder.com/150x150?text=FINANCE"
        },
        {
            "name": "บริษัท การตลาด จำกัด",
            "description": "บริษัทให้บริการด้านการตลาดและโฆษณา",
            "logo_url": "https://via.placeholder.com/150x150?text=MARKETING"
        }
    ]
    
    created_companies = []
    
    # Create companies
    for company in companies:
        try:
            response = requests.post(f"{BASE_URL}/admin/companies", json=company)
            if response.status_code == 200:
                created_company = response.json()
                created_companies.append(created_company)
                print(f"✅ สร้างบริษัท: {created_company['name']}")
            else:
                print(f"❌ ไม่สามารถสร้างบริษัท: {company['name']} - {response.text}")
        except Exception as e:
            print(f"❌ ข้อผิดพลาด: {e}")
    
    # Sample departments for each company
    departments_data = {
        0: [  # Tech company
            {"name": "แผนกพัฒนาซอฟต์แวร์", "description": "พัฒนาแอปพลิเคชันและเว็บไซต์"},
            {"name": "แผนกข้อมูลขนาดใหญ่", "description": "วิเคราะห์และจัดการข้อมูลขนาดใหญ่"},
            {"name": "แผนกปัญญาประดิษฐ์", "description": "พัฒนาระบบ AI และ Machine Learning"}
        ],
        1: [  # Finance company
            {"name": "แผนกสินเชื่อ", "description": "จัดการสินเชื่อและอนุมัติเงินกู้"},
            {"name": "แผนกการลงทุน", "description": "จัดการพอร์ตการลงทุนและวิเคราะห์หุ้น"},
            {"name": "แผนกบัญชี", "description": "จัดการบัญชีและการเงิน"}
        ],
        2: [  # Marketing company
            {"name": "แผนกการตลาดดิจิทัล", "description": "การตลาดออนไลน์และโซเชียลมีเดีย"},
            {"name": "แผนกโฆษณา", "description": "สร้างแคมเปญโฆษณาและสื่อ"},
            {"name": "แผนกวิเคราะห์ตลาด", "description": "วิเคราะห์แนวโน้มตลาดและผู้บริโภค"}
        ]
    }
    
    created_departments = []
    
    # Create departments
    for company_idx, departments in departments_data.items():
        if company_idx < len(created_companies):
            company_id = created_companies[company_idx]['id']
            for dept in departments:
                dept['company_id'] = company_id
                try:
                    response = requests.post(f"{BASE_URL}/admin/companies/{company_id}/departments", json=dept)
                    if response.status_code == 200:
                        created_dept = response.json()
                        created_departments.append(created_dept)
                        print(f"✅ สร้างแผนก: {created_dept['name']}")
                    else:
                        print(f"❌ ไม่สามารถสร้างแผนก: {dept['name']} - {response.text}")
                except Exception as e:
                    print(f"❌ ข้อผิดพลาด: {e}")
    
    # Sample positions
    positions_data = [
        # Tech positions
        {"name": "Frontend Developer", "description": "พัฒนาส่วนติดต่อผู้ใช้"},
        {"name": "Backend Developer", "description": "พัฒนาระบบเซิร์ฟเวอร์"},
        {"name": "Full Stack Developer", "description": "พัฒนาทั้งส่วนหน้าและหลัง"},
        {"name": "Data Scientist", "description": "วิเคราะห์ข้อมูลและสร้างโมเดล"},
        {"name": "AI Engineer", "description": "พัฒนาระบบปัญญาประดิษฐ์"},
        
        # Finance positions
        {"name": "Credit Analyst", "description": "วิเคราะห์ความเสี่ยงด้านสินเชื่อ"},
        {"name": "Investment Advisor", "description": "ให้คำปรึกษาการลงทุน"},
        {"name": "Accountant", "description": "จัดทำบัญชีและรายงานการเงิน"},
        
        # Marketing positions
        {"name": "Digital Marketing Specialist", "description": "จัดการการตลาดออนไลน์"},
        {"name": "Creative Designer", "description": "ออกแบบสื่อโฆษณา"},
        {"name": "Market Research Analyst", "description": "วิเคราะห์ข้อมูลตลาด"}
    ]
    
    created_positions = []
    
    # Create positions (distribute among departments)
    for i, position in enumerate(positions_data):
        if i < len(created_departments):
            dept_id = created_departments[i]['id']
            position['department_id'] = dept_id
            try:
                response = requests.post(f"{BASE_URL}/admin/departments/{dept_id}/positions", json=position)
                if response.status_code == 200:
                    created_position = response.json()
                    created_positions.append(created_position)
                    print(f"✅ สร้างตำแหน่ง: {created_position['name']}")
                else:
                    print(f"❌ ไม่สามารถสร้างตำแหน่ง: {position['name']} - {response.text}")
            except Exception as e:
                print(f"❌ ข้อผิดพลาด: {e}")
    
    # Sample exam templates
    exam_templates = [
        {
            "name": "ข้อสอบ Frontend Developer",
            "description": "ทดสอบความรู้ HTML, CSS, JavaScript, React",
            "programming_language": "JavaScript", 
            "duration_minutes": 90,
            "questions": [
                {
                    "type": "multiple_choice",
                    "question": "React Hook ใดที่ใช้สำหรับจัดการ state ใน functional component?",
                    "options": [
                        {"id": "a", "text": "useEffect"},
                        {"id": "b", "text": "useState"}, 
                        {"id": "c", "text": "useContext"},
                        {"id": "d", "text": "useMemo"}
                    ],
                    "correct_answer": "b",
                    "score": 10
                },
                {
                    "type": "code",
                    "question": "เขียนฟังก์ชัน JavaScript ที่รับ array และคืนค่า array ที่มีเฉพาะค่าที่ไม่ซ้ำกัน",
                    "expected_output": "[1, 2, 3, 4, 5]",
                    "score": 20
                }
            ]
        },
        {
            "name": "ข้อสอบ Data Scientist", 
            "description": "ทดสอบความรู้ Python, Machine Learning, Statistics",
            "programming_language": "Python",
            "duration_minutes": 120,
            "questions": [
                {
                    "type": "multiple_choice",
                    "question": "Algorithm ใดเหมาะสำหรับการจำแนกประเภท (Classification)?",
                    "options": [
                        {"id": "a", "text": "Linear Regression"},
                        {"id": "b", "text": "K-Means"},
                        {"id": "c", "text": "Random Forest"},
                        {"id": "d", "text": "PCA"}
                    ],
                    "correct_answer": "c",
                    "score": 10
                },
                {
                    "type": "essay",
                    "question": "อธิบายความแตกต่างระหว่าง Supervised Learning และ Unsupervised Learning พร้อมยกตัวอย่าง",
                    "max_words": 300,
                    "score": 25
                }
            ]
        },
        {
            "name": "ข้อสอบ Digital Marketing",
            "description": "ทดสอบความรู้การตลาดออนไลน์ SEO SEM",
            "programming_language": "None",
            "duration_minutes": 60,
            "questions": [
                {
                    "type": "true_false",
                    "question": "SEO ย่อมาจาก Search Engine Optimization",
                    "correct_answer": True,
                    "score": 5
                },
                {
                    "type": "essay",
                    "question": "อธิบายกลยุทธ์การทำ Content Marketing ที่มีประสิทธิภาพ",
                    "max_words": 250,
                    "score": 20
                }
            ]
        }
    ]
    
    # Create exam templates
    for i, exam in enumerate(exam_templates):
        if i < len(created_positions):
            position_id = created_positions[i]['id']
            try:
                response = requests.post(f"{BASE_URL}/positions/{position_id}/exam-templates", json=exam)
                if response.status_code == 200:
                    created_exam = response.json()
                    print(f"✅ สร้างข้อสอบ: {created_exam['name']}")
                else:
                    print(f"❌ ไม่สามารถสร้างข้อสอบ: {exam['name']} - {response.text}")
            except Exception as e:
                print(f"❌ ข้อผิดพลาด: {e}")
    
    # Sample candidates
    candidates = [
        {
            "first_name": "สมชาย",
            "last_name": "ใจดี", 
            "email": "somchai@example.com",
            "phone": "081-234-5678"
        },
        {
            "first_name": "สมหญิง",
            "last_name": "รักงาน",
            "email": "somying@example.com", 
            "phone": "082-345-6789"
        },
        {
            "first_name": "อรุณ",
            "last_name": "เก่งมาก",
            "email": "arun@example.com",
            "phone": "083-456-7890"
        }
    ]
    
    # Create candidates
    for candidate in candidates:
        try:
            response = requests.post(f"{BASE_URL}/candidates", json=candidate)
            if response.status_code == 200:
                created_candidate = response.json()
                print(f"✅ สร้างผู้สมัคร: {created_candidate['first_name']} {created_candidate['last_name']}")
            else:
                print(f"❌ ไม่สามารถสร้างผู้สมัคร: {candidate['first_name']} - {response.text}")
        except Exception as e:
            print(f"❌ ข้อผิดพลาด: {e}")
    
    print("\n🎉 สร้างข้อมูลตัวอย่างเสร็จสิ้น!")
    print("🌐 เข้าสู่ Admin Dashboard ที่: http://localhost:3000/admin")

if __name__ == "__main__":
    try:
        create_sample_data()
    except KeyboardInterrupt:
        print("\n⛔ ยกเลิกการสร้างข้อมูล")
    except Exception as e:
        print(f"\n❌ เกิดข้อผิดพลาด: {e}")
        print("💡 กรุณาตรวจสอบว่า Backend API ทำงานอยู่ที่ http://localhost:8000") 