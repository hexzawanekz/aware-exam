import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import { ArrowBack, Fullscreen, FullscreenExit } from "@mui/icons-material";
import Webcam from "react-webcam";
import screenfull from "screenfull";
import { useTranslation } from "react-i18next";
import api from "../services/api";

const DebugMonitoring = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // State management
  const [webcamReady, setWebcamReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [faceDetectionStatus, setFaceDetectionStatus] = useState({
    detected: false,
    verified: false,
    confidence: 0,
    suspicious: [],
    num_faces: 0,
    face_direction: "Unknown",
    analysis_type: "unknown",
    face_rectangles: [],
    mouth_regions: [],
    frame_dimensions: { width: 640, height: 480 },
    pose_keypoints: [],
    pose_analysis: {
      head_position: "unknown",
      body_posture: "unknown",
      hand_positions: "unknown",
      attention_direction: "unknown",
    },
    phone_detection: {
      phones_detected: false,
      phone_count: 0,
      phone_confidence: 0,
      phone_masks: [],
      phone_boxes: [],
    },
  });

  const [debugActivities, setDebugActivities] = useState({
    tabSwitches: 0,
    fullscreenExits: 0,
    lastTabSwitch: null,
    lastFullscreenExit: null,
  });

  const [violations, setViolations] = useState({
    tabSwitches: 0,
    fullscreenExits: 0,
    faceAbsence: 0,
  });

  // Webcam setup
  const handleWebcamReady = useCallback(() => {
    console.log("📹 Webcam ready for debug monitoring!");
    setWebcamReady(true);
  }, []);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(screenfull.isFullscreen);
    };

    if (screenfull.isEnabled) {
      screenfull.on("change", handleFullscreenChange);
    }

    return () => {
      if (screenfull.isEnabled) {
        screenfull.off("change", handleFullscreenChange);
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (screenfull.isEnabled) {
      if (screenfull.isFullscreen) {
        screenfull.exit();
      } else {
        screenfull.request();
      }
    }
  };

  // Canvas drawing for detection visualization
  const drawDetectionOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face rectangles
    if (
      faceDetectionStatus.face_rectangles &&
      faceDetectionStatus.face_rectangles.length > 0
    ) {
      const scaleX = canvas.width / faceDetectionStatus.frame_dimensions.width;
      const scaleY =
        canvas.height / faceDetectionStatus.frame_dimensions.height;

      faceDetectionStatus.face_rectangles.forEach((rect, index) => {
        // Draw face rectangle
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          rect.x * scaleX,
          rect.y * scaleY,
          rect.width * scaleX,
          rect.height * scaleY
        );

        // Add face label
        ctx.fillStyle = "#00ff00";
        ctx.font = "14px Arial";
        ctx.fillText(`Face ${index + 1}`, rect.x * scaleX, rect.y * scaleY - 5);
      });

      // Draw mouth regions
      if (faceDetectionStatus.mouth_regions) {
        faceDetectionStatus.mouth_regions.forEach((mouth) => {
          ctx.strokeStyle = "#ff8800";
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            mouth.x * scaleX,
            mouth.y * scaleY,
            mouth.width * scaleX,
            mouth.height * scaleY
          );
        });
        ctx.setLineDash([]);
      }
    }

    // Draw YOLO11 pose keypoints (all sessions now use YOLO11)
    if (
      faceDetectionStatus.pose_keypoints &&
      faceDetectionStatus.pose_keypoints.length > 0
    ) {
      const scaleX = canvas.width / faceDetectionStatus.frame_dimensions.width;
      const scaleY =
        canvas.height / faceDetectionStatus.frame_dimensions.height;

      faceDetectionStatus.pose_keypoints.forEach((person, personIndex) => {
        // Define skeleton connections for YOLO11 pose (17 keypoints) - DISABLED per user request
        /*
        const skeleton = [
          // Face connections
          [0, 1],
          [0, 2], // nose to eyes
          [1, 3],
          [2, 4], // eyes to ears
          // Body connections
          // [5, 6], // shoulders - REMOVED per user request
          [5, 7],
          [7, 9], // left arm
          [6, 8],
          [8, 10], // right arm
          [5, 11],
          [6, 12], // shoulders to hips
          [11, 12], // hips
          [11, 13],
          [13, 15], // left leg
          [12, 14],
          [14, 16], // right leg
        ];

        // Create keypoint map for easy access
        const keypointMap = {};
        person.forEach((keypoint) => {
          const keypointNames = [
            "nose",
            "left_eye",
            "right_eye",
            "left_ear",
            "right_ear",
            "left_shoulder",
            "right_shoulder",
            "left_elbow",
            "right_elbow",
            "left_wrist",
            "right_wrist",
            "left_hip",
            "right_hip",
            "left_knee",
            "right_knee",
            "left_ankle",
            "right_ankle",
          ];
          const index = keypointNames.indexOf(keypoint.name);
          if (index !== -1) {
            keypointMap[index] = keypoint;
          }
        });

        // Draw skeleton connections first (behind keypoints) - DISABLED per user request
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        skeleton.forEach(([startIdx, endIdx]) => {
          const startKp = keypointMap[startIdx];
          const endKp = keypointMap[endIdx];

          if (
            startKp &&
            endKp &&
            startKp.confidence > 0.3 &&
            endKp.confidence > 0.3
          ) {
            const startX = startKp.x * scaleX;
            const startY = startKp.y * scaleY;
            const endX = endKp.x * scaleX;
            const endY = endKp.y * scaleY;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
        });
        */

        // Draw keypoints with enhanced visualization
        person.forEach((keypoint, kpIndex) => {
          if (keypoint.confidence > 0.3) {
            const x = keypoint.x * scaleX;
            const y = keypoint.y * scaleY;

            // Enhanced color coding for different body parts
            let color = "#ffffff";
            let size = 4;

            if (keypoint.name === "nose") {
              color = "#ff0000"; // Red for nose
              size = 6;
            } else if (keypoint.name.includes("eye")) {
              color = "#ffff00"; // Yellow for eyes
              size = 5;
            } else if (keypoint.name.includes("ear")) {
              color = "#ffa500"; // Orange for ears
              size = 4;
            } else if (keypoint.name.includes("shoulder")) {
              color = "#00ffff"; // Cyan for shoulders
              size = 5;
            } else if (keypoint.name.includes("elbow")) {
              color = "#0080ff"; // Blue for elbows
              size = 4;
            } else if (keypoint.name.includes("wrist")) {
              color = "#8000ff"; // Purple for wrists
              size = 5;
            } else if (keypoint.name.includes("hip")) {
              color = "#ff8000"; // Orange for hips
              size = 5;
            } else if (keypoint.name.includes("knee")) {
              color = "#80ff00"; // Green for knees
              size = 4;
            } else if (keypoint.name.includes("ankle")) {
              color = "#ff0080"; // Pink for ankles
              size = 4;
            }

            // Draw keypoint with confidence-based transparency
            const alpha = Math.min(keypoint.confidence, 1.0);
            ctx.globalAlpha = alpha;

            // Draw outer circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();

            // Draw inner circle for high confidence points
            if (keypoint.confidence > 0.7) {
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(x, y, size - 2, 0, 2 * Math.PI);
              ctx.fill();
            }

            ctx.globalAlpha = 1.0; // Reset alpha

            // Draw keypoint labels for important points with better positioning
            if (
              keypoint.name === "nose" ||
              keypoint.name.includes("eye") ||
              keypoint.name.includes("wrist") ||
              keypoint.name.includes("shoulder")
            ) {
              ctx.fillStyle = color;
              ctx.font = "10px Arial";
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 2;

              // Add text outline for better visibility
              ctx.strokeText(keypoint.name.replace("_", " "), x + 8, y - 8);
              ctx.fillText(keypoint.name.replace("_", " "), x + 8, y - 8);
            }
          }
        });

        // Draw person bounding box
        if (
          faceDetectionStatus.face_rectangles &&
          faceDetectionStatus.face_rectangles[personIndex]
        ) {
          const rect = faceDetectionStatus.face_rectangles[personIndex];
          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            rect.x * scaleX,
            rect.y * scaleY,
            rect.width * scaleX,
            rect.height * scaleY
          );
          ctx.setLineDash([]);

          // Add person label
          ctx.fillStyle = "#00ff00";
          ctx.font = "12px Arial";
          ctx.fillText(
            `Person ${personIndex + 1}`,
            rect.x * scaleX,
            rect.y * scaleY - 5
          );
        }
      });

      // Draw mobile phone detections (segmentation masks and boxes)
      if (
        faceDetectionStatus.phone_detection &&
        faceDetectionStatus.phone_detection.phones_detected
      ) {
        // Draw phone bounding boxes
        faceDetectionStatus.phone_detection.phone_boxes.forEach(
          (phoneBox, phoneIndex) => {
            const x = phoneBox.x * scaleX;
            const y = phoneBox.y * scaleY;
            const width = phoneBox.width * scaleX;
            const height = phoneBox.height * scaleY;

            // Draw phone bounding box in red
            ctx.strokeStyle = "#ff0000";
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(x, y, width, height);
            ctx.setLineDash([]);

            // Add phone label with confidence
            ctx.fillStyle = "#ff0000";
            ctx.font = "bold 14px Arial";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeText(`📱 Phone ${phoneIndex + 1}`, x, y - 8);
            ctx.fillText(`📱 Phone ${phoneIndex + 1}`, x, y - 8);

            // Add confidence score
            ctx.font = "12px Arial";
            ctx.fillStyle = "#ff4444";
            ctx.fillText(
              `${Math.round(phoneBox.confidence * 100)}%`,
              x,
              y - 25
            );
          }
        );

        // Draw segmentation masks if available
        if (
          faceDetectionStatus.phone_detection.phone_masks &&
          faceDetectionStatus.phone_detection.phone_masks.length > 0
        ) {
          faceDetectionStatus.phone_detection.phone_masks.forEach(
            (maskData, maskIndex) => {
              if (maskData.contours && maskData.contours.length > 0) {
                // Draw segmentation mask outline
                ctx.strokeStyle = "#ff6600";
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 3]);

                ctx.beginPath();
                for (let i = 0; i < maskData.contours.length; i += 2) {
                  const x = maskData.contours[i] * scaleX;
                  const y = maskData.contours[i + 1] * scaleY;

                  if (i === 0) {
                    ctx.moveTo(x, y);
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
                ctx.closePath();
                ctx.stroke();

                // Fill with semi-transparent red
                ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
                ctx.fill();

                ctx.setLineDash([]);
              }
            }
          );
        }
      }
    }

    // Add detection status text with enhanced information
    ctx.fillStyle = faceDetectionStatus.detected ? "#00ff00" : "#ff0000";
    ctx.font = "14px Arial";

    // YOLO11 specific status (now default for all sessions)
    ctx.fillText(
      `🤖 YOLO11: ${
        faceDetectionStatus.face_rectangles.length
      } person(s) | Confidence: ${Math.round(
        (faceDetectionStatus.confidence || 0) * 100
      )}%`,
      10,
      25
    );

    // Add pose analysis summary
    if (faceDetectionStatus.pose_analysis) {
      ctx.fillStyle = "#00ffff";
      ctx.font = "12px Arial";
      ctx.fillText(
        `Head: ${
          faceDetectionStatus.pose_analysis.head_position || "unknown"
        } | ` +
          `Posture: ${
            faceDetectionStatus.pose_analysis.body_posture || "unknown"
          }`,
        10,
        45
      );
      ctx.fillText(
        `Hands: ${
          faceDetectionStatus.pose_analysis.hand_positions || "unknown"
        } | ` +
          `Attention: ${
            faceDetectionStatus.pose_analysis.attention_direction || "unknown"
          }`,
        10,
        60
      );
    }

    // Add keypoint count
    if (
      faceDetectionStatus.pose_keypoints &&
      faceDetectionStatus.pose_keypoints.length > 0
    ) {
      ctx.fillStyle = "#ffff00";
      ctx.font = "11px Arial";
      const totalKeypoints = faceDetectionStatus.pose_keypoints[0]?.length || 0;
      const highConfidenceKp =
        faceDetectionStatus.pose_keypoints[0]?.filter(
          (kp) => kp.confidence > 0.7
        ).length || 0;
      ctx.fillText(
        `🔗 Keypoints: ${highConfidenceKp}/${totalKeypoints} (high confidence)`,
        10,
        75
      );
    }

    // Add phone detection status
    if (faceDetectionStatus.phone_detection) {
      ctx.fillStyle = faceDetectionStatus.phone_detection.phones_detected
        ? "#ff0000"
        : "#00ff00";
      ctx.font = "12px Arial";
      ctx.fillText(
        `📱 Phones: ${faceDetectionStatus.phone_detection.phone_count} detected | ` +
          `Confidence: ${Math.round(
            (faceDetectionStatus.phone_detection.phone_confidence || 0) * 100
          )}%`,
        10,
        90
      );
    }

    // Add suspicious activities with better positioning
    if (
      faceDetectionStatus.suspicious &&
      faceDetectionStatus.suspicious.length > 0
    ) {
      ctx.fillStyle = "#ff8800";
      ctx.font = "12px Arial";
      const startY = 110; // YOLO11 is now default, always use extended layout
      faceDetectionStatus.suspicious.forEach((activity, index) => {
        ctx.fillText(
          `⚠️ ${activity.replace("_", " ").toUpperCase()}`,
          10,
          startY + index * 15
        );
      });
    }

    // Add legend for YOLO11 keypoint colors (bottom right)
    if (
      faceDetectionStatus.pose_keypoints &&
      faceDetectionStatus.pose_keypoints.length > 0
    ) {
      const legendX = canvas.width - 180;
      const legendY = canvas.height - 120;

      // Semi-transparent background for legend
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(legendX - 5, legendY - 15, 175, 110);

      ctx.font = "10px Arial";
      const legendItems = [
        { color: "#ff0000", text: "🔴 Nose" },
        { color: "#ffff00", text: "🟡 Eyes" },
        { color: "#ffa500", text: "🟠 Ears" },
        { color: "#00ffff", text: "🔵 Shoulders" },
        { color: "#8000ff", text: "🟣 Wrists" },
        { color: "#ff8000", text: "🟠 Hips" },
        { color: "#80ff00", text: "🟢 Knees" },
        { color: "#ff0080", text: "🔴 Ankles" },
      ];

      legendItems.forEach((item, index) => {
        ctx.fillStyle = item.color;
        ctx.fillText(item.text, legendX, legendY + index * 12);
      });
    }
  }, [faceDetectionStatus, sessionId]);

  // Face detection loop
  useEffect(() => {
    if (!webcamReady || !webcamRef.current) return;

    console.log("🔍 Starting debug face detection service");
    const faceDetectionInterval = setInterval(async () => {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        try {
          // Send frame to backend face detection service
          const response = await api.request("/api/v1/exam/verify-face", {
            method: "POST",
            body: JSON.stringify({
              candidate_id: 1,
              frame_data: imageSrc,
              session_id: sessionId,
            }),
          });

          const result = response;
          setFaceDetectionStatus({
            detected: result.face_detected,
            verified: result.identity_verified || false,
            confidence: result.confidence,
            suspicious: result.suspicious_activity || [],
            num_faces: result.num_faces || 0,
            face_direction: result.face_direction || "Unknown",
            analysis_type: result.analysis_type || "detection",
            face_rectangles: result.face_rectangles || [],
            mouth_regions: result.mouth_regions || [],
            frame_dimensions: result.frame_dimensions || {
              width: 640,
              height: 480,
            },
            pose_keypoints: result.pose_keypoints || [],
            pose_analysis: result.pose_analysis || {
              head_position: "unknown",
              body_posture: "unknown",
              hand_positions: "unknown",
              attention_direction: "unknown",
            },
            phone_detection: result.phone_detection || {
              phones_detected: false,
              phone_count: 0,
              phone_confidence: 0,
              phone_masks: [],
              phone_boxes: [],
            },
          });

          // Enhanced logging (YOLO11 now default for all sessions)
          console.log(
            `🤖 [YOLO11] Debug: ${
              result.face_detected ? "Person Detected" : "No Person"
            } | ` +
              `Persons: ${result.face_count || 0} | ` +
              `Confidence: ${Math.round((result.confidence || 0) * 100)}%`
          );

          if (result.pose_analysis) {
            console.log(
              `🎯 [YOLO11] Pose: Head=${result.pose_analysis.head_position} | ` +
                `Posture=${result.pose_analysis.body_posture} | ` +
                `Hands=${result.pose_analysis.hand_positions} | ` +
                `Attention=${result.pose_analysis.attention_direction}`
            );
          }

          if (result.phone_detection) {
            console.log(
              `📱 [YOLO11] Phone: ${
                result.phone_detection.phones_detected ? "DETECTED" : "None"
              } | ` +
                `Count: ${result.phone_detection.phone_count} | ` +
                `Confidence: ${Math.round(
                  (result.phone_detection.phone_confidence || 0) * 100
                )}%`
            );
          }
        } catch (error) {
          console.error("❌ Debug detection error:", error);
        }
      }
    }, 1000);

    return () => {
      clearInterval(faceDetectionInterval);
    };
  }, [webcamReady, sessionId]);

  // Update canvas overlay
  useEffect(() => {
    drawDetectionOverlay();
  }, [drawDetectionOverlay]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: "primary.main" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/")}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🔬 Debug Monitoring - YOLO11 Pose + Segmentation (AI Detection)
          </Typography>
          <IconButton color="inherit" onClick={toggleFullscreen}>
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Webcam Section */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                📹 Camera Feed with Detection Overlay
              </Typography>
              <Box sx={{ position: "relative", display: "inline-block" }}>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  onUserMedia={handleWebcamReady}
                  style={{
                    width: "100%",
                    maxWidth: 640,
                    height: "auto",
                    borderRadius: 8,
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Debug Panel */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                การควบคุมการสอบ (Debug Mode)
              </Typography>

              {/* Detection Status */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Detection Status:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  <Chip
                    size="small"
                    label={`👤 ${
                      faceDetectionStatus.detected ? "Detected" : "Not Detected"
                    }`}
                    color={faceDetectionStatus.detected ? "success" : "error"}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`🎯 ${Math.round(
                      (faceDetectionStatus.confidence || 0) * 100
                    )}%`}
                    color={
                      faceDetectionStatus.confidence > 0.7
                        ? "success"
                        : "warning"
                    }
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* YOLO11 Pose Analysis Panel (now available for all sessions) */}
              {true && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    bgcolor: "#f8f9fa",
                  }}
                >
                  <Typography
                    variant="body2"
                    gutterBottom
                    color="secondary"
                    sx={{ fontWeight: "bold" }}
                  >
                    🤖 [YOLO11] Advanced Pose Analysis
                  </Typography>

                  {/* Main Analysis Row */}
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}
                  >
                    <Chip
                      size="small"
                      label={`👤 Head: ${
                        faceDetectionStatus.pose_analysis?.head_position ||
                        "unknown"
                      }`}
                      color={
                        faceDetectionStatus.pose_analysis?.head_position ===
                        "normal"
                          ? "success"
                          : faceDetectionStatus.pose_analysis?.head_position ===
                            "looking_down"
                          ? "error"
                          : faceDetectionStatus.pose_analysis?.head_position ===
                            "looking_up"
                          ? "warning"
                          : "default"
                      }
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`🏃 Posture: ${
                        faceDetectionStatus.pose_analysis?.body_posture ||
                        "unknown"
                      }`}
                      color={
                        faceDetectionStatus.pose_analysis?.body_posture ===
                        "upright"
                          ? "success"
                          : faceDetectionStatus.pose_analysis?.body_posture ===
                            "leaning_forward"
                          ? "warning"
                          : faceDetectionStatus.pose_analysis?.body_posture ===
                            "slouching"
                          ? "error"
                          : "default"
                      }
                      variant="outlined"
                    />
                  </Box>

                  {/* Secondary Analysis Row */}
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}
                  >
                    <Chip
                      size="small"
                      label={`✋ Hands: ${
                        faceDetectionStatus.pose_analysis?.hand_positions ||
                        "unknown"
                      }`}
                      color={
                        faceDetectionStatus.pose_analysis?.hand_positions ===
                        "normal"
                          ? "success"
                          : faceDetectionStatus.pose_analysis
                              ?.hand_positions === "hand_near_face"
                          ? "warning"
                          : faceDetectionStatus.pose_analysis
                              ?.hand_positions === "hands_raised"
                          ? "info"
                          : "default"
                      }
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`👀 Attention: ${
                        faceDetectionStatus.pose_analysis
                          ?.attention_direction || "unknown"
                      }`}
                      color={
                        faceDetectionStatus.pose_analysis
                          ?.attention_direction === "forward"
                          ? "success"
                          : faceDetectionStatus.pose_analysis?.attention_direction?.includes(
                              "looking_left"
                            )
                          ? "warning"
                          : faceDetectionStatus.pose_analysis?.attention_direction?.includes(
                              "looking_right"
                            )
                          ? "warning"
                          : "default"
                      }
                      variant="outlined"
                    />
                  </Box>

                  {/* Detailed Keypoint Information */}
                  <Box
                    sx={{ mt: 1, p: 1, bgcolor: "#ffffff", borderRadius: 1 }}
                  >
                    <Typography
                      variant="caption"
                      color="info.main"
                      display="block"
                    >
                      🔗 Keypoints:{" "}
                      {faceDetectionStatus.pose_keypoints?.length > 0
                        ? `${faceDetectionStatus.pose_keypoints.length} person(s) detected`
                        : "0 detected"}
                    </Typography>

                    {faceDetectionStatus.pose_keypoints?.length > 0 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        📊 Points per person:{" "}
                        {faceDetectionStatus.pose_keypoints[0]?.length || 0}/17
                        keypoints
                      </Typography>
                    )}

                    {/* High-confidence keypoints display */}
                    {faceDetectionStatus.pose_keypoints?.length > 0 &&
                      faceDetectionStatus.pose_keypoints[0]?.length > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          <Typography
                            variant="caption"
                            color="success.main"
                            display="block"
                          >
                            🎯 High Confidence Keypoints:{" "}
                            {
                              faceDetectionStatus.pose_keypoints[0].filter(
                                (kp) => kp.confidence > 0.7
                              ).length
                            }
                            /17
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 0.25,
                              mt: 0.5,
                            }}
                          >
                            {faceDetectionStatus.pose_keypoints[0]
                              .filter((kp) => kp.confidence > 0.7)
                              .slice(0, 6) // Show only first 6 to avoid clutter
                              .map((kp, idx) => (
                                <Chip
                                  key={idx}
                                  size="small"
                                  label={`${kp.name.replace(
                                    "_",
                                    " "
                                  )}: ${Math.round(kp.confidence * 100)}%`}
                                  variant="outlined"
                                  sx={{ fontSize: "10px", height: "20px" }}
                                  color="success"
                                />
                              ))}
                          </Box>
                        </Box>
                      )}
                  </Box>

                  {/* Mobile Phone Detection Panel */}
                  <Box
                    sx={{ mt: 1, p: 1, bgcolor: "#ffffff", borderRadius: 1 }}
                  >
                    <Typography
                      variant="caption"
                      color="secondary.main"
                      display="block"
                      sx={{ fontWeight: "bold" }}
                    >
                      📱 Mobile Phone Detection (Segmentation)
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        mt: 0.5,
                      }}
                    >
                      <Chip
                        size="small"
                        label={`Phones: ${
                          faceDetectionStatus.phone_detection?.phone_count || 0
                        }`}
                        color={
                          faceDetectionStatus.phone_detection?.phones_detected
                            ? "error"
                            : "success"
                        }
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={`Confidence: ${Math.round(
                          (faceDetectionStatus.phone_detection
                            ?.phone_confidence || 0) * 100
                        )}%`}
                        color={
                          faceDetectionStatus.phone_detection
                            ?.phone_confidence > 0.5
                            ? "error"
                            : "default"
                        }
                        variant="outlined"
                      />
                    </Box>

                    {faceDetectionStatus.phone_detection?.phones_detected && (
                      <Typography
                        variant="caption"
                        color="error.main"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        🚨 Mobile phone detected with pixel-level segmentation!
                      </Typography>
                    )}
                  </Box>

                  {/* Suspicious Activity Alert */}
                  {faceDetectionStatus.suspicious &&
                    faceDetectionStatus.suspicious.length > 0 && (
                      <Box
                        sx={{
                          mt: 1,
                          p: 1,
                          bgcolor: "#fff3e0",
                          borderRadius: 1,
                          border: "1px solid #ffb74d",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="warning.main"
                          display="block"
                          sx={{ fontWeight: "bold" }}
                        >
                          ⚠️ Suspicious Activities Detected:
                        </Typography>
                        {faceDetectionStatus.suspicious.map((activity, idx) => (
                          <Typography
                            key={idx}
                            variant="caption"
                            color="warning.dark"
                            display="block"
                          >
                            • {activity.replace("_", " ").toUpperCase()}
                          </Typography>
                        ))}
                      </Box>
                    )}
                </Box>
              )}

              {/* Browser Activities */}
              <Box>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  Browser Activities:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  <Chip
                    size="small"
                    label={`🔄 Tab Switch (${debugActivities.tabSwitches})`}
                    color={
                      debugActivities.tabSwitches > 0 ? "warning" : "default"
                    }
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`📺 Fullscreen Exit (${debugActivities.fullscreenExits})`}
                    color={
                      debugActivities.fullscreenExits > 0
                        ? "warning"
                        : "default"
                    }
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* Debug Controls */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Debug Controls:
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      console.log(
                        "Current detection status:",
                        faceDetectionStatus
                      )
                    }
                  >
                    📊 Log Current Status
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      setFaceDetectionStatus((prev) => ({
                        ...prev,
                        suspicious: [],
                      }))
                    }
                  >
                    🧹 Clear Suspicious Activities
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default DebugMonitoring;
