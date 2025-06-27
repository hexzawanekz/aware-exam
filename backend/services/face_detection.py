import cv2
import numpy as np
import face_recognition
import asyncio
import base64
from io import BytesIO
from PIL import Image
from typing import Dict, List, Tuple, Optional, Any
import logging
import json
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class FaceDetectionService:
    def __init__(self):
        """Initialize face detection service with OpenCV"""
        try:
            # Load pre-trained face detection model
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            logger.info("Face detection service initialized successfully")
            self.known_face_encodings = {}
            self.suspicious_threshold = 0.3
        except Exception as e:
            logger.error(f"Failed to initialize face detection service: {e}")
            self.face_cascade = None
    
    async def load_candidate_face(self, candidate_id: int, face_image_path: str) -> bool:
        """โหลดใบหน้าของผู้สมัครสำหรับการยืนยันตัวตน"""
        try:
            # อ่านภาพและสร้าง face encoding
            image = face_recognition.load_image_file(face_image_path)
            face_encodings = face_recognition.face_encodings(image)
            
            if face_encodings:
                self.known_face_encodings[candidate_id] = face_encodings[0]
                logger.info(f"โหลดใบหน้าของผู้สมัคร ID {candidate_id} สำเร็จ")
                return True
            else:
                logger.error(f"ไม่พบใบหน้าในภาพของผู้สมัคร ID {candidate_id}")
                return False
                
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการโหลดใบหน้า: {str(e)}")
            return False
    
    async def verify_face_from_frame(self, candidate_id: int, frame_data: str) -> Dict:
        """ตรวจสอบใบหน้าจาก webcam frame"""
        try:
            if not self.face_cascade:
                return {
                    "face_detected": False,
                    "face_count": 0,
                    "identity_verified": False,
                    "confidence": 0.0,
                    "suspicious_activity": ["detection_error"]
                }
            
            # Decode base64 image
            if frame_data.startswith('data:image'):
                # Remove data URL prefix
                frame_data = frame_data.split(',')[1]
            
            # Decode base64 to bytes
            img_bytes = base64.b64decode(frame_data)
            
            # Convert bytes to numpy array
            nparr = np.frombuffer(img_bytes, np.uint8)
            
            # Decode image
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                return {
                    "face_detected": False,
                    "face_count": 0,
                    "identity_verified": False,
                    "confidence": 0.0,
                    "suspicious_activity": ["detection_error"]
                }
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            # Analyze results
            num_faces = len(faces)
            
            result = {
                "face_detected": num_faces > 0,
                "face_count": num_faces,
                "identity_verified": False,
                "confidence": 0.0,
                "suspicious_activity": []
            }
            
            if num_faces == 0:
                result["suspicious_activity"].append("no_face_detected")
                return result
            
            if num_faces > 1:
                result["suspicious_activity"].append("multiple_faces_detected")
                
            # ตรวจสอบตัวตนของผู้สมัคร
            if candidate_id in self.known_face_encodings:
                known_encoding = self.known_face_encodings[candidate_id]
                
                for (x, y, w, h) in faces:
                    face_region = img[y:y+h, x:x+w]
                    face_encodings = face_recognition.face_encodings(face_region)
                    
                    if face_encodings:
                        face_encoding = face_encodings[0]
                        matches = face_recognition.compare_faces([known_encoding], face_encoding, tolerance=0.6)
                        face_distances = face_recognition.face_distance([known_encoding], face_encoding)
                        
                        if matches[0]:
                            confidence = 1 - face_distances[0]
                            result["identity_verified"] = True
                            result["confidence"] = float(confidence)
                            break
            
            # ตรวจสอบกิจกรรมน่าสงสัย
            suspicious_activities = await self._detect_suspicious_activities(img, faces)
            result["suspicious_activity"].extend(suspicious_activities)
            
            return result
            
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการตรวจสอบใบหน้า: {str(e)}")
            return {
                "face_detected": False,
                "face_count": 0,
                "identity_verified": False,
                "confidence": 0.0,
                "suspicious_activity": ["detection_error"]
            }
    
    async def _detect_suspicious_activities(self, frame: np.ndarray, face_locations: List) -> List[str]:
        """ตรวจจับกิจกรรมน่าสงสัย"""
        suspicious = []
        
        if not face_locations:
            return ["no_face_detected"]
            
        # ตรวจสอบท่าทางและการมองของใบหน้า
        for (top, right, bottom, left) in face_locations:
            face_region = frame[top:bottom, left:right]
            
            # ตรวจสอบการก้มหน้า (ใช้อัตราส่วนความสูงความกว้าง)
            face_height = bottom - top
            face_width = right - left
            aspect_ratio = face_height / face_width if face_width > 0 else 0
            
            if aspect_ratio > 1.5:  # ใบหน้าสูงเกินไป อาจหมายถึงการก้มหน้า
                suspicious.append("head_down_detected")
                
            # ตรวจสอบการหันหน้า (ใช้ตำแหน่งตา)
            eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
            gray_face = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
            eyes = eye_cascade.detectMultiScale(gray_face, 1.1, 4)
            
            if len(eyes) < 2:
                suspicious.append("face_turned_away")
                
        return suspicious
    
    async def analyze_video_segment(self, video_path: str, candidate_id: int, start_time: float, duration: float) -> Dict:
        """วิเคราะห์ segment ของวิดีโอเพื่อหาการโกง"""
        try:
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            start_frame = int(start_time * fps)
            end_frame = int((start_time + duration) * fps)
            
            cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
            
            analysis_result = {
                "total_frames": end_frame - start_frame,
                "face_present_frames": 0,
                "identity_verified_frames": 0,
                "suspicious_activities": {},
                "cheating_probability": 0.0
            }
            
            frame_count = 0
            while frame_count < (end_frame - start_frame):
                ret, frame = cap.read()
                if not ret:
                    break
                    
                # แปลงเป็น base64 เพื่อใช้กับ verify_face_from_frame
                _, buffer = cv2.imencode('.jpg', frame)
                frame_base64 = base64.b64encode(buffer).decode('utf-8')
                frame_data = f"data:image/jpeg;base64,{frame_base64}"
                
                # วิเคราะห์ frame
                result = await self.verify_face_from_frame(candidate_id, frame_data)
                
                if result["face_detected"]:
                    analysis_result["face_present_frames"] += 1
                    
                if result["identity_verified"]:
                    analysis_result["identity_verified_frames"] += 1
                    
                # รวบรวมกิจกรรมน่าสงสัย
                for activity in result["suspicious_activity"]:
                    if activity not in analysis_result["suspicious_activities"]:
                        analysis_result["suspicious_activities"][activity] = 0
                    analysis_result["suspicious_activities"][activity] += 1
                    
                frame_count += 1
            
            cap.release()
            
            # คำนวณความน่าจะเป็นของการโกง
            face_absence_rate = 1 - (analysis_result["face_present_frames"] / analysis_result["total_frames"])
            identity_failure_rate = 1 - (analysis_result["identity_verified_frames"] / max(analysis_result["face_present_frames"], 1))
            
            # คำนวณคะแนนกิจกรรมน่าสงสัย
            suspicious_score = 0
            for activity, count in analysis_result["suspicious_activities"].items():
                activity_rate = count / analysis_result["total_frames"]
                if activity == "no_face_detected":
                    suspicious_score += activity_rate * 0.4
                elif activity == "multiple_faces_detected":
                    suspicious_score += activity_rate * 0.3
                elif activity == "head_down_detected":
                    suspicious_score += activity_rate * 0.2
                elif activity == "face_turned_away":
                    suspicious_score += activity_rate * 0.1
                    
            analysis_result["cheating_probability"] = min(1.0, face_absence_rate * 0.4 + identity_failure_rate * 0.3 + suspicious_score)
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการวิเคราะห์วิดีโอ: {str(e)}")
            return {
                "total_frames": 0,
                "face_present_frames": 0,
                "identity_verified_frames": 0,
                "suspicious_activities": {},
                "cheating_probability": 1.0  # ถือว่าน่าสงสัยสูงสุดหากไม่สามารถวิเคราะห์ได้
            }

# สร้าง singleton instance
face_detection_service = FaceDetectionService() 