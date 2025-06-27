# Detection Configuration for Face Detection Service
# This file contains all tunable parameters for the detection system
# Modify these values to calibrate the system for your specific requirements

class DetectionConfig:
    """Configuration class for all detection parameters"""
    
    # ========== BRIGHTNESS THRESHOLDS ==========
    # Adjust these based on your lighting environment
    BRIGHT_ENV_THRESHOLD = 130      # Above this = bright environment
    NORMAL_ENV_THRESHOLD = 90       # Above this = normal lighting
    LOW_ENV_THRESHOLD = 50          # Above this = low lighting
    
    # Brightness adjustment factors
    BRIGHT_ENV_ADJUSTMENT = 45      # Added to brightness threshold in bright env
    NORMAL_ENV_ADJUSTMENT = 35      # Added to brightness threshold in normal env
    LOW_ENV_ADJUSTMENT = 25         # Added to brightness threshold in low env
    VERY_LOW_ENV_ADJUSTMENT = 20    # Added to brightness threshold in very low env
    MIN_BRIGHTNESS_FLOOR = 70       # Minimum brightness threshold
    
    # ========== EDGE DETECTION ==========
    EDGE_LOW_THRESHOLD = 70         # Higher edge detection threshold for faster detection
    EDGE_HIGH_THRESHOLD = 200       # Much higher edge detection threshold
    KERNEL_SIZE = 5                 # Larger kernel for cleaner detection
    
    # ========== CONTOUR DETECTION ==========
    MIN_DETECTION_AREA = 8000       # Higher minimum area for faster detection
    MAX_DETECTION_AREA = 60000      # Lower maximum area 
    MIN_ASPECT_RATIO = 0.4          # More restrictive aspect ratio
    MAX_ASPECT_RATIO = 2.5          # More restrictive aspect ratio
    MIN_WIDTH = 80                  # Higher minimum width
    MIN_HEIGHT = 80                 # Higher minimum height
    MIN_CONTOUR_AREA = 6000         # Higher minimum contour area
    MIN_RECTANGULARITY = 0.8        # Much higher rectangularity requirement
    
    # ========== BRIGHTNESS ANALYSIS ==========
    MAX_STD_BRIGHTNESS = 35         # Maximum standard deviation for uniform brightness
    MIN_BRIGHT_SCREEN = 120         # Minimum brightness for bright screen detection
    MAX_DARK_SCREEN = 25            # Maximum brightness for dark screen detection
    MAX_DARK_STD = 10               # Maximum std for dark screen
    MIN_DARK_AREA = 12000           # Minimum area for dark screen detection
    
    # ========== EDGE DENSITY ==========
    MIN_EDGE_DENSITY = 0.03         # Minimum edge density
    MAX_EDGE_DENSITY = 0.25         # Maximum edge density
    
    # ========== UNIFORM LIGHT FILTERING ==========
    MIN_GRADIENT_REQUIREMENT = 12   # Minimum gradient for non-uniform detection
    UNIFORM_PEAK_RATIO = 0.4        # Peak ratio threshold for uniform detection
    MAX_UNIFORM_GRADIENT = 10       # Maximum gradient for uniform light
    MAX_UNIFORM_TEXTURE = 50        # Maximum texture variance for uniform light
    
    # ========== CONFIDENCE THRESHOLDS ==========
    MIN_DEVICE_CONFIDENCE = 0.4     # Higher confidence for faster detection
    HIGH_CONFIDENCE_THRESHOLD = 0.5  # Much higher threshold for final detection
    
    # ========== YOLO DETECTION ==========
    YOLO_CONFIDENCE_THRESHOLD = 0.15  # YOLO confidence threshold
    YOLO_INPUT_SIZE = 416             # YOLO input image size
    YOLO_SCALE_FACTOR = 1/255.0       # YOLO blob scale factor
    
    # ========== HEAD DOWN DETECTION ==========
    HEAD_DOWN_ASPECT_RATIO = 1.6      # Much less sensitive - higher threshold
    HEAD_DOWN_POSITION_RATIO = 0.8    # Much higher threshold - face must be very low
    HEAD_DOWN_MAX_FACE_AREA = 8000    # Smaller area requirement - more restrictive
    HEAD_DOWN_NARROW_ASPECT = 1.5     # Much less sensitive narrow aspect
    HEAD_DOWN_MAX_WIDTH = 50          # Smaller width requirement - more restrictive
    HEAD_DOWN_THRESHOLD_FRAMES = 2    # Need 5 consecutive frames (5 seconds)
    
    # ========== TALKING DETECTION ==========
    MOUTH_AREA_VARIANCE_THRESHOLD = 120   # Much higher threshold for less sensitivity
    MOUTH_EDGE_VARIANCE_THRESHOLD = 0.003 # Much lower threshold for less sensitivity  
    TALKING_THRESHOLD_FRAMES = 5          # Need 5 consecutive frames (5 seconds)
    
    # ========== FACE ABSENCE ==========
    PROLONGED_ABSENCE_FRAMES = 8      # Need 8 frames (8 seconds) for prolonged absence
    

    
    # ========== DEVICE TYPE CLASSIFICATION ==========
    # Portrait phone
    PHONE_PORTRAIT_MIN_ASPECT = 0.5
    PHONE_PORTRAIT_MAX_ASPECT = 0.8
    PHONE_PORTRAIT_MIN_AREA = 8000
    PHONE_PORTRAIT_MAX_AREA = 20000
    
    # Landscape phone/tablet
    PHONE_LANDSCAPE_MIN_ASPECT = 1.2
    PHONE_LANDSCAPE_MAX_ASPECT = 1.8
    PHONE_LANDSCAPE_MIN_AREA = 8000
    PHONE_LANDSCAPE_MAX_AREA = 25000
    TABLET_MIN_AREA = 25000
    TABLET_MAX_AREA = 50000
    
    # Monitor/wide screen
    MONITOR_MIN_ASPECT = 1.8
    MONITOR_MIN_AREA = 30000
    
    @classmethod
    def get_brightness_threshold(cls, frame_mean: float) -> float:
        """Calculate brightness threshold based on environment"""
        if frame_mean > cls.BRIGHT_ENV_THRESHOLD:
            return frame_mean + cls.BRIGHT_ENV_ADJUSTMENT
        elif frame_mean > cls.NORMAL_ENV_THRESHOLD:
            return frame_mean + cls.NORMAL_ENV_ADJUSTMENT
        elif frame_mean > cls.LOW_ENV_THRESHOLD:
            return frame_mean + cls.LOW_ENV_ADJUSTMENT
        else:
            return max(frame_mean + cls.VERY_LOW_ENV_ADJUSTMENT, cls.MIN_BRIGHTNESS_FLOOR)
    
    @classmethod
    def is_device_size_valid(cls, area: int, aspect_ratio: float, w: int, h: int, contour_area: int) -> bool:
        """Check if detected object meets size criteria for device detection"""
        return (cls.MIN_DETECTION_AREA < area < cls.MAX_DETECTION_AREA and
                cls.MIN_ASPECT_RATIO < aspect_ratio < cls.MAX_ASPECT_RATIO and
                w > cls.MIN_WIDTH and h > cls.MIN_HEIGHT and
                contour_area > cls.MIN_CONTOUR_AREA)
    
    @classmethod
    def classify_device_type(cls, aspect_ratio: float, area: int, brightness: float) -> str:
        """Classify device type based on dimensions and characteristics"""
        # Portrait phone
        if (cls.PHONE_PORTRAIT_MIN_ASPECT < aspect_ratio < cls.PHONE_PORTRAIT_MAX_ASPECT and
            cls.PHONE_PORTRAIT_MIN_AREA < area < cls.PHONE_PORTRAIT_MAX_AREA):
            return "mobile_phone"
        
        # Landscape phone/tablet
        elif (cls.PHONE_LANDSCAPE_MIN_ASPECT < aspect_ratio < cls.PHONE_LANDSCAPE_MAX_ASPECT):
            if cls.PHONE_LANDSCAPE_MIN_AREA < area < cls.PHONE_LANDSCAPE_MAX_AREA:
                return "mobile_phone"
            elif cls.TABLET_MIN_AREA < area < cls.TABLET_MAX_AREA:
                return "tablet_device"
        
        # Wide screen/monitor
        elif (aspect_ratio > cls.MONITOR_MIN_ASPECT and area > cls.MONITOR_MIN_AREA):
            return "monitor_screen"
        
        return None 