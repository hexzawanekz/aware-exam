#!/usr/bin/env python3
import asyncio
import httpx
import json

async def test_n8n_connection():
    """ทดสอบการเชื่อมต่อกับ N8N"""
    
    # Test basic connection
    print("🔍 Testing N8N basic connection...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://n8n:5678", timeout=10)
            print(f"✅ N8N UI accessible: {response.status_code}")
    except Exception as e:
        print(f"❌ N8N UI connection failed: {e}")
    
    # Test webhook endpoint
    print("\n🔍 Testing webhook endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            test_payload = {
                "event_type": "generate_exam",
                "config": {
                    "programming_language": "JavaScript",
                    "level": "junior",
                    "multiple_choice_count": 5,
                    "coding_question_count": 2
                }
            }
            
            response = await client.post(
                "http://n8n:5678/webhook/generate-exam",
                json=test_payload,
                timeout=30
            )
            
            print(f"📊 Webhook response status: {response.status_code}")
            print(f"📊 Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    print(f"✅ Webhook JSON response: {json.dumps(result, indent=2)}")
                except:
                    print(f"⚠️ Webhook raw response: {response.text}")
            else:
                print(f"❌ Webhook error response: {response.text}")
                
    except httpx.ConnectError as e:
        print(f"❌ Connection error: {e}")
    except httpx.TimeoutException as e:
        print(f"❌ Timeout error: {e}")
    except Exception as e:
        print(f"❌ Webhook test failed: {e}")
    
    # Test N8N API
    print("\n🔍 Testing N8N REST API...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://n8n:5678/rest/workflows", timeout=10)
            print(f"📊 N8N API status: {response.status_code}")
            if response.status_code == 200:
                workflows = response.json()
                print(f"📊 Found {len(workflows)} workflows")
                for wf in workflows:
                    print(f"  - {wf.get('name', 'Unnamed')} (ID: {wf.get('id')}) - Active: {wf.get('active', False)}")
            else:
                print(f"❌ N8N API error: {response.text}")
    except Exception as e:
        print(f"❌ N8N API test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_n8n_connection()) 