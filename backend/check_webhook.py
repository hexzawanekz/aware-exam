#!/usr/bin/env python3
import asyncio
import httpx
import json

async def check_n8n_webhooks():
    """ตรวจสอบ webhook paths ใน N8N"""
    
    print("🔍 Checking N8N webhook paths...")
    
    # Test different webhook paths
    webhook_paths = [
        "generate-exam",
        "exam-generation", 
        "ai-exam",
        "test"
    ]
    
    for path in webhook_paths:
        print(f"\n📍 Testing webhook path: /{path}")
        try:
            async with httpx.AsyncClient() as client:
                test_payload = {"test": "data"}
                
                response = await client.post(
                    f"http://n8n:5678/webhook/{path}",
                    json=test_payload,
                    timeout=10
                )
                
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    print(f"   ✅ WORKING! Response: {response.text[:100]}...")
                elif response.status_code == 404:
                    print(f"   ❌ Not found: {response.text}")
                else:
                    print(f"   ⚠️ Other status: {response.text}")
                    
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    # Check if we can get webhook info from N8N
    print(f"\n🔍 Trying to get webhook info...")
    try:
        async with httpx.AsyncClient() as client:
            # Try to get active webhooks (this might not work without auth)
            response = await client.get("http://n8n:5678/rest/active-workflows", timeout=10)
            print(f"Active workflows status: {response.status_code}")
            if response.status_code != 401:
                print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error getting active workflows: {e}")

if __name__ == "__main__":
    asyncio.run(check_n8n_webhooks()) 