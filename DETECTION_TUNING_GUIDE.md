# AI Exam System - Detection Tuning Guide

This guide explains how to tune the detection system to fit your specific requirements and reduce false positives.

## 🎯 Quick Start

All tunable parameters are centralized in `backend/core/detection_config.py`. Simply edit this file and restart the backend container to apply changes.

```bash
# After editing detection_config.py
docker-compose restart backend
```

## 📋 Detection Parameters

### 1. Brightness Thresholds (Environment Adaptation)

Adjust these based on your lighting conditions:

```python
# Environment detection thresholds
BRIGHT_ENV_THRESHOLD = 130      # Decrease if your environment is darker
NORMAL_ENV_THRESHOLD = 90       # Adjust for your typical lighting
LOW_ENV_THRESHOLD = 50          # For low-light conditions

# Brightness adjustments (higher = less sensitive)
BRIGHT_ENV_ADJUSTMENT = 45      # Reduce to detect more devices in bright light
NORMAL_ENV_ADJUSTMENT = 35      # Standard adjustment
LOW_ENV_ADJUSTMENT = 25         # For low-light environments
```

**Common Issues & Solutions:**

- **Too many false positives in bright rooms**: Increase `BRIGHT_ENV_ADJUSTMENT` to 60-80
- **Missing devices in dark rooms**: Decrease `LOW_ENV_ADJUSTMENT` to 15-20
- **Inconsistent detection**: Adjust environment thresholds to match your room lighting

### 2. Edge Detection (Sensitivity Control)

Controls how sensitive the system is to edges and shapes:

```python
EDGE_LOW_THRESHOLD = 50         # Lower = more sensitive to weak edges
EDGE_HIGH_THRESHOLD = 150       # Higher = less noise, cleaner detection
KERNEL_SIZE = 3                 # Morphology kernel size (3-7 recommended)
```

**Tuning Tips:**

- **Too many false positives**: Increase both thresholds (60/180)
- **Missing actual devices**: Decrease thresholds (40/120)
- **Noisy detection**: Increase `KERNEL_SIZE` to 5

### 3. Size and Shape Constraints

Define what sizes and shapes count as devices:

```python
# Area constraints (in pixels)
MIN_DETECTION_AREA = 5000       # Smaller = detect smaller objects
MAX_DETECTION_AREA = 80000      # Larger = allow bigger objects

# Shape constraints
MIN_ASPECT_RATIO = 0.3          # Very wide objects
MAX_ASPECT_RATIO = 3.0          # Very tall objects
MIN_RECTANGULARITY = 0.6        # How "rectangle-like" (0.0-1.0)
```

**Common Adjustments:**

- **Missing small phones**: Decrease `MIN_DETECTION_AREA` to 3000
- **Detecting furniture/walls**: Increase `MIN_RECTANGULARITY` to 0.8
- **Missing tablets**: Increase `MAX_DETECTION_AREA` to 120000

### 4. Confidence Thresholds (False Positive Control)

Control how confident the system must be before reporting detection:

```python
MIN_DEVICE_CONFIDENCE = 0.25    # Minimum confidence for any detection
HIGH_CONFIDENCE_THRESHOLD = 0.3 # Final threshold for reporting
YOLO_CONFIDENCE_THRESHOLD = 0.15 # YOLO model confidence
```

**Tuning Strategy:**

- **Too many false positives**: Increase to 0.4-0.5
- **Missing obvious devices**: Decrease to 0.15-0.2
- **Balance accuracy**: Keep between 0.25-0.35

### 5. Head Down Detection

Detect when students are looking down (cheating indicator):

```python
HEAD_DOWN_ASPECT_RATIO = 1.3      # Face height/width ratio when looking down
HEAD_DOWN_POSITION_RATIO = 0.7    # Face position in frame (0.0-1.0)
HEAD_DOWN_THRESHOLD_FRAMES = 3    # Consecutive frames needed
```

**Adjustments:**

- **Too sensitive**: Increase `HEAD_DOWN_ASPECT_RATIO` to 1.5
- **Missing head down**: Decrease to 1.1
- **Reduce false alarms**: Increase `HEAD_DOWN_THRESHOLD_FRAMES` to 5

### 6. Talking Detection

Detect mouth movement/talking:

```python
MOUTH_AREA_VARIANCE_THRESHOLD = 50    # Mouth area change sensitivity
TALKING_THRESHOLD_FRAMES = 3          # Frames needed to confirm talking
```

**Fine-tuning:**

- **Too sensitive to normal expressions**: Increase variance threshold to 100
- **Missing obvious talking**: Decrease to 25
- **Reduce false positives**: Increase frame threshold to 5

## 🔧 Common Tuning Scenarios

### Scenario 1: Bright Office Environment

```python
BRIGHT_ENV_ADJUSTMENT = 60
EDGE_HIGH_THRESHOLD = 180
MIN_DEVICE_CONFIDENCE = 0.35
```

### Scenario 2: Home Environment (Variable Lighting)

```python
NORMAL_ENV_ADJUSTMENT = 30
LOW_ENV_ADJUSTMENT = 20
MIN_DETECTION_AREA = 4000
```

### Scenario 3: Strict Exam Environment (Low False Positives)

```python
MIN_DEVICE_CONFIDENCE = 0.4
HIGH_CONFIDENCE_THRESHOLD = 0.45
MIN_RECTANGULARITY = 0.8
HEAD_DOWN_THRESHOLD_FRAMES = 5
```

### Scenario 4: Lenient Environment (Catch More Devices)

```python
MIN_DEVICE_CONFIDENCE = 0.2
EDGE_LOW_THRESHOLD = 40
MIN_DETECTION_AREA = 3000
```

## 📊 Testing Your Configuration

### 1. Live Testing

- Go to `http://localhost:3000/exam/real-session-1`
- Test with various objects and lighting conditions
- Check browser console for detection logs

### 2. Debug Information

Look for these log patterns:

```
📱 [BETA] Digital Device Detected: mobile_phone
🔍 [DEBUG] Classifying: aspect=1.5, area=15000, brightness=120
📱 [YOLO] Detected cell phone with confidence 0.85
```

### 3. Backend Logs

```bash
docker-compose logs backend | grep -E "(BETA|YOLO|DEBUG)"
```

## 🚨 Troubleshooting Common Issues

### Issue: "Digital detected always" with no devices

**Solution:**

```python
# Increase these values
MIN_DEVICE_CONFIDENCE = 0.4
HIGH_CONFIDENCE_THRESHOLD = 0.45
MIN_RECTANGULARITY = 0.8
BRIGHT_ENV_ADJUSTMENT = 60  # If in bright environment
```

### Issue: Missing obvious phones/tablets

**Solution:**

```python
# Decrease these values
MIN_DEVICE_CONFIDENCE = 0.2
MIN_DETECTION_AREA = 3000
EDGE_LOW_THRESHOLD = 40
```

### Issue: Detecting walls/furniture as devices

**Solution:**

```python
# Increase shape requirements
MIN_RECTANGULARITY = 0.85
MAX_DETECTION_AREA = 50000
MIN_ASPECT_RATIO = 0.4
MAX_ASPECT_RATIO = 2.5
```

### Issue: Head down detection too sensitive

**Solution:**

```python
HEAD_DOWN_ASPECT_RATIO = 1.5
HEAD_DOWN_THRESHOLD_FRAMES = 5
HEAD_DOWN_POSITION_RATIO = 0.75
```

## 🔄 Quick Restart Command

After making changes:

```bash
docker-compose restart backend
```

## 📝 Configuration Backup

Before making major changes, backup your working configuration:

```bash
cp backend/core/detection_config.py backend/core/detection_config.py.backup
```

## 🎯 Recommended Starting Points

### Conservative (Low False Positives)

- `MIN_DEVICE_CONFIDENCE = 0.35`
- `HIGH_CONFIDENCE_THRESHOLD = 0.4`
- `MIN_RECTANGULARITY = 0.8`

### Balanced (Good Detection + Reasonable False Positives)

- `MIN_DEVICE_CONFIDENCE = 0.25`
- `HIGH_CONFIDENCE_THRESHOLD = 0.3`
- `MIN_RECTANGULARITY = 0.6`

### Aggressive (Catch Everything)

- `MIN_DEVICE_CONFIDENCE = 0.15`
- `HIGH_CONFIDENCE_THRESHOLD = 0.2`
- `MIN_RECTANGULARITY = 0.5`

---

**Remember**: Changes take effect immediately after restarting the backend container. Test thoroughly in your specific environment before using in actual exams.
