# 📸 YOLO11 Evidence Capture System

## Overview

This feature implements an advanced evidence capture system using YOLO11 AI for exam proctoring. When the system detects suspicious behavior with >90% confidence, it automatically captures and stores evidence frames along with detailed analysis metadata.

## 🎯 Key Features

### 1. **Real-time Evidence Detection**

- **90% Confidence Threshold**: Only captures evidence when AI is >90% confident
- **Multi-modal Detection**: Combines YOLO11 pose estimation + segmentation
- **Smart Scoring**: Calculates evidence scores based on multiple factors

### 2. **Evidence Types Detected**

- 📱 **Mobile Phone Detection**: YOLO11 segmentation detects cell phones
- 👻 **Face Absence**: Person not detected in frame
- 👥 **Multiple People**: More than one person detected
- 🔍 **Head Down**: Sustained head-down posture
- 🔄 **Looking Away**: Head turned away from screen
- 🙌 **Suspicious Hand Movement**: Hand near face/phone usage

### 3. **Evidence Storage & Analysis**

- **Frame Capture**: High-quality JPEG images saved when threshold exceeded
- **Metadata Storage**: Complete YOLO11 analysis results stored in database
- **Risk Classification**: Evidence levels (low/medium/high/critical)
- **AI Integration**: Ready for N8N workflow AI evaluation

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
# Install YOLO11
pip install ultralytics

# Run setup script
cd backend
python setup_evidence_capture.py
```

### 2. Database Migration

The setup script automatically adds these new fields to `proctoring_logs`:

- `evidence_level`: Risk level classification
- `captured_frame_url`: Path to captured frame image
- `frame_analysis`: Complete YOLO11 analysis JSON
- `cheating_score`: Numerical evidence score (0-100)
- `ai_evaluation`: Future N8N AI evaluation results
- `processed`: Whether evidence has been AI-processed

### 3. Directory Structure

```
backend/
  evidence_frames/          # Captured evidence images
    evidence_session123_mobile_phone_20241201_143022_abc123.jpg
    evidence_session456_face_absent_20241201_143055_def456.jpg
```

## 🔗 API Endpoints

### Evidence Summary

```http
GET /api/v1/exam/sessions/{session_id}/evidence-summary
```

Returns comprehensive evidence analysis including:

- Overall risk level and score
- Statistics (total events, high-risk events, captured frames)
- Event type breakdown with scoring
- Recent high-risk events

### Detailed Proctoring Logs

```http
GET /api/v1/exam/sessions/{session_id}/proctoring-logs
```

Returns enhanced logs with evidence data:

- All proctoring events with evidence scores
- Frame capture status
- Evidence levels and metadata

### Evidence Frame Images

```http
GET /api/v1/exam/evidence-frame/{filename}
```

Serves captured evidence images securely.

## 🎮 User Interface

### Exam Interface (`/exam/session_xxxxx`)

**Real-time Evidence Display:**

- Evidence score meter (0-100%)
- Risk level indicator (LOW/MEDIUM/HIGH/CRITICAL)
- Frame capture counter
- Recent event notifications

![Evidence Panel](docs/evidence-panel.png)

### Admin Interface (`/admin/candidates/xx`)

**Evidence Analysis Dashboard:**

- Risk level summary cards
- Event type breakdown statistics
- High-risk events timeline
- Evidence frame gallery (future feature)

![Admin Evidence](docs/admin-evidence.png)

## 🤖 Evidence Scoring Algorithm

The system calculates evidence scores using weighted factors:

```python
# Base scoring factors
phone_detection = confidence * 40        # Up to 40 points
face_absence = 30                        # 30 points if no face
multiple_people = 25                     # 25 points if >1 person
head_position = confidence * 20          # Up to 20 points
attention_direction = confidence * 15    # Up to 15 points
hand_position = confidence * 20          # Up to 20 points

# Activity multipliers
mobile_phone_detected = 1.5x
confirmed_phone_usage = 2.0x
prolonged_absence = 1.3x
head_down_detected = 1.2x
```

**Evidence Levels:**

- 🟢 **LOW** (0-49%): Normal behavior
- 🟡 **MEDIUM** (50-74%): Suspicious but not conclusive
- 🟠 **HIGH** (75-89%): Likely cheating behavior
- 🔴 **CRITICAL** (90-100%): Frame captured, strong evidence

## 🔧 Configuration

### Evidence Threshold

```python
# In face_detection_yolo11.py
self.evidence_threshold = 0.90  # 90% threshold for capture
```

### Storage Path

```python
# Evidence storage directory
self.evidence_storage_path = "evidence_frames"
```

### Event Weights

Customize scoring weights in `_calculate_evidence_score()`:

```python
activity_multipliers = {
    'mobile_phone_detected': 1.5,
    'confirmed_phone_usage': 2.0,
    'prolonged_absence_detected': 1.3,
    # ... customize as needed
}
```

## 🔮 Future N8N AI Integration

The system is designed for seamless N8N integration:

### Evidence Processing Workflow

1. **High Evidence Detection** (≥90%) → Send to N8N
2. **N8N AI Analysis** → GPT/Claude evaluation
3. **AI Verdict** → Store in `ai_evaluation` field
4. **Risk Assessment** → Update cheating percentage
5. **Admin Notification** → Alert on critical findings

### N8N Webhook Structure

```json
{
  "session_id": "session_123",
  "evidence_score": 95.5,
  "evidence_level": "critical",
  "event_type": "mobile_phone_detected",
  "captured_frame_path": "evidence_frames/evidence_session123_mobile_phone_20241201_143022_abc123.jpg",
  "frame_analysis": {
    "phone_detection": {...},
    "pose_analysis": {...},
    "suspicious_activity": [...]
  }
}
```

## 📊 Usage Statistics

Track evidence capture effectiveness:

```sql
-- High-risk events by type
SELECT event_type, COUNT(*), AVG(cheating_score)
FROM proctoring_logs
WHERE evidence_level IN ('high', 'critical')
GROUP BY event_type;

-- Frame capture rate
SELECT
  COUNT(*) as total_events,
  SUM(CASE WHEN captured_frame_url IS NOT NULL THEN 1 ELSE 0 END) as frames_captured,
  ROUND(SUM(CASE WHEN captured_frame_url IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as capture_rate
FROM proctoring_logs;
```

## 🛡️ Security Considerations

### Frame Storage Security

- Images stored with random UUIDs in filenames
- Access restricted through API endpoints only
- Optional encryption for sensitive deployments

### Privacy Compliance

- Automatic frame cleanup after configurable period
- GDPR-compliant data retention policies
- Consent tracking for evidence capture

## 🐛 Troubleshooting

### Common Issues

**1. No Evidence Frames Captured**

```bash
# Check directory permissions
ls -la evidence_frames/

# Verify YOLO11 installation
python -c "from ultralytics import YOLO; print('YOLO11 OK')"

# Check logs
tail -f logs/evidence_capture.log
```

**2. High False Positive Rate**

- Adjust evidence threshold: `self.evidence_threshold = 0.95`
- Modify scoring weights for specific environments
- Fine-tune YOLO11 confidence thresholds

**3. Performance Issues**

- Use YOLO11n (nano) models for speed
- Implement frame skipping for slower systems
- Consider GPU acceleration for high-volume deployments

## 📚 Technical Details

### File Structure

```
backend/
├── services/
│   ├── face_detection_yolo11.py     # Main evidence capture logic
│   └── ...
├── models/
│   └── exam.py                      # Enhanced ProctoringLog model
├── api/v1/
│   └── exam.py                      # Evidence API endpoints
├── evidence_frames/                 # Captured evidence storage
└── setup_evidence_capture.py       # Setup script
```

### Dependencies

```txt
ultralytics>=8.0.0    # YOLO11 models
opencv-python>=4.8.0  # Image processing
pillow>=9.0.0         # Image handling
numpy>=1.21.0         # Numerical operations
```

## 🤝 Contributing

To extend the evidence capture system:

1. **Add New Detection Types**: Extend `_detect_suspicious_activities()`
2. **Customize Scoring**: Modify `_calculate_evidence_score()`
3. **Enhance UI**: Add new components to evidence display
4. **Integrate AI Services**: Implement N8N workflows

## 📄 License

This evidence capture system is part of the main project and follows the same licensing terms.

---

**🎯 Ready to catch cheaters with 90%+ confidence!** 🚨📸🤖
