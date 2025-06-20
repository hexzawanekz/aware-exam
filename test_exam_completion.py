#!/usr/bin/env python3
"""
Test script for exam completion and evaluation workflow
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "http://localhost:8000"
N8N_URL = "http://localhost:5678"

def test_exam_completion_workflow():
    """Test the complete exam completion and evaluation workflow"""
    
    print("🎯 Testing Exam Completion & Evaluation Workflow")
    print("=" * 60)
    
    # Step 1: Create test data
    print("📋 Step 1: Setting up test data")
    candidate_data = setup_test_candidate()
    exam_data = setup_test_exam()
    session_data = create_exam_session(candidate_data, exam_data)
    
    if not session_data:
        print("❌ Failed to create exam session")
        return False
    
    session_id = session_data["session_id"]
    print(f"✅ Created exam session: {session_id}")
    
    # Step 2: Start exam
    print(f"\n📋 Step 2: Starting exam session")
    start_result = start_exam_session(session_id)
    if not start_result:
        print("❌ Failed to start exam")
        return False
    print("✅ Exam started successfully")
    
    # Step 3: Simulate proctoring events
    print(f"\n📋 Step 3: Simulating proctoring events")
    simulate_proctoring_events(session_id)
    print("✅ Proctoring events logged")
    
    # Step 4: Submit exam answers
    print(f"\n📋 Step 4: Submitting exam answers")
    answers = generate_test_answers(start_result["questions"])
    submit_result = submit_exam_answers(session_id, answers)
    if not submit_result:
        print("❌ Failed to submit exam")
        return False
    print("✅ Exam submitted successfully")
    
    # Step 5: Wait for evaluation
    print(f"\n📋 Step 5: Waiting for evaluation to complete")
    time.sleep(5)  # Wait for N8N workflow
    
    # Step 6: Check results
    print(f"\n📋 Step 6: Checking evaluation results")
    results = get_candidate_results(candidate_data["id"])
    if results:
        print("✅ Results retrieved successfully")
        print_results_summary(results)
        return True
    else:
        print("❌ Failed to retrieve results")
        return False

def setup_test_candidate():
    """Create a test candidate"""
    candidate_data = {
        "first_name": "ทดสอบ",
        "last_name": "ระบบ",
        "email": f"test_{int(time.time())}@example.com",
        "phone": "081-234-5678"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/v1/exam/candidates", json=candidate_data)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error creating candidate: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error creating candidate: {e}")
        return None

def setup_test_exam():
    """Create a test exam template"""
    exam_data = {
        "name": "ทดสอบระบบ JavaScript",
        "description": "ข้อสอบทดสอบระบบ",
        "programming_language": "JavaScript",
        "duration_minutes": 30,
        "questions": [
            {
                "id": 1,
                "type": "multiple_choice",
                "question": "What does 'var' keyword do in JavaScript?",
                "options": [
                    {"id": "a", "text": "Declares a variable"},
                    {"id": "b", "text": "Defines a function"},
                    {"id": "c", "text": "Creates an object"},
                    {"id": "d", "text": "None of the above"}
                ],
                "correct_answer": "a",
                "score": 10
            },
            {
                "id": 2,
                "type": "multiple_choice", 
                "question": "Which method is used to add an element to an array?",
                "options": [
                    {"id": "a", "text": "push()"},
                    {"id": "b", "text": "add()"},
                    {"id": "c", "text": "append()"},
                    {"id": "d", "text": "insert()"}
                ],
                "correct_answer": "a",
                "score": 10
            },
            {
                "id": 3,
                "type": "code",
                "question": "Write a function that returns the sum of two numbers",
                "expected_output": "function sum(a, b) { return a + b; }",
                "score": 20
            }
        ]
    }
    return exam_data

def create_exam_session(candidate_data, exam_data):
    """Create an exam session"""
    # First create exam template if needed
    # For testing, we'll use a mock template ID
    template_id = 1
    
    session_data = {
        "candidate_id": candidate_data["id"]
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/v1/exam/exam-templates/{template_id}/sessions", json=session_data)
        if response.status_code == 200:
            return response.json()["session"]
        else:
            print(f"Error creating session: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error creating session: {e}")
        return None

def start_exam_session(session_id):
    """Start the exam session"""
    try:
        response = requests.post(f"{BACKEND_URL}/api/v1/exam/sessions/{session_id}/start")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error starting exam: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error starting exam: {e}")
        return None

def simulate_proctoring_events(session_id):
    """Simulate various proctoring events"""
    events = [
        {"type": "face_lost", "confidence": 0.8},
        {"type": "multiple_faces", "confidence": 0.9},
        {"type": "phone_detected", "confidence": 0.7},
        {"type": "tab_switch", "confidence": 0.95}
    ]
    
    for event in events:
        try:
            response = requests.post(f"{BACKEND_URL}/api/v1/exam/sessions/{session_id}/log-activity", json=event)
            time.sleep(1)  # Simulate time between events
        except Exception as e:
            print(f"Error logging event: {e}")

def generate_test_answers(questions):
    """Generate test answers"""
    answers = {}
    
    for question in questions:
        question_id = str(question["id"])
        
        if question["type"] == "multiple_choice":
            # Answer correctly for first question, incorrectly for second
            if question["id"] == 1:
                answers[question_id] = "a"  # Correct answer
            else:
                answers[question_id] = "b"  # Incorrect answer
        elif question["type"] == "code":
            # Provide a partial code answer
            answers[question_id] = "function sum(a, b) { return a + b; }"
    
    return answers

def submit_exam_answers(session_id, answers):
    """Submit exam answers"""
    try:
        response = requests.post(f"{BACKEND_URL}/api/v1/exam/sessions/{session_id}/submit", json={"answers": answers})
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error submitting exam: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error submitting exam: {e}")
        return None

def get_candidate_results(candidate_id):
    """Get candidate results"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/v1/exam/candidates/{candidate_id}/results")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error getting results: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error getting results: {e}")
        return None

