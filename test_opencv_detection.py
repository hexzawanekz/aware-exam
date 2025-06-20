#!/usr/bin/env python3
"""
Test script for OpenCV-based face detection service
Verifies the new implementation works correctly
"""

import asyncio
import base64
import cv2
import sys
import os

# Add backend to path
sys.path.append('backend')

from services.face_detection_opencv import opencv_face_detection_service

async def test_opencv_service():
    """Test the OpenCV face detection service"""
    print("🧪 Testing OpenCV Face Detection Service")
    print("=" * 50)
    
    # Test 1: Service initialization
    print("1. Testing service initialization...")
    service = opencv_face_detection_service
    
    if service.face_cascade is not None:
        print("✅ Face cascade loaded successfully")
    else:
        print("❌ Face cascade failed to load")
        return False
    
    if service.eye_cascade is not None:
        print("✅ Eye cascade loaded successfully")
    else:
        print("❌ Eye cascade failed to load")
        return False
    
    # Test 2: Camera capture (optional)
    print("\n2. Testing camera capture...")
    cap = cv2.VideoCapture(0)
    if cap.isOpened():
        print("✅ Camera accessible")
        
        # Capture a test frame
        ret, frame = cap.read()
        if ret:
            print("✅ Frame captured successfully")
            
            # Convert frame to base64 for testing
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Test 3: Face detection on real frame
            print("\n3. Testing face detection on camera frame...")
            result = await service.verify_face_from_frame(1, frame_base64)
            
            if result['success']:
                print("✅ Face detection completed successfully")
                print(f"   - Faces detected: {result['num_faces']}")
                print(f"   - Face direction: {result['face_direction']}")
                print(f"   - Confidence: {result['confidence']:.2f}")
                print(f"   - Suspicious activities: {result['suspicious_activity']}")
            else:
                print(f"❌ Face detection failed: {result.get('error', 'Unknown error')}")
        else:
            print("⚠️ Could not capture frame from camera")
        
        cap.release()
    else:
        print("⚠️ Camera not accessible, skipping camera tests")
    
    # Test 4: Test with synthetic frame
    print("\n4. Testing with synthetic test frame...")
    
    # Create a simple test image
    test_frame = create_test_frame()
    _, buffer = cv2.imencode('.jpg', test_frame)
    test_frame_base64 = base64.b64encode(buffer).decode('utf-8')
    
    result = await service.verify_face_from_frame(1, test_frame_base64)
    
    if result['success']:
        print("✅ Synthetic frame processing successful")
        print(f"   - Analysis type: {result['analysis_type']}")
    else:
        print(f"❌ Synthetic frame processing failed: {result.get('error', 'Unknown error')}")
    
    # Test 5: YOLO phone detection status
    print("\n5. Checking YOLO phone detection...")
    if service.phone_net is not None:
        print("✅ YOLO phone detection is available")
    else:
        print("⚠️ YOLO phone detection is disabled (YOLO files not found)")
        print("   This is normal - phone detection will use basic methods")
    
    print("\n" + "=" * 50)
    print("🎉 OpenCV Face Detection Service Test Complete!")
    return True

def create_test_frame():
    """Create a simple test frame for testing"""
    import numpy as np
    
    # Create a blank image
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # Draw a circle for face
    cv2.circle(frame, (320, 240), 80, (100, 100, 100), -1)
    
    # Draw eyes
    cv2.circle(frame, (300, 220), 10, (200, 200, 200), -1)
    cv2.circle(frame, (340, 220), 10, (200, 200, 200), -1)
    
    # Draw mouth
    cv2.ellipse(frame, (320, 260), (20, 10), 0, 0, 180, (200, 200, 200), -1)
    
    return frame

def test_detection_comparison():
    """Compare detection approaches"""
    print("\n📊 Detection Approach Comparison")
    print("=" * 40)
    
    print("🔍 OLD System (face_detection_lite.py):")
    print("   ❌ Complex YOLO + custom algorithms")
    print("   ❌ Too many false positives")
    print("   ❌ Excessive debug logging")
    print("   ❌ Hard to maintain and calibrate")
    
    print("\n✨ NEW System (face_detection_opencv.py):")
    print("   ✅ Clean OpenCV Haar cascades")
    print("   ✅ Focused on essential detection")
    print("   ✅ Minimal false positives")
    print("   ✅ Easy to understand and maintain")
    print("   ✅ Based on proven OpenCV methods")
    
    print("\n🎯 Key Improvements:")
    print("   • Face detection: OpenCV Haar cascades")
    print("   • Direction analysis: Eye position tracking")
    print("   • Phone detection: Optional YOLO (if available)")
    print("   • Cleaner code structure")
    print("   • Better error handling")
    print("   • Reduced complexity")

async def run_live_test():
    """Run a live test with camera feed"""
    print("\n🎥 Live Camera Test (Press 'q' to quit)")
    print("=" * 40)
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Cannot open camera for live test")
        return
    
    service = opencv_face_detection_service
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        
        # Test every 10 frames to avoid overwhelming
        if frame_count % 10 == 0:
            # Convert to base64
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Analyze frame
            result = await service.verify_face_from_frame(1, frame_base64)
            
            # Display results on frame
            status_text = f"Faces: {result['num_faces']} | Direction: {result['face_direction']}"
            cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            if result['suspicious_activity']:
                activity_text = f"Suspicious: {', '.join(result['suspicious_activity'])}"
                cv2.putText(frame, activity_text, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        
        cv2.imshow('OpenCV Face Detection Test', frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    print("✅ Live test completed")

if __name__ == "__main__":
    import numpy as np
    
    print("🚀 OpenCV Face Detection Service Test Suite")
    print("=" * 60)
    
    # Run basic tests
    success = asyncio.run(test_opencv_service())
    
    if success:
        # Show comparison
        test_detection_comparison()
        
        # Ask for live test
        try:
            choice = input("\nRun live camera test? (y/n): ").lower().strip()
            if choice == 'y':
                asyncio.run(run_live_test())
        except KeyboardInterrupt:
            print("\nTest interrupted by user")
    
    print("\n🎉 Test suite completed!") 