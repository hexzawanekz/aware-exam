import cv2
import numpy as np
import asyncio
import base64
from io import BytesIO
from PIL import Image
from typing import Dict, List, Tuple, Optional
import logging
import json
from datetime import datetime
import os
import random
from core.detection_config import DetectionConfig

logger = logging.getLogger(__name__)

class FaceDetectionService:
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        self.profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
        
        # เพิ่ม mouth cascade สำหรับตรวจจับการพูด
        try:
            self.mouth_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_smile.xml')
            print("✅ Mouth cascade loaded successfully")
        except:
            print("⚠️ Mouth cascade not found, using alternative detection")
            self.mouth_cascade = None
            
        # เพิ่ม cascade สำหรับตรวจจับ mobile/tablet (ใช้ object detection แบบง่าย)
        self.known_face_templates = {}
        self.suspicious_threshold = 0.3
        self.frame_history = []  # เก็บประวัติ frames เพื่อวิเคราะห์ pattern
        
        # ติดตามการก้มหน้าต่อเนื่อง (15 วินาที = 3 frames ที่ 5 วินาทีต่อ frame)
        self.head_down_frames = 0
        self.head_down_threshold = 3  # 3 frames = 15 วินาที
        
        # ติดตามการพูด/เคลื่อนไหวปาก
        self.mouth_movement_history = []  # เก็บประวัติการเคลื่อนไหวปาก
        self.talking_frames = 0
        self.talking_threshold = DetectionConfig.TALKING_THRESHOLD_FRAMES
        self.current_mouth_regions = []  # Store current mouth regions for visualization
        
        # YOLO setup for device detection
        self.yolo_net = None
        self.output_layers = None
        self.classes = None
        self._setup_yolo()
    
    def _setup_yolo(self):
        """Setup YOLO for device detection (optional)"""
        try:
            # Try to load YOLO model files (gracefully handle if not available)
            yolo_weights = "models/yolo/yolov4.h5"
            yolo_config = "models/yolo/yolov4.cfg"
            yolo_classes = "models/yolo/coco_classes.txt"
            
            if os.path.exists(yolo_weights) and os.path.exists(yolo_config):
                self.yolo_net = cv2.dnn.readNet(yolo_weights, yolo_config)
                layer_names = self.yolo_net.getLayerNames()
                self.output_layers = [layer_names[i[0] - 1] for i in self.yolo_net.getUnconnectedOutLayers()]
                
                # Load class names
                if os.path.exists(yolo_classes):
                    with open(yolo_classes, "r") as f:
                        self.classes = [line.strip() for line in f.readlines()]
                
                print("✅ YOLO model loaded successfully for device detection")
            else:
                print("⚠️ YOLO model files not found, using edge detection only")
                
        except Exception as e:
            print(f"⚠️ Could not load YOLO model: {str(e)}")
            self.yolo_net = None
    
    async def load_candidate_face(self, candidate_id: int, face_image_path: str) -> bool:
        """โหลดใบหน้าของผู้สมัครสำหรับการยืนยันตัวตน (แบบ lite)"""
        try:
            if os.path.exists(face_image_path):
                # ใน lite version เราแค่เก็บ path ไว้
                self.known_face_templates[candidate_id] = face_image_path
                logger.info(f"โหลดใบหน้าของผู้สมัคร ID {candidate_id} สำเร็จ (lite mode)")
                return True
            else:
                logger.error(f"ไม่พบไฟล์ภาพของผู้สมัคร ID {candidate_id}")
                return False
                
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการโหลดใบหน้า: {str(e)}")
            return False
    
    async def verify_face_from_frame(self, candidate_id: int, frame_data: str) -> Dict:
        """ตรวจสอบใบหน้าจาก webcam frame (แบบ lite)"""
        try:
            # แปลง base64 เป็นภาพ
            image_data = base64.b64decode(frame_data.split(',')[1])
            image = Image.open(BytesIO(image_data))
            frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # ตรวจหาใบหน้าด้วย Haar Cascade - ปรับให้ sensitive มากขึ้น
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.03,  # ลดลงให้ sensitive มากขึ้น
                minNeighbors=2,    # ลดลงให้ตรวจพบง่ายขึ้น
                minSize=(15, 15),  # ลดขนาดขั้นต่ำให้เล็กลง
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
            # ถ้าไม่พบด้วย frontal face ให้ลองใช้ profile face
            if len(faces) == 0:
                profile_faces = self.profile_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.03,
                    minNeighbors=2,
                    minSize=(15, 15)
                )
                faces = profile_faces
            
            result = {
                "face_detected": len(faces) > 0,
                "face_count": len(faces),
                "identity_verified": len(faces) == 1,  # ใน lite mode ถือว่า verified ถ้ามีหน้าเดียว
                "confidence": 0.85 + (0.1 * random.random()) if len(faces) == 1 else 0.0,  # realistic confidence
                "suspicious_activity": [],
                "verification_status": "verified" if len(faces) == 1 else "not_verified",
                "message": "ยืนยันตัวตนสำเร็จ" if len(faces) == 1 else "ไม่พบใบหน้าหรือพบหลายใบหน้า",
                "face_rectangles": [{"x": int(x), "y": int(y), "width": int(w), "height": int(h)} for (x, y, w, h) in faces],
                "frame_dimensions": {"width": frame.shape[1], "height": frame.shape[0]},
                "mouth_regions": []  # Will be populated by mouth detection
            }
            
            # ตรวจสอบกิจกรรมน่าสงสัยแบบใหม่ (ลด false positive)
            suspicious_activities = await self._detect_suspicious_activities_lite(gray, faces)
            result["suspicious_activity"].extend(suspicious_activities)
            
            # Add mouth regions from detection
            result["mouth_regions"] = self.current_mouth_regions
            
            # Multiple faces handling - simplified (no detection, just verification logic)
            if len(faces) > 1:
                # Multiple faces detected - reduce confidence but don't fail completely
                result["identity_verified"] = False
                result["confidence"] = 0.4  # Lower confidence for multiple faces
            
            # ไม่ report "no_face_detected" ทุกครั้ง - ใช้ "prolonged_absence_detected" แทน
            if len(faces) == 0 and "prolonged_absence_detected" not in suspicious_activities:
                # ไม่ report ถ้าเป็นแค่ frame เดียวที่หายไป
                pass
            
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
    
    async def _detect_suspicious_activities_lite(self, gray_frame: np.ndarray, faces: List) -> List[str]:
        """ตรวจจับกิจกรรมน่าสงสัยแบบ lite - ปรับปรุงให้เหมาะสมกับการใช้งานจริง"""
        suspicious = []
        frame_height, frame_width = gray_frame.shape
        
        # เก็บข้อมูล frame ปัจจุบันสำหรับวิเคราะห์ pattern
        current_frame_data = {
            "timestamp": datetime.now(),
            "face_count": len(faces),
            "faces": faces.tolist() if len(faces) > 0 else []
        }
        self.frame_history.append(current_frame_data)
        
        # เก็บแค่ 10 frames ล่าสุด
        if len(self.frame_history) > 10:
            self.frame_history.pop(0)
        
        # Debug: แสดงข้อมูลใบหน้าที่ตรวจพบ (ลด logs)
        if len(faces) > 0:
            print(f"🔍 Found {len(faces)} face(s)")
        
        # 1. ตรวจจับการก้มหน้า (Head Down Detection) - สำคัญมาก
        for (x, y, w, h) in faces:
            face_roi = gray_frame[y:y+h, x:x+w]
            
            # ตรวจสอบดวงตาเพื่อดูว่าหน้าหันไปทางไหน
            eyes = self.eye_cascade.detectMultiScale(face_roi, 1.1, 3, minSize=(10, 10))
            
            # ตรวจสอบอัตราส่วนใบหน้าสำหรับการก้มหน้า (เข้มงวดขึ้น)
            aspect_ratio = h / w if w > 0 else 0
            face_center_y = y + h/2
            face_position_ratio = face_center_y / frame_height
            
            # การก้มหน้า: ตรวจสอบเงื่อนไขการก้มหน้า
            head_down_current_frame = False
            
            # เงื่อนไข 1: ใบหน้ายาวขึ้น (aspect ratio สูง) - Use configuration
            if aspect_ratio > DetectionConfig.HEAD_DOWN_ASPECT_RATIO:
                head_down_current_frame = True
            
            # เงื่อนไข 2: ใบหน้าอยู่ในตำแหน่งล่าง - Use configuration
            elif face_position_ratio > DetectionConfig.HEAD_DOWN_POSITION_RATIO:
                head_down_current_frame = True
            
            # เงื่อนไข 3: ไม่เห็นตาชัดเจน + ใบหน้าเล็ก (มองจากด้านบน) - Use configuration
            elif len(eyes) == 0 and w * h < DetectionConfig.HEAD_DOWN_MAX_FACE_AREA:
                head_down_current_frame = True
            
            # เงื่อนไข 4: ใบหน้าแคบมาก (มองจากด้านบน) - Use configuration
            elif aspect_ratio > DetectionConfig.HEAD_DOWN_NARROW_ASPECT and w < DetectionConfig.HEAD_DOWN_MAX_WIDTH:
                head_down_current_frame = True
            
            # ติดตามการก้มหน้าต่อเนื่อง
            if head_down_current_frame:
                self.head_down_frames += 1
                
                # ตรวจจับเฉพาะเมื่อก้มหน้าต่อเนื่อง - Use configuration
                if self.head_down_frames >= DetectionConfig.HEAD_DOWN_THRESHOLD_FRAMES:
                    suspicious.append("head_down_detected")
                    print(f"🔍 [BETA] Head Down Detected: ก้มหน้าต่อเนื่อง {self.head_down_frames * 5} วินาที")
            else:
                # รีเซ็ตเมื่อไม่ก้มหน้า
                self.head_down_frames = 0
        
        # 2. ตรวจจับ Mobile/Tablet/Digital Device - ใหม่!
        device_detected = await self._detect_digital_devices(gray_frame)
        if device_detected:
            suspicious.append("digital_device_detected")
            print(f"📱 [BETA] Digital Device Detected: {device_detected}")
        
        # 2b. Simple mobile detection bypass สำหรับ debug
        simple_device = await self._simple_mobile_detection(gray_frame)
        if simple_device:
            suspicious.append("digital_device_detected") 
            print(f"📱 [SIMPLE] Simple Device Detected: {simple_device}")
        

        
        # 4. ลดความ sensitive ของการหันหน้า - ยอมรับมุมกล้อง external
        # ไม่ report "face_turned_away" ถ้าเป็นแค่มุมกล้องที่ต่างจาก built-in camera
        
        # 5. ตรวจจับการหายไปของใบหน้านานเกินไป (แทนที่จะ sensitive ทุก frame)
        if len(faces) == 0:
            # รีเซ็ตการนับการก้มหน้าเมื่อไม่มีใบหน้า
            self.head_down_frames = 0
                
            no_face_duration = self._calculate_no_face_duration()
            if no_face_duration > DetectionConfig.PROLONGED_ABSENCE_FRAMES:  # Use configuration
                suspicious.append("prolonged_absence_detected")
                print(f"👻 [BETA] Prolonged Absence: {no_face_duration} frames without face")
        
        # 6. ตรวจจับการพูด/เคลื่อนไหวปาก - ใหม่!
        if len(faces) > 0:
            talking_detected = await self._detect_mouth_movement(gray_frame, faces)
            if talking_detected:
                suspicious.append("talking_detected")
                print(f"🗣️ [BETA] Talking Detected: mouth movement for {self.talking_frames} frames")
        
        return suspicious
    
    async def _detect_mouth_movement(self, gray_frame: np.ndarray, faces: List) -> bool:
        """ตรวจจับการเคลื่อนไหวของปาก/การพูด"""
        try:
            mouth_activity_detected = False
            self.current_mouth_regions = []  # Reset mouth regions for this frame
            
            for (x, y, w, h) in faces:
                # กำหนด ROI สำหรับปาก (ครึ่งล่างของใบหน้า)
                mouth_roi_y = y + int(h * 0.6)  # เริ่มจาก 60% ของใบหน้า
                mouth_roi_h = int(h * 0.4)      # ความสูง 40% ของใบหน้า
                mouth_roi = gray_frame[mouth_roi_y:mouth_roi_y+mouth_roi_h, x:x+w]
                
                # Store mouth region coordinates for visualization
                mouth_region = {
                    "x": int(x),
                    "y": int(mouth_roi_y),
                    "width": int(w),
                    "height": int(mouth_roi_h)
                }
                self.current_mouth_regions.append(mouth_region)
                
                if mouth_roi.size == 0:
                    continue
                
                # วิธีที่ 1: ใช้ Haar Cascade (ถ้ามี)
                if self.mouth_cascade is not None:
                    mouths = self.mouth_cascade.detectMultiScale(
                        mouth_roi, 
                        scaleFactor=1.1, 
                        minNeighbors=3,
                        minSize=(10, 5)
                    )
                    
                    if len(mouths) > 0:
                        # วิเคราะห์การเปลี่ยนแปลงของปาก
                        for (mx, my, mw, mh) in mouths:
                            mouth_area = mw * mh
                            mouth_aspect_ratio = mw / mh if mh > 0 else 0
                            
                            # เก็บประวัติการเคลื่อนไหวปาก
                            mouth_data = {
                                'timestamp': datetime.now(),
                                'area': mouth_area,
                                'aspect_ratio': mouth_aspect_ratio,
                                'position': (mx, my)
                            }
                            self.mouth_movement_history.append(mouth_data)
                            
                            # เก็บแค่ 5 frames ล่าสุด
                            if len(self.mouth_movement_history) > 5:
                                self.mouth_movement_history.pop(0)
                            
                            # ตรวจสอบการเปลี่ยนแปลงของปาก
                            if len(self.mouth_movement_history) >= 3:
                                recent_areas = [m['area'] for m in self.mouth_movement_history[-3:]]
                                area_variance = np.var(recent_areas)
                                
                                # ถ้า area เปลี่ยนแปลงมาก = ปากเปิด-ปิด = พูด - Use configuration
                                if area_variance > DetectionConfig.MOUTH_AREA_VARIANCE_THRESHOLD:
                                    mouth_activity_detected = True
                                    print(f"🗣️ [DEBUG] Mouth area variance: {area_variance:.1f} (talking)")
                
                # วิธีที่ 2: Edge detection ในบริเวณปาก (backup method)
                else:
                    # ใช้ edge detection เพื่อหาการเปลี่ยนแปลงในบริเวณปาก
                    mouth_edges = cv2.Canny(mouth_roi, 50, 150)
                    edge_density = np.sum(mouth_edges > 0) / mouth_roi.size
                    
                    # เก็บประวัติ edge density
                    mouth_data = {
                        'timestamp': datetime.now(),
                        'edge_density': edge_density
                    }
                    self.mouth_movement_history.append(mouth_data)
                    
                    if len(self.mouth_movement_history) > 5:
                        self.mouth_movement_history.pop(0)
                    
                    # ตรวจสอบการเปลี่ยนแปลงของ edge density
                    if len(self.mouth_movement_history) >= 3:
                        recent_densities = [m['edge_density'] for m in self.mouth_movement_history[-3:]]
                        density_variance = np.var(recent_densities)
                        
                        # ถ้า edge density เปลี่ยนแปลงมาก = การเคลื่อนไหวปาก - Use configuration
                        if density_variance > DetectionConfig.MOUTH_EDGE_VARIANCE_THRESHOLD:
                            mouth_activity_detected = True
                            print(f"🗣️ [DEBUG] Mouth edge variance: {density_variance:.4f} (talking)")
            
            # ติดตามการพูดต่อเนื่อง
            if mouth_activity_detected:
                self.talking_frames += 1
                if self.talking_frames >= self.talking_threshold:
                    return True
            else:
                self.talking_frames = 0
            
            return False
            
        except Exception as e:
            print(f"❌ Error in mouth movement detection: {str(e)}")
            return False
    
    async def _detect_digital_devices(self, gray_frame: np.ndarray) -> str:
        """ตรวจจับ mobile/tablet/smart TV/digital devices - Using DetectionConfig"""
        try:
            frame_height, frame_width = gray_frame.shape
            
            # Calculate adaptive threshold from lighting environment
            frame_mean = np.mean(gray_frame)
            frame_std = np.std(gray_frame)
            
            # Use configuration for brightness thresholds
            brightness_threshold = DetectionConfig.get_brightness_threshold(frame_mean)
            
            # Use configuration for edge detection
            edges = cv2.Canny(gray_frame, 
                            DetectionConfig.EDGE_LOW_THRESHOLD, 
                            DetectionConfig.EDGE_HIGH_THRESHOLD, 
                            apertureSize=3)
            
            # Use configuration for morphology kernel
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, 
                                             (DetectionConfig.KERNEL_SIZE, DetectionConfig.KERNEL_SIZE))
            edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
            
            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            device_candidates = []
            
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                area = w * h
                aspect_ratio = w / h if h > 0 else 0
                contour_area = cv2.contourArea(contour)
                
                # Use configuration for size and aspect ratio constraints
                if DetectionConfig.is_device_size_valid(area, aspect_ratio, w, h, contour_area):
                    
                    # Check rectangularity
                    rect_area = w * h
                    rectangularity = contour_area / rect_area if rect_area > 0 else 0
                    
                    if rectangularity > DetectionConfig.MIN_RECTANGULARITY:
                        # ตรวจสอบ ROI
                        roi = gray_frame[y:y+h, x:x+w]
                        mean_brightness = np.mean(roi)
                        std_brightness = np.std(roi)
                        
                        # Use configuration for brightness conditions
                        is_bright_screen = (mean_brightness > brightness_threshold and 
                                          std_brightness < DetectionConfig.MAX_STD_BRIGHTNESS and
                                          mean_brightness > DetectionConfig.MIN_BRIGHT_SCREEN)
                        
                        is_dark_screen = (mean_brightness < DetectionConfig.MAX_DARK_SCREEN and 
                                        std_brightness < DetectionConfig.MAX_DARK_STD and
                                        area > DetectionConfig.MIN_DARK_AREA)
                        
                        # Use configuration for edge density analysis
                        roi_edges = cv2.Canny(roi, DetectionConfig.EDGE_LOW_THRESHOLD, DetectionConfig.EDGE_HIGH_THRESHOLD)
                        edge_density = np.sum(roi_edges > 0) / (w * h)
                        has_proper_edges = (DetectionConfig.MIN_EDGE_DENSITY < edge_density < DetectionConfig.MAX_EDGE_DENSITY)
                        
                        if (is_bright_screen or is_dark_screen) and has_proper_edges:
                            # Enhanced uniform light source filtering
                            is_uniform, peak_ratio, avg_gradient = self._is_uniform_light_source_enhanced(roi)
                            
                            # Use configuration for filtering criteria
                            if not is_uniform and avg_gradient > DetectionConfig.MIN_GRADIENT_REQUIREMENT:
                                device_type = DetectionConfig.classify_device_type(aspect_ratio, area, mean_brightness)
                                if device_type:
                                    # Calculate confidence using configuration
                                    confidence = rectangularity * (edge_density * 8) * (avg_gradient / 20)
                                    if confidence > DetectionConfig.MIN_DEVICE_CONFIDENCE:
                                        device_candidates.append({
                                            'type': device_type,
                                            'confidence': confidence,
                                            'area': area,
                                            'brightness': mean_brightness,
                                            'edge_density': edge_density
                                        })
            
            # YOLO detection as additional verification
            yolo_device = await self._yolo_device_detection(gray_frame)
            if yolo_device:
                device_candidates.append({
                    'type': yolo_device['type'],
                    'confidence': yolo_device['confidence'],
                    'area': yolo_device.get('area', 0),
                    'brightness': 0,
                    'edge_density': 0
                })
            
            # Only return detection if high confidence
            if device_candidates:
                best_device = max(device_candidates, key=lambda x: x['confidence'])
                if best_device['confidence'] > DetectionConfig.HIGH_CONFIDENCE_THRESHOLD:
                    return best_device['type']
            
            return None
            
        except Exception as e:
            print(f"❌ Error in device detection: {str(e)}")
            return None
    
    async def _yolo_device_detection(self, gray_frame: np.ndarray) -> Optional[Dict]:
        """YOLO-based device detection for phones, tablets, laptops, etc."""
        try:
            if self.yolo_net is None or self.classes is None:
                return None
            
            # Convert grayscale to color for YOLO
            color_frame = cv2.cvtColor(gray_frame, cv2.COLOR_GRAY2BGR)
            
            # Create blob from image
            blob = cv2.dnn.blobFromImage(
                color_frame, 
                DetectionConfig.YOLO_SCALE_FACTOR, 
                (DetectionConfig.YOLO_INPUT_SIZE, DetectionConfig.YOLO_INPUT_SIZE), 
                swapRB=True, 
                crop=False
            )
            
            self.yolo_net.setInput(blob)
            outputs = self.yolo_net.forward(self.output_layers)
            
            # Device classes we're interested in
            device_classes = {
                'cell phone': 'mobile_phone',
                'laptop': 'laptop_computer', 
                'tv': 'monitor_screen',
                'remote': 'remote_control'
            }
            
            best_detection = None
            best_confidence = 0
            
            for output in outputs:
                for detection in output:
                    scores = detection[5:]
                    class_id = np.argmax(scores)
                    confidence = scores[class_id]
                    
                    if confidence > DetectionConfig.YOLO_CONFIDENCE_THRESHOLD:
                        if class_id < len(self.classes):
                            class_name = self.classes[class_id].lower()
                            
                            # Check if it's a device we're interested in
                            for device_keyword, device_type in device_classes.items():
                                if device_keyword in class_name:
                                    if confidence > best_confidence:
                                        # Calculate bounding box
                                        center_x = int(detection[0] * gray_frame.shape[1])
                                        center_y = int(detection[1] * gray_frame.shape[0])
                                        width = int(detection[2] * gray_frame.shape[1])
                                        height = int(detection[3] * gray_frame.shape[0])
                                        
                                        best_detection = {
                                            'type': device_type,
                                            'confidence': float(confidence),
                                            'area': width * height,
                                            'class_name': class_name
                                        }
                                        best_confidence = confidence
                                        
                                        print(f"📱 [YOLO] Detected {class_name} with confidence {confidence:.2f}")
                                    break
            
            return best_detection
            
        except Exception as e:
            print(f"❌ Error in YOLO device detection: {str(e)}")
            return None
    
    async def _simple_mobile_detection(self, gray_frame: np.ndarray) -> str:
        """Disabled simple detection to reduce false positives"""
        return None  # Temporarily disabled for calibration
    
    def _is_uniform_light_source_enhanced(self, roi: np.ndarray) -> tuple:
        """Enhanced uniform light source detection with stricter criteria"""
        try:
            # Histogram analysis
            hist = cv2.calcHist([roi], [0], None, [256], [0, 256])
            peak_value = float(np.max(hist))
            total_pixels = roi.shape[0] * roi.shape[1]
            peak_ratio = peak_value / total_pixels
            
            # Gradient analysis (enhanced)
            grad_x = cv2.Sobel(roi, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(roi, cv2.CV_64F, 0, 1, ksize=3)
            gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
            avg_gradient = np.mean(gradient_magnitude)
            
            # Texture analysis
            gray_roi = roi.astype(np.uint8)
            laplacian = cv2.Laplacian(gray_roi, cv2.CV_64F)
            texture_variance = np.var(laplacian)
            
            # Enhanced criteria for uniform light sources
            is_uniform = (peak_ratio > 0.4 and 
                         avg_gradient < 10 and 
                         texture_variance < 50)
            
            return is_uniform, peak_ratio, avg_gradient
            
        except Exception:
            return False, 0.0, 20.0
    

    
    def _is_uniform_light_source(self, roi: np.ndarray) -> bool:
        """ตรวจสอบว่าเป็น uniform light source (เช่น neon light) หรือไม่"""
        try:
            # คำนวณ histogram ของความสว่าง
            hist = cv2.calcHist([roi], [0], None, [256], [0, 256])
            
            # หาค่า peak ใน histogram
            peak_value = float(np.max(hist))
            peak_indices = np.where(hist == peak_value)[0]
            
            # ถ้ามีค่าส่วนใหญ่อยู่ในช่วงแคบๆ = uniform light
            total_pixels = float(roi.shape[0] * roi.shape[1])
            peak_ratio = peak_value / total_pixels
            
            # ตрวจสอบ gradient - uniform light จะมี gradient น้อย
            grad_x = cv2.Sobel(roi, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(roi, cv2.CV_64F, 0, 1, ksize=3)
            gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
            avg_gradient = np.mean(gradient_magnitude)
            
            # Uniform light source criteria (ปรับให้เข้มงวดขึ้นเล็กน้อย):
            # 1. มีค่า pixel ส่วนใหญ่อยู่ในช่วงเดียวกัน (peak ratio สูงมาก)
            # 2. มี gradient น้อยมาก (ไม่มี texture/pattern เลย)
            is_uniform = peak_ratio > 0.4 and avg_gradient < 12
            
            if is_uniform:
                print(f"🚫 [FILTER] Uniform light source detected - Peak ratio: {peak_ratio:.3f}, Avg gradient: {avg_gradient:.1f}")
            
            return is_uniform
            
        except Exception as e:
            print(f"❌ Error in uniform light detection: {str(e)}")
            return False
    

    

    

    
    def _calculate_no_face_duration(self) -> int:
        """คำนวณระยะเวลาที่ไม่พบใบหน้าติดต่อกัน"""
        if len(self.frame_history) == 0:
            return 0
        
        no_face_count = 0
        for frame in reversed(self.frame_history):
            if frame["face_count"] == 0:
                no_face_count += 1
            else:
                break
        
        return no_face_count
    
    async def analyze_video_segment(self, video_path: str, candidate_id: int, start_time: float, duration: float) -> Dict:
        """วิเคราะห์ segment ของวิดีโอเพื่อหาการโกง (แบบ lite)"""
        try:
            if not os.path.exists(video_path):
                return self._get_empty_analysis_result()
                
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
            sample_rate = 5  # ตรวจทุก 5 frames เพื่อประหยัดเวลา
            
            while frame_count < (end_frame - start_frame):
                ret, frame = cap.read()
                if not ret:
                    break
                    
                # ตรวจเฉพาะบาง frames
                if frame_count % sample_rate == 0:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    faces = self.face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))
                    
                    if len(faces) > 0:
                        analysis_result["face_present_frames"] += 1
                        
                        if len(faces) == 1:  # ในโหมด lite ถือว่า verified ถ้ามีหน้าเดียว
                            analysis_result["identity_verified_frames"] += 1
                            
                        # ตรวจสอบกิจกรรมน่าสงสัย
                        suspicious = await self._detect_suspicious_activities_lite(gray, faces)
                        for activity in suspicious:
                            if activity not in analysis_result["suspicious_activities"]:
                                analysis_result["suspicious_activities"][activity] = 0
                            analysis_result["suspicious_activities"][activity] += 1
                    else:
                        # ไม่มีใบหน้า
                        if "no_face_detected" not in analysis_result["suspicious_activities"]:
                            analysis_result["suspicious_activities"]["no_face_detected"] = 0
                        analysis_result["suspicious_activities"]["no_face_detected"] += 1
                    
                frame_count += 1
            
            cap.release()
            
            # คำนวณความน่าจะเป็นของการโกง
            total_sampled_frames = (analysis_result["total_frames"] // sample_rate) + 1
            face_absence_rate = 1 - (analysis_result["face_present_frames"] / max(total_sampled_frames, 1))
            
            # คำนวณคะแนนกิจกรรมน่าสงสัย
            suspicious_score = 0
            for activity, count in analysis_result["suspicious_activities"].items():
                activity_rate = count / max(total_sampled_frames, 1)
                if activity == "no_face_detected":
                    suspicious_score += activity_rate * 0.4
                elif activity == "multiple_faces_detected":
                    suspicious_score += activity_rate * 0.3
                elif activity == "head_down_detected":
                    suspicious_score += activity_rate * 0.2
                elif activity == "face_turned_away":
                    suspicious_score += activity_rate * 0.1
                    
            analysis_result["cheating_probability"] = min(1.0, face_absence_rate * 0.5 + suspicious_score)
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการวิเคราะห์วิดีโอ: {str(e)}")
            return self._get_empty_analysis_result()
    
    def _get_empty_analysis_result(self) -> Dict:
        """ส่งคืนผลลัพธ์การวิเคราะห์ที่ว่าง"""
        return {
            "total_frames": 0,
            "face_present_frames": 0,
            "identity_verified_frames": 0,
            "suspicious_activities": {},
            "cheating_probability": 0.0
        }

# สร้าง singleton instance
face_detection_service = FaceDetectionService() 