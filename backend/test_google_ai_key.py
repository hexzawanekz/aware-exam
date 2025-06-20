#!/usr/bin/env python3
import requests
import json

def test_google_ai_key(api_key):
    """Test Google AI API key"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{
                "text": "Hello, please respond with 'API key is working!'"
            }]
        }]
    }
    
    try:
        response = requests.post(
            url,
            headers={'Content-Type': 'application/json'},
            json=payload,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
            print(f"✅ API Key is working! Response: {text}")
            return True
        else:
            print(f"❌ API Key failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing API key: {str(e)}")
        return False

if __name__ == "__main__":
    # Replace with your actual API key
    api_key = input("Enter your Google AI API key: ").strip()
    
    if not api_key:
        print("❌ No API key provided")
    elif not api_key.startswith('AIza'):
        print("❌ Invalid API key format. Should start with 'AIza'")
    else:
        test_google_ai_key(api_key) 