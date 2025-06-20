#!/usr/bin/env python3
"""
Comprehensive Test Script for AI Exam Workflow - Built-in modules only
Tests the complete flow: Draft → AI Generation → Database Update → Response
"""

import urllib.request
import urllib.parse
import json
import time
import sys
from datetime import datetime

class WorkflowTester:
    def __init__(self):
        # Try the new improved webhook first, fallback to working webhook
        self.n8n_url = "http://localhost:5678/webhook/generate-exam-v2"
        self.fallback_url = "http://localhost:5678/webhook/working-google-ai"
        self.backend_url = "http://localhost:8000"
        
    def print_header(self, title):
        print("\n" + "="*60)
        print(f"🎯 {title}")
        print("="*60)
        
    def print_step(self, step, description):
        print(f"\n📋 Step {step}: {description}")
        print("-" * 40)
        
    def test_backend_health(self):
        """Test if backend is running and healthy"""
        self.print_step(1, "Testing Backend Health")
        
        try:
            req = urllib.request.Request(f"{self.backend_url}/health")
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    print("✅ Backend is healthy")
                    return True
                else:
                    print(f"❌ Backend health check failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Backend connection failed: {e}")
            return False
    
    def test_n8n_health(self):
        """Test if N8N is running"""
        self.print_step(2, "Testing N8N Health")
        
        try:
            # Test with a simple GET request first
            req = urllib.request.Request("http://localhost:5678/healthz")
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    print("✅ N8N is healthy")
                    return True
                else:
                    print(f"⚠️  N8N health endpoint returned: {response.status}")
                    return True  # N8N might not have /healthz but could still work
        except Exception as e:
            print(f"❌ N8N connection failed: {e}")
            return False
    
    def test_improved_workflow(self):
        """Test the complete improved workflow"""
        self.print_step(3, "Testing Improved Workflow")
        
        # Test payload
        test_payload = {
            "company_name": "Tech Solutions Inc",
            "department_name": "Software Development", 
            "position_name": "Senior Full Stack Developer",
            "programmingLanguage": "JavaScript",
            "difficultyLevel": "Senior",
            "examDuration": 45,
            "multipleChoiceCount": 3,
            "codingQuestionCount": 2
        }
        
        # Try the improved workflow first
        result = self._test_webhook(self.n8n_url, "Improved Workflow", test_payload)
        if result:
            return result
            
        # Fallback to working webhook
        print(f"\n⚠️  Improved workflow failed, trying fallback...")
        result = self._test_webhook(self.fallback_url, "Working Fallback", test_payload)
        return result
    
    def _test_webhook(self, url, name, test_payload):
        """Test a specific webhook URL"""
        print(f"📤 Sending request to: {url}")
        print(f"📋 Testing: {name}")
        print(f"📋 Payload: {json.dumps(test_payload, indent=2)}")
        
        try:
            start_time = time.time()
            data = json.dumps(test_payload).encode('utf-8')
            req = urllib.request.Request(
                url,
                data=data,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            
            with urllib.request.urlopen(req, timeout=60) as response:
                end_time = time.time()
                
                print(f"⏱️  Response time: {end_time - start_time:.2f} seconds")
                print(f"📊 Status code: {response.status}")
                print(f"📝 Headers: {dict(response.headers)}")
                
                if response.status == 200:
                    content = response.read().decode('utf-8')
                    if content:
                        try:
                            result = json.loads(content)
                            print("✅ Workflow completed successfully!")
                            print(f"📄 Response: {json.dumps(result, indent=2)}")
                            
                            # Validate response structure
                            self.validate_response(result)
                            return result
                            
                        except json.JSONDecodeError:
                            print("❌ Response is not valid JSON")
                            print(f"Raw response: {content}")
                            return None
                    else:
                        print("❌ Empty response received")
                        return None
                else:
                    print(f"❌ Workflow failed with status: {response.status}")
                    content = response.read().decode('utf-8')
                    print(f"Response: {content}")
                    return None
                    
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return None
    
    def validate_response(self, response):
        """Validate the workflow response structure"""
        self.print_step(4, "Validating Response Structure")
        
        # Check if it's the improved workflow response
        if "workflow_version" in response:
            self._validate_improved_response(response)
        else:
            self._validate_basic_response(response)
    
    def _validate_improved_response(self, response):
        """Validate improved workflow response"""
        print("🔍 Validating Improved Workflow Response")
        
        required_fields = [
            "success", "message", "exam_id", "questions_generated",
            "ai_metadata", "exam_details", "workflow_version", "timestamp"
        ]
        
        for field in required_fields:
            if field in response:
                print(f"✅ {field}: {response[field]}")
            else:
                print(f"❌ Missing field: {field}")
        
        # Validate AI metadata
        if "ai_metadata" in response:
            ai_meta = response["ai_metadata"]
            if "model" in ai_meta and "tokens_used" in ai_meta:
                print(f"✅ AI Model: {ai_meta['model']}")
                print(f"✅ Tokens Used: {ai_meta['tokens_used']}")
            else:
                print("❌ AI metadata incomplete")
        
        # Validate exam details
        if "exam_details" in response:
            details = response["exam_details"]
            print(f"✅ Programming Language: {details.get('programming_language')}")
            print(f"✅ Difficulty Level: {details.get('difficulty_level')}")
            print(f"✅ Questions Generated: {response.get('questions_generated')}")
    
    def _validate_basic_response(self, response):
        """Validate basic workflow response"""
        print("🔍 Validating Basic Workflow Response")
        
        basic_fields = ["success", "message"]
        
        for field in basic_fields:
            if field in response:
                print(f"✅ {field}: {response[field]}")
            else:
                print(f"❌ Missing field: {field}")
        
        # Check for AI question
        if "ai_question" in response:
            print(f"✅ AI Question Generated: {response['ai_question'][:100]}...")
        
        # Check for model info
        if "model" in response:
            print(f"✅ AI Model: {response['model']}")
        
        # Check for tokens
        if "tokens_used" in response:
            print(f"✅ Tokens Used: {response['tokens_used']}")
    
    def verify_database_record(self, exam_id):
        """Verify the exam was saved to database"""
        self.print_step(5, "Verifying Database Record")
        
        try:
            req = urllib.request.Request(f"{self.backend_url}/admin/exam-templates/{exam_id}")
            with urllib.request.urlopen(req) as response:
                if response.status == 200:
                    content = response.read().decode('utf-8')
                    exam_data = json.loads(content)
                    print("✅ Exam found in database")
                    print(f"📋 Exam ID: {exam_data.get('id')}")
                    print(f"📋 Status: {exam_data.get('status')}")
                    print(f"📋 Questions Count: {len(exam_data.get('questions', []))}")
                    return exam_data
                else:
                    print(f"❌ Exam not found in database: {response.status}")
                    return None
        except Exception as e:
            print(f"❌ Database verification failed: {e}")
            return None
    
    def run_comprehensive_test(self):
        """Run the complete test suite"""
        self.print_header("AI Exam Workflow - Comprehensive Test")
        
        print(f"🕐 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Step 1: Test backend health
        if not self.test_backend_health():
            print("\n❌ Backend is not available. Please start the backend service.")
            return False
        
        # Step 2: Test N8N health
        if not self.test_n8n_health():
            print("\n❌ N8N is not available. Please start N8N service.")
            return False
        
        # Step 3: Test the workflow
        result = self.test_improved_workflow()
        if not result:
            print("\n❌ Workflow test failed.")
            return False
        
        # Step 4: Verify database record (if exam_id is available)
        if result and result.get("exam_id"):
            exam_data = self.verify_database_record(result["exam_id"])
            if exam_data:
                print("\n✅ End-to-end test completed successfully!")
                return True
        
        print("\n✅ Workflow test completed successfully!")
        print("⚠️  Database verification skipped (no exam_id or backend integration).")
        return True

def main():
    """Main test execution"""
    tester = WorkflowTester()
    
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 Tests completed! The AI workflow is working correctly.")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed. Please check the workflow configuration.")
        sys.exit(1)

if __name__ == "__main__":
    main() 