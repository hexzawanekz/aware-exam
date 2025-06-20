#!/usr/bin/env python3
import requests
import json
import time

def create_simple_workflow():
    """Create a simple workflow directly via n8n web interface"""
    try:
        # First, let's try to access n8n without authentication
        base_url = "http://n8n:5678"
        
        # Check if n8n is accessible
        print("🔍 Checking n8n accessibility...")
        response = requests.get(f"{base_url}/healthz", timeout=10)
        print(f"Health check: {response.status_code}")
        
        # Try to get workflows (this might work without auth in some setups)
        print("📋 Trying to list existing workflows...")
        workflows_response = requests.get(f"{base_url}/api/v1/workflows", timeout=10)
        print(f"Workflows API: {workflows_response.status_code}")
        
        if workflows_response.status_code == 200:
            workflows = workflows_response.json()
            print(f"Found {len(workflows)} existing workflows")
            for wf in workflows:
                print(f"  - {wf.get('name', 'Unknown')} (ID: {wf.get('id', 'Unknown')})")
        
        # Simple workflow data
        workflow_data = {
            "name": "Simple Test Webhook",
            "active": True,
            "nodes": [
                {
                    "parameters": {
                        "httpMethod": "POST",
                        "path": "generate-exam",
                        "responseMode": "responseNode"
                    },
                    "id": "webhook1",
                    "name": "Webhook",
                    "type": "n8n-nodes-base.webhook",
                    "typeVersion": 1,
                    "position": [240, 300]
                },
                {
                    "parameters": {
                        "respondWith": "json",
                        "responseBody": "={{ {\"success\": true, \"message\": \"Test webhook working!\", \"timestamp\": $now} }}"
                    },
                    "id": "response1",
                    "name": "Respond to Webhook",
                    "type": "n8n-nodes-base.respondToWebhook",
                    "typeVersion": 1,
                    "position": [460, 300]
                }
            ],
            "connections": {
                "Webhook": {
                    "main": [
                        [
                            {
                                "node": "Respond to Webhook",
                                "type": "main",
                                "index": 0
                            }
                        ]
                    ]
                }
            }
        }
        
        # Try to create workflow
        print("📤 Attempting to create workflow...")
        create_response = requests.post(
            f"{base_url}/api/v1/workflows",
            json=workflow_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"Create workflow response: {create_response.status_code}")
        print(f"Response text: {create_response.text}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    create_simple_workflow() 