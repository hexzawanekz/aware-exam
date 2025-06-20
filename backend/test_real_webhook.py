#!/usr/bin/env python3
import asyncio
import httpx
import json

async def test_real_webhook():
    """ทดสอบ webhook ด้วยข้อมูลจริงเหมือนที่ Backend ส่ง"""
    
    print("🔍 Testing webhook with real data...")
    
    # ข้อมูลเหมือนที่ Backend ส่งจริง
    real_payload = {
        "event_type": "generate_exam",
        "config": {
            "company_name": "Mock Company",
            "department_name": "Mock Department",
            "position_name": "Mock Position",
            "programming_language": "JavaScript",
            "level": "junior",
            "multiple_choice_count": 5,
            "coding_question_count": 2,
            "duration_minutes": 60,
            "additional_requirements": ""
        },
        "timestamp": "{\"timestamp\": \"now\"}"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            print("📤 Sending real payload to webhook...")
            print(f"📋 Payload: {json.dumps(real_payload, indent=2)}")
            
            response = await client.post(
                "http://n8n:5678/webhook/generate-exam",
                json=real_payload,
                timeout=30
            )
            
            print(f"\n📊 Response Status: {response.status_code}")
            print(f"📊 Response Headers: {dict(response.headers)}")
            print(f"📊 Response Length: {len(response.text)} characters")
            
            if response.text:
                print(f"📄 Response Content: {response.text}")
                try:
                    json_response = response.json()
                    print(f"✅ Valid JSON Response: {json.dumps(json_response, indent=2)}")
                except:
                    print(f"⚠️ Response is not valid JSON")
            else:
                print(f"❌ Empty response!")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_real_webhook()) 