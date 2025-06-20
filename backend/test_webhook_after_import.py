#!/usr/bin/env python3
import asyncio
import httpx
import json
import time

async def test_webhook_after_import():
    """ทดสอบ webhook หลังจาก import workflow ใหม่"""
    
    print("🔍 Testing webhook after importing new workflow...")
    print("⏳ Waiting 5 seconds for workflow to be ready...")
    await asyncio.sleep(5)
    
    # Test payload เหมือนที่ Backend ส่งจริง
    test_payload = {
        "event_type": "generate_exam",
        "config": {
            "company_name": "Test Company",
            "department_name": "IT Department",
            "position_name": "Software Developer",
            "programming_language": "JavaScript",
            "level": "junior",
            "multiple_choice_count": 3,
            "coding_question_count": 1,
            "duration_minutes": 30,
            "additional_requirements": ""
        },
        "timestamp": json.dumps({"timestamp": "now"}, default=str)
    }
    
    try:
        async with httpx.AsyncClient() as client:
            print("📤 Sending test payload...")
            print(f"📋 URL: http://n8n:5678/webhook/generate-exam")
            
            response = await client.post(
                "http://n8n:5678/webhook/generate-exam",
                json=test_payload,
                timeout=30
            )
            
            print(f"\n📊 Response Status: {response.status_code}")
            print(f"📊 Response Headers: {dict(response.headers)}")
            print(f"📊 Response Length: {len(response.text)} characters")
            
            if response.status_code == 200:
                if response.text:
                    try:
                        json_response = response.json()
                        print(f"✅ SUCCESS! Valid JSON Response:")
                        print(json.dumps(json_response, indent=2))
                        
                        # Validate response structure
                        if json_response.get('success') and json_response.get('questions'):
                            print(f"\n🎉 Workflow is working correctly!")
                            print(f"📊 Generated {len(json_response['questions'])} questions")
                            print(f"📊 Total score: {json_response.get('exam_metadata', {}).get('total_score', 'N/A')}")
                        else:
                            print(f"⚠️ Response structure is not as expected")
                            
                    except json.JSONDecodeError as e:
                        print(f"❌ Invalid JSON response: {e}")
                        print(f"📄 Raw response: {response.text}")
                else:
                    print(f"❌ Empty response!")
            elif response.status_code == 404:
                print(f"❌ Webhook not found: {response.text}")
                print(f"💡 Make sure to import and activate the workflow in N8N UI")
            else:
                print(f"❌ Error response: {response.text}")
                
    except httpx.ConnectError as e:
        print(f"❌ Connection error: {e}")
    except httpx.TimeoutException as e:
        print(f"❌ Timeout error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    asyncio.run(test_webhook_after_import()) 