def print_results_summary(results):
    """Print a summary of the results"""
    print("\n🎉 EXAM EVALUATION RESULTS")
    print("-" * 40)
    print(f"👤 Candidate: {results.get('first_name', '')} {results.get('last_name', '')}")
    print(f"📧 Email: {results.get('email', 'N/A')}")
    print(f"💼 Position: {results.get('position', 'N/A')}")
    print(f"📊 Score: {results.get('exam_score', 0)}/100")
    print(f"🎯 Status: {results.get('status', 'Unknown')}")
    print(f"⚠️ Cheating Probability: {results.get('cheating_percentage', 0)}%")
    print(f"🤖 AI Confidence: {results.get('ai_confidence', 0)}%")
    print(f"📅 Exam Date: {results.get('exam_date', 'N/A')}")
    print(f"⏰ Duration: {results.get('exam_duration', 'N/A')}")
    
    events = results.get('proctoring_events', [])
    if events:
        print(f"\n🚨 Proctoring Events ({len(events)} total):")
        for event in events[:5]:  # Show first 5 events
            print(f"  • {event.get('timestamp', 'N/A')} - {event.get('description', 'N/A')} ({event.get('severity', 'N/A')})")
        if len(events) > 5:
            print(f"  ... and {len(events) - 5} more events")

def test_n8n_connection():
    """Test N8N connection"""
    try:
        response = requests.get(f"{N8N_URL}/healthz")
        return response.status_code == 200
    except:
        return False

if __name__ == "__main__":
    # Test N8N connection first
    print("🔧 Testing N8N connection...")
    if test_n8n_connection():
        print("✅ N8N is accessible")
    else:
        print("⚠️ N8N is not accessible - will use fallback evaluation")
    
    # Run the complete test
    success = test_exam_completion_workflow()
    
    if success:
        print(f"\n🎉 All tests passed! The exam completion workflow is working correctly.")
    else:
        print(f"\n❌ Some tests failed. Please check the logs above.") 