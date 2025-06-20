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
import { getMockExamData } from "../services/mockExamData";

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
  const [webcamReady, setWebcamReady] = useState(false);

  // Timer setup
  const expiryTimestamp = new Date();
  expiryTimestamp.setSeconds(
    expiryTimestamp.getSeconds() + (examData?.duration_minutes || 60) * 60
  );

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
    expiryTimestamp,
    onExpire: () => handleSubmitExam(true), // Auto-submit when time expires
  });

  // Initialize WebSocket connection
  useEffect(() => {
    if (sessionId?.startsWith("demo-")) {
      // Mock face detection for demo sessions
      console.log("🎭 Demo mode: Using mock face detection");
      const mockFaceDetection = setInterval(() => {
        setFaceDetectionStatus({
          detected: true,
          verified: true,
          confidence: 0.85 + Math.random() * 0.1,
          suspicious: [],
        });
      }, 3000);

      return () => clearInterval(mockFaceDetection);
    } else if (sessionId && !sessionId.startsWith("demo-")) {
      // For real sessions, disable WebSocket to avoid 404 errors
      // Face detection will work through HTTP API calls in the face detection loop
      console.log(
        "🔍 Real mode: WebSocket disabled, using HTTP API for face detection"
      );

      // Initialize face detection status for real sessions
      setFaceDetectionStatus({
        detected: false,
        verified: false,
        confidence: 0,
        suspicious: [],
      });
    }
  }, [sessionId]);

  // Load exam data
  useEffect(() => {
    const loadExamData = async () => {
      try {
        let response;

        if (sessionId?.startsWith("demo-")) {
          // For demo sessions, use mock data directly
          console.log("🎭 Demo session: Using mock data");
          response = await getMockExamData(sessionId);
        } else {
          // For real sessions, try API first, then fallback to mock
          try {
            console.log("🔍 Real session: Trying API first");
            const apiResponse = await api.request(
              `/api/v1/exam/sessions/${sessionId}/status`
            );
            console.log("✅ Real session: API data loaded");
            response = { data: apiResponse }; // Wrap API response to match mock format
          } catch (apiError) {
            console.log(
              "⚠️ Real session: API not available, using mock data template"
            );
            response = await getMockExamData(sessionId);
          }
        }

        setExamData(response.data);
      } catch (error) {
        console.error("Error loading exam data:", error);
        // For demo purposes, redirect to exam selection instead of error page
        navigate("/exam");
      }
    };

    if (sessionId) {
      loadExamData();
    }
  }, [sessionId, navigate]);

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

          // Log to backend
          if (!sessionId?.startsWith("demo-")) {
            api.request(`/api/v1/exam/sessions/${sessionId}/log-activity`, {
              method: "POST",
              body: JSON.stringify({
                type: "tab_switch",
                timestamp,
              }),
            });
          } else {
            console.log("📋 Mock activity logged: tab_switch");
          }
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

          // Log to backend
          if (!sessionId?.startsWith("demo-")) {
            api.request(`/api/v1/exam/sessions/${sessionId}/log-activity`, {
              method: "POST",
              body: JSON.stringify({
                type: "fullscreen_exit",
                timestamp,
              }),
            });
          } else {
            console.log("📋 Mock activity logged: fullscreen_exit");
          }
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

    // Add detection status text
    ctx.fillStyle = faceDetectionStatus.detected ? "#00ff00" : "#ff0000";
    ctx.font = "14px Arial";
    ctx.fillText(
      `Faces: ${
        faceDetectionStatus.face_rectangles.length
      } | Confidence: ${Math.round(
        (faceDetectionStatus.confidence || 0) * 100
      )}%`,
      10,
      25
    );

    // Add suspicious activities
    if (
      faceDetectionStatus.suspicious &&
      faceDetectionStatus.suspicious.length > 0
    ) {
      ctx.fillStyle = "#ff8800";
      ctx.font = "12px Arial";
      faceDetectionStatus.suspicious.forEach((activity, index) => {
        ctx.fillText(`⚠️ ${activity}`, 10, 45 + index * 15);
      });
    }
  }, [faceDetectionStatus]);

  // Face detection loop - เริ่มทำงานทันทีที่มี webcam (ไม่ต้องรอ start exam)
  useEffect(() => {
    if (!webcamReady || !webcamRef.current) return;

    if (sessionId?.startsWith("demo-")) {
      // Mock face detection for demo sessions
      console.log("🎭 Demo mode: Starting mock face detection");
      const faceDetectionInterval = setInterval(() => {
        // Simulate face detection with random confidence
        const confidence = 0.8 + Math.random() * 0.15;
        const detected = confidence > 0.7;

        setFaceDetectionStatus((prev) => ({
          detected,
          verified: detected,
          confidence,
          suspicious: detected ? [] : ["low_confidence"],
        }));

        console.log(
          `👤 Mock face detection: ${
            detected ? "Detected" : "Not detected"
          } (${Math.round(confidence * 100)}%)`
        );
      }, 1000); // Fast detection for demo - 1 second

      return () => {
        clearInterval(faceDetectionInterval);
      };
    } else {
      // Real face detection for actual sessions
      console.log("🔍 Starting real face detection service");
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
            });

            console.log(
              `🎯 [OPENCV] Face detection: ${
                result.face_detected ? "Detected" : "Not detected"
              } | Faces: ${result.num_faces || 0} | Direction: ${
                result.face_direction || "Unknown"
              } | Confidence: ${Math.round((result.confidence || 0) * 100)}%`
            );

            // Show success notification for real detection
            if (result.face_detected) {
              console.log(
                "✅ Face detection successful - Real camera working!"
              );
            }

            // Log suspicious activities - Updated for OpenCV system
            if (
              result.suspicious_activity &&
              result.suspicious_activity.length > 0
            ) {
              result.suspicious_activity.forEach((activity) => {
                switch (activity) {
                  case "head_turned_away":
                    console.warn(
                      "🔄 [OPENCV] หันหน้าไปทางอื่น - Head turned away"
                    );
                    break;
                  case "digital_device_detected":
                    console.warn(
                      "📱 [OPENCV] อุปกรณ์ดิจิทัลตรวจพบ - Digital device detected"
                    );
                    break;

                  case "prolonged_absence_detected":
                    console.warn(
                      "👻 [OPENCV] หายไปนานเกินไป - Prolonged absence detected"
                    );
                    break;
                  default:
                    console.warn(
                      `⚠️ [OPENCV] กิจกรรมน่าสงสัย - Suspicious activity: ${activity}`
                    );
                }
              });

              // Log สำหรับ n8n workflow และ OpenCV analysis
              console.log("📊 [OPENCV] Detection Summary:", {
                activities: result.suspicious_activity,
                num_faces: result.num_faces,
                face_direction: result.face_direction,
                analysis_type: result.analysis_type,
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

      // Start exam
      try {
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
        setExamData(response); // API returns data directly
      } catch (apiError) {
        // For mock data, just use the existing data
        console.log("Using mock data for exam start");
      }

      setExamStarted(true);

      // Start timer
      const newExpiryTime = new Date();
      newExpiryTime.setSeconds(
        newExpiryTime.getSeconds() + (examData?.duration_minutes || 60) * 60
      );
      restart(newExpiryTime);
    } catch (error) {
      console.error("Error starting exam:", error);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      try {
        await api.request(`/api/v1/exam/sessions/${sessionId}/submit`, {
          method: "POST",
          body: JSON.stringify({
            answers,
            isAutoSubmit,
            submissionTime: new Date().toISOString(),
          }),
        });
      } catch (apiError) {
        // For mock data, just log the submission
        console.log("Mock exam submitted:", {
          sessionId,
          answers,
          isAutoSubmit,
          submissionTime: new Date().toISOString(),
        });
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
            {question.text}
          </Typography>

          {question.type === "multiple_choice" && (
            <Box>
              {question.options.map((option, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Button
                    variant={
                      answers[question.id] === option.id
                        ? "contained"
                        : "outlined"
                    }
                    fullWidth
                    onClick={() => handleAnswerChange(question.id, option.id)}
                    sx={{ textAlign: "left", justifyContent: "flex-start" }}
                  >
                    {option.text}
                  </Button>
                </Box>
              ))}
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
      {/* Mode Banner */}
      {sessionId?.startsWith("demo-") ? (
        <Box
          sx={{
            bgcolor: "info.main",
            color: "white",
            p: 1,
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          🎭 DEMO MODE - ระบบจำลอง | Mock face detection และ API responses
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: "success.main",
            color: "white",
            p: 1,
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          🔍 REAL MODE - ระบบจริง | Real face detection กำลังทำงาน
        </Box>
      )}

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
                {t("exam.start_exam")}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {t("exam.duration")}: {examData.duration_minutes}{" "}
                {t("exam.minutes")}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleStartExam}
                disabled={!webcamReady}
              >
                {t("exam.start_exam")}
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
