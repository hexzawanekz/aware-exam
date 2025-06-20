#!/usr/bin/env python3
"""
Calibration script for digital device detection false positives
This will update the face_detection_lite.py service to reduce false alerts
"""

import os
import sys

def calibrate_device_detection():
    """Apply calibration fix to reduce false positives in device detection"""
    
    print("🔧 Calibrating Digital Device Detection System")
    print("=" * 60)
    
    # Updated device detection method with stricter thresholds
    updated_detection_method = '''
    async def _detect_digital_devices(self, gray_frame: np.ndarray) -> str:
        """ตรวจจับ mobile/tablet/smart TV/digital devices - Calibrated to reduce false positives"""
        try:
            frame_height, frame_width = gray_frame.shape
            
            # Calculate adaptive threshold from lighting environment
            frame_mean = np.mean(gray_frame)
            frame_std = np.std(gray_frame)
            
            # Stricter brightness thresholds to reduce false positives
            if frame_mean > 140:  # Very bright environment
                brightness_threshold = frame_mean + 50  # Significantly higher threshold
            elif frame_mean > 100:  # Bright environment  
                brightness_threshold = frame_mean + 40
            elif frame_mean > 60:  # Normal lighting
                brightness_threshold = frame_mean + 35
            else:  # Low light
                brightness_threshold = max(frame_mean + 30, 80)
            
            # More conservative edge detection
            edges = cv2.Canny(gray_frame, 60, 180, apertureSize=3)  # Higher thresholds
            
            # Smaller kernel to be more precise
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
            edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
            
            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            device_candidates = []
            
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                area = w * h
                aspect_ratio = w / h if h > 0 else 0
                contour_area = cv2.contourArea(contour)
                
                # Stricter size and aspect ratio constraints
                if (area > 8000 and area < 60000 and  # Increased minimum area
                    0.5 < aspect_ratio < 2.0 and      # More restrictive aspect ratio
                    w > 80 and h > 80 and             # Larger minimum dimensions
                    contour_area > 6000):             # Higher contour area requirement
                    
                    # Check rectangularity more strictly
                    rect_area = w * h
                    rectangularity = contour_area / rect_area if rect_area > 0 else 0
                    
                    if rectangularity > 0.8:  # Much higher rectangularity requirement
                        roi = gray_frame[y:y+h, x:x+w]
                        mean_brightness = np.mean(roi)
                        std_brightness = np.std(roi)
                        
                        # Stricter brightness conditions
                        is_bright_screen = (mean_brightness > brightness_threshold and 
                                          std_brightness < 35 and
                                          mean_brightness > 120)  # Additional brightness floor
                        
                        is_dark_screen = (mean_brightness < 25 and 
                                        std_brightness < 10 and
                                        area > 12000)  # Larger area requirement for dark screens
                        
                        # Enhanced edge density analysis
                        roi_edges = cv2.Canny(roi, 60, 180)
                        edge_density = np.sum(roi_edges > 0) / (w * h)
                        has_proper_edges = 0.03 < edge_density < 0.25  # Narrower range
                        
                        if (is_bright_screen or is_dark_screen) and has_proper_edges:
                            # Enhanced uniform light source filtering
                            is_uniform, peak_ratio, avg_gradient = self._is_uniform_light_source_enhanced(roi)
                            
                            # Stricter filtering criteria
                            if not is_uniform and avg_gradient > 12:  # Higher gradient requirement
                                device_type = self._classify_device_type_strict(aspect_ratio, area, mean_brightness)
                                if device_type:
                                    # Higher confidence threshold
                                    confidence = rectangularity * (edge_density * 8) * (avg_gradient / 20)
                                    if confidence > 0.25:  # Much higher threshold
                                        device_candidates.append({
                                            'type': device_type,
                                            'confidence': confidence,
                                            'area': area,
                                            'brightness': mean_brightness,
                                            'edge_density': edge_density
                                        })
            
            # Only return detection if high confidence
            if device_candidates:
                best_device = max(device_candidates, key=lambda x: x['confidence'])
                if best_device['confidence'] > 0.3:  # High threshold
                    return best_device['type']
            
            return None
            
        except Exception as e:
            print(f"❌ Error in device detection: {str(e)}")
            return None

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

    def _classify_device_type_strict(self, aspect_ratio: float, area: int, brightness: float) -> str:
        """Stricter device type classification"""
        # Only classify clearly recognizable device shapes and sizes
        if 0.5 < aspect_ratio < 0.8:  # Portrait phone
            if 8000 < area < 20000:
                return "mobile_phone"
        elif 1.2 < aspect_ratio < 1.8:  # Landscape tablet/phone
            if 8000 < area < 25000:
                return "mobile_phone"
            elif 25000 < area < 50000:
                return "tablet_device"
        elif aspect_ratio > 1.8:  # Wide screen
            if area > 30000:
                return "monitor_screen"
        
        return None  # Don't classify unclear shapes
    '''
    
    # Disable simple mobile detection to reduce noise
    updated_simple_detection = '''
    async def _simple_mobile_detection(self, gray_frame: np.ndarray) -> str:
        """Disabled simple detection to reduce false positives"""
        return None  # Temporarily disabled for calibration
    '''
    
    print("📋 Calibration Plan:")
    print("✅ Increase brightness thresholds significantly")
    print("✅ Require higher rectangularity (0.8 vs 0.05)")
    print("✅ Increase minimum area (8000 vs 1500 pixels)")
    print("✅ Stricter edge density requirements")
    print("✅ Enhanced uniform light filtering")
    print("✅ Higher confidence thresholds (0.3 vs 0.05)")
    print("✅ Disable simple detection temporarily")
    print("✅ More restrictive aspect ratios")
    
    print(f"\n🔧 Apply these changes to backend/services/face_detection_lite.py")
    print(f"📁 The updated methods are ready for manual application")
    
    # Write the calibrated methods to a file for manual application
    with open("device_detection_calibrated.py", "w") as f:
        f.write("# Calibrated Digital Device Detection Methods\n")
        f.write("# Replace the corresponding methods in backend/services/face_detection_lite.py\n\n")
        f.write(updated_detection_method)
        f.write("\n\n")
        f.write(updated_simple_detection)
    
    print(f"\n✅ Calibrated methods written to: device_detection_calibrated.py")
    return True

