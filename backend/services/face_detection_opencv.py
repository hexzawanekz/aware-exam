#!/usr/bin/env python3
"""
OpenCV-based Face Detection Service
Based on the cleaner implementation from face-detection/OpenCV/
Focuses on essential cheating detection: face direction, multiple faces, and phone detection
"""

import cv2
import numpy as np
import base64
import io
from PIL import Image
from typing import Dict, List, Optional, Tuple
import asyncio
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OpenCVFaceDetectionService:
    """OpenCV-based face detection service for exam proctoring"""
    
    def __init__(self):
        """Initialize OpenCV face detection service"""
        self.face_cascade = None
        self.eye_cascade = None
        self.phone_net = None
        self.phone_classes = []
        self.phone_output_layers = []
        self.colors = None
        
        # Detection thresholds
        self.confidence_threshold = 0.5
        self.nms_threshold = 0.4
        
        # Tracking variables
        self.consecutive_no_face = 0
        # self.consecutive_multiple_faces = 0  # Removed - no longer needed
        self.consecutive_looking_away = 0
        self.no_face_threshold = 3  # 3 consecutive frames = ~15 seconds
        # self.multiple_face_threshold = 2  # Removed - no longer needed  
        self.looking_away_threshold = 4  # 4 consecutive frames = ~20 seconds
        
        self._initialize_detectors()
    
    def _initialize_detectors(self):
        """Initialize OpenCV face detection and YOLO phone detection"""
        try:
            # Initialize face detection using OpenCV Haar cascades
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
            
            if self.face_cascade.empty() or self.eye_cascade.empty():
                logger.warning("OpenCV Haar cascades not loaded properly")
            else:
                logger.info("✅ OpenCV face detection initialized successfully")
            
            # Try to initialize YOLO for phone detection (optional)
            self._initialize_yolo()
            
        except Exception as e:
            logger.error(f"❌ Error initializing face detection: {str(e)}")
    
    def _initialize_yolo(self):
        """Initialize YOLO for phone detection (optional)"""
        try:
            # Check if YOLO files exist
            yolo_weights = "yolov4.weights"
            yolo_config = "yolov4.cfg" 
            coco_names = "coco.names"
            
            if not all(os.path.exists(f) for f in [yolo_weights, yolo_config, coco_names]):
                logger.info("📱 YOLO files not found, phone detection disabled")
                return
            
            # Load YOLO
            self.phone_net = cv2.dnn.readNet(yolo_weights, yolo_config)
            
            # Load class names
            with open(coco_names, "r") as f:
                self.phone_classes = [line.strip() for line in f.readlines()]
            
            # Get output layers
            layer_names = self.phone_net.getLayerNames()
            self.phone_output_layers = [layer_names[i-1] for i in self.phone_net.getUnconnectedOutLayers()]
            
            # Generate colors for classes
            self.colors = np.random.uniform(0, 255, size=(len(self.phone_classes), 3))
            
            logger.info("✅ YOLO phone detection initialized successfully")
            
        except Exception as e:
            logger.warning(f"⚠️ YOLO initialization failed: {str(e)}, phone detection disabled")
    
    async def verify_face_from_frame(self, candidate_id: int, frame_data: str) -> Dict:
        """
        Analyze frame for cheating detection using OpenCV approach
        Returns: Detection results with suspicious activities
        """
        try:
            # Decode base64 frame
            frame = self._decode_frame(frame_data)
            if frame is None:
                return self._get_error_result("Invalid frame data")
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.1, 
                minNeighbors=5, 
                minSize=(30, 30)
            )
            
            # Analyze face detection results
            suspicious_activities = []
            face_analysis = self._analyze_faces(frame, gray, faces)
            
            # Check for suspicious activities
            if face_analysis['num_faces'] == 0:
                self.consecutive_no_face += 1
                # self.consecutive_multiple_faces = 0  # Removed
                self.consecutive_looking_away = 0
                
                if self.consecutive_no_face >= self.no_face_threshold:
                    suspicious_activities.append("prolonged_absence_detected")
                    
            elif face_analysis['num_faces'] > 1:
                # Multiple faces detected - no longer treated as suspicious
                # self.consecutive_multiple_faces = 0  # Removed
                self.consecutive_no_face = 0
                    
            else:
                # Single face detected - analyze direction
                self.consecutive_no_face = 0
                # self.consecutive_multiple_faces = 0  # Removed
                
                if face_analysis['direction'] in ['Left', 'Right']:
                    self.consecutive_looking_away += 1
                    
                    if self.consecutive_looking_away >= self.looking_away_threshold:
                        suspicious_activities.append("head_turned_away")
                else:
                    self.consecutive_looking_away = 0
            
            # Phone detection (if YOLO is available)
            if self.phone_net is not None:
                phone_detected = await self._detect_phones(frame)
                if phone_detected:
                    suspicious_activities.append("digital_device_detected")
            
            return {
                'success': True,
                'candidate_id': candidate_id,
                'face_detected': face_analysis['num_faces'] > 0,
                'num_faces': face_analysis['num_faces'],
                'face_direction': face_analysis['direction'],
                'suspicious_activity': suspicious_activities,
                'confidence': face_analysis['confidence'],
                'analysis_type': 'opencv_detection'
            }
            
        except Exception as e:
            logger.error(f"❌ Error in face verification: {str(e)}")
            return self._get_error_result(f"Face verification failed: {str(e)}")
    
    def _analyze_faces(self, frame: np.ndarray, gray: np.ndarray, faces) -> Dict:
        """Analyze detected faces for direction and confidence"""
        num_faces = len(faces)
        direction = "Forward"
        confidence = 0.0
        
        if num_faces == 0:
            return {
                'num_faces': 0,
                'direction': 'None',
                'confidence': 0.0
            }
        
        if num_faces == 1:
            # Single face - analyze direction using eye detection
            face_x, face_y, face_w, face_h = faces[0]
            roi_gray = gray[face_y:face_y+face_h, face_x:face_x+face_w]
            
            # Detect eyes within the face region
            eyes = self.eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=3)
            
            if len(eyes) >= 2:
                # Calculate face center and eye positions
                face_center_x = face_x + face_w // 2
                
                # Find eye positions relative to face center
                eye_positions = []
                for (ex, ey, ew, eh) in eyes:
                    eye_center_x = face_x + ex + ew // 2
                    eye_positions.append(eye_center_x)
                
                if len(eye_positions) >= 2:
                    # Determine direction based on eye symmetry
                    left_eye = min(eye_positions)
                    right_eye = max(eye_positions)
                    eye_center = (left_eye + right_eye) // 2
                    
                    # Compare eye center with face center
                    offset = abs(eye_center - face_center_x)
                    threshold = face_w * 0.15  # 15% of face width
                    
                    if eye_center < face_center_x - threshold:
                        direction = "Left"
                    elif eye_center > face_center_x + threshold:
                        direction = "Right"
                    else:
                        direction = "Forward"
                    
                    confidence = min(len(eyes) * 0.3, 1.0)  # More eyes = higher confidence
            
            # Fallback: use face position relative to frame
            if confidence < 0.3:
                frame_center_x = frame.shape[1] // 2
                face_center_x = face_x + face_w // 2
                
                if face_center_x < frame.shape[1] // 3:
                    direction = "Left"
                elif face_center_x > 2 * frame.shape[1] // 3:
                    direction = "Right"
                else:
                    direction = "Forward"
                
                confidence = 0.5
        
        return {
            'num_faces': num_faces,
            'direction': direction,
            'confidence': confidence
        }
    
    async def _detect_phones(self, frame: np.ndarray) -> bool:
        """Detect phones using YOLO (simplified version)"""
        try:
            if self.phone_net is None:
                return False
            
            height, width = frame.shape[:2]
            
            # Create blob from frame
            blob = cv2.dnn.blobFromImage(
                frame, 
                scalefactor=0.00392, 
                size=(416, 416), 
                mean=(0, 0, 0), 
                swapRB=True, 
                crop=False
            )
            
            # Set input and run forward pass
            self.phone_net.setInput(blob)
            outputs = self.phone_net.forward(self.phone_output_layers)
            
            # Parse outputs
            boxes = []
            confidences = []
            class_ids = []
            
            for output in outputs:
                for detection in output:
                    scores = detection[5:]
                    class_id = np.argmax(scores)
                    confidence = scores[class_id]
                    
                    if confidence > self.confidence_threshold:
                        # Get class name
                        if class_id < len(self.phone_classes):
                            class_name = self.phone_classes[class_id]
                            
                            # Check if it's a phone-related object
                            if class_name in ['cell phone', 'laptop', 'tablet', 'book']:
                                center_x = int(detection[0] * width)
                                center_y = int(detection[1] * height)
                                w = int(detection[2] * width)
                                h = int(detection[3] * height)
                                
                                x = int(center_x - w / 2)
                                y = int(center_y - h / 2)
                                
                                boxes.append([x, y, w, h])
                                confidences.append(float(confidence))
                                class_ids.append(class_id)
            
            # Apply NMS to remove overlapping boxes
            if boxes:
                indexes = cv2.dnn.NMSBoxes(boxes, confidences, self.confidence_threshold, self.nms_threshold)
                if len(indexes) > 0:
                    # Check if any detected object is a phone
                    for i in indexes.flatten():
                        class_name = self.phone_classes[class_ids[i]]
                        if class_name == 'cell phone':
                            logger.info(f"📱 Phone detected with confidence: {confidences[i]:.2f}")
                            return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Error in phone detection: {str(e)}")
            return False
    
    def _decode_frame(self, frame_data: str) -> Optional[np.ndarray]:
        """Decode base64 frame data to OpenCV format"""
        try:
            # Remove data URL prefix if present
            if frame_data.startswith('data:image'):
                frame_data = frame_data.split(',')[1]
            
            # Decode base64
            image_data = base64.b64decode(frame_data)
            
            # Convert to PIL Image
            pil_image = Image.open(io.BytesIO(image_data))
            
            # Convert to OpenCV format (BGR)
            opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            return opencv_image
            
        except Exception as e:
            logger.error(f"❌ Error decoding frame: {str(e)}")
            return None
    
    def _get_error_result(self, error_message: str) -> Dict:
        """Return error result format"""
        return {
            'success': False,
            'error': error_message,
            'face_detected': False,
            'num_faces': 0,
            'face_direction': 'Unknown',
            'suspicious_activity': [],
            'confidence': 0.0,
            'analysis_type': 'opencv_detection'
        }
    
    async def load_candidate_face(self, candidate_id: int, face_image_path: str) -> bool:
        """Load candidate reference face (simplified for OpenCV approach)"""
        try:
            if os.path.exists(face_image_path):
                logger.info(f"✅ Candidate {candidate_id} reference loaded: {face_image_path}")
                return True
            else:
                logger.warning(f"⚠️ Reference image not found: {face_image_path}")
                return False
        except Exception as e:
            logger.error(f"❌ Error loading candidate face: {str(e)}")
            return False
    
    async def analyze_video_segment(self, video_path: str, candidate_id: int, start_time: float, duration: float) -> Dict:
        """Analyze video segment for suspicious activities"""
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return self._get_error_result("Cannot open video file")
            
            # Set video position
            fps = cap.get(cv2.CAP_PROP_FPS)
            start_frame = int(start_time * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
            
            suspicious_events = []
            frame_count = 0
            max_frames = int(duration * fps)
            
            while frame_count < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Convert frame to base64 for analysis
                _, buffer = cv2.imencode('.jpg', frame)
                frame_base64 = base64.b64encode(buffer).decode('utf-8')
                
                # Analyze frame
                result = await self.verify_face_from_frame(candidate_id, frame_base64)
                
                if result['suspicious_activity']:
                    timestamp = start_time + (frame_count / fps)
                    suspicious_events.append({
                        'timestamp': timestamp,
                        'activities': result['suspicious_activity'],
                        'face_direction': result['face_direction'],
                        'num_faces': result['num_faces']
                    })
                
                frame_count += 1
            
            cap.release()
            
            return {
                'success': True,
                'video_path': video_path,
                'analyzed_duration': duration,
                'suspicious_events': suspicious_events,
                'total_events': len(suspicious_events),
                'analysis_type': 'opencv_video_analysis'
            }
            
        except Exception as e:
            logger.error(f"❌ Error analyzing video: {str(e)}")
            return self._get_error_result(f"Video analysis failed: {str(e)}")

# Global instance
opencv_face_detection_service = OpenCVFaceDetectionService() 