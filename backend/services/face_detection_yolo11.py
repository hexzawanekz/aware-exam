"""
YOLO11 Pose Estimation Service for Advanced Cheating Detection
Using Ultralytics YOLO11 for human pose estimation and analysis
"""

import cv2
import numpy as np
import base64
import io
from PIL import Image
from typing import Dict, List, Optional, Tuple
import logging
from datetime import datetime
import os
import uuid

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    logging.warning("Ultralytics not available. Install with: pip install ultralytics")

from core.detection_config import DetectionConfig

logger = logging.getLogger(__name__)

class YOLO11PoseDetectionService:
    """Advanced pose detection service using YOLO11 pose estimation"""
    
    def __init__(self):
        self.model = None
        self.seg_model = None  # Add segmentation model for phone detection
        self.pose_history = []  # Store pose history for analysis
        self.suspicious_pose_frames = 0
        self.head_down_frames = 0
        self.looking_away_frames = 0
        self.phone_usage_frames = 0
        
        # Evidence capture settings
        self.evidence_threshold = 0.70  # 70% confidence threshold for evidence capture (lowered for better detection)
        self.evidence_storage_path = "evidence_frames"  # Directory to store captured frames
        self._ensure_evidence_directory()
        
        # YOLO11 pose keypoint indices (17 keypoints)
        self.KEYPOINTS = {
            'nose': 0,
            'left_eye': 1, 'right_eye': 2,
            'left_ear': 3, 'right_ear': 4,
            'left_shoulder': 5, 'right_shoulder': 6,
            'left_elbow': 7, 'right_elbow': 8,
            'left_wrist': 9, 'right_wrist': 10,
            'left_hip': 11, 'right_hip': 12,
            'left_knee': 13, 'right_knee': 14,
            'left_ankle': 15, 'right_ankle': 16
        }
        
        # COCO class names for segmentation detection
        self.COCO_CLASSES = {
            67: 'cell phone',  # Mobile phone class in COCO dataset
            # Add other relevant classes if needed
            0: 'person',
            62: 'laptop',
            63: 'mouse',
            64: 'remote',
            65: 'keyboard'
        }
        
        self._initialize_models()
    
    def _ensure_evidence_directory(self):
        """Create evidence storage directory if it doesn't exist"""
        try:
            os.makedirs(self.evidence_storage_path, exist_ok=True)
            logger.info(f"📁 Evidence storage directory ready: {self.evidence_storage_path}")
        except Exception as e:
            logger.error(f"❌ Failed to create evidence directory: {str(e)}")
    
    def _save_evidence_frame(self, frame: np.ndarray, session_id: str, event_type: str, confidence: float) -> Optional[str]:
        """Save frame as evidence when confidence exceeds threshold"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            frame_id = str(uuid.uuid4())[:8]
            filename = f"evidence_{session_id}_{event_type}_{timestamp}_{frame_id}.jpg"
            filepath = os.path.join(self.evidence_storage_path, filename)
            
            # Save frame as JPEG
            cv2.imwrite(filepath, frame)
            
            logger.info(f"📸 Evidence frame saved: {filename} (confidence: {confidence:.2%})")
            return filepath
            
        except Exception as e:
            logger.error(f"❌ Failed to save evidence frame: {str(e)}")
            return None
    
    def _calculate_evidence_score(self, pose_analysis: Dict, phone_detection: Dict, suspicious_activities: List[str]) -> Tuple[float, str]:
        """Calculate overall evidence score and determine evidence level"""
        score = 0.0
        evidence_level = "low"
        
        # Phone detection scoring (highest priority)
        if phone_detection['phones_detected']:
            phone_confidence = phone_detection['phone_confidence']
            score += phone_confidence * 40  # Phone detection can contribute up to 40 points
            
        # Face detection scoring
        if not pose_analysis['person_detected']:
            score += 50  # Face absence is high priority (increased from 30)
        elif pose_analysis['num_persons'] > 1:
            score += 40  # Multiple people detected (increased from 25)
            
        # Pose-based scoring
        confidence = pose_analysis.get('confidence', 0.0)
        if pose_analysis.get('head_position') == 'head_down':
            score += confidence * 20
        if pose_analysis.get('attention_direction') in ['looking_left', 'looking_right']:
            score += confidence * 15
        if pose_analysis.get('hand_positions') == 'hand_near_face':
            score += confidence * 20
            
        # Activity-based scoring multiplier
        activity_multipliers = {
            'mobile_phone_detected': 1.5,
            'confirmed_phone_usage': 2.0,
            'prolonged_absence_detected': 1.3,
            'head_down_detected': 1.2,
            'head_turned_away': 1.1,
            'digital_device_detected': 1.4
        }
        
        for activity in suspicious_activities:
            multiplier = activity_multipliers.get(activity, 1.0)
            score *= multiplier
            
        # Cap at 100
        score = min(score, 100.0)
        
        # Determine evidence level
        if score >= 90:
            evidence_level = "critical"
        elif score >= 75:
            evidence_level = "high"
        elif score >= 50:
            evidence_level = "medium"
        else:
            evidence_level = "low"
            
        return score, evidence_level
    
    def _initialize_models(self):
        """Initialize both YOLO11 pose and segmentation models"""
        try:
            if not ULTRALYTICS_AVAILABLE:
                logger.error("❌ Ultralytics not available. Cannot initialize YOLO11 models.")
                return
            
            # Load YOLO11 pose model (will download if not exists)
            pose_model_path = "yolo11n-pose.pt"  # Nano model for speed
            logger.info(f"🤖 Loading YOLO11 pose model: {pose_model_path}")
            self.model = YOLO(pose_model_path)
            logger.info("✅ YOLO11 pose model loaded successfully")
            
            # Load YOLO11 segmentation model for phone detection
            seg_model_path = "yolo11n-seg.pt"  # Nano segmentation model
            logger.info(f"📱 Loading YOLO11 segmentation model: {seg_model_path}")
            self.seg_model = YOLO(seg_model_path)
            logger.info("✅ YOLO11 segmentation model loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize YOLO11 models: {str(e)}")
            self.model = None
            self.seg_model = None
    
    async def verify_face_from_frame(self, candidate_id: int, frame_data: str, session_id: str = None) -> Dict:
        """Analyze frame using YOLO11 pose estimation and segmentation for cheating detection"""
        try:
            if self.model is None:
                return self._get_fallback_result("YOLO11 pose model not available")
            
            # Decode frame
            frame = self._decode_frame(frame_data)
            if frame is None:
                return self._get_fallback_result("Invalid frame data")
            
            # Run YOLO11 pose estimation
            pose_results = self.model(frame, verbose=False)
            
            # Analyze pose results
            pose_analysis = self._analyze_pose_results(pose_results, frame)
            
            # Run YOLO11 segmentation for mobile phone detection
            phone_detection = self._detect_mobile_phones(frame)
            
            # Combine pose and phone detection for suspicious activities
            suspicious_activities = self._detect_suspicious_activities(pose_analysis, phone_detection)
            
            # Calculate evidence score and level
            evidence_score, evidence_level = self._calculate_evidence_score(pose_analysis, phone_detection, suspicious_activities)
            
            # Capture evidence frame if score exceeds threshold
            captured_frame_path = None
            threshold_percentage = self.evidence_threshold * 100
            
            logger.info(f"🎯 Evidence Score: {evidence_score:.1f}% | Threshold: {threshold_percentage:.1f}% | Session: {session_id}")
            
            if evidence_score >= threshold_percentage and session_id:
                # Determine primary event type for filename
                primary_event = "unknown"
                if phone_detection['phones_detected']:
                    primary_event = "mobile_phone"
                elif not pose_analysis['person_detected']:
                    primary_event = "face_absent"
                elif pose_analysis['num_persons'] > 1:
                    primary_event = "multiple_faces"
                elif suspicious_activities:
                    primary_event = suspicious_activities[0]
                
                captured_frame_path = self._save_evidence_frame(frame, session_id, primary_event, evidence_score / 100)
                
                logger.warning(f"🚨 HIGH EVIDENCE DETECTED! Score: {evidence_score:.1f}% | Event: {primary_event} | Frame saved: {captured_frame_path}")
            
            # Build comprehensive response
            result = {
                "face_detected": pose_analysis['person_detected'],
                "face_count": pose_analysis['num_persons'],
                "identity_verified": pose_analysis['num_persons'] == 1,
                "confidence": pose_analysis['confidence'],
                "suspicious_activity": suspicious_activities,
                "verification_status": "verified" if pose_analysis['num_persons'] == 1 else "not_verified",
                "message": "YOLO11 pose and segmentation analysis completed",
                "face_rectangles": pose_analysis['person_boxes'],
                "mouth_regions": pose_analysis['mouth_regions'],
                "frame_dimensions": {"width": frame.shape[1], "height": frame.shape[0]},
                "pose_keypoints": pose_analysis['keypoints'],
                "pose_analysis": {
                    "head_position": pose_analysis['head_position'],
                    "body_posture": pose_analysis['body_posture'],
                    "hand_positions": pose_analysis['hand_positions'],
                    "attention_direction": pose_analysis['attention_direction']
                },
                # Add phone detection results
                "phone_detection": {
                    "phones_detected": phone_detection['phones_detected'],
                    "phone_count": phone_detection['phone_count'],
                    "phone_confidence": phone_detection['phone_confidence'],
                    "phone_masks": phone_detection['phone_masks'],
                    "phone_boxes": phone_detection['phone_boxes']
                },
                # Add evidence capture results
                "evidence_capture": {
                    "evidence_score": round(evidence_score, 2),
                    "evidence_level": evidence_level,
                    "frame_captured": captured_frame_path is not None,
                    "captured_frame_path": captured_frame_path,
                    "threshold_exceeded": evidence_score >= threshold_percentage
                }
            }
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error in YOLO11 analysis: {str(e)}")
            return self._get_fallback_result(f"Analysis failed: {str(e)}")
    
    def _analyze_pose_results(self, results, frame: np.ndarray) -> Dict:
        """Analyze YOLO11 pose estimation results"""
        analysis = {
            'person_detected': False,
            'num_persons': 0,
            'confidence': 0.0,
            'person_boxes': [],
            'mouth_regions': [],
            'keypoints': [],
            'head_position': 'unknown',
            'body_posture': 'unknown',
            'hand_positions': 'unknown',
            'attention_direction': 'unknown'
        }
        
        if not results or len(results) == 0:
            return analysis
        
        result = results[0]  # First result
        
        if result.boxes is None or len(result.boxes) == 0:
            return analysis
        
        # Extract person detections
        boxes = result.boxes.xyxy.cpu().numpy()  # Bounding boxes
        confidences = result.boxes.conf.cpu().numpy()  # Confidence scores
        
        # Filter for person class (class 0 in COCO)
        person_indices = []
        for i, box in enumerate(boxes):
            if confidences[i] > 0.5:  # Confidence threshold
                person_indices.append(i)
        
        analysis['num_persons'] = len(person_indices)
        analysis['person_detected'] = len(person_indices) > 0
        
        if len(person_indices) > 0:
            analysis['confidence'] = float(np.mean([confidences[i] for i in person_indices]))
            
            # Convert boxes to face_rectangles format
            for i in person_indices:
                x1, y1, x2, y2 = boxes[i]
                analysis['person_boxes'].append({
                    'x': int(x1),
                    'y': int(y1),
                    'width': int(x2 - x1),
                    'height': int(y2 - y1)
                })
        
        # Analyze pose keypoints if available
        if result.keypoints is not None and len(person_indices) > 0:
            keypoints = result.keypoints.xy.cpu().numpy()  # [N, 17, 2]
            confidences_kp = result.keypoints.conf.cpu().numpy()  # [N, 17]
            
            for i, person_idx in enumerate(person_indices):
                if person_idx < len(keypoints):
                    person_keypoints = keypoints[person_idx]
                    person_kp_conf = confidences_kp[person_idx]
                    
                    # Store keypoints
                    kp_data = []
                    for j, (x, y) in enumerate(person_keypoints):
                        kp_data.append({
                            'x': float(x),
                            'y': float(y),
                            'confidence': float(person_kp_conf[j]),
                            'name': list(self.KEYPOINTS.keys())[j]
                        })
                    analysis['keypoints'].append(kp_data)
                    
                    # Analyze pose
                    pose_analysis = self._analyze_individual_pose(person_keypoints, person_kp_conf, frame.shape)
                    analysis.update(pose_analysis)
                    
                    # Calculate mouth region from face keypoints
                    mouth_region = self._calculate_mouth_region(person_keypoints, person_kp_conf)
                    if mouth_region:
                        analysis['mouth_regions'].append(mouth_region)
        
        return analysis
    
    def _analyze_individual_pose(self, keypoints: np.ndarray, confidences: np.ndarray, frame_shape: Tuple) -> Dict:
        """Analyze individual person's pose for suspicious activities"""
        frame_height, frame_width = frame_shape[:2]
        
        # Get key body points
        nose = keypoints[self.KEYPOINTS['nose']]
        left_eye = keypoints[self.KEYPOINTS['left_eye']]
        right_eye = keypoints[self.KEYPOINTS['right_eye']]
        left_shoulder = keypoints[self.KEYPOINTS['left_shoulder']]
        right_shoulder = keypoints[self.KEYPOINTS['right_shoulder']]
        left_wrist = keypoints[self.KEYPOINTS['left_wrist']]
        right_wrist = keypoints[self.KEYPOINTS['right_wrist']]
        
        # Analyze head position
        head_position = self._analyze_head_position(nose, left_eye, right_eye, confidences, frame_height)
        
        # Analyze body posture
        body_posture = self._analyze_body_posture(left_shoulder, right_shoulder, nose, confidences)
        
        # Analyze hand positions
        hand_positions = self._analyze_hand_positions(left_wrist, right_wrist, nose, confidences)
        
        # Determine attention direction
        attention_direction = self._analyze_attention_direction(nose, left_eye, right_eye, confidences, frame_width)
        
        return {
            'head_position': head_position,
            'body_posture': body_posture,
            'hand_positions': hand_positions,
            'attention_direction': attention_direction
        }
    
    def _analyze_head_position(self, nose, left_eye, right_eye, confidences, frame_height) -> str:
        """Analyze head position for head down detection"""
        nose_conf = confidences[self.KEYPOINTS['nose']]
        left_eye_conf = confidences[self.KEYPOINTS['left_eye']]
        right_eye_conf = confidences[self.KEYPOINTS['right_eye']]
        
        if nose_conf < 0.3:
            return 'not_visible'
        
        # Check if head is in lower portion of frame
        nose_y_ratio = nose[1] / frame_height
        
        if nose_y_ratio > 0.7:  # Head in lower 30% of frame
            return 'head_down'
        elif nose_y_ratio < 0.3:  # Head in upper 30% of frame
            return 'head_up'
        
        # Check eye visibility for head down detection
        if left_eye_conf < 0.2 and right_eye_conf < 0.2:
            return 'head_down'  # Eyes not visible, likely looking down
        
        return 'normal'
    
    def _analyze_body_posture(self, left_shoulder, right_shoulder, nose, confidences) -> str:
        """Analyze body posture"""
        left_shoulder_conf = confidences[self.KEYPOINTS['left_shoulder']]
        right_shoulder_conf = confidences[self.KEYPOINTS['right_shoulder']]
        nose_conf = confidences[self.KEYPOINTS['nose']]
        
        if left_shoulder_conf < 0.3 or right_shoulder_conf < 0.3:
            return 'partially_visible'
        
        # Calculate shoulder angle
        shoulder_vector = right_shoulder - left_shoulder
        shoulder_angle = np.arctan2(shoulder_vector[1], shoulder_vector[0]) * 180 / np.pi
        
        if abs(shoulder_angle) > 15:
            return 'tilted'
        
        # Check if person is leaning forward (nose below shoulder line)
        shoulder_center_y = (left_shoulder[1] + right_shoulder[1]) / 2
        if nose_conf > 0.3 and nose[1] > shoulder_center_y + 20:
            return 'leaning_forward'
        
        return 'upright'
    
    def _analyze_hand_positions(self, left_wrist, right_wrist, nose, confidences) -> str:
        """Analyze hand positions for phone usage detection"""
        left_wrist_conf = confidences[self.KEYPOINTS['left_wrist']]
        right_wrist_conf = confidences[self.KEYPOINTS['right_wrist']]
        nose_conf = confidences[self.KEYPOINTS['nose']]
        
        if left_wrist_conf < 0.3 and right_wrist_conf < 0.3:
            return 'hands_not_visible'
        
        # Check if hands are near face (phone usage pattern)
        if nose_conf > 0.3:
            if left_wrist_conf > 0.3:
                distance_left = np.linalg.norm(left_wrist - nose)
                if distance_left < 100:  # Hand near face
                    return 'hand_near_face'
            
            if right_wrist_conf > 0.3:
                distance_right = np.linalg.norm(right_wrist - nose)
                if distance_right < 100:  # Hand near face
                    return 'hand_near_face'
        
        return 'normal'
    
    def _analyze_attention_direction(self, nose, left_eye, right_eye, confidences, frame_width) -> str:
        """Analyze attention direction based on face orientation"""
        nose_conf = confidences[self.KEYPOINTS['nose']]
        left_eye_conf = confidences[self.KEYPOINTS['left_eye']]
        right_eye_conf = confidences[self.KEYPOINTS['right_eye']]
        
        if nose_conf < 0.3:
            return 'unknown'
        
        # Check face position in frame
        nose_x_ratio = nose[0] / frame_width
        
        if nose_x_ratio < 0.3:
            return 'looking_left'
        elif nose_x_ratio > 0.7:
            return 'looking_right'
        
        # Check eye symmetry for forward facing
        if left_eye_conf > 0.3 and right_eye_conf > 0.3:
            eye_center = (left_eye + right_eye) / 2
            face_center_offset = abs(nose[0] - eye_center[0])
            
            if face_center_offset < 20:  # Face is relatively centered
                return 'forward'
            elif nose[0] < eye_center[0]:
                return 'looking_left'
            else:
                return 'looking_right'
        
        return 'forward'
    
    def _calculate_mouth_region(self, keypoints: np.ndarray, confidences: np.ndarray) -> Optional[Dict]:
        """Calculate mouth region from nose position"""
        nose = keypoints[self.KEYPOINTS['nose']]
        nose_conf = confidences[self.KEYPOINTS['nose']]
        
        if nose_conf < 0.3:
            return None
        
        # Estimate mouth region based on nose position
        mouth_width = 40
        mouth_height = 25
        mouth_x = int(nose[0] - mouth_width // 2)
        mouth_y = int(nose[1] + 15)  # Mouth is below nose
        
        return {
            'x': mouth_x,
            'y': mouth_y,
            'width': mouth_width,
            'height': mouth_height
        }
    
    def _detect_mobile_phones(self, frame: np.ndarray) -> Dict:
        """Detect mobile phones using YOLO11 segmentation model"""
        phone_detection = {
            'phones_detected': False,
            'phone_count': 0,
            'phone_confidence': 0.0,
            'phone_masks': [],
            'phone_boxes': []
        }
        
        try:
            if self.seg_model is None:
                logger.warning("⚠️ YOLO11 segmentation model not available for phone detection")
                return phone_detection
            
            # Run segmentation model on frame
            seg_results = self.seg_model(frame, verbose=False)
            
            if not seg_results or len(seg_results) == 0:
                return phone_detection
            
            result = seg_results[0]  # First result
            
            if result.boxes is None or len(result.boxes) == 0:
                return phone_detection
            
            # Extract detection results
            boxes = result.boxes.xyxy.cpu().numpy()  # Bounding boxes
            confidences = result.boxes.conf.cpu().numpy()  # Confidence scores
            classes = result.boxes.cls.cpu().numpy()  # Class IDs
            
            # Filter for mobile phone detections (class 67 in COCO)
            phone_indices = []
            phone_confidences = []
            
            for i, (cls_id, conf) in enumerate(zip(classes, confidences)):
                if int(cls_id) == 67 and conf > 0.3:  # Cell phone class with confidence > 30%
                    phone_indices.append(i)
                    phone_confidences.append(conf)
            
            if len(phone_indices) > 0:
                phone_detection['phones_detected'] = True
                phone_detection['phone_count'] = len(phone_indices)
                phone_detection['phone_confidence'] = float(np.mean(phone_confidences))
                
                # Extract phone bounding boxes
                for i in phone_indices:
                    x1, y1, x2, y2 = boxes[i]
                    phone_detection['phone_boxes'].append({
                        'x': int(x1),
                        'y': int(y1),
                        'width': int(x2 - x1),
                        'height': int(y2 - y1),
                        'confidence': float(confidences[i])
                    })
                
                # Extract segmentation masks if available
                if result.masks is not None:
                    masks_data = result.masks.data.cpu().numpy()  # [N, H, W]
                    
                    for i, phone_idx in enumerate(phone_indices):
                        if phone_idx < len(masks_data):
                            mask = masks_data[phone_idx]
                            # Convert mask to polygon format for frontend
                            contours = self._mask_to_polygon(mask)
                            if contours:
                                phone_detection['phone_masks'].append({
                                    'contours': contours,
                                    'confidence': float(confidences[phone_idx])
                                })
                
                logger.info(f"📱 Detected {len(phone_indices)} mobile phone(s) with avg confidence: {phone_detection['phone_confidence']:.2f}")
            
        except Exception as e:
            logger.error(f"❌ Error in mobile phone detection: {str(e)}")
        
        return phone_detection
    
    def _mask_to_polygon(self, mask: np.ndarray) -> List[List[int]]:
        """Convert segmentation mask to polygon coordinates"""
        try:
            import cv2
            
            # Find contours in the mask
            contours, _ = cv2.findContours(
                (mask * 255).astype(np.uint8), 
                cv2.RETR_EXTERNAL, 
                cv2.CHAIN_APPROX_SIMPLE
            )
            
            if len(contours) > 0:
                # Get the largest contour
                largest_contour = max(contours, key=cv2.contourArea)
                
                # Simplify the contour to reduce points
                epsilon = 0.02 * cv2.arcLength(largest_contour, True)
                simplified_contour = cv2.approxPolyDP(largest_contour, epsilon, True)
                
                # Convert to list of [x, y] coordinates
                polygon = []
                for point in simplified_contour:
                    x, y = point[0]
                    polygon.extend([int(x), int(y)])
                
                return polygon
        except Exception as e:
            logger.error(f"❌ Error converting mask to polygon: {str(e)}")
        
        return []

    def _detect_suspicious_activities(self, pose_analysis: Dict, phone_detection: Dict) -> List[str]:
        """Detect suspicious activities combining pose and phone detection"""
        activities = []
        
        # First, get pose-based suspicious activities
        pose_activities = self._detect_suspicious_pose_activities(pose_analysis)
        activities.extend(pose_activities)
        
        # Add phone-specific suspicious activities
        if phone_detection['phones_detected']:
            activities.append("mobile_phone_detected")
            
            # Enhanced phone usage detection based on pose + phone presence
            if pose_analysis.get('hand_positions') == 'hand_near_face':
                activities.append("phone_usage_suspected")
                self.phone_usage_frames += 1
            else:
                self.phone_usage_frames = max(0, self.phone_usage_frames - 1)
            
            # Trigger alert if phone usage detected for multiple frames
            if self.phone_usage_frames >= 3:  # 3 seconds of phone usage
                activities.append("confirmed_phone_usage")
        else:
            # Reset phone usage counter when no phone detected
            self.phone_usage_frames = max(0, self.phone_usage_frames - 1)
        
        return list(set(activities))  # Remove duplicates

    def _detect_suspicious_pose_activities(self, pose_analysis: Dict) -> List[str]:
        """Detect suspicious activities based on pose analysis"""
        suspicious = []
        
        if not pose_analysis['person_detected']:
            self.head_down_frames = 0
            self.looking_away_frames = 0
            self.phone_usage_frames = 0
            return ["prolonged_absence_detected"]
        
        # Head down detection
        if pose_analysis['head_position'] == 'head_down':
            self.head_down_frames += 1
            if self.head_down_frames >= DetectionConfig.HEAD_DOWN_THRESHOLD_FRAMES:
                suspicious.append("head_down_detected")
                print(f"🔍 [YOLO11] Head Down Detected: {self.head_down_frames} frames")
        else:
            self.head_down_frames = 0
        
        # Looking away detection
        if pose_analysis['attention_direction'] in ['looking_left', 'looking_right']:
            self.looking_away_frames += 1
            if self.looking_away_frames >= 3:  # 3 seconds
                suspicious.append("head_turned_away")
                print(f"👀 [YOLO11] Looking Away Detected: {pose_analysis['attention_direction']}")
        else:
            self.looking_away_frames = 0
        
        # Phone usage detection
        if pose_analysis['hand_positions'] == 'hand_near_face':
            self.phone_usage_frames += 1
            if self.phone_usage_frames >= 2:  # 2 seconds
                suspicious.append("digital_device_detected")
                print(f"📱 [YOLO11] Possible Phone Usage Detected")
        else:
            self.phone_usage_frames = 0
        
        # Talking detection (based on hand near face)
        if pose_analysis['hand_positions'] == 'hand_near_face' and pose_analysis['head_position'] == 'normal':
            suspicious.append("talking_detected")
            print(f"🗣️ [YOLO11] Talking Detected (hand near face)")
        
        return suspicious
    
    def _decode_frame(self, frame_data: str) -> Optional[np.ndarray]:
        """Decode base64 frame data to OpenCV format"""
        try:
            if frame_data.startswith('data:image'):
                frame_data = frame_data.split(',')[1]
            
            image_data = base64.b64decode(frame_data)
            pil_image = Image.open(io.BytesIO(image_data))
            opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            return opencv_image
            
        except Exception as e:
            logger.error(f"❌ Error decoding frame: {str(e)}")
            return None
    
    def _get_fallback_result(self, error_message: str) -> Dict:
        """Return fallback result when YOLO11 is not available"""
        return {
            "face_detected": False,
            "face_count": 0,
            "identity_verified": False,
            "confidence": 0.0,
            "suspicious_activity": ["yolo11_unavailable"],
            "verification_status": "error",
            "message": error_message,
            "face_rectangles": [],
            "mouth_regions": [],
            "frame_dimensions": {"width": 640, "height": 480},
            "pose_keypoints": [],
            "pose_analysis": {
                "head_position": "unknown",
                "body_posture": "unknown", 
                "hand_positions": "unknown",
                "attention_direction": "unknown"
            }
        }

# Create singleton instance
yolo11_pose_service = YOLO11PoseDetectionService() 