def create_quick_disable_patch():
    """Create a quick patch to disable device detection entirely for immediate fix"""
    
    disable_patch = '''
# QUICK DISABLE PATCH for Digital Device Detection
# Replace the _detect_digital_devices method with this to completely disable detection:

async def _detect_digital_devices(self, gray_frame: np.ndarray) -> str:
    """Temporarily disabled to eliminate false positives"""
    return None

async def _simple_mobile_detection(self, gray_frame: np.ndarray) -> str:
    """Temporarily disabled to eliminate false positives"""  
    return None
    '''
    
    with open("quick_disable_patch.py", "w") as f:
        f.write(disable_patch)
    
    print("🚨 QUICK FIX: Created quick_disable_patch.py")
    print("   This completely disables device detection to stop false alerts immediately")

def test_calibration_settings():
    """Test different calibration settings"""
    
    settings = {
        "conservative": {
            "min_area": 10000,
            "rectangularity": 0.85,
            "confidence_threshold": 0.4,
            "description": "Very conservative - minimal false positives"
        },
        "balanced": {
            "min_area": 8000, 
            "rectangularity": 0.8,
            "confidence_threshold": 0.3,
            "description": "Balanced - good detection with low false positives"
        },
        "sensitive": {
            "min_area": 6000,
            "rectangularity": 0.75, 
            "confidence_threshold": 0.2,
            "description": "More sensitive - catches more devices but may have some false positives"
        }
    }
    
    print("🎯 Calibration Settings Options:")
    print("=" * 50)
    
    for name, config in settings.items():
        print(f"\n📊 {name.upper()} Mode:")
        print(f"   Min Area: {config['min_area']} pixels")
        print(f"   Rectangularity: {config['rectangularity']}")
        print(f"   Confidence: {config['confidence_threshold']}")
        print(f"   Description: {config['description']}")
    
    print(f"\n💡 Recommendation: Start with BALANCED mode")
    print(f"   If still getting false positives, switch to CONSERVATIVE")
    print(f"   If missing real devices, switch to SENSITIVE")

if __name__ == "__main__":
    print("🎯 Digital Device Detection Calibration Tool")
    print("=" * 60)
    
    print("Current Issue: 'digital detected always' with no visible devices")
    print("Root Cause: Detection thresholds too low, causing false positives")
    print("")
    
    # Show calibration options
    test_calibration_settings()
    
    print("\n" + "=" * 60)
    choice = input("Choose action:\n1. Generate calibrated detection (recommended)\n2. Create quick disable patch\n3. Both\nEnter choice (1-3): ").strip()
    
    if choice in ["1", "3"]:
        calibrate_device_detection()
    
    if choice in ["2", "3"]:
        create_quick_disable_patch()
    
    print(f"\n🎉 Calibration complete!")
    print(f"📝 Next steps:")
    print(f"   1. Review the generated files")
    print(f"   2. Apply changes to backend/services/face_detection_lite.py")
    print(f"   3. Restart the backend container")
    print(f"   4. Test at exam/real-session-1")
    print(f"\n🔧 Commands to restart backend:")
    print(f"   docker-compose restart backend")
    print(f"   # or")
    print(f"   docker-compose down && docker-compose up -d") 