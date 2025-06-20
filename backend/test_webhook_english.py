#!/usr/bin/env python3
import requests
import json
import time

def test_webhook_english():
    """Test webhook with English data"""
    url = "http://n8n:5678/webhook/generate-exam"
    
    # Test payload in English
    payload = {
        "event_type": "generate_exam",
        "config": {
            "company_name": "Tech Solutions Inc",
            "department_name": "Software Development",
            "position_name": "Senior Software Engineer",
            "programming_language": "JavaScript",
            "level": "senior",
            "multiple_choice_count": 5,
            "coding_question_count": 2,
            "duration_minutes": 90,
            "additional_requirements": "Focus on React and Node.js"
        }
    }
    
    try:
        print("🔍 Testing webhook with English data...")
        print(f"📋 URL: {url}")
        print(f"📤 Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=60  # Increased timeout for AI processing
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")
        print(f"📊 Response Length: {len(response.text)} characters")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print("✅ SUCCESS! Valid JSON Response:")
                print(json.dumps(result, indent=2, ensure_ascii=False))
                
                # Check response structure
                if result.get('success'):
                    exam_data = result.get('exam_data', {})
                    print(f"\n🎯 Exam Generated:")
                    print(f"   Title: {exam_data.get('exam_title', 'N/A')}")
                    print(f"   Questions: {len(exam_data.get('questions', []))} questions")
                    print(f"   Duration: {exam_data.get('duration_minutes', 'N/A')} minutes")
                    print(f"   Processing Time: {result.get('processing_time', 'N/A')}s")
                    
                    # Show sample questions
                    questions = exam_data.get('questions', [])
                    if questions:
                        print(f"\n📝 Sample Questions:")
                        for i, q in enumerate(questions[:2]):  # Show first 2 questions
                            print(f"   {i+1}. [{q.get('type', 'unknown')}] {q.get('question', 'N/A')[:100]}...")
                else:
                    print(f"⚠️ Generation failed: {result.get('error', 'Unknown error')}")
                    
            except json.JSONDecodeError:
                print("❌ Invalid JSON response:")
                print(response.text[:1000])
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("⏰ Request timed out - AI processing may take longer")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_webhook_english() 