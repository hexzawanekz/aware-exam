#!/usr/bin/env python3
import requests
import json
import sys
import time

def import_workflow(workflow_file):
    """Import workflow to n8n"""
    try:
        # Read workflow file
        with open(workflow_file, 'r', encoding='utf-8') as f:
            workflow_data = json.load(f)
        
        print(f"📁 Loading workflow from {workflow_file}")
        print(f"📋 Workflow name: {workflow_data.get('name', 'Unknown')}")
        
        # N8N API endpoint
        n8n_url = "http://n8n:5678/api/v1/workflows"
        
        # Import workflow
        print("📤 Importing workflow to n8n...")
        headers = {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': 'n8n-api-key'  # Use the API key from docker-compose
        }
        response = requests.post(
            n8n_url,
            json=workflow_data,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 201:
            result = response.json()
            workflow_id = result.get('id')
            print(f"✅ Workflow imported successfully!")
            print(f"🆔 Workflow ID: {workflow_id}")
            
            # Activate workflow
            print("🔄 Activating workflow...")
            activate_url = f"{n8n_url}/{workflow_id}/activate"
            activate_response = requests.post(activate_url, headers=headers, timeout=30)
            
            if activate_response.status_code == 200:
                print("✅ Workflow activated successfully!")
                
                # Wait a moment for webhook to register
                print("⏳ Waiting for webhook to register...")
                time.sleep(3)
                
                return True
            else:
                print(f"❌ Failed to activate workflow: {activate_response.status_code}")
                print(f"Response: {activate_response.text}")
                return False
                
        else:
            print(f"❌ Failed to import workflow: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error importing workflow: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python import_minimal_workflow.py <workflow_file>")
        sys.exit(1)
    
    workflow_file = sys.argv[1]
    success = import_workflow(workflow_file)
    sys.exit(0 if success else 1) 