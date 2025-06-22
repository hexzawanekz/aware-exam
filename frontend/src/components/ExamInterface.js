import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { useTimer } from "react-timer-hook";
import screenfull from "screenfull";
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Chip,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Fullscreen,
  Visibility,
  VisibilityOff,
  Warning,
  CheckCircle,
  Error,
  Timer,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useEffect as useEffectCanvas, useRef as useRefCanvas } from "react";
import { io } from "socket.io-client";
import api from "../services/api";

const ExamInterface = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);

  // State management
  const [examData, setExamData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [faceDetectionStatus, setFaceDetectionStatus] = useState({
    detected: sessionId?.startsWith("demo-") ? true : false,
    verified: sessionId?.startsWith("demo-") ? true : false,
    confidence: sessionId?.startsWith("demo-") ? 0.85 : 0,
    suspicious: [],
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
  const [violations, setViolations] = useState({
    tabSwitches: 0,
    fullscreenExits: 0,
    faceAbsence: 0,
  });

  // Debug panel states - ติดตาม activities แบบ real-time
  const [debugActivities, setDebugActivities] = useState({
    tabSwitches: 0,
    fullscreenExits: 0,
    lastTabSwitch: null,
    lastFullscreenExit: null,
  });

  const [examStarted, setExamStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [saveTimeouts, setSaveTimeouts] = useState({});
  const [webcamReady, setWebcamReady] = useState(false);

  // Timer setup - calculate expiry based on exam status
  // State for timer expiry timestamp
  const [timerExpiryTimestamp, setTimerExpiryTimestamp] = useState(
    new Date(Date.now() + 60 * 60 * 1000) // Default 1 hour
  );

  // Timer key to force re-initialization
  const [timerKey, setTimerKey] = useState(0);

  const {
    seconds,
    minutes,
    hours,
    days,
    isRunning,
    start,
    pause,
    resume,
    restart,
  } = useTimer({
    expiryTimestamp: timerExpiryTimestamp,
    onExpire: () => handleSubmitExam(true), // Auto-submit when time expires
    key: timerKey, // Force re-initialization when key changes
  });

  // Effect to restart timer when expiry timestamp changes
  useEffect(() => {
    if (timerExpiryTimestamp) {
      const now = new Date();
      const remainingMs = timerExpiryTimestamp.getTime() - now.getTime();
      const remainingSeconds = Math.floor(remainingMs / 1000);
      const displayMinutes = Math.floor(remainingSeconds / 60);
      const displaySeconds = remainingSeconds % 60;

      console.log(
        `🔄 Timer expiry timestamp changed, restarting timer to: ${timerExpiryTimestamp.toISOString()}`
      );
      console.log(
        `⏰ Should display: ${displayMinutes}:${displaySeconds
          .toString()
          .padStart(2, "0")}`
      );
      console.log(`📏 Remaining milliseconds: ${remainingMs}`);
      console.log(`🔑 Timer key: ${timerKey}`);

      restart(timerExpiryTimestamp);
    }
  }, [timerExpiryTimestamp, timerKey, restart]);

  // Initialize face detection status for all sessions
  useEffect(() => {
    if (sessionId) {
      // Initialize face detection status for all sessions (real database sessions only)
      console.log(
        "🔍 Initializing face detection status for session:",
        sessionId
      );

      setFaceDetectionStatus({
        detected: false,
        verified: false,
        confidence: 0,
        suspicious: [],
      });
    }
  }, [sessionId]);

  // Load exam data from database API
  useEffect(() => {
    const loadExamData = async () => {
      try {
        console.log(
          "🔍 Loading exam data from database API for session:",
          sessionId
        );
        const apiResponse = await api.request(
          `/api/v1/exam/sessions/${sessionId}/status`
        );
        console.log("✅ Database exam data loaded successfully");
        console.log("📊 Backend Response:", {
          status: apiResponse.status,
          remaining_time_seconds: apiResponse.remaining_time_seconds,
          start_time: apiResponse.start_time,
          duration_minutes: apiResponse.duration_minutes,
        });
        setExamData(apiResponse);

        // Load saved answers for resume functionality
        const localStorageKey = `exam_answers_${sessionId}`;
        let mergedAnswers = {};

        // First, load from localStorage
        try {
          const localAnswers = JSON.parse(
            localStorage.getItem(localStorageKey) || "{}"
          );
          Object.entries(localAnswers).forEach(([questionId, answerData]) => {
            if (answerData && answerData.answer !== undefined) {
              mergedAnswers[questionId] = answerData.answer;
            }
          });
          const codingAnswers = Object.entries(localAnswers).filter(
            ([_, data]) => data.answerLength && data.answerLength > 50
          ).length;
          console.log(
            `💾 Loaded ${
              Object.keys(mergedAnswers).length
            } answers from localStorage (${codingAnswers} coding answers)`
          );
        } catch (error) {
          console.error("❌ Failed to load from localStorage:", error);
        }

        // Then, merge with backend answers (backend takes priority for conflicts)
        if (apiResponse.answers) {
          Object.entries(apiResponse.answers).forEach(
            ([questionId, answerData]) => {
              // Handle both old format (direct answer) and new format (with timestamp)
              if (
                typeof answerData === "object" &&
                answerData.answer !== undefined
              ) {
                mergedAnswers[questionId] = answerData.answer;
              } else {
                mergedAnswers[questionId] = answerData;
              }
            }
          );
          console.log(
            `🔄 Merged with ${
              Object.keys(apiResponse.answers).length
            } answers from backend`
          );
        }

        setAnswers(mergedAnswers);
        console.log(
          `✅ Total resumed answers: ${Object.keys(mergedAnswers).length}`
        );

        // Auto-resume exam if it's already in progress (not failed)
        if (
          apiResponse.status === "in_progress" &&
          apiResponse.remaining_time_seconds > 0
        ) {
          setExamStarted(true);
          // Set timer expiry timestamp based on remaining time from backend
          const now = new Date();
          const expiryTime = new Date(
            now.getTime() + apiResponse.remaining_time_seconds * 1000
          );
          console.log(
            `⏰ Timer Debug: Now=${now.toISOString()}, Remaining=${
              apiResponse.remaining_time_seconds
            }s, ExpiryTime=${expiryTime.toISOString()}`
          );
          console.log(
            `🔧 Setting timer expiry to: ${expiryTime.toISOString()} (${
              apiResponse.remaining_time_seconds
            } seconds from now)`
          );
          setTimerExpiryTimestamp(expiryTime);
          setTimerKey((prev) => prev + 1); // Force timer re-initialization
          console.log(
            `🔄 Resuming exam with ${apiResponse.remaining_time_seconds} seconds remaining...`
          );
        } else if (
          apiResponse.status === "failed" ||
          apiResponse.remaining_time_seconds <= 0
        ) {
          // Don't auto-resume failed or expired sessions
          console.log("⚠️ Session is failed or expired, not auto-resuming");
        }
      } catch (error) {
        console.error("❌ Error loading exam data from database:", error);
        // Redirect to exam selection if session not found
        navigate("/exam");
      }
    };

    if (sessionId) {
      loadExamData();
    }
  }, [sessionId, navigate]);

  // Periodic sync of localStorage answers to backend (every 30 seconds)
  useEffect(() => {
    if (!examStarted || !sessionId) return;

    const syncInterval = setInterval(async () => {
      const localStorageKey = `exam_answers_${sessionId}`;
      try {
        const localAnswers = JSON.parse(
          localStorage.getItem(localStorageKey) || "{}"
        );
        const answersToSync = Object.keys(localAnswers);

        if (answersToSync.length > 0) {
          console.log(
            `🔄 Syncing ${answersToSync.length} answers from localStorage to backend...`
          );

          // Sync each answer that might not be in backend yet
          for (const [questionId, answerData] of Object.entries(localAnswers)) {
            try {
              await api.request(
                `/api/v1/exam/sessions/${sessionId}/save-answer`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    question_id: questionId,
                    answer: answerData.answer,
                    timestamp: answerData.timestamp,
                  }),
                }
              );
            } catch (error) {
              console.error(`❌ Failed to sync answer ${questionId}:`, error);
            }
          }
        }
      } catch (error) {
        console.error("❌ Failed to sync localStorage to backend:", error);
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [examStarted, sessionId]);

  // Security measures
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable copy/paste
    const handleKeyDown = (e) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+U
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
        (e.ctrlKey && e.shiftKey && e.keyCode === 67) || // Ctrl+Shift+C
        (e.ctrlKey && e.keyCode === 85) || // Ctrl+U
        (e.ctrlKey && e.keyCode === 67) || // Ctrl+C
        (e.ctrlKey && e.keyCode === 86) || // Ctrl+V
        (e.ctrlKey && e.keyCode === 65) // Ctrl+A
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Detect tab switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const timestamp = new Date().toISOString();

        // Update debug activities (ทำงานตลอดเวลา ไม่ต้องรอ exam start)
        setDebugActivities((prev) => ({
          ...prev,
          tabSwitches: prev.tabSwitches + 1,
          lastTabSwitch: timestamp,
        }));

        console.log("🔄 [DEBUG] Tab Switch Detected:", {
          count: debugActivities.tabSwitches + 1,
          timestamp,
        });

        // Update violations (เฉพาะเมื่อ exam เริ่มแล้ว)
        if (examStarted) {
          setViolations((prev) => ({
            ...prev,
            tabSwitches: prev.tabSwitches + 1,
          }));

          // Log to backend database
          api
            .request(`/api/v1/exam/sessions/${sessionId}/log-activity`, {
              method: "POST",
              body: JSON.stringify({
                type: "tab_switch",
                timestamp,
              }),
            })
            .catch((error) => {
              console.error("Failed to log tab switch activity:", error);
            });
        }
      }
    };

    // Detect fullscreen changes
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = screenfull.isFullscreen;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen) {
        const timestamp = new Date().toISOString();

        // Update debug activities (ทำงานตลอดเวลา)
        setDebugActivities((prev) => ({
          ...prev,
          fullscreenExits: prev.fullscreenExits + 1,
          lastFullscreenExit: timestamp,
        }));

        console.log("📺 [DEBUG] Fullscreen Exit Detected:", {
          count: debugActivities.fullscreenExits + 1,
          timestamp,
        });

        // Update violations และแสดง warning (เฉพาะเมื่อ exam เริ่มแล้ว)
        if (examStarted) {
          setViolations((prev) => ({
            ...prev,
            fullscreenExits: prev.fullscreenExits + 1,
          }));
          setShowFullscreenWarning(true);

          // Log to backend database
          api
            .request(`/api/v1/exam/sessions/${sessionId}/log-activity`, {
              method: "POST",
              body: JSON.stringify({
                type: "fullscreen_exit",
                timestamp,
              }),
            })
            .catch((error) => {
              console.error("Failed to log fullscreen exit activity:", error);
            });
        }
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (screenfull.isEnabled) {
      screenfull.on("change", handleFullscreenChange);
    }

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (screenfull.isEnabled) {
        screenfull.off("change", handleFullscreenChange);
      }
    };
  }, [examStarted, sessionId]);

  // Canvas overlay for drawing detection rectangles
  useEffect(() => {
    if (!canvasRef.current || !faceDetectionStatus.face_rectangles) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face rectangles
    if (faceDetectionStatus.face_rectangles.length > 0) {
      ctx.strokeStyle = "#00ff00"; // Green for faces
      ctx.lineWidth = 2;

      faceDetectionStatus.face_rectangles.forEach((rect, index) => {
        // Scale coordinates from original frame to canvas size
        const scaleX =
          canvas.width / faceDetectionStatus.frame_dimensions.width;
        const scaleY =
          canvas.height / faceDetectionStatus.frame_dimensions.height;

        const x = rect.x * scaleX;
        const y = rect.y * scaleY;
        const width = rect.width * scaleX;
        const height = rect.height * scaleY;

        // Draw rectangle
        ctx.strokeRect(x, y, width, height);

        // Draw face number label
        ctx.fillStyle = "#00ff00";
        ctx.font = "16px Arial";
        ctx.fillText(`Face ${index + 1}`, x, y - 5);
      });
    }

    // Draw mouth regions for talking detection
    if (faceDetectionStatus.mouth_regions.length > 0) {
      ctx.strokeStyle = "#ff6600"; // Orange for mouth regions
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]); // Dashed line for mouth regions

      faceDetectionStatus.mouth_regions.forEach((mouth, index) => {
        // Scale coordinates from original frame to canvas size
        const scaleX =
          canvas.width / faceDetectionStatus.frame_dimensions.width;
        const scaleY =
          canvas.height / faceDetectionStatus.frame_dimensions.height;

        const x = mouth.x * scaleX;
        const y = mouth.y * scaleY;
        const width = mouth.width * scaleX;
        const height = mouth.height * scaleY;

        // Draw dashed rectangle for mouth region
        ctx.strokeRect(x, y, width, height);

        // Draw mouth region label
        ctx.fillStyle = "#ff6600";
        ctx.font = "12px Arial";
        ctx.fillText(`👄 Mouth ${index + 1}`, x, y - 5);
      });

      // Reset line dash
      ctx.setLineDash([]);
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
          [5, 6], // shoulders
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

    // Add detection status text with enhanced YOLO11 information
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
      const startY = 95; // YOLO11 is now default, always use extended layout
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
  }, [faceDetectionStatus]);

  // Face detection loop - เริ่มทำงานทันทีที่มี webcam (ไม่ต้องรอ start exam)
  useEffect(() => {
    if (!webcamReady || !webcamRef.current) return;

    // Real YOLO11 face detection for all sessions (including demo sessions)
    if (true) {
      // Real YOLO11 face detection for all sessions (including demo sessions)
      console.log(
        `🤖 Starting YOLO11 face detection service for session: ${sessionId}`
      );
      const faceDetectionInterval = setInterval(async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          try {
            // Send frame to backend face detection service
            const response = await api.request("/api/v1/exam/verify-face", {
              method: "POST",
              body: JSON.stringify({
                candidate_id: examData?.candidate_id || 1,
                frame_data: imageSrc,
                session_id: sessionId, // Pass session ID to select detection service
              }),
            });

            console.log("📡 Face detection API call successful");

            const result = response; // API returns data directly
            setFaceDetectionStatus({
              detected: result.face_detected,
              verified: result.identity_verified || false,
              confidence: result.confidence,
              suspicious: result.suspicious_activity || [],
              num_faces: result.num_faces || 0,
              face_direction: result.face_direction || "Unknown",
              analysis_type: result.analysis_type || "opencv_detection",
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

            // Enhanced logging based on detection service
            // YOLO11 specific logging for all sessions
            if (true) {
              // All sessions now use YOLO11 pose + segmentation detection
              console.log(
                `🤖 [YOLO11] Pose detection: ${
                  result.face_detected ? "Person Detected" : "No Person"
                } | Persons: ${
                  result.face_count || 0
                } | Confidence: ${Math.round((result.confidence || 0) * 100)}%`
              );

              // Log pose analysis details
              if (result.pose_analysis) {
                console.log(
                  `🎯 [YOLO11] Pose Analysis - Head: ${result.pose_analysis.head_position} | ` +
                    `Posture: ${result.pose_analysis.body_posture} | ` +
                    `Hands: ${result.pose_analysis.hand_positions} | ` +
                    `Attention: ${result.pose_analysis.attention_direction}`
                );
              }

              // Log keypoint information
              if (result.pose_keypoints && result.pose_keypoints.length > 0) {
                const totalKp = result.pose_keypoints[0]?.length || 0;
                const highConfKp =
                  result.pose_keypoints[0]?.filter((kp) => kp.confidence > 0.7)
                    .length || 0;
                console.log(
                  `🔗 [YOLO11] Keypoints: ${highConfKp}/${totalKp} high confidence | ` +
                    `Persons detected: ${result.pose_keypoints.length}`
                );
              }

              // Log phone detection information
              if (result.phone_detection) {
                console.log(
                  `📱 [YOLO11] Phone Detection: ${
                    result.phone_detection.phones_detected ? "DETECTED" : "None"
                  } | ` +
                    `Count: ${result.phone_detection.phone_count} | ` +
                    `Confidence: ${Math.round(
                      (result.phone_detection.phone_confidence || 0) * 100
                    )}%`
                );

                if (result.phone_detection.phones_detected) {
                  console.log(
                    `🎯 [YOLO11] Phone Segmentation: ${
                      result.phone_detection.phone_masks?.length || 0
                    } masks | ` +
                      `${
                        result.phone_detection.phone_boxes?.length || 0
                      } bounding boxes`
                  );
                }
              }
            } else {
              // OpenCV specific logging
              console.log(
                `🎯 [OPENCV] Face detection: ${
                  result.face_detected ? "Detected" : "Not detected"
                } | Faces: ${result.num_faces || 0} | Direction: ${
                  result.face_direction || "Unknown"
                } | Confidence: ${Math.round((result.confidence || 0) * 100)}%`
              );
            }

            // Show success notification for real detection
            if (result.face_detected) {
              console.log(
                "✅ Face detection successful - Real camera working!"
              );
            }

            // Log suspicious activities - Enhanced for both systems
            if (
              result.suspicious_activity &&
              result.suspicious_activity.length > 0
            ) {
              result.suspicious_activity.forEach((activity) => {
                // YOLO11 specific suspicious activity logging (now default for all sessions)
                switch (activity) {
                  case "head_down_detected":
                    console.warn(
                      "🔽 [YOLO11] หัวก้มลง - Head looking down detected"
                    );
                    break;
                  case "looking_away_detected":
                    console.warn(
                      "👀 [YOLO11] มองไปที่อื่น - Looking away detected"
                    );
                    break;
                  case "hand_near_face_detected":
                    console.warn(
                      "✋ [YOLO11] มือใกล้หน้า - Hand near face detected"
                    );
                    break;
                  case "suspicious_posture_detected":
                    console.warn(
                      "🏃 [YOLO11] ท่าทางน่าสงสัย - Suspicious posture detected"
                    );
                    break;
                  case "attention_diverted":
                    console.warn(
                      "🎯 [YOLO11] สมาธิเสียโฟกัส - Attention diverted"
                    );
                    break;
                  case "prolonged_absence_detected":
                    console.warn(
                      "👻 [YOLO11] หายไปนานเกินไป - Prolonged absence detected"
                    );
                    break;
                  case "mobile_phone_detected":
                    console.warn(
                      "📱 [YOLO11] โทรศัพท์มือถือตรวจพบ - Mobile phone detected"
                    );
                    break;
                  case "phone_usage_suspected":
                    console.warn(
                      "📞 [YOLO11] สงสัยใช้โทรศัพท์ - Phone usage suspected"
                    );
                    break;
                  case "confirmed_phone_usage":
                    console.warn(
                      "🚨 [YOLO11] ยืนยันการใช้โทรศัพท์ - Confirmed phone usage"
                    );
                    break;
                  default:
                    console.warn(
                      `⚠️ [YOLO11] กิจกรรมน่าสงสัย - Suspicious activity: ${activity}`
                    );
                }
              });

              // Enhanced detection summary logging (YOLO11 now default)
              console.log("📊 [YOLO11] Pose Detection Summary:", {
                activities: result.suspicious_activity,
                num_persons: result.face_count,
                pose_analysis: result.pose_analysis,
                keypoints_detected: result.pose_keypoints?.length || 0,
                analysis_type: "yolo11_pose",
                timestamp: new Date().toISOString(),
                session_id: sessionId,
                confidence: result.confidence,
              });
            }

            // Note: WebSocket disabled for real sessions to avoid 404 errors
            // Real-time monitoring happens through HTTP API calls
            console.log(
              "📡 Face detection result sent via HTTP API (WebSocket disabled)"
            );
          } catch (error) {
            console.error("❌ Face detection error:", error);

            // Check if it's a network error or API error
            if (error.response) {
              console.error(
                "API Error:",
                error.response.status,
                error.response.data
              );
            } else if (error.request) {
              console.error("Network Error: No response from backend");
            } else {
              console.error("Request Error:", error.message);
            }

            // Fallback to basic detection status
            setFaceDetectionStatus((prev) => ({
              ...prev,
              detected: false,
              verified: false,
              confidence: 0,
              suspicious: ["detection_error"],
              num_faces: 0,
              face_direction: "Error",
              analysis_type: "error",
            }));
          }
        }
      }, 1000); // Fast real-time detection - 1 second

      return () => {
        clearInterval(faceDetectionInterval);
      };
    }
  }, [webcamReady, sessionId, examData]);

  const handleStartExam = async () => {
    try {
      // Enable fullscreen
      if (screenfull.isEnabled) {
        await screenfull.request();
      }

      // Start exam via database API
      const response = await api.request(
        `/api/v1/exam/sessions/${sessionId}/start`,
        {
          method: "POST",
          body: JSON.stringify({
            candidate_id: examData.candidate_id,
            timestamp: new Date().toISOString(),
          }),
        }
      );
      setExamData(response); // API returns updated exam data

      setExamStarted(true);

      // Start timer with full duration for new exam
      const newExpiryTime = new Date();
      newExpiryTime.setSeconds(
        newExpiryTime.getSeconds() + (examData?.duration_minutes || 60) * 60
      );
      setTimerExpiryTimestamp(newExpiryTime);
      setTimerKey((prev) => prev + 1); // Force timer re-initialization
    } catch (error) {
      console.error("Error starting exam:", error);
    }
  };

  const handleAnswerChange = async (questionId, answer) => {
    // Update local state immediately
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    // Save to localStorage immediately for offline persistence
    const localStorageKey = `exam_answers_${sessionId}`;
    try {
      const existingAnswers = JSON.parse(
        localStorage.getItem(localStorageKey) || "{}"
      );
      const answerLength = answer ? answer.toString().length : 0;
      const updatedAnswers = {
        ...existingAnswers,
        [questionId]: {
          answer: answer,
          timestamp: new Date().toISOString(),
          savedAt: Date.now(),
          answerLength: answerLength,
          answerType: answerLength > 50 ? "coding" : "choice",
        },
      };
      localStorage.setItem(localStorageKey, JSON.stringify(updatedAnswers));
      setLastSavedTime(new Date());

      // Enhanced logging for coding vs choice answers
      if (answerLength > 50) {
        console.log(
          `💾 Saved coding answer to localStorage for question ${questionId} (${answerLength} characters)`
        );
      } else {
        console.log(
          `💾 Saved answer to localStorage for question ${questionId}`
        );
      }
    } catch (error) {
      console.error("❌ Failed to save to localStorage:", error);

      // Handle storage quota exceeded for large coding answers
      if (error.name === "QuotaExceededError" || error.code === 22) {
        console.warn(
          "⚠️ localStorage quota exceeded, trying to save simplified version..."
        );
        try {
          // Save just the answer without metadata for large content
          const simpleAnswers = JSON.parse(
            localStorage.getItem(localStorageKey) || "{}"
          );
          simpleAnswers[questionId] = answer;
          localStorage.setItem(localStorageKey, JSON.stringify(simpleAnswers));
          setLastSavedTime(new Date());
          console.log(
            `💾 Saved simplified coding answer for question ${questionId}`
          );
        } catch (fallbackError) {
          console.error(
            "❌ Failed to save even simplified answer:",
            fallbackError
          );
          // Still show save indicator even if localStorage fails
          setLastSavedTime(new Date());
        }
      }
    }

    // Auto-save to backend if exam has started
    if (examStarted && sessionId) {
      try {
        await api.request(`/api/v1/exam/sessions/${sessionId}/save-answer`, {
          method: "POST",
          body: JSON.stringify({
            question_id: questionId,
            answer: answer,
            timestamp: new Date().toISOString(),
          }),
        });
        const answerLength = answer ? answer.toString().length : 0;
        if (answerLength > 50) {
          console.log(
            `✅ Auto-saved coding answer for question ${questionId} (${answerLength} characters)`
          );
        } else {
          console.log(`✅ Auto-saved answer for question ${questionId}`);
        }
      } catch (error) {
        console.error("❌ Failed to auto-save answer:", error);
      }
    }
  };

  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Submit exam to database API
      await api.request(`/api/v1/exam/sessions/${sessionId}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers,
          isAutoSubmit,
          submissionTime: new Date().toISOString(),
        }),
      });

      // Clean up localStorage after successful submission
      const localStorageKey = `exam_answers_${sessionId}`;
      try {
        localStorage.removeItem(localStorageKey);
        console.log(`🧹 Cleaned up localStorage for session ${sessionId}`);
      } catch (error) {
        console.error("❌ Failed to clean localStorage:", error);
      }

      // Exit fullscreen
      if (screenfull.isEnabled && screenfull.isFullscreen) {
        await screenfull.exit();
      }

      navigate("/exam-completed");
    } catch (error) {
      console.error("Error submitting exam:", error);
      setIsSubmitting(false);
    }
  };

  const handleFullscreenWarningResponse = (continueExam) => {
    setShowFullscreenWarning(false);

    if (continueExam) {
      if (screenfull.isEnabled) {
        screenfull.request();
      }
    } else {
      handleSubmitExam();
    }
  };

  const getCurrentQuestion = () => {
    return examData?.questions?.[currentQuestion];
  };

  const renderQuestion = () => {
    const question = getCurrentQuestion();
    if (!question) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t("exam.question")} {currentQuestion + 1} {t("exam.of")}{" "}
            {examData.questions.length}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {question.question}
          </Typography>

          {/* Show criteria and points for all question types */}
          {question.Criteria && (
            <Box sx={{ mb: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                <strong>🎯 Criteria:</strong> {question.Criteria}
              </Typography>
              <Typography variant="body2" color="secondary">
                <strong>💎 Points:</strong> {question.points || question.score}{" "}
                points
              </Typography>
            </Box>
          )}

          {question.type === "multiple_choice" && (
            <Box>
              {question.options.map((option, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Button
                    variant={
                      answers[question.id] === option ? "contained" : "outlined"
                    }
                    fullWidth
                    onClick={() => handleAnswerChange(question.id, option)}
                    sx={{ textAlign: "left", justifyContent: "flex-start" }}
                  >
                    {option}
                  </Button>
                </Box>
              ))}
            </Box>
          )}

          {question.type === "coding" && (
            <Box>
              {question.sample_input && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Sample Input:</strong> {question.sample_input}
                </Typography>
              )}
              {question.sample_output && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Sample Output:</strong> {question.sample_output}
                </Typography>
              )}

              {/* Code Editor with Line Numbers */}
              <Box
                sx={{
                  border: "1px solid #ccc",
                  borderRadius: 1,
                  overflow: "hidden",
                  backgroundColor: "#f8f9fa",
                }}
              >
                {/* Editor Header */}
                <Box
                  sx={{
                    backgroundColor: "#e9ecef",
                    padding: "8px 12px",
                    borderBottom: "1px solid #ccc",
                    fontSize: "12px",
                    color: "#6c757d",
                    fontFamily: "monospace",
                  }}
                >
                  💻 Code Editor - Question {currentQuestion + 1}
                </Box>

                {/* Code Area with Line Numbers */}
                <Box
                  sx={{
                    display: "flex",
                    minHeight: 250,
                    backgroundColor: "#ffffff",
                  }}
                >
                  {/* Line Numbers */}
                  <Box
                    sx={{
                      backgroundColor: "#f8f9fa",
                      borderRight: "1px solid #e9ecef",
                      padding: "12px 8px",
                      fontSize: "14px",
                      fontFamily: "monospace",
                      color: "#6c757d",
                      lineHeight: "20px",
                      userSelect: "none",
                      minWidth: "50px",
                      textAlign: "right",
                    }}
                  >
                    {(() => {
                      const lines = (answers[question.id] || "").split("\n");
                      const totalLines = Math.max(15, lines.length);

                      return Array.from({ length: totalLines }, (_, index) => (
                        <div
                          key={index}
                          style={{
                            height: "20px",
                            color: index < lines.length ? "#495057" : "#ced4da",
                            fontWeight: index < lines.length ? "normal" : "300",
                          }}
                        >
                          {index + 1}
                        </div>
                      ));
                    })()}
                  </Box>

                  {/* Code Input Area */}
                  <textarea
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      // Handle Tab key for indentation
                      if (e.key === "Tab") {
                        e.preventDefault();
                        const start = e.target.selectionStart;
                        const end = e.target.selectionEnd;
                        const value = e.target.value;
                        const newValue =
                          value.substring(0, start) +
                          "    " +
                          value.substring(end);
                        handleAnswerChange(question.id, newValue);
                        // Set cursor position after the inserted spaces
                        setTimeout(() => {
                          e.target.selectionStart = e.target.selectionEnd =
                            start + 4;
                        }, 0);
                      }
                    }}
                    placeholder={`// ${t("exam.enter_answer")}
// Example:
function solution() {
    // Your code here
    return result;
}`}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      padding: "12px",
                      fontSize: "14px",
                      fontFamily:
                        "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
                      lineHeight: "20px",
                      resize: "none",
                      backgroundColor: "transparent",
                      minHeight: "226px", // 250px - header height
                      scrollbarWidth: "thin",
                      scrollbarColor: "#c1c1c1 #f1f1f1",
                    }}
                  />
                </Box>

                {/* Editor Footer with Stats */}
                <Box
                  sx={{
                    backgroundColor: "#f8f9fa",
                    padding: "4px 12px",
                    borderTop: "1px solid #e9ecef",
                    fontSize: "11px",
                    color: "#6c757d",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    Lines: {(answers[question.id] || "").split("\n").length} |
                    Characters: {(answers[question.id] || "").length}
                  </span>
                  <span>💾 Auto-save enabled</span>
                </Box>
              </Box>
            </Box>
          )}

          {question.type === "text" && (
            <textarea
              value={answers[question.id] || ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder={t("exam.enter_answer")}
              style={{
                width: "100%",
                minHeight: 150,
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 4,
                fontSize: 16,
                fontFamily: "inherit",
              }}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  if (!examData) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <LinearProgress />
        <Typography>{t("messages.loading")}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* System Status Banner */}
      <Box
        sx={{
          bgcolor: "success.main",
          color: "white",
          p: 1,
          textAlign: "center",
          fontSize: "14px",
        }}
      >
        🤖 YOLO11 AI SYSTEM - ระบบตรวจจับการโกงด้วย AI | Real-time pose
        detection กำลังทำงาน
      </Box>

      {/* Header with timer and status */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5">{t("exam.title")}</Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Timer */}
          <Chip
            icon={<Timer />}
            label={`${hours}:${minutes}:${seconds}`}
            color={minutes < 5 ? "error" : "primary"}
            variant="outlined"
          />

          {/* Auto-save indicator */}
          {lastSavedTime && (
            <Chip
              size="small"
              icon={<CheckCircle />}
              label={`💾 Saved ${new Date(lastSavedTime).toLocaleTimeString()}`}
              color="success"
              variant="outlined"
            />
          )}

          {/* Face detection status */}
          <Chip
            icon={faceDetectionStatus.detected ? <CheckCircle /> : <Error />}
            label={
              faceDetectionStatus.detected
                ? t("proctoring.face_detected")
                : t("proctoring.face_not_detected")
            }
            color={faceDetectionStatus.detected ? "success" : "error"}
            variant="outlined"
          />

          {/* Fullscreen status */}
          <Chip
            icon={<Fullscreen />}
            label={isFullscreen ? "Fullscreen" : "Windowed"}
            color={isFullscreen ? "success" : "warning"}
            variant="outlined"
          />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Main exam area */}
        <Grid item xs={12} md={8}>
          {!examStarted ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h4" gutterBottom>
                {examData.status === "in_progress" &&
                examData.remaining_time_seconds > 0
                  ? t("exam.resume_exam")
                  : t("exam.start_exam")}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {t("exam.duration")}: {examData.duration_minutes}{" "}
                {t("exam.minutes")}
              </Typography>
              {examData.status === "in_progress" &&
                examData.remaining_time_seconds > 0 &&
                Object.keys(answers).length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t("exam.exam_resumed")} ({Object.keys(answers).length}{" "}
                    คำตอบ)
                  </Alert>
                )}
              {(examData.status === "failed" ||
                examData.remaining_time_seconds <= 0) && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  เซสชันหมดเวลาหรือมีปัญหา - คลิกเพื่อเริ่มใหม่
                </Alert>
              )}
              <Button
                variant="contained"
                size="large"
                onClick={handleStartExam}
                disabled={!webcamReady}
              >
                {examData.status === "in_progress" &&
                examData.remaining_time_seconds > 0
                  ? t("exam.resume_exam")
                  : t("exam.start_exam")}
              </Button>
              {!webcamReady && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {t("proctoring.camera_required")}
                </Alert>
              )}
            </Paper>
          ) : (
            <Box>
              {renderQuestion()}

              {/* Navigation buttons */}
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
              >
                <Button
                  variant="outlined"
                  onClick={() =>
                    setCurrentQuestion(Math.max(0, currentQuestion - 1))
                  }
                  disabled={currentQuestion === 0}
                >
                  {t("exam.previous")}
                </Button>

                <Box sx={{ display: "flex", gap: 2 }}>
                  {currentQuestion < examData.questions.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    >
                      {t("exam.next")}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleSubmitExam()}
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? t("messages.loading")
                        : t("exam.submit_exam")}
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Grid>

        {/* Sidebar with camera and monitoring */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t("proctoring.title")}
            </Typography>

            {/* Webcam with Detection Overlay */}
            <Box sx={{ mb: 2, position: "relative" }}>
              <Webcam
                ref={webcamRef}
                audio={false}
                width="100%"
                height="auto"
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "user",
                }}
                onUserMedia={() => {
                  console.log("📹 Webcam ready!");
                  setWebcamReady(true);
                  // For real sessions, set initial face detection status to allow exam start
                  if (!sessionId?.startsWith("demo-")) {
                    setFaceDetectionStatus((prev) => ({
                      ...prev,
                      detected: true, // Allow exam to start once camera is ready
                    }));
                  }
                }}
                onUserMediaError={(error) => {
                  console.error("❌ Webcam error:", error);
                  setWebcamReady(false);
                }}
              />
              {/* Detection Overlay Canvas */}
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "auto",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
            </Box>

            {/* Face detection info */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {t("proctoring.face_detection")}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                <Chip
                  size="small"
                  label={
                    faceDetectionStatus.detected
                      ? `✅ ตรวจพบ (${Math.round(
                          faceDetectionStatus.confidence * 100
                        )}%)`
                      : "❌ ไม่พบใบหน้า"
                  }
                  color={faceDetectionStatus.detected ? "success" : "error"}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={
                    faceDetectionStatus.verified
                      ? "🔐 ยืนยันแล้ว"
                      : "🔓 ยังไม่ยืนยัน"
                  }
                  color={faceDetectionStatus.verified ? "success" : "warning"}
                  variant="outlined"
                />
              </Box>
              {webcamReady && (
                <Typography
                  variant="caption"
                  display="block"
                  color="success.main"
                >
                  📹 กล้องพร้อมใช้งาน - Face Detection กำลังทำงาน
                </Typography>
              )}
            </Box>

            {/* OpenCV Detection Panel */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom color="primary">
                🎯 [OPENCV] Detection Status
              </Typography>

              {/* Face Detection Status */}
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  Face Analysis:
                </Typography>
                <Box
                  sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}
                >
                  <Chip
                    size="small"
                    label={`👤 Faces: ${faceDetectionStatus.num_faces || 0}`}
                    color={
                      (faceDetectionStatus.num_faces || 0) === 1
                        ? "success"
                        : "warning"
                    }
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`👁️ Direction: ${
                      faceDetectionStatus.face_direction || "Unknown"
                    }`}
                    color={
                      faceDetectionStatus.face_direction === "Forward"
                        ? "success"
                        : faceDetectionStatus.face_direction === "None"
                        ? "error"
                        : "warning"
                    }
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`📊 Confidence: ${Math.round(
                      (faceDetectionStatus.confidence || 0) * 100
                    )}%`}
                    color={
                      (faceDetectionStatus.confidence || 0) > 0.7
                        ? "success"
                        : (faceDetectionStatus.confidence || 0) > 0.3
                        ? "warning"
                        : "error"
                    }
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* Suspicious Activities */}
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  Suspicious Activities:
                </Typography>
                {faceDetectionStatus.suspicious &&
                faceDetectionStatus.suspicious.length > 0 ? (
                  faceDetectionStatus.suspicious.map((activity, index) => (
                    <Chip
                      key={index}
                      size="small"
                      label={
                        activity === "head_turned_away"
                          ? "🔄 หันหน้าไปทางอื่น"
                          : activity === "digital_device_detected"
                          ? "📱 อุปกรณ์ดิจิทัล"
                          : activity === "prolonged_absence_detected"
                          ? "👻 หายไปนาน"
                          : activity === "head_down_detected"
                          ? "🔍 ก้มหน้า"
                          : activity === "talking_detected"
                          ? "🗣️ พูดคุย"
                          : `⚠️ ${activity}`
                      }
                      color="warning"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))
                ) : (
                  <Typography variant="caption" color="success.main">
                    ✅ ไม่พบกิจกรรมน่าสงสัย
                  </Typography>
                )}
              </Box>

              {/* YOLO11 Pose Analysis Panel (now available for all sessions) */}
              {
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
                              .slice(0, 8) // Show only first 8 to avoid clutter
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
              }

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
                {(debugActivities.lastTabSwitch ||
                  debugActivities.lastFullscreenExit) && (
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {debugActivities.lastTabSwitch && (
                      <>
                        Last Tab Switch:{" "}
                        {new Date(
                          debugActivities.lastTabSwitch
                        ).toLocaleTimeString()}
                        <br />
                      </>
                    )}
                    {debugActivities.lastFullscreenExit && (
                      <>
                        Last Fullscreen Exit:{" "}
                        {new Date(
                          debugActivities.lastFullscreenExit
                        ).toLocaleTimeString()}
                      </>
                    )}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Violations */}
            <Box>
              <Typography variant="body2" gutterBottom>
                {t("security.violation_count")}
              </Typography>
              <Typography variant="caption" display="block">
                {t("security.tab_switch_detected")}: {violations.tabSwitches}
              </Typography>
              <Typography variant="caption" display="block">
                Fullscreen exits: {violations.fullscreenExits}
              </Typography>
              <Typography variant="caption" display="block">
                {t("proctoring.face_not_detected")}: {violations.faceAbsence}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Fullscreen warning dialog */}
      <Dialog open={showFullscreenWarning} disableEscapeKeyDown>
        <DialogTitle>
          <Warning color="warning" sx={{ mr: 1 }} />
          {t("fullscreen.warning")}
        </DialogTitle>
        <DialogContent>
          <Typography>{t("fullscreen.exit_warning")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleFullscreenWarningResponse(false)}>
            {t("fullscreen.end_exam")}
          </Button>
          <Button
            onClick={() => handleFullscreenWarningResponse(true)}
            variant="contained"
          >
            {t("fullscreen.continue")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamInterface;
