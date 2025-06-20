#!/usr/bin/env python3
"""
Debug script for testing digital device detection sensitivity
Use this to test and adjust detection parameters with your webcam
"""

import cv2
import numpy as np
import sys
import os

class DeviceDetectionDebugger:
    def __init__(self):
        self.cap = cv2.VideoCapture(0)  # Use default camera
        if not self.cap.isOpened():
            print("❌ Cannot open camera")
            sys.exit(1)
        
        print("🎥 Camera opened successfully")
        print("📱 Digital Device Detection Debugger")
        print("Press 'q' to quit, 's' to save current frame")
        print("Press '1', '2', '3' to adjust sensitivity levels")
        
        # Detection sensitivity levels (updated with balanced parameters)
        self.sensitivity_level = 2  # Default: medium
        self.sensitivity_configs = {
            1: {"name": "Low (Strict)", "brightness_offset": 35, "edge_threshold": [60, 180], "area_min": 5000},
            2: {"name": "Medium", "brightness_offset": 25, "edge_threshold": [50, 150], "area_min": 3000},
            3: {"name": "High (Sensitive)", "brightness_offset": 20, "edge_threshold": [40, 120], "area_min": 2000}
        }
    
    def _is_uniform_light_source(self, roi: np.ndarray) -> tuple:
        """ตรวจสอบว่าเป็น uniform light source (เช่น neon light) หรือไม่"""
        try:
            # คำนวณ histogram ของความสว่าง
            hist = cv2.calcHist([roi], [0], None, [256], [0, 256])
            
            # หาค่า peak ใน histogram
            peak_value = np.max(hist)
            
            # ถ้ามีค่าส่วนใหญ่อยู่ในช่วงแคบๆ = uniform light
            total_pixels = roi.shape[0] * roi.shape[1]
            peak_ratio = peak_value / total_pixels
            
            # ตรวจสอบ gradient - uniform light จะมี gradient น้อย
            grad_x = cv2.Sobel(roi, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(roi, cv2.CV_64F, 0, 1, ksize=3)
            gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
            avg_gradient = np.mean(gradient_magnitude)
            
            # Uniform light source criteria (ปรับให้เข้มงวดขึ้นเล็กน้อย)
            is_uniform = peak_ratio > 0.4 and avg_gradient < 12
            
            return is_uniform, peak_ratio, avg_gradient
            
        except Exception as e:
            print(f"❌ Error in uniform light detection: {str(e)}")
            return False, 0, 0
    
    def detect_digital_devices_debug(self, gray_frame: np.ndarray) -> tuple:
        """ตรวจจับ digital devices พร้อม debug info"""
        try:
            frame_height, frame_width = gray_frame.shape
            config = self.sensitivity_configs[self.sensitivity_level]
            
            # คำนวณ adaptive threshold จาก lighting environment
            frame_mean = np.mean(gray_frame)
            frame_std = np.std(gray_frame)
            
            # ปรับ threshold ตาม lighting conditions
            if frame_mean > 100:  # สภาพแสงสว่าง
                brightness_threshold = max(frame_mean + config["brightness_offset"], 140)
            else:  # สภาพแสงปกติ/มืด
                brightness_threshold = max(frame_mean + config["brightness_offset"] - 10, 110)
            
            # Edge Detection
            edges = cv2.Canny(gray_frame, config["edge_threshold"][0], config["edge_threshold"][1], apertureSize=3)
            
            # Template matching
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
            
            # หา contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            device_candidates = []
            debug_info = {
                "frame_stats": {"mean": frame_mean, "std": frame_std, "threshold": brightness_threshold},
                "contours_found": len(contours),
                "candidates_analyzed": 0,
                "filtered_by_uniform_light": 0
            }
            
            for i, contour in enumerate(contours):
                x, y, w, h = cv2.boundingRect(contour)
                area = w * h
                aspect_ratio = w / h if h > 0 else 0
                contour_area = cv2.contourArea(contour)
                
                # เงื่อนไขขนาดและรูปร่าง
                if (area > config["area_min"] and area < 60000 and
                    0.4 < aspect_ratio < 2.5 and
                    w > 50 and h > 50 and
                    contour_area > 3000):
                    
                    debug_info["candidates_analyzed"] += 1
                    
                    # ตรวจสอบความเป็น rectangle
                    rect_area = w * h
                    rectangularity = contour_area / rect_area if rect_area > 0 else 0
                    
                    if rectangularity > 0.75:
                        # ตรวจสอบ ROI
                        roi = gray_frame[y:y+h, x:x+w]
                        mean_brightness = np.mean(roi)
                        std_brightness = np.std(roi)
                        
                        # เงื่อนไขการตรวจจับ
                        is_bright_screen = mean_brightness > brightness_threshold and std_brightness < 40
                        is_uniform_dark_screen = mean_brightness < 30 and std_brightness < 15
                        
                        # ตรวจสอบ edge density
                        roi_edges = cv2.Canny(roi, 50, 150)
                        edge_density = np.sum(roi_edges > 0) / (w * h)
                        has_screen_edges = 0.02 < edge_density < 0.3
                        
                        # ตรวจสอบ uniform light source
                        is_uniform, peak_ratio, avg_gradient = self._is_uniform_light_source(roi)
                        if is_uniform:
                            debug_info["filtered_by_uniform_light"] += 1
                        
                        if (is_bright_screen or is_uniform_dark_screen) and has_screen_edges and not is_uniform:
                            confidence = rectangularity * (edge_density * 10)
                            if confidence > 0.15:
                                device_candidates.append({
                                    'bbox': (x, y, w, h),
                                    'type': self._classify_device_type(aspect_ratio, area, mean_brightness),
                                    'confidence': confidence,
                                    'area': area,
                                    'brightness': mean_brightness,
                                    'edge_density': edge_density,
                                    'rectangularity': rectangularity,
                                    'is_uniform': is_uniform,
                                    'peak_ratio': peak_ratio,
                                    'avg_gradient': avg_gradient
                                })
            
            return device_candidates, debug_info, edges
            
        except Exception as e:
            print(f"❌ Error in device detection: {str(e)}")
            return [], {}, None
    
    def _classify_device_type(self, aspect_ratio: float, area: int, brightness: float) -> str:
        """จำแนกประเภท device"""
        if 0.4 < aspect_ratio < 0.7:  # Portrait
            return "mobile_phone" if area < 15000 else "tablet_device"
        elif 1.3 < aspect_ratio < 2.2:  # Landscape
            if area < 20000:
                return "mobile_phone"
            elif area < 50000:
                return "tablet_device"
            else:
                return "monitor_screen"
        elif aspect_ratio > 2.2:  # Wide screen
            return "monitor_screen"
        elif 0.8 < aspect_ratio < 1.2:  # Square-ish
            if brightness > 120:
                return "tablet_device"
        return "unknown_device"
    
    def run(self):
        """รัน debug loop"""
        while True:
            ret, frame = self.cap.read()
            if not ret:
                print("❌ Failed to grab frame")
                break
            
            # แปลงเป็น grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # ตรวจจับ devices
            candidates, debug_info, edges = self.detect_digital_devices_debug(gray)
            
            # วาด bounding boxes
            for candidate in candidates:
                x, y, w, h = candidate['bbox']
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                
                # แสดงข้อมูล
                label = f"{candidate['type']} ({candidate['confidence']:.2f})"
                cv2.putText(frame, label, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            
            # แสดง debug info
            config = self.sensitivity_configs[self.sensitivity_level]
            info_text = [
                f"Sensitivity: {config['name']}",
                f"Frame Mean: {debug_info.get('frame_stats', {}).get('mean', 0):.1f}",
                f"Threshold: {debug_info.get('frame_stats', {}).get('threshold', 0):.1f}",
                f"Contours: {debug_info.get('contours_found', 0)}",
                f"Candidates: {debug_info.get('candidates_analyzed', 0)}",
                f"Filtered: {debug_info.get('filtered_by_uniform_light', 0)}",
                f"Detected: {len(candidates)}"
            ]
            
            for i, text in enumerate(info_text):
                cv2.putText(frame, text, (10, 30 + i*25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(frame, text, (10, 30 + i*25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
            
            # แสดงผล
            cv2.imshow('Digital Device Detection Debug', frame)
            if edges is not None:
                cv2.imshow('Edges', edges)
            
            # Handle key presses
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                cv2.imwrite(f'debug_frame_{self.sensitivity_level}.jpg', frame)
                print(f"💾 Saved frame with sensitivity level {self.sensitivity_level}")
            elif key == ord('1'):
                self.sensitivity_level = 1
                print(f"🔧 Sensitivity set to: {self.sensitivity_configs[1]['name']}")
            elif key == ord('2'):
                self.sensitivity_level = 2
                print(f"🔧 Sensitivity set to: {self.sensitivity_configs[2]['name']}")
            elif key == ord('3'):
                self.sensitivity_level = 3
                print(f"🔧 Sensitivity set to: {self.sensitivity_configs[3]['name']}")
        
        # Cleanup
        self.cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    try:
        debugger = DeviceDetectionDebugger()
        debugger.run()
    except KeyboardInterrupt:
        print("\n👋 Debugging session ended")
    except Exception as e:
        print(f"❌ Error: {str(e)}") 