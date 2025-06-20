#!/usr/bin/env python3
"""
Setup script for exam completion and evaluation system
"""

import requests
import json
import time

def setup_exam_completion_system():
    """Setup the complete exam completion system"""
    
    print("🚀 Setting up Exam Completion & Evaluation System")
    print("=" * 60)
    
    # Check system status
    print("📋 Step 1: Checking system components")
    check_backend()
    check_n8n()
    check_database()
    
    # Instructions for manual setup
    print("\n📋 Step 2: Manual N8N Workflow Setup")
    print_n8n_instructions()
    
    # Test the system
    print("\n📋 Step 3: System validation")
    print("✅ All components checked. Ready to test!")
    print("\nTo test the complete system:")
    print("1. Make sure all Docker containers are running:")
    print("   docker-compose up -d")
    print("\n2. Import the N8N workflow (see instructions above)")
    print("\n3. Run the test script:")
    print("   python test_exam_completion.py")
    print("\n4. Check results at:")
    print("   http://localhost:3000/admin/candidates/1")

def check_backend():
    """Check backend status"""
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print("✅ Backend API is running")
            return True
        else:
            print(f"⚠️ Backend API returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend API is not accessible: {e}")
        return False

def check_n8n():
    """Check N8N status"""
    try:
        response = requests.get("http://localhost:5678/healthz")
        if response.status_code == 200:
            print("✅ N8N is running")
            return True
        else:
            print(f"⚠️ N8N returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ N8N is not accessible: {e}")
        print("   Make sure N8N is running on port 5678")
        return False

def check_database():
    """Check database connection through backend"""
    try:
        response = requests.get("http://localhost:8000/api/v1/exam/exam-templates")
        if response.status_code in [200, 404]:  # 404 is ok if no templates exist yet
            print("✅ Database connection is working")
            return True
        else:
            print(f"⚠️ Database check returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def print_n8n_instructions():
    """Print N8N workflow import instructions"""
    print("=" * 60)
    print("📝 N8N WORKFLOW IMPORT INSTRUCTIONS")
    print("=" * 60)
    print("")
    print("1. Open N8N in your browser:")
    print("   http://localhost:5678")
    print("")
    print("2. Login with credentials:")
    print("   Username: admin")
    print("   Password: admin") 
    print("")
    print("3. Import the workflow:")
    print("   - Click on 'Workflows' in the main menu")
    print("   - Click 'Import from file'")
    print("   - Select: exam_completion_workflow.json")
    print("   - Click 'Import'")
    print("")
    print("4. Activate the workflow:")
    print("   - Open the imported workflow")
    print("   - Click the 'Active' toggle in the top right")
    print("   - Save the workflow")
    print("")
    print("5. Test the webhook URL:")
    print("   - The webhook should be available at:")
    print("   - http://localhost:5678/webhook/exam-complete")
    print("")
    print("✅ Once imported, the workflow will automatically:")
    print("   • Score exam answers")
    print("   • Analyze proctoring events") 
    print("   • Calculate cheating probability")
    print("   • Update candidate results")
    print("=" * 60)

def create_sample_data():
    """Create sample exam data for testing"""
    print("\n📋 Creating sample test data...")
    
    # Sample candidate
    candidate_data = {
        "first_name": "สมชาย",
        "last_name": "ทดสอบ", 
        "email": "test@example.com",
        "phone": "081-234-5678"
    }
    
    try:
        response = requests.post("http://localhost:8000/api/v1/exam/candidates", json=candidate_data)
        if response.status_code == 200:
            print("✅ Sample candidate created")
        else:
            print(f"⚠️ Failed to create sample candidate: {response.status_code}")
    except Exception as e:
        print(f"❌ Error creating sample candidate: {e}")

if __name__ == "__main__":
    setup_exam_completion_system()
    
    # Ask if user wants to create sample data
    create_sample = input("\n❓ Do you want to create sample test data? (y/n): ").lower().strip()
    if create_sample == 'y':
        create_sample_data()
    
    print(f"\n🎯 Setup complete! The exam completion system is ready to use.")
    print(f"📚 Check the status document for more details: AI_EXAM_SYSTEM_STATUS.md") 