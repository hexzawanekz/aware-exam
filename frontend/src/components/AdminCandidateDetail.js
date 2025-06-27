import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";

const AdminCandidateDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [candidateData, setCandidateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [availableExams, setAvailableExams] = useState([]);
  const [selectedExamSession, setSelectedExamSession] = useState(null);
  const [loadingExams, setLoadingExams] = useState(false);

  // Evidence data states
  const [evidenceData, setEvidenceData] = useState(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  // Real-time updates
  const [liveEvidence, setLiveEvidence] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const wsRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Captured frames viewer states
  const [showCapturedFramesModal, setShowCapturedFramesModal] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [loadingFrames, setLoadingFrames] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(null);

  // Using real AI evaluation data instead of mock data

  const mockCheatingAnalysis = {
    overallThreatLevel: "LOW",
    suspiciousActivities: [
      {
        timestamp: "14:35:22",
        type: "HEAD_MOVEMENT",
        severity: "low",
        description: "ผู้สมัครหันหน้าไปทางซ้ายเล็กน้อย อาจมองไปที่วัตถุข้างๆ",
        duration: "3 วินาที",
        aiConfidence: 75,
        frameCapture: "frame_001.jpg",
      },
      {
        timestamp: "14:42:15",
        type: "MULTIPLE_FACES",
        severity: "medium",
        description: "ตรวจพบใบหน้าเพิ่มเติมในพื้นหลัง",
        duration: "2 วินาที",
        aiConfidence: 88,
        frameCapture: "frame_002.jpg",
      },
      {
        timestamp: "14:48:03",
        type: "SCREEN_SWITCH",
        severity: "high",
        description: "มีการเปลี่ยนหน้าต่าง หรือแอปพลิเคชัน",
        duration: "1 วินาที",
        aiConfidence: 95,
        frameCapture: "frame_003.jpg",
      },
    ],
    biometricData: {
      faceRecognitionAccuracy: 98.5,
      eyeTrackingData: [
        { timestamp: "14:30:00", focusArea: "question", duration: 45 },
        { timestamp: "14:31:30", focusArea: "options", duration: 30 },
        { timestamp: "14:33:15", focusArea: "off_screen", duration: 5 },
      ],
    },
    deviceDetection: {
      secondaryDevices: [],
      bluetoothDevices: ["AirPods Pro"],
      usbDevices: ["Wireless Mouse"],
      networkConnections: 1,
    },
  };

  useEffect(() => {
    loadAvailableExams();
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [id]);

  useEffect(() => {
    if (selectedExamSession) {
      loadCandidateResults(selectedExamSession);
      loadLiveEvidence(selectedExamSession);
    }
  }, [selectedExamSession]);

  // Auto-refresh live evidence every 1 second
  useEffect(() => {
    let intervalId;

    if (selectedExamSession) {
      intervalId = setInterval(() => {
        loadLiveEvidence(selectedExamSession);
      }, 1000); // Refresh every 1 second
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedExamSession, lastUpdateTime]);

  // Setup WebSocket for real-time updates
  const setupWebSocket = () => {
    try {
      const wsUrl = `ws://localhost:8000/ws/admin/${id}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("🔗 Admin WebSocket connected");
        setConnectionStatus("connected");

        // Send ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000); // Ping every 30 seconds

        wsRef.current.pingInterval = pingInterval;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("📨 Received WebSocket message:", message);

          if (message.type === "evidence_captured") {
            // Add new evidence to live evidence list
            setLiveEvidence((prev) => [message, ...prev.slice(0, 49)]); // Keep last 50
            setLastUpdateTime(new Date().toISOString());

            // Show notification
            showEvidenceNotification(message);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = () => {
        console.log("🔌 Admin WebSocket disconnected");
        setConnectionStatus("disconnected");

        if (wsRef.current?.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
        }

        // Attempt to reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        setConnectionStatus("error");
      };
    } catch (error) {
      console.error("Failed to setup WebSocket:", error);
      setConnectionStatus("error");
    }
  };

  // Load live evidence data
  const loadLiveEvidence = async (sessionId) => {
    if (!sessionId) return;

    try {
      const response = await apiService.request(
        `/api/v1/exam/sessions/${sessionId}/evidence/live${
          lastUpdateTime ? `?since=${lastUpdateTime}` : ""
        }`
      );

      if (response.status === "success") {
        const newEvidence = response.evidence || [];

        // Only update if we have new data or it's the initial load
        if (newEvidence.length > 0 || !lastUpdateTime) {
          if (lastUpdateTime && newEvidence.length > 0) {
            // Merge new evidence with existing, avoiding duplicates
            setLiveEvidence((prev) => {
              const combined = [...newEvidence, ...prev];
              // Remove duplicates based on timestamp and message
              const unique = combined.filter(
                (item, index, self) =>
                  index ===
                  self.findIndex(
                    (t) =>
                      t.timestamp === item.timestamp &&
                      t.message === item.message
                  )
              );
              // Keep only the latest 50 items
              return unique.slice(0, 50);
            });
          } else {
            // Initial load or full refresh
            setLiveEvidence(newEvidence);
          }

          if (response.last_updated) {
            setLastUpdateTime(response.last_updated);
          }
        }
        // If no new data and not initial load, don't update the state (prevents blinking)
      }
    } catch (error) {
      console.error("Failed to load live evidence:", error);
      // Don't clear the evidence on error to prevent blinking
    }
  };

  // Show evidence notification
  const showEvidenceNotification = (evidence) => {
    // You can implement a toast notification here
    console.log(`🚨 New evidence: ${evidence.message}`);

    // Optional: Play notification sound for high-risk evidence
    if (evidence.evidence_level === "high") {
      // playNotificationSound();
    }
  };

  // Load captured frames for a session
  const loadCapturedFrames = async (sessionId) => {
    if (!sessionId) return;

    setLoadingFrames(true);
    try {
      const response = await apiService.request(
        `/api/v1/exam/sessions/${sessionId}/captured-frames`
      );
      setCapturedFrames(response.frames || []);
      console.log(
        `📸 Loaded ${response.total_frames} captured frames for session ${sessionId}`
      );
    } catch (error) {
      console.error("❌ Error loading captured frames:", error);
      setCapturedFrames([]);
    } finally {
      setLoadingFrames(false);
    }
  };

  // Open captured frames modal
  const openCapturedFramesModal = (sessionId) => {
    setShowCapturedFramesModal(true);
    loadCapturedFrames(sessionId);
  };

  // Close captured frames modal
  const closeCapturedFramesModal = () => {
    setShowCapturedFramesModal(false);
    setCapturedFrames([]);
    setSelectedFrame(null);
  };

  const loadAvailableExams = async () => {
    try {
      setLoadingExams(true);
      console.log("🔄 Loading available exams for candidate ID:", id);

      // Fetch all exams assigned to this candidate
      const candidateExams = await apiService.request(
        `/api/v1/candidate/exams/${id}`
      );
      console.log("✅ Available exams received:", candidateExams);

      setAvailableExams(candidateExams.exams || []);

      // Auto-select the first exam if available
      if (candidateExams.exams && candidateExams.exams.length > 0) {
        const firstSessionId = candidateExams.exams[0].session_id_string;
        setSelectedExamSession(firstSessionId);
        // Load evidence data for the first session
        loadEvidenceData(firstSessionId);
      }
    } catch (error) {
      console.error("❌ Error loading available exams:", error);
      // If API fails, try to load results anyway
      loadCandidateResults();
    } finally {
      setLoadingExams(false);
    }
  };

  const loadEvidenceData = async (sessionId) => {
    if (!sessionId) return;

    try {
      setLoadingEvidence(true);
      console.log("🔍 Loading evidence data for session:", sessionId);

      // Load evidence summary
      const evidenceSummary = await apiService.request(
        `/api/v1/exam/sessions/${sessionId}/evidence-summary`
      );

      // Load detailed proctoring logs
      const proctoringLogs = await apiService.request(
        `/api/v1/exam/sessions/${sessionId}/proctoring-logs`
      );

      setEvidenceData({
        summary: evidenceSummary,
        logs: proctoringLogs,
      });

      console.log("✅ Evidence data loaded successfully:", evidenceSummary);
    } catch (error) {
      console.error("❌ Error loading evidence data:", error);
      setEvidenceData(null);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const loadCandidateResults = async (sessionId = null) => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        "🔄 Loading candidate data for ID:",
        id,
        "Session:",
        sessionId
      );

      // Try to get candidate data - use simpler API calls first
      let candidateResponse = null;
      let detailedResults = null;
      let examSessionData = null;
      let examQuestionsData = null;

      try {
        // Try the detailed results endpoint first - pass session_id if provided
        console.log("📡 Calling detailed results API...");
        detailedResults = await apiService.getCandidateDetailedResults(
          id,
          sessionId
        );
        console.log("✅ Detailed results received:", detailedResults);

        // Use provided sessionId or extract from results
        const finalSessionId =
          sessionId ||
          detailedResults?.session_metadata?.session_id ||
          detailedResults?.raw_ai_results?.session_id ||
          detailedResults?.exam_summary?.session_id;

        if (finalSessionId) {
          console.log(
            "📡 Found session_id:",
            finalSessionId,
            "- Fetching exam session data..."
          );

          try {
            // Fetch exam session status and questions
            examSessionData = await apiService.request(
              `/api/v1/exam/sessions/${finalSessionId}/status`
            );
            console.log("✅ Exam session data received:", examSessionData);
          } catch (sessionError) {
            console.warn("⚠️ Exam session API failed:", sessionError.message);
          }

          try {
            // Fetch exam questions that candidate answered
            examQuestionsData = await apiService.request(
              `/api/v1/exam/sessions/${finalSessionId}/questions`
            );
            console.log("✅ Exam questions data received:", examQuestionsData);
          } catch (questionsError) {
            console.warn(
              "⚠️ Exam questions API failed:",
              questionsError.message
            );
          }
        }
      } catch (detailedError) {
        console.warn("⚠️ Detailed results API failed:", detailedError.message);
      }

      try {
        // Try basic candidate info
        console.log("📡 Calling basic candidate API...");
        candidateResponse = await apiService.request(
          `/api/v1/exam/candidates/${id}/results`
        );
        console.log("✅ Basic candidate data received:", candidateResponse);
      } catch (basicError) {
        console.warn("⚠️ Basic candidate API failed:", basicError.message);

        // Try alternative endpoint
        try {
          console.log("📡 Trying alternative candidate endpoint...");
          candidateResponse = await apiService.request(
            `/api/v1/candidates/${id}`
          );
          console.log(
            "✅ Alternative candidate data received:",
            candidateResponse
          );
        } catch (altError) {
          console.warn(
            "⚠️ Alternative candidate API also failed:",
            altError.message
          );
        }
      }

      // Process the enhanced candidate data with fallbacks
      console.log("🔄 Processing candidate data...");

      // Handle case where APIs failed
      if (!candidateResponse && !detailedResults) {
        console.log("❌ No API data available, using mock data");
        throw new Error("No API endpoints available");
      }

      // Use detailed results if available, otherwise fallback to basic response
      const primaryData =
        detailedResults?.exam_summary || candidateResponse || {};
      const examResults =
        detailedResults?.raw_ai_results ||
        candidateResponse?.exam_results ||
        {};
      const proctoringAnalysis = candidateResponse?.proctoring_analysis || {};

      console.log("📊 Primary data:", primaryData);
      console.log("📊 Exam results:", examResults);
      console.log("📊 Proctoring analysis:", proctoringAnalysis);

      // Debug the exam score calculation
      console.log("🔍 EXAM SCORE DEBUG:");
      console.log("  examResults.total_score:", examResults.total_score);
      console.log("  examResults.overall_score:", examResults.overall_score);
      console.log(
        "  primaryData.final_percentage:",
        primaryData.final_percentage
      );
      console.log("  primaryData.score_summary:", primaryData.score_summary);

      const finalScore =
        primaryData.final_percentage !== undefined
          ? primaryData.final_percentage
          : primaryData.score_summary?.final_percentage !== undefined
          ? primaryData.score_summary.final_percentage
          : primaryData.score_summary?.total_score !== undefined
          ? primaryData.score_summary.total_score
          : examResults.total_score || examResults.overall_score || 0;

      console.log("  Final exam_score will be:", finalScore);
      console.log(
        "  Data source:",
        primaryData.final_percentage !== undefined
          ? "primaryData.final_percentage"
          : primaryData.score_summary?.final_percentage !== undefined
          ? "primaryData.score_summary.final_percentage"
          : primaryData.score_summary?.total_score !== undefined
          ? "primaryData.score_summary.total_score"
          : examResults.total_score
          ? "examResults.total_score"
          : examResults.overall_score
          ? "examResults.overall_score"
          : "fallback 0"
      );

      setCandidateData({
        // Basic candidate info with safe fallbacks
        id: parseInt(id),
        first_name:
          primaryData.candidate_name ||
          candidateResponse?.first_name ||
          candidateResponse?.name ||
          `Candidate ${id}`,
        last_name: candidateResponse?.last_name || "",
        name:
          primaryData.candidate_name ||
          candidateResponse?.name ||
          `Candidate ${id}`,
        email: candidateResponse?.email || "No email provided",
        phone: candidateResponse?.phone || "No phone provided",
        position:
          primaryData.position ||
          candidateResponse?.position ||
          "Not specified",
        department:
          primaryData.department ||
          candidateResponse?.department ||
          "Not specified",
        company:
          primaryData.company || candidateResponse?.company || "Not specified",
        ...candidateResponse,

        // Exam session data from API
        session_id:
          examSessionData?.session_id ||
          detailedResults?.session_metadata?.session_id,
        exam_template_name:
          examSessionData?.exam_template?.name ||
          primaryData.exam_template_name,
        programming_language:
          examSessionData?.exam_template?.programming_language ||
          primaryData.programming_language,
        exam_date: examSessionData?.started_at || candidateResponse?.exam_date,
        exam_duration:
          examSessionData?.duration || candidateResponse?.exam_duration,

        // Real exam questions and answers from database
        exam_questions: examQuestionsData?.questions || [],
        candidate_answers: examSessionData?.answers || {},

        // Enhanced exam results from AI with proper fallbacks
        // Prioritize primaryData (current session) over examResults (may be cached)
        exam_score:
          primaryData.final_percentage !== undefined
            ? primaryData.final_percentage
            : primaryData.score_summary?.final_percentage !== undefined
            ? primaryData.score_summary.final_percentage
            : primaryData.score_summary?.total_score !== undefined
            ? primaryData.score_summary.total_score
            : examResults.total_score || examResults.overall_score || 0,
        exam_status:
          // Prioritize primaryData status over examResults
          primaryData.score_summary?.status === "passed"
            ? "ผ่านการสอบ"
            : primaryData.score_summary?.status === "failed"
            ? "ไม่ผ่านการสอบ"
            : primaryData.score_summary?.performance_level ===
              "Needs Improvement"
            ? "ไม่ผ่านการสอบ"
            : examResults.status === "passed"
            ? "ผ่านการสอบ"
            : examResults.status === "failed"
            ? "ไม่ผ่านการสอบ"
            : primaryData.status || "ไม่ระบุ",
        ai_recommendation:
          examResults.recommendation ||
          examResults.ai_recommendation ||
          "ไม่มีข้อมูล",
        overall_feedback:
          examResults.overall_feedback || "ไม่มีความเห็นเพิ่มเติม",

        // Score breakdown - using real AI results structure
        score_breakdown: examResults.score_breakdown || {},
        multiple_choice_score: examResults.multiple_choice_score || {},
        coding_scores: examResults.coding_scores || [],

        // Criteria analysis (วิเคราะห์ผลการสอบตามหัวข้อ) - map from multiple_choice_score.criteria_breakdown
        criteria_analysis:
          examResults.multiple_choice_score?.criteria_breakdown ||
          examResults.criteria_analysis ||
          {},

        // Detailed analysis (รายละเอียดข้อสอบ)
        detailed_analysis: examResults.detailed_analysis || {},

        // Proctoring analysis
        cheating_percentage: proctoringAnalysis.cheating_percentage || 0,
        ai_confidence: proctoringAnalysis.ai_confidence || 85,
        proctoring_events: proctoringAnalysis.proctoring_events || [],
        video_segments: proctoringAnalysis.video_segments || [],

        // Evaluation metadata
        evaluation_method: examResults.evaluation_method || "unknown",
        ai_model: examResults.ai_model || "basic",
        evaluation_timestamp: examResults.evaluation_timestamp || "ไม่ระบุ",

        // Topic performance from real criteria analysis
        topicPerformance: Object.keys(examResults.criteria_analysis || {}).map(
          (criteria) => ({
            topic: criteria,
            totalQuestions: Math.round(
              (examResults.criteria_analysis[criteria]?.max_score || 10) / 5
            ),
            correct: Math.round(
              (examResults.criteria_analysis[criteria]?.score || 0) / 5
            ),
            percentage: Math.round(
              ((examResults.criteria_analysis[criteria]?.score || 0) /
                (examResults.criteria_analysis[criteria]?.max_score || 1)) *
                100
            ),
          })
        ),

        mockCheatingAnalysis: {
          ...mockCheatingAnalysis,
          overallThreatLevel:
            proctoringAnalysis.cheating_percentage > 30
              ? "HIGH"
              : proctoringAnalysis.cheating_percentage > 15
              ? "MEDIUM"
              : "LOW",
          suspiciousActivities:
            proctoringAnalysis.proctoring_events ||
            mockCheatingAnalysis.suspiciousActivities,
        },
      });
    } catch (err) {
      console.error("❌ Error loading candidate results:", err);
      console.log("📝 Using fallback mock data");

      // Always set some data even if APIs fail - don't set error to show the interface
      setCandidateData({
        id: parseInt(id),
        first_name: `Candidate`,
        last_name: `${id}`,
        name: `Candidate ${id}`,
        email: "api-error@example.com",
        phone: "No data available",
        position: "No data available",
        department: "No data available",
        company: "No data available",
        status: "API Error",
        exam_score: 0,
        exam_date: new Date().toISOString(),
        exam_duration: "ไม่ระบุ",
        exam_status: "No data - API Error",
        cheating_percentage: 15,
        ai_confidence: 85,
        topicPerformance: [],
        mockCheatingAnalysis: mockCheatingAnalysis,
        evaluation_method: "fallback",
        overall_feedback: "⚠️ API ไม่พร้อมใช้งาน - แสดงข้อมูลตัวอย่าง",
        ai_recommendation: "⚠️ ไม่สามารถเชื่อมต่อ API ได้",
        ai_model: "Mock Data",
        score_breakdown: {},
        multiple_choice_score: {},
        coding_scores: [],
        criteria_analysis: {},
        detailed_analysis: {},
        proctoring_events: [],
        video_segments: [],
        evaluation_timestamp: new Date().toISOString(),
      });

      console.log("✅ Fallback data set successfully");
    } finally {
      setLoading(false);
      console.log("🏁 Loading finished");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "low":
        return "bg-warning/10 text-warning border-warning";
      case "medium":
        return "bg-meta-6/10 text-meta-6 border-meta-6";
      case "high":
        return "bg-danger/10 text-danger border-danger";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "low":
        return "⚠️";
      case "medium":
        return "🚨";
      case "high":
        return "🔴";
      default:
        return "ℹ️";
    }
  };

  const getCheatingColor = (percentage) => {
    if (percentage > 30) return "text-danger";
    if (percentage > 15) return "text-warning";
    return "text-success";
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "passed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const renderLiveEvidence = () => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{t("liveEvidence")}</h3>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "error"
                  ? "bg-red-500"
                  : "bg-gray-400"
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              {connectionStatus === "connected"
                ? t("live")
                : connectionStatus === "error"
                ? t("error")
                : t("connecting")}
            </span>
            {lastUpdateTime && (
              <span className="text-xs text-gray-500">
                {t("lastUpdate")}:{" "}
                {new Date(lastUpdateTime).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {liveEvidence.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p>{t("noEvidenceYet")}</p>
            <p className="text-sm">{t("evidenceWillAppearHere")}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {liveEvidence.map((evidence, index) => (
              <div
                key={`${evidence.timestamp}-${index}`}
                className={`p-3 rounded-lg border-l-4 ${
                  evidence.evidence_level === "high"
                    ? "border-red-500 bg-red-50"
                    : evidence.evidence_level === "medium"
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-blue-500 bg-blue-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className={`text-sm font-medium ${
                          evidence.evidence_level === "high"
                            ? "text-red-600"
                            : evidence.evidence_level === "medium"
                            ? "text-yellow-600"
                            : "text-blue-600"
                        }`}
                      >
                        {evidence.evidence_level.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(evidence.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{evidence.message}</p>
                    {evidence.cheating_score > 0 && (
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-600">
                          {t("riskScore")}:
                        </span>
                        <span
                          className={`text-xs font-medium ml-1 ${
                            evidence.cheating_score >= 40
                              ? "text-red-600"
                              : evidence.cheating_score >= 20
                              ? "text-yellow-600"
                              : "text-blue-600"
                          }`}
                        >
                          {evidence.cheating_score}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        evidence.evidence_level === "high"
                          ? "bg-red-100 text-red-800"
                          : evidence.evidence_level === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {evidence.event_type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {liveEvidence.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {t("totalEvents")}: {liveEvidence.length}
              </span>
              <span>
                {t("highRisk")}:{" "}
                {liveEvidence.filter((e) => e.evidence_level === "high").length}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderScoreSummary = () => {
    // Use real AI results structure
    const scoreBreakdown = candidateData.score_breakdown || {};
    const multipleChoiceScore = candidateData.multiple_choice_score || {};
    const codingScores = candidateData.coding_scores || [];

    // Calculate coding totals
    const totalCodingScore = codingScores.reduce(
      (sum, q) => sum + (q.score || 0),
      0
    );
    const totalCodingMax = codingScores.reduce(
      (sum, q) => sum + (q.max_score || 0),
      0
    );
    const codingPercentage =
      totalCodingMax > 0
        ? Math.round((totalCodingScore / totalCodingMax) * 100)
        : 0;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t("examResults")}</h3>

        {/* Overall Score */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div
              className={`text-3xl font-bold ${getPerformanceColor(
                candidateData.exam_score || 0
              )}`}
            >
              {candidateData.exam_score || 0}%
            </div>
            <div className="text-sm text-gray-600">{t("totalScore")}</div>
            <div className="text-xs text-gray-500">
              {scoreBreakdown.total || 0}/{scoreBreakdown.total_max || 100}{" "}
              {t("points")}
            </div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {multipleChoiceScore.percentage || 0}%
            </div>
            <div className="text-sm text-gray-600">{t("multipleChoice")}</div>
            <div className="text-xs text-gray-500">
              {multipleChoiceScore.score || 0}/
              {multipleChoiceScore.max_score || 0} {t("points")}
            </div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {codingPercentage}%
            </div>
            <div className="text-sm text-gray-600">{t("coding")}</div>
            <div className="text-xs text-gray-500">
              {totalCodingScore}/{totalCodingMax} {t("points")} (
              {codingScores.length} {t("questions")})
            </div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div
              className={`text-lg font-bold px-2 py-1 rounded ${getStatusBadgeClass(
                candidateData.exam_status
              )}`}
            >
              {candidateData.exam_status}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {candidateData.exam_score >= 70
                ? t("excellent")
                : candidateData.exam_score >= 50
                ? t("good")
                : t("needsImprovement")}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCriteriaBreakdown = () => {
    const criteriaData = candidateData.criteria_analysis || {};

    if (Object.keys(criteriaData).length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t("criteriaPerformance")}
          </h3>
          <p className="text-gray-500 text-center">{t("noDataAvailable")}</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          {t("criteriaPerformance")}
        </h3>

        <div className="space-y-4">
          {Object.entries(criteriaData).map(([criteriaName, item]) => (
            <div key={criteriaName} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{criteriaName}</h4>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${getPerformanceColor(
                    item.percentage || 0
                  )}`}
                >
                  {item.percentage || 0}%
                </span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>
                    {t("score")}: {item.earned_points || 0}/
                    {item.total_points || 0}
                  </span>
                  <span>
                    {t("correct")}: {item.correct_count || 0}/
                    {item.questions_count || 0}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (item.percentage || 0) >= 80
                        ? "bg-green-500"
                        : (item.percentage || 0) >= 60
                        ? "bg-blue-500"
                        : (item.percentage || 0) >= 40
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${item.percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Add comprehensive safety checks
  if (loading) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="text-center">
          <p className="text-lg text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-primary px-4 py-2 text-white hover:bg-opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!candidateData) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="text-center">
          <p className="text-lg text-gray-600">No candidate data available</p>
          <button
            onClick={() => navigate("/admin/candidates")}
            className="mt-4 rounded bg-primary px-4 py-2 text-white hover:bg-opacity-90"
          >
            Back to Candidates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          📋 {t("admin.candidate_details")}
        </h2>
        <button
          onClick={() => navigate("/admin/candidates")}
          className="inline-flex items-center justify-center rounded-md bg-gray-600 px-10 py-4 text-center font-medium text-white hover:bg-opacity-90"
        >
          ← {t("admin.back_to_candidates")}
        </button>
      </div>

      {/* Exam Selection */}
      {availableExams.length > 1 && (
        <div className="mb-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
            📚 เลือกการสอบที่ต้องการดู
          </h3>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                การสอบที่มีอยู่ ({availableExams.length} การสอบ):
              </label>
              <select
                value={selectedExamSession || ""}
                onChange={(e) => {
                  const newSessionId = e.target.value;
                  setSelectedExamSession(newSessionId);
                  if (newSessionId) {
                    loadCandidateResults(newSessionId);
                    loadEvidenceData(newSessionId);
                  }
                }}
                className="w-full rounded-lg border border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                disabled={loadingExams}
              >
                <option value="">-- เลือกการสอบ --</option>
                {availableExams.map((exam, index) => (
                  <option
                    key={exam.session_id_string}
                    value={exam.session_id_string}
                  >
                    {index + 1}. {exam.name || "ไม่ระบุชื่อ"} -{exam.status}
                    {exam.scheduled_date &&
                      ` - ${new Date(exam.scheduled_date).toLocaleDateString(
                        "th-TH"
                      )}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-4">
              {loadingExams && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  กำลังโหลด...
                </div>
              )}
              {selectedExamSession && (
                <div className="text-sm text-success">
                  ✅ แสดงผลการสอบที่เลือก
                </div>
              )}
            </div>
          </div>

          {availableExams.length > 0 && selectedExamSession && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-700">
              {(() => {
                const selectedExam = availableExams.find(
                  (exam) => exam.session_id_string === selectedExamSession
                );
                return selectedExam ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-800 dark:text-blue-300">
                        🆔 Session ID:
                      </span>
                      <span className="ml-2 text-blue-700 dark:text-blue-400">
                        {selectedExam.session_id_string}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800 dark:text-blue-300">
                        📅 วันที่สอบ:
                      </span>
                      <span className="ml-2 text-blue-700 dark:text-blue-400">
                        {selectedExam.scheduled_date
                          ? new Date(
                              selectedExam.scheduled_date
                            ).toLocaleString("th-TH")
                          : "ไม่ระบุ"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800 dark:text-blue-300">
                        ⏱️ ระยะเวลา:
                      </span>
                      <span className="ml-2 text-blue-700 dark:text-blue-400">
                        {selectedExam.duration_minutes
                          ? `${selectedExam.duration_minutes} นาที`
                          : "ไม่ระบุ"}
                      </span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      )}

      {/* Loading State for Exams */}
      {availableExams.length === 0 && loadingExams && (
        <div className="mb-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            <span className="text-gray-600 dark:text-gray-400">
              กำลังโหลดรายการการสอบ...
            </span>
          </div>
        </div>
      )}

      {/* No Exams Available */}
      {availableExams.length === 0 && !loadingExams && (
        <div className="mb-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              ไม่พบการสอบ
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              ผู้สมัครคนนี้ยังไม่ได้รับมอบหมายการสอบใดๆ
            </p>
          </div>
        </div>
      )}

      {/* Show results only when exam is selected or single exam */}
      {(selectedExamSession || availableExams.length === 1) && (
        <div>
          {/* Candidate Information Grid */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                {t("admin.candidate_info")}
              </h3>
              <div className="space-y-3">
                <p className="text-sm">
                  <span className="font-medium text-black dark:text-white">
                    {t("admin.name")}:
                  </span>{" "}
                  {candidateData?.first_name || candidateData?.name || "N/A"}{" "}
                  {candidateData?.last_name || ""}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-black dark:text-white">
                    {t("admin.email")}:
                  </span>{" "}
                  {candidateData?.email || "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-black dark:text-white">
                    {t("admin.phone")}:
                  </span>{" "}
                  {candidateData?.phone || "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-black dark:text-white">
                    {t("admin.position")}:
                  </span>{" "}
                  {candidateData?.position || t("admin.position_not_specified")}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-black dark:text-white">
                    {t("admin.status")}:
                  </span>{" "}
                  <span className="text-success">
                    {candidateData?.status ||
                      candidateData?.exam_status ||
                      t("admin.no_status")}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                📊 {t("admin.exam_results")}
              </h3>
              {candidateData?.exam_score !== null &&
              candidateData?.exam_score !== undefined ? (
                <div className="space-y-4">
                  {/* Overall Score Display */}
                  <div className="text-center border-b border-stroke pb-4 dark:border-strokedark">
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-primary">
                        {candidateData?.exam_score || 0}
                      </span>
                      <span className="text-2xl text-body dark:text-bodydark">
                        /100
                      </span>
                    </div>
                    <div
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${(() => {
                        // Use real AI evaluation status
                        const aiStatus =
                          candidateData?.exam_status || candidateData?.status;
                        if (
                          aiStatus === "ยอดเยี่ยม" ||
                          aiStatus === "excellent" ||
                          aiStatus === "passed"
                        ) {
                          return "bg-success/10 text-success";
                        } else if (
                          aiStatus === "ผ่าน" ||
                          aiStatus === "good" ||
                          aiStatus === "satisfactory"
                        ) {
                          return "bg-warning/10 text-warning";
                        } else if (
                          aiStatus === "ไม่ผ่าน" ||
                          aiStatus === "failed" ||
                          aiStatus === "poor"
                        ) {
                          return "bg-danger/10 text-danger";
                        }

                        // Fallback to score-based status
                        return (candidateData?.exam_score || 0) >= 80
                          ? "bg-success/10 text-success"
                          : (candidateData?.exam_score || 0) >= 70
                          ? "bg-warning/10 text-warning"
                          : "bg-danger/10 text-danger";
                      })()}`}
                    >
                      {(() => {
                        // Use real AI evaluation status text
                        const aiStatus =
                          candidateData?.exam_status || candidateData?.status;
                        if (
                          aiStatus === "ยอดเยี่ยม" ||
                          aiStatus === "excellent"
                        ) {
                          return "🏆 ยอดเยี่ยม";
                        } else if (
                          aiStatus === "ผ่าน" ||
                          aiStatus === "good" ||
                          aiStatus === "satisfactory"
                        ) {
                          return "✅ ผ่าน";
                        } else if (
                          aiStatus === "ไม่ผ่าน" ||
                          aiStatus === "failed" ||
                          aiStatus === "poor"
                        ) {
                          return "❌ ไม่ผ่าน";
                        } else if (aiStatus === "passed") {
                          return "🏆 ยอดเยี่ยม";
                        }

                        // Fallback to score-based status
                        return (candidateData?.exam_score || 0) >= 80
                          ? "🏆 ยอดเยี่ยม"
                          : (candidateData?.exam_score || 0) >= 70
                          ? "✅ ผ่าน"
                          : "❌ ไม่ผ่าน";
                      })()}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-body dark:text-bodydark">
                        {t("admin.exam_date")}
                      </p>
                      <p className="font-semibold text-black dark:text-white">
                        {new Date(candidateData.exam_date).toLocaleDateString(
                          "th-TH"
                        )}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-body dark:text-bodydark">
                        {t("admin.duration")}
                      </p>
                      <p className="font-semibold text-black dark:text-white">
                        {(() => {
                          // Use real exam duration from AI evaluation or session data
                          if (candidateData.exam_duration) {
                            return candidateData.exam_duration;
                          }

                          // Calculate duration from session metadata if available
                          if (
                            candidateData.session_metadata?.start_time &&
                            candidateData.session_metadata?.end_time
                          ) {
                            const startTime = new Date(
                              candidateData.session_metadata.start_time
                            );
                            const endTime = new Date(
                              candidateData.session_metadata.end_time
                            );
                            const diffMs = endTime - startTime;
                            const diffMins = Math.floor(diffMs / 60000);
                            const diffSecs = Math.floor(
                              (diffMs % 60000) / 1000
                            );
                            return `${diffMins} นาที ${diffSecs} วินาที`;
                          }

                          return "ไม่ระบุ";
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-sm p-4 dark:bg-meta-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success">
                        {(() => {
                          // Calculate correct answers from AI evaluation data
                          const mcScore =
                            candidateData.multiple_choice_score || {};
                          const codingScores =
                            candidateData.coding_scores || [];

                          // Multiple choice correct answers
                          const mcCorrect = mcScore.correct_count || 0;

                          // Coding correct answers (assuming score > 0 means correct)
                          const codingCorrect = codingScores.filter(
                            (q) => (q.score || 0) > 0
                          ).length;

                          return mcCorrect + codingCorrect;
                        })()}
                      </p>
                      <p className="text-xs text-body dark:text-bodydark">
                        คำตอบถูก
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {(() => {
                          // Calculate total questions from AI evaluation data
                          const mcScore =
                            candidateData.multiple_choice_score || {};
                          const codingScores =
                            candidateData.coding_scores || [];

                          // Multiple choice total questions
                          const mcTotal = mcScore.total_questions || 0;

                          // Coding total questions
                          const codingTotal = codingScores.length;

                          return mcTotal + codingTotal;
                        })()}
                      </p>
                      <p className="text-xs text-body dark:text-bodydark">
                        ข้อทั้งหมด
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-warning">
                        {(() => {
                          // Calculate wrong answers from AI evaluation data
                          const mcScore =
                            candidateData.multiple_choice_score || {};
                          const codingScores =
                            candidateData.coding_scores || [];

                          // Multiple choice wrong answers
                          const mcWrong =
                            (mcScore.total_questions || 0) -
                            (mcScore.correct_count || 0);

                          // Coding wrong answers (assuming score = 0 means wrong)
                          const codingWrong = codingScores.filter(
                            (q) => (q.score || 0) === 0
                          ).length;

                          return mcWrong + codingWrong;
                        })()}
                      </p>
                      <p className="text-xs text-body dark:text-bodydark">
                        คำตอบผิด
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-body dark:text-bodydark">
                    {t("admin.no_exam_results")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Exam Dashboard */}
      {candidateData?.exam_score !== null &&
        candidateData?.exam_score !== undefined && (
          <div className="mb-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-6 text-xl font-semibold text-black dark:text-white">
              🎯 Dashboard ผลการสอบ
            </h3>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Overall Score */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 text-center dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-700">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {candidateData.exam_score}%
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                  คะแนนรวม
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-500">
                  {candidateData.score_breakdown?.total ||
                    candidateData.exam_score}
                  /{candidateData.score_breakdown?.total_max || 100} คะแนน
                </div>
              </div>

              {/* Multiple Choice Performance */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 text-center dark:from-green-900/20 dark:to-green-800/20 dark:border-green-700">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {candidateData.multiple_choice_score?.score || 0}/
                  {candidateData.multiple_choice_score?.max_score || 0}
                </div>
                <div className="text-sm text-green-700 dark:text-green-400 mb-2">
                  ข้อสอบปรนัย
                </div>
                <div className="text-xs text-green-600 dark:text-green-500">
                  ได้คะแนน {candidateData.multiple_choice_score?.score || 0}{" "}
                  จากเต็ม {candidateData.multiple_choice_score?.max_score || 0}{" "}
                  คะแนน
                </div>
              </div>

              {/* Coding Performance */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 text-center dark:from-purple-900/20 dark:to-purple-800/20 dark:border-purple-700">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {candidateData.coding_scores
                    ? candidateData.coding_scores.reduce(
                        (sum, q) => sum + q.score,
                        0
                      )
                    : 0}
                  /
                  {candidateData.coding_scores
                    ? candidateData.coding_scores.reduce(
                        (sum, q) => sum + q.max_score,
                        0
                      )
                    : 0}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-400 mb-2">
                  ข้อสอบเขียนโค้ด
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-500">
                  ได้คะแนน{" "}
                  {candidateData.coding_scores
                    ? candidateData.coding_scores.reduce(
                        (sum, q) => sum + q.score,
                        0
                      )
                    : 0}{" "}
                  จากเต็ม{" "}
                  {candidateData.coding_scores
                    ? candidateData.coding_scores.reduce(
                        (sum, q) => sum + q.max_score,
                        0
                      )
                    : 0}{" "}
                  คะแนน
                </div>
              </div>

              {/* AI Evaluation Status */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 text-center dark:from-orange-900/20 dark:to-orange-800/20 dark:border-orange-700">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {candidateData.evaluation_method === "google_ai"
                    ? "🤖"
                    : "📊"}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-400 mb-2">
                  วิธีการประเมิน
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-500">
                  {candidateData.evaluation_method === "google_ai"
                    ? "Google AI"
                    : candidateData.evaluation_method === "fallback"
                    ? "ระบบอัตโนมัติ"
                    : "ไม่ระบุ"}
                </div>
              </div>
            </div>

            {/* Performance Summary Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>ประสิทธิภาพโดยรวม</span>
                <span>
                  {candidateData.exam_score}% ({candidateData.exam_status})
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                <div
                  className={`h-4 rounded-full transition-all duration-1000 ${
                    candidateData.exam_score >= 80
                      ? "bg-green-500"
                      : candidateData.exam_score >= 70
                      ? "bg-blue-500"
                      : candidateData.exam_score >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${candidateData.exam_score}%` }}
                ></div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm">
              <div className="p-3 bg-gray-50 rounded-lg dark:bg-meta-4">
                <div className="font-semibold text-black dark:text-white">
                  📅 วันที่สอบ
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {candidateData.exam_date
                    ? new Date(candidateData.exam_date).toLocaleDateString(
                        "th-TH"
                      )
                    : "ไม่ระบุ"}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg dark:bg-meta-4">
                <div className="font-semibold text-black dark:text-white">
                  ⏱️ ระยะเวลา
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {candidateData.exam_duration || "ไม่ระบุ"}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg dark:bg-meta-4">
                <div className="font-semibold text-black dark:text-white">
                  🤖 โมเดล AI
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {candidateData.ai_model || "ไม่ระบุ"}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Live Evidence Monitoring Section */}
      {renderLiveEvidence()}

      {/* AI Evaluation Results Section */}
      {candidateData?.overall_feedback &&
        candidateData?.evaluation_method !== "fallback" && (
          <div className="mb-6 space-y-6">
            {/* AI Overall Assessment */}
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <h3 className="mb-4 text-xl font-semibold text-black dark:text-white flex items-center">
                🤖 การประเมินจาก Google AI (
                {candidateData?.ai_model || "Gemini 1.5 Pro"})
              </h3>

              <div className="space-y-4">
                {/* AI Recommendation */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    💡 คำแนะนำการจ้างงาน
                  </h4>
                  <p className="text-blue-700 dark:text-blue-400">
                    {candidateData?.ai_recommendation || "ไม่มีข้อมูล"}
                  </p>
                </div>

                {/* AI Overall Feedback */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                    📝 ความเห็นโดยรวม
                  </h4>
                  <p className="text-green-700 dark:text-green-400 leading-relaxed">
                    {candidateData?.overall_feedback || "ไม่มีข้อมูล"}
                  </p>
                </div>

                {/* Evaluation Metadata */}
                <div className="grid grid-cols-3 gap-4 text-center bg-gray-50 p-4 rounded-lg dark:bg-meta-4">
                  <div>
                    <p className="text-sm text-body dark:text-bodydark">
                      วิธีการประเมิน
                    </p>
                    <p className="font-semibold text-black dark:text-white">
                      {candidateData?.evaluation_method === "google_ai"
                        ? "🤖 Google AI"
                        : "📊 ระบบอัตโนมัติ"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-body dark:text-bodydark">
                      โมเดล AI
                    </p>
                    <p className="font-semibold text-black dark:text-white">
                      {candidateData?.ai_model || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-body dark:text-bodydark">
                      เวลาประเมิน
                    </p>
                    <p className="font-semibold text-black dark:text-white text-xs">
                      {candidateData?.evaluation_timestamp !== "ไม่ระบุ"
                        ? new Date(
                            candidateData?.evaluation_timestamp
                          ).toLocaleString("th-TH")
                        : "ไม่ระบุ"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Real Exam Questions and Answers Section */}
            {candidateData?.exam_questions &&
              candidateData.exam_questions.length > 0 && (
                <div className="mb-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                  <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                    📝 ข้อสอบที่ผู้สมัครทำจริง (จากฐานข้อมูล)
                  </h3>

                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-800 dark:text-blue-300">
                          🆔 Session ID:
                        </span>
                        <span className="ml-2 text-blue-700 dark:text-blue-400">
                          {candidateData.session_id}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800 dark:text-blue-300">
                          📚 แบบทดสอบ:
                        </span>
                        <span className="ml-2 text-blue-700 dark:text-blue-400">
                          {candidateData.exam_template_name}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800 dark:text-blue-300">
                          💻 ภาษา:
                        </span>
                        <span className="ml-2 text-blue-700 dark:text-blue-400">
                          {candidateData.programming_language}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {candidateData.exam_questions.map((question, index) => {
                      const candidateAnswer =
                        candidateData.candidate_answers?.[question.id];
                      const isMultipleChoice =
                        question.type === "multiple_choice";
                      const isCoding = question.type === "coding";

                      return (
                        <div
                          key={question.id}
                          className="border border-gray-200 rounded-lg p-6 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                                ข้อที่ {index + 1}:{" "}
                                {question.Criteria ||
                                  question.criteria ||
                                  "ไม่ระบุหัวข้อ"}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <span
                                  className={`px-2 py-1 rounded ${
                                    isMultipleChoice
                                      ? "bg-green-100 text-green-800"
                                      : "bg-purple-100 text-purple-800"
                                  }`}
                                >
                                  {isMultipleChoice
                                    ? "📝 ปรนัย"
                                    : "💻 เขียนโค้ด"}
                                </span>
                                <span>🎯 คะแนน: {question.points || 0}</span>
                                <span>
                                  ⏱️ เวลา: {question.time_limit || "ไม่จำกัด"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Question Content */}
                          <div className="mb-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                            <h5 className="font-medium text-black dark:text-white mb-2">
                              โจทย์:
                            </h5>
                            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {question.question || question.question_text}
                            </div>
                          </div>

                          {/* Multiple Choice Options */}
                          {isMultipleChoice && question.options && (
                            <div className="mb-4">
                              <h5 className="font-medium text-black dark:text-white mb-3">
                                ตัวเลือก:
                              </h5>
                              <div className="space-y-2">
                                {Object.entries(question.options).map(
                                  ([key, option]) => {
                                    const isSelected =
                                      candidateAnswer?.answer === option;
                                    const isCorrect =
                                      question.correct_answer === option;

                                    return (
                                      <div
                                        key={key}
                                        className={`p-3 rounded-lg border ${
                                          isSelected && isCorrect
                                            ? "bg-green-50 border-green-200 text-green-800"
                                            : isSelected && !isCorrect
                                            ? "bg-red-50 border-red-200 text-red-800"
                                            : !isSelected && isCorrect
                                            ? "bg-blue-50 border-blue-200 text-blue-800"
                                            : "bg-gray-50 border-gray-200 text-gray-700"
                                        }`}
                                      >
                                        <div className="flex items-center">
                                          <span className="font-medium mr-3">
                                            {key})
                                          </span>
                                          <span>{option}</span>
                                          <div className="ml-auto flex space-x-2">
                                            {isSelected && (
                                              <span className="text-sm">
                                                👆 เลือก
                                              </span>
                                            )}
                                            {isCorrect && (
                                              <span className="text-sm">
                                                ✅ ถูก
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )}

                          {/* Coding Answer */}
                          {isCoding && candidateAnswer?.answer && (
                            <div className="mb-4">
                              <h5 className="font-medium text-black dark:text-white mb-3">
                                คำตอบของผู้สมัคร:
                              </h5>
                              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                                <pre className="text-sm">
                                  <code>{candidateAnswer.answer}</code>
                                </pre>
                              </div>
                            </div>
                          )}

                          {/* Answer Status */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                สถานะ:{" "}
                                {candidateAnswer
                                  ? isMultipleChoice
                                    ? candidateAnswer.answer ===
                                      question.correct_answer
                                      ? "✅ ถูกต้อง"
                                      : "❌ ผิด"
                                    : "📝 ตอบแล้ว"
                                  : "⚠️ ไม่ได้ตอบ"}
                              </span>
                              {candidateAnswer?.timestamp && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  ⏰ ตอบเมื่อ:{" "}
                                  {new Date(
                                    candidateAnswer.timestamp
                                  ).toLocaleString("th-TH")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Coding Questions AI Evaluation */}
            {candidateData?.coding_scores &&
              candidateData.coding_scores.length > 0 && (
                <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                  <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                    💻 การประเมินข้อสอบเขียนโค้ด
                  </h3>
                  <div className="space-y-4">
                    {candidateData.coding_scores.map((question, index) => {
                      // Find the corresponding question from exam_questions to get the correct max points
                      const examQuestion = candidateData.exam_questions?.find(
                        (q) =>
                          q.id.toString() === question.question_id?.toString()
                      );
                      const maxPoints =
                        examQuestion?.points || question.max_score;
                      const questionNumber = examQuestion
                        ? candidateData.exam_questions.indexOf(examQuestion) + 1
                        : index + 1;

                      return (
                        <div
                          key={index}
                          className="border-l-4 border-primary pl-4 py-3 bg-gray-50 dark:bg-meta-4 rounded-r-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-black dark:text-white">
                              ข้อที่ {questionNumber}: {question.question_id}
                            </h4>
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
                              {question.score}/{maxPoints} คะแนน
                            </span>
                          </div>
                          <p className="text-sm text-body dark:text-bodydark mb-3">
                            {question.feedback}
                          </p>

                          {question.strengths &&
                            question.strengths.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-success mb-1">
                                  ✅ จุดแข็ง:
                                </p>
                                <ul className="text-xs text-body dark:text-bodydark pl-4">
                                  {question.strengths.map((strength, idx) => (
                                    <li key={idx} className="list-disc">
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          {question.improvements &&
                            question.improvements.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-warning mb-1">
                                  🔧 ควรปรับปรุง:
                                </p>
                                <ul className="text-xs text-body dark:text-bodydark pl-4">
                                  {question.improvements.map(
                                    (improvement, idx) => (
                                      <li key={idx} className="list-disc">
                                        {improvement}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Detailed AI Analysis */}
            {candidateData.detailed_analysis && (
              <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                  🔍 การวิเคราะห์เชิงลึก
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Strengths */}
                  {candidateData.detailed_analysis.strengths &&
                    candidateData.detailed_analysis.strengths.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-700">
                        <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center">
                          ✅ จุดแข็ง
                        </h4>
                        <ul className="space-y-2">
                          {candidateData.detailed_analysis.strengths.map(
                            (strength, index) => (
                              <li
                                key={index}
                                className="text-sm text-green-700 dark:text-green-400 flex items-start"
                              >
                                <span className="text-green-500 mr-2">•</span>
                                {strength}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {/* Weaknesses */}
                  {candidateData.detailed_analysis.weaknesses &&
                    candidateData.detailed_analysis.weaknesses.length > 0 && (
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 dark:bg-orange-900/20 dark:border-orange-700">
                        <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-3 flex items-center">
                          ⚠️ จุดที่ควรพัฒนา
                        </h4>
                        <ul className="space-y-2">
                          {candidateData.detailed_analysis.weaknesses.map(
                            (weakness, index) => (
                              <li
                                key={index}
                                className="text-sm text-orange-700 dark:text-orange-400 flex items-start"
                              >
                                <span className="text-orange-500 mr-2">•</span>
                                {weakness}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {/* Suggestions */}
                  {candidateData.detailed_analysis.suggestions &&
                    candidateData.detailed_analysis.suggestions.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                          💡 คำแนะนำ
                        </h4>
                        <ul className="space-y-2">
                          {candidateData.detailed_analysis.suggestions.map(
                            (suggestion, index) => (
                              <li
                                key={index}
                                className="text-sm text-blue-700 dark:text-blue-400 flex items-start"
                              >
                                <span className="text-blue-500 mr-2">•</span>
                                {suggestion}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Enhanced Score Breakdown Summary */}
            {candidateData?.score_breakdown && (
              <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                  📊 สรุปคะแนนรายละเอียด (จากการประเมิน AI)
                </h3>

                {/* Performance Summary Cards */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300">
                      🎯 ประสิทธิภาพโดยรวม
                    </h4>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        {candidateData.score_breakdown.percentage || 0}%
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        {candidateData.score_breakdown.total || 0} /{" "}
                        {candidateData.score_breakdown.total_max || 100} คะแนน
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-blue-200 rounded-full h-4 dark:bg-blue-800">
                    <div
                      className={`h-4 rounded-full transition-all duration-1000 ${
                        (candidateData.score_breakdown.percentage || 0) >= 70
                          ? "bg-green-500"
                          : (candidateData.score_breakdown.percentage || 0) >=
                            50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${
                          candidateData.score_breakdown.percentage || 0
                        }%`,
                      }}
                    ></div>
                  </div>

                  <div className="mt-2 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        (candidateData.score_breakdown.percentage || 0) >= 70
                          ? "bg-green-100 text-green-800"
                          : (candidateData.score_breakdown.percentage || 0) >=
                            50
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {(candidateData.score_breakdown.percentage || 0) >= 70
                        ? "🏆 ผ่านการสอบ"
                        : (candidateData.score_breakdown.percentage || 0) >= 50
                        ? "⚠️ ต้องพิจารณา"
                        : "❌ ไม่ผ่านการสอบ"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Multiple Choice Score */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center dark:bg-green-900/20 dark:border-green-700">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {candidateData.score_breakdown.multiple_choice || 0}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-400">
                      ข้อสอบปรนัย
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-500">
                      คะแนนเต็ม{" "}
                      {candidateData.multiple_choice_score?.max_score || 0}
                    </div>
                  </div>

                  {/* Coding Score */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center dark:bg-purple-900/20 dark:border-purple-700">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {candidateData.score_breakdown.coding || 0}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-400">
                      ข้อสอบเขียนโค้ด
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-500">
                      คะแนนเต็ม{" "}
                      {candidateData.coding_scores?.reduce(
                        (sum, q) => sum + (q.max_score || 0),
                        0
                      ) || 0}
                    </div>
                  </div>

                  {/* Total Score */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center dark:bg-blue-900/20 dark:border-blue-700">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {candidateData.score_breakdown.total || 0}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-400">
                      คะแนนรวม
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-500">
                      จาก {candidateData.score_breakdown.total_max || 100} คะแนน
                    </div>
                  </div>

                  {/* Percentage */}
                  <div
                    className={`border rounded-lg p-4 text-center ${
                      (candidateData.score_breakdown.percentage || 0) >= 70
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700"
                        : (candidateData.score_breakdown.percentage || 0) >= 50
                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700"
                        : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700"
                    }`}
                  >
                    <div
                      className={`text-3xl font-bold mb-1 ${
                        (candidateData.score_breakdown.percentage || 0) >= 70
                          ? "text-green-600"
                          : (candidateData.score_breakdown.percentage || 0) >=
                            50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {candidateData.score_breakdown.percentage || 0}%
                    </div>
                    <div
                      className={`text-sm ${
                        (candidateData.score_breakdown.percentage || 0) >= 70
                          ? "text-green-700 dark:text-green-400"
                          : (candidateData.score_breakdown.percentage || 0) >=
                            50
                          ? "text-yellow-700 dark:text-yellow-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      เปอร์เซนต์รวม
                    </div>
                    <div
                      className={`text-xs font-medium ${
                        (candidateData.score_breakdown.percentage || 0) >= 70
                          ? "text-green-600 dark:text-green-500"
                          : (candidateData.score_breakdown.percentage || 0) >=
                            50
                          ? "text-yellow-600 dark:text-yellow-500"
                          : "text-red-600 dark:text-red-500"
                      }`}
                    >
                      {(candidateData.score_breakdown.percentage || 0) >= 70
                        ? "✅ ผ่าน"
                        : (candidateData.score_breakdown.percentage || 0) >= 50
                        ? "⚠️ พิจารณา"
                        : "❌ ไม่ผ่าน"}
                    </div>
                  </div>
                </div>

                {/* Individual Coding Question Scores */}
                {candidateData.score_breakdown.coding_question_scores &&
                  candidateData.score_breakdown.coding_question_scores.length >
                    0 && (
                    <div>
                      <h4 className="font-semibold text-black dark:text-white mb-3">
                        คะแนนรายข้อ (ข้อสอบเขียนโค้ด)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {candidateData.score_breakdown.coding_question_scores.map(
                          (q, index) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4 dark:border-gray-700"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-black dark:text-white">
                                  ข้อ {q.question_id}: {q.criteria}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded text-sm font-bold ${getPerformanceColor(
                                    q.percentage
                                  )}`}
                                >
                                  {q.percentage}%
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {q.score}/{q.max_score} คะแนน
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2 dark:bg-gray-700">
                                <div
                                  className={`h-2 rounded-full ${
                                    q.percentage >= 80
                                      ? "bg-green-500"
                                      : q.percentage >= 60
                                      ? "bg-blue-500"
                                      : q.percentage >= 40
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${q.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

      {/* Real Criteria Analysis from AI */}
      {candidateData?.criteria_analysis &&
        Object.keys(candidateData.criteria_analysis).length > 0 && (
          <div className="mb-6 space-y-6">
            {/* Criteria Performance Breakdown */}
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                📈 วิเคราะห์ผลการสอบตามหัวข้อ (จากการประเมิน AI)
              </h3>
              <div className="space-y-4">
                {Object.entries(candidateData.criteria_analysis).map(
                  ([criteriaName, criteria], index) => (
                    <div
                      key={index}
                      className="border-b border-stroke pb-4 last:border-b-0 dark:border-strokedark"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-black dark:text-white">
                          {criteriaName
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            (criteria.percentage || 0) >= 80
                              ? "bg-success/10 text-success"
                              : (criteria.percentage || 0) >= 60
                              ? "bg-warning/10 text-warning"
                              : "bg-danger/10 text-danger"
                          }`}
                        >
                          {criteria.percentage || 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-body dark:text-bodydark mb-2">
                        <span>
                          คะแนน {criteria.score || 0} จาก{" "}
                          {criteria.max_score || 0} คะแนน
                        </span>
                        <span>
                          ตอบถูก {criteria.correct || 0} จาก{" "}
                          {criteria.total || 0} ข้อ
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className={`h-2 rounded-full ${
                            (criteria.percentage || 0) >= 80
                              ? "bg-success"
                              : (criteria.percentage || 0) >= 60
                              ? "bg-warning"
                              : "bg-danger"
                          }`}
                          style={{ width: `${criteria.percentage || 0}%` }}
                        ></div>
                      </div>
                      {criteria.feedback && (
                        <div className="mt-2 text-xs text-body dark:text-bodydark bg-gray-50 p-2 rounded dark:bg-meta-4">
                          💬 {criteria.feedback}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {candidateData?.coding_scores &&
              candidateData.coding_scores.length > 0 && (
                <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                  <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                    💻 วิเคราะห์ข้อสอบเขียนโค้ดแต่ละข้อ
                  </h3>
                  <div className="space-y-6">
                    {candidateData.coding_scores.map((question, index) => {
                      // Find the corresponding question from exam_questions to get the correct max points
                      const examQuestion = candidateData.exam_questions?.find(
                        (q) =>
                          q.id.toString() === question.question_id?.toString()
                      );
                      const maxPoints =
                        examQuestion?.points || question.max_score;
                      const questionNumber = examQuestion
                        ? candidateData.exam_questions.indexOf(examQuestion) + 1
                        : index + 1;

                      return (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 dark:border-gray-700"
                        >
                          {/* Question Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              <div>
                                <h4 className="font-semibold text-black dark:text-white">
                                  ข้อที่ {questionNumber}:{" "}
                                  {question.Criteria ||
                                    question.criteria ||
                                    "ไม่ระบุหัวข้อ"}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  หัวข้อ:{" "}
                                  {question.Criteria ||
                                    question.criteria ||
                                    "ไม่ระบุ"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                {question.score}/{maxPoints}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {Math.round((question.score / maxPoints) * 100)}
                                %
                              </div>
                            </div>
                          </div>

                          {/* Score Visualization */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                              <span>ความสำเร็จ</span>
                              <span>
                                {Math.round((question.score / maxPoints) * 100)}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                              <div
                                className={`h-3 rounded-full transition-all duration-500 ${
                                  Math.round(
                                    (question.score / maxPoints) * 100
                                  ) >= 80
                                    ? "bg-green-500"
                                    : Math.round(
                                        (question.score / maxPoints) * 100
                                      ) >= 60
                                    ? "bg-blue-500"
                                    : Math.round(
                                        (question.score / maxPoints) * 100
                                      ) >= 40
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{
                                  width: `${Math.round(
                                    (question.score / maxPoints) * 100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* AI Feedback */}
                          {question.feedback && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-700">
                              <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                                🤖 ความเห็นจาก AI
                              </h5>
                              <p className="text-blue-700 dark:text-blue-400 text-sm leading-relaxed">
                                {question.feedback}
                              </p>
                            </div>
                          )}

                          {/* Strengths and Improvements Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Strengths */}
                            {question.strengths &&
                              question.strengths.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/20 dark:border-green-700">
                                  <h5 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center">
                                    ✅ จุดแข็ง
                                  </h5>
                                  <ul className="space-y-2">
                                    {question.strengths.map((strength, idx) => (
                                      <li
                                        key={idx}
                                        className="text-sm text-green-700 dark:text-green-400 flex items-start"
                                      >
                                        <span className="text-green-500 mr-2 mt-1">
                                          •
                                        </span>
                                        <span>{strength}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                            {/* Improvements */}
                            {question.improvements &&
                              question.improvements.length > 0 && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 dark:bg-orange-900/20 dark:border-orange-700">
                                  <h5 className="font-semibold text-orange-800 dark:text-orange-300 mb-3 flex items-center">
                                    🔧 ควรปรับปรุง
                                  </h5>
                                  <ul className="space-y-2">
                                    {question.improvements.map(
                                      (improvement, idx) => (
                                        <li
                                          key={idx}
                                          className="text-sm text-orange-700 dark:text-orange-400 flex items-start"
                                        >
                                          <span className="text-orange-500 mr-2 mt-1">
                                            •
                                          </span>
                                          <span>{improvement}</span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Show a message when no data is available */}
            {(!candidateData?.coding_scores ||
              candidateData.coding_scores.length === 0) &&
              (!candidateData?.multiple_choice_score ||
                candidateData.multiple_choice_score.score === 0) && (
                <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                      ไม่มีข้อมูลการสอบ
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      ยังไม่มีผลการประเมินจาก AI สำหรับการสอบนี้
                    </p>
                  </div>
                </div>
              )}

            {/* Multiple Choice Analysis */}
            {candidateData?.multiple_choice_score &&
              candidateData.multiple_choice_score.score > 0 && (
                <div className="mb-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                  <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                    📝 วิเคราะห์ข้อสอบปรนัย
                  </h3>

                  {/* Overall MC Performance */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-green-800 dark:text-green-300">
                        📊 ผลการสอบปรนัยโดยรวม
                      </h4>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {candidateData.multiple_choice_score.score}/
                          {candidateData.multiple_choice_score.max_score}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-400">
                          {candidateData.multiple_choice_score.percentage}%
                          ความสำเร็จ
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-green-200 rounded-full h-3 dark:bg-green-800">
                      <div
                        className="h-3 bg-green-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${candidateData.multiple_choice_score.percentage}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Criteria Breakdown for MC */}
                  {candidateData.multiple_choice_score.criteria_breakdown &&
                    Object.keys(
                      candidateData.multiple_choice_score.criteria_breakdown
                    ).length > 0 && (
                      <div>
                        <h4 className="font-semibold text-black dark:text-white mb-4">
                          🎯 การแยกวิเคราะห์ตามหัวข้อ
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(
                            candidateData.multiple_choice_score
                              .criteria_breakdown
                          ).map(([criteriaName, criteria], index) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4 bg-white dark:bg-gray-800 dark:border-gray-700"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-black dark:text-white text-sm">
                                  {criteriaName
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </h5>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-bold ${
                                    (criteria.percentage || 0) >= 80
                                      ? "bg-green-100 text-green-800"
                                      : (criteria.percentage || 0) >= 60
                                      ? "bg-blue-100 text-blue-800"
                                      : (criteria.percentage || 0) >= 40
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {criteria.percentage || 0}%
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                  <span>
                                    คะแนน: {criteria.score || 0}/
                                    {criteria.max_score || 0}
                                  </span>
                                  <span>
                                    ถูก: {criteria.correct || 0}/
                                    {criteria.total || 0}
                                  </span>
                                </div>

                                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      (criteria.percentage || 0) >= 80
                                        ? "bg-green-500"
                                        : (criteria.percentage || 0) >= 60
                                        ? "bg-blue-500"
                                        : (criteria.percentage || 0) >= 40
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{
                                      width: `${criteria.percentage || 0}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

            {/* Enhanced AI Proctoring Analysis */}
            <div className="mb-6 space-y-6">
              {/* Main Proctoring Overview */}
              <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                  🤖 {t("admin.ai_proctoring_analysis")}
                </h3>

                {/* Threat Level Indicator */}
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center rounded-full px-4 py-2 text-lg font-bold bg-gray-100 text-gray-600 border border-gray-300">
                    🔒 --
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="rounded-sm border border-stroke bg-gradient-to-br from-danger/5 to-danger/10 p-4 text-center dark:border-strokedark">
                    <h4 className="mb-2 text-sm font-medium text-black dark:text-white">
                      {t("admin.cheating_percentage")}
                    </h4>
                    <div
                      className={`text-3xl font-bold ${getCheatingColor(
                        candidateData.cheating_percentage || 0
                      )}`}
                    >
                      {candidateData.cheating_percentage || 0}%
                    </div>
                  </div>
                  <div className="rounded-sm border border-stroke bg-gradient-to-br from-primary/5 to-primary/10 p-4 text-center dark:border-strokedark">
                    <h4 className="mb-2 text-sm font-medium text-black dark:text-white">
                      {t("admin.ai_confidence")}
                    </h4>
                    <div className="text-3xl font-bold text-primary">
                      {candidateData.ai_confidence || 0}%
                    </div>
                  </div>
                  <div className="rounded-sm border border-stroke bg-gradient-to-br from-warning/5 to-warning/10 p-4 text-center dark:border-strokedark">
                    <h4 className="mb-2 text-sm font-medium text-black dark:text-white">
                      {t("admin.suspicious_events")}
                    </h4>
                    <div className="text-3xl font-bold text-gray-600">
                      {candidateData.proctoring_events &&
                      candidateData.proctoring_events.length > 0
                        ? candidateData.proctoring_events.length
                        : "--"}
                    </div>
                  </div>
                  <div className="rounded-sm border border-stroke bg-gradient-to-br from-gray-50 to-gray-100 p-4 text-center dark:border-strokedark">
                    <h4 className="mb-2 text-sm font-medium text-black dark:text-white">
                      ความแม่นยำใบหน้า
                    </h4>
                    <div className="text-3xl font-bold text-gray-600">--</div>
                  </div>
                </div>

                {/* System Status */}
                <div className="rounded-sm bg-gradient-to-r from-meta-2/10 to-primary/5 p-4 dark:bg-meta-4/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">
                        🔗 N8N Workflow Status:
                      </span>{" "}
                      <span className="text-success">
                        ✅ AI Analysis Completed
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">📊 Analysis Model:</span>{" "}
                      YOLOv11 + Face Recognition + Behavior Detection
                    </div>
                    <div>
                      <span className="font-medium">⏱️ Processing Time:</span>{" "}
                      2.3 seconds
                    </div>
                  </div>
                </div>
              </div>

              {/* Biometric Analysis Only */}
              <div className="grid grid-cols-1 gap-6">
                {/* Biometric Analysis */}
                <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                  <h4 className="mb-4 text-lg font-semibold text-black dark:text-white">
                    👤 การวิเคราะห์ชีวมิติ
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-sm dark:bg-meta-4">
                      <span className="text-black dark:text-white">
                        ความแม่นยำการจดจำใบหน้า
                      </span>
                      <span className="font-bold text-gray-600">--</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-sm dark:bg-meta-4">
                      <h5 className="font-medium text-black dark:text-white mb-2">
                        Eye Tracking สรุป
                      </h5>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>👁️ มองคำถาม</span>
                          <span className="text-gray-600">--</span>
                        </div>
                        <div className="flex justify-between">
                          <span>📝 มองตัวเลือก</span>
                          <span className="text-gray-600">--</span>
                        </div>
                        <div className="flex justify-between">
                          <span>❌ มองนอกจอ</span>
                          <span className="text-gray-600">--</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Evidence Capture Display - Moved here after AI Proctoring */}
              {evidenceData && (
                <div className="mt-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                  <h3 className="mb-6 text-xl font-semibold text-black dark:text-white flex items-center">
                    📸 หลักฐานการโกงที่บันทึกไว้ (YOLO11 Evidence Capture)
                    {loadingEvidence && (
                      <div className="ml-3 animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    )}
                  </h3>

                  {/* Evidence Summary Cards */}
                  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div
                      className={`rounded-sm p-4 text-center ${
                        evidenceData.summary.overall_risk_level === "critical"
                          ? "bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300"
                          : evidenceData.summary.overall_risk_level === "high"
                          ? "bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300"
                          : evidenceData.summary.overall_risk_level === "medium"
                          ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300"
                          : "bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300"
                      }`}
                    >
                      <h4 className="mb-2 text-sm font-medium text-black">
                        ระดับความเสี่ยง
                      </h4>
                      <div
                        className={`text-2xl font-bold ${
                          evidenceData.summary.overall_risk_level === "critical"
                            ? "text-red-600"
                            : evidenceData.summary.overall_risk_level === "high"
                            ? "text-orange-600"
                            : evidenceData.summary.overall_risk_level ===
                              "medium"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {evidenceData.summary.overall_risk_level.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600">
                        คะแนน: {evidenceData.summary.overall_score}%
                      </div>
                    </div>

                    <div className="rounded-sm bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 p-4 text-center">
                      <h4 className="mb-2 text-sm font-medium text-black">
                        หลักฐานทั้งหมด
                      </h4>
                      <div className="text-2xl font-bold text-blue-600">
                        {evidenceData.summary.statistics.total_evidence_events}
                      </div>
                      <div className="text-sm text-gray-600">เหตุการณ์</div>
                    </div>

                    <div className="rounded-sm bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 p-4 text-center">
                      <h4 className="mb-2 text-sm font-medium text-black">
                        รูปภาพที่บันทึก
                      </h4>
                      <div className="text-2xl font-bold text-purple-600">
                        {evidenceData.summary.statistics.captured_frames}
                      </div>
                      <div className="text-sm text-gray-600">รูปภาพ</div>
                    </div>

                    <div className="rounded-sm bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 p-4 text-center">
                      <h4 className="mb-2 text-sm font-medium text-black">
                        เหตุการณ์เสี่ยงสูง
                      </h4>
                      <div className="text-2xl font-bold text-red-600">
                        {evidenceData.summary.statistics.high_risk_events}
                      </div>
                      <div className="text-sm text-gray-600">
                        เหตุการณ์ ≥90%
                      </div>
                    </div>
                  </div>

                  {/* Event Type Breakdown */}
                  {Object.keys(evidenceData.summary.event_breakdown).length >
                    0 && (
                    <div className="mb-6">
                      <h4 className="mb-4 text-lg font-semibold text-black dark:text-white">
                        📊 สถิติแยกตามประเภทเหตุการณ์
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(
                          evidenceData.summary.event_breakdown
                        ).map(([eventType, stats]) => (
                          <div
                            key={eventType}
                            className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                {eventType === "mobile_phone_detected"
                                  ? "📱 ตรวจพบโทรศัพท์"
                                  : eventType === "face_lost"
                                  ? "👻 หน้าหาย"
                                  : eventType === "head_down_detected"
                                  ? "🔍 ก้มหน้า"
                                  : eventType === "head_turned_away"
                                  ? "🔄 หันหน้าไป"
                                  : eventType === "digital_device_detected"
                                  ? "📱 อุปกรณ์ดิจิทัล"
                                  : eventType}
                              </h5>
                              <span
                                className={`px-2 py-1 rounded text-xs font-bold ${
                                  stats.max_score >= 90
                                    ? "bg-red-100 text-red-800"
                                    : stats.max_score >= 75
                                    ? "bg-orange-100 text-orange-800"
                                    : stats.max_score >= 50
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {stats.max_score}%
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              จำนวน: {stats.count} ครั้ง
                              <br />
                              เฉลี่ย: {stats.avg_score}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent High Risk Events */}
                  {evidenceData.summary.recent_high_risk_events.length > 0 && (
                    <div className="mb-6">
                      <h4 className="mb-4 text-lg font-semibold text-black dark:text-white">
                        🚨 เหตุการณ์เสี่ยงสูงล่าสุด (≥75%)
                      </h4>
                      <div className="space-y-3">
                        {evidenceData.summary.recent_high_risk_events.map(
                          (event, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-700"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="text-2xl">
                                  {event.event_type === "mobile_phone_detected"
                                    ? "📱"
                                    : event.event_type === "face_lost"
                                    ? "👻"
                                    : event.event_type === "head_down_detected"
                                    ? "🔍"
                                    : event.event_type === "head_turned_away"
                                    ? "🔄"
                                    : "⚠️"}
                                </div>
                                <div>
                                  <div className="font-medium text-red-800 dark:text-red-300">
                                    {event.event_type ===
                                    "mobile_phone_detected"
                                      ? "ตรวจพบโทรศัพท์"
                                      : event.event_type === "face_lost"
                                      ? "หน้าหายไป"
                                      : event.event_type ===
                                        "head_down_detected"
                                      ? "ก้มหน้าลง"
                                      : event.event_type === "head_turned_away"
                                      ? "หันหน้าไปทางอื่น"
                                      : event.event_type}
                                  </div>
                                  <div className="text-sm text-red-600 dark:text-red-400">
                                    {new Date(event.timestamp).toLocaleString(
                                      "th-TH"
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-bold ${
                                    event.score >= 90
                                      ? "bg-red-100 text-red-800"
                                      : "bg-orange-100 text-orange-800"
                                  }`}
                                >
                                  {event.score}%
                                </span>
                                {event.frame_captured && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    📸 มีรูปภาพ
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Proctoring Events Timeline */}
            {candidateData.proctoring_events &&
            candidateData.proctoring_events.length > 0 ? (
              <div className="mb-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                  ⏰ {t("admin.suspicious_events_timeline")}
                </h3>

                {/* Timeline Stats */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-gray-50 rounded-sm dark:bg-meta-4">
                    <div className="text-2xl font-bold text-danger">
                      {candidateData.proctoring_events?.filter(
                        (e) => e.severity === "high"
                      ).length || 0}
                    </div>
                    <div className="text-sm text-body dark:text-bodydark">
                      เหตุการณ์ความเสี่ยงสูง
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-sm dark:bg-meta-4">
                    <div className="text-2xl font-bold text-warning">
                      {candidateData.proctoring_events?.filter(
                        (e) => e.severity === "medium"
                      ).length || 0}
                    </div>
                    <div className="text-sm text-body dark:text-bodydark">
                      เหตุการณ์ความเสี่ยงปานกลาง
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-sm dark:bg-meta-4">
                    <div className="text-2xl font-bold text-success">
                      {candidateData.proctoring_events?.filter(
                        (e) => e.severity === "low"
                      ).length || 0}
                    </div>
                    <div className="text-sm text-body dark:text-bodydark">
                      เหตุการณ์ความเสี่ยงต่ำ
                    </div>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {(candidateData.proctoring_events || []).map(
                    (event, index) => (
                      <div
                        key={index}
                        className={`flex items-start rounded-sm border p-4 mb-3 ${getSeverityColor(
                          event.severity
                        )} transition-all hover:shadow-md`}
                      >
                        <div className="mr-4 text-2xl">
                          {getSeverityIcon(event.severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold text-black dark:text-white">
                                {event.timestamp}
                              </span>
                              <span className="text-sm text-body dark:text-bodydark">
                                {event.type?.replace("_", " ") || "Unknown"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`rounded px-2 py-1 text-xs font-medium ${getSeverityColor(
                                  event.severity
                                )}`}
                              >
                                {event.severity
                                  ? event.severity.toUpperCase()
                                  : "N/A"}
                              </span>
                              {event.aiConfidence && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  AI: {event.aiConfidence}%
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 font-medium text-black dark:text-white">
                            {event.description}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-xs text-body dark:text-bodydark">
                            <span>
                              {t("admin.duration")}: {event.duration}
                            </span>
                            {event.frameCapture && (
                              <span className="bg-gray-100 px-2 py-1 rounded dark:bg-gray-700">
                                📸 {event.frameCapture}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col space-y-2">
                          <button
                            onClick={() =>
                              openCapturedFramesModal(selectedExamSession)
                            }
                            className="rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-opacity-90 transition-colors"
                          >
                            📹 ดูหลักฐาน
                          </button>
                          {event.frameCapture && (
                            <button
                              onClick={() =>
                                alert(`ดูภาพหน้าจอ: ${event.frameCapture}`)
                              }
                              className="rounded bg-secondary px-3 py-1 text-xs font-medium text-white hover:bg-opacity-90 transition-colors"
                            >
                              📸 ดูภาพ
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                  ⏰ {t("admin.suspicious_events_timeline")}
                </h3>
                <div className="text-center py-8">
                  <p className="text-success text-lg">
                    ✅ ไม่พบเหตุการณ์ต้องสงสัย
                  </p>
                  <p className="text-body dark:text-bodydark text-sm mt-2">
                    ผู้สมัครสอบในลักษณะที่เหมาะสม ไม่มีพฤติกรรมน่าสงสัย
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Captured Frames Modal */}
      {showCapturedFramesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl max-w-6xl w-full m-4 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-stroke dark:border-strokedark">
              <h3 className="text-xl font-semibold text-black dark:text-white">
                📸 หลักฐานการโกงที่บันทึกไว้
              </h3>
              <button
                onClick={closeCapturedFramesModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingFrames ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-body dark:text-bodydark">
                    กำลังโหลดหลักฐาน...
                  </p>
                </div>
              ) : capturedFrames.length > 0 ? (
                <>
                  {/* Summary */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
                      📊 สรุปหลักฐานที่จับได้
                    </h4>
                    <p className="text-blue-700 dark:text-blue-400">
                      พบหลักฐานการโกงทั้งหมด{" "}
                      <strong>{capturedFrames.length}</strong> ครั้ง
                    </p>
                  </div>

                  {/* Frames Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {capturedFrames.map((frame, index) => (
                      <div
                        key={frame.id}
                        className="border border-stroke dark:border-strokedark rounded-lg overflow-hidden"
                      >
                        {/* Frame Image */}
                        <div className="relative">
                          <img
                            src={`${
                              process.env.REACT_APP_API_BASE_URL ||
                              "http://localhost:8000"
                            }${frame.frame_url}`}
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setSelectedFrame(frame)}
                            onError={(e) => {
                              e.target.src =
                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=";
                            }}
                          />
                          {/* Evidence Level Badge */}
                          <div
                            className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
                              frame.evidence_level === "critical"
                                ? "bg-red-500 text-white"
                                : frame.evidence_level === "high"
                                ? "bg-orange-500 text-white"
                                : frame.evidence_level === "medium"
                                ? "bg-yellow-500 text-black"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {frame.evidence_level?.toUpperCase()}
                          </div>
                          {/* Score Badge */}
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white rounded text-xs font-bold">
                            {Math.round(frame.cheating_score)}%
                          </div>
                        </div>

                        {/* Frame Info */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-black dark:text-white">
                              {frame.event_type === "mobile_phone_detected"
                                ? "📱 ตรวจพบโทรศัพท์"
                                : frame.event_type === "face_lost"
                                ? "👻 หน้าหายไป"
                                : frame.event_type === "head_down_detected"
                                ? "🔽 ก้มหน้าลง"
                                : frame.event_type === "head_turned_away"
                                ? "🔄 หันหน้าไป"
                                : frame.event_type}
                            </span>
                          </div>
                          <div className="text-xs text-body dark:text-bodydark">
                            <div>
                              {new Date(frame.timestamp).toLocaleString(
                                "th-TH"
                              )}
                            </div>
                            <div className="mt-1">
                              ความเชื่อมั่น:{" "}
                              {Math.round((frame.confidence || 0) * 100)}%
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedFrame(frame)}
                            className="mt-2 w-full bg-primary text-white px-3 py-1 rounded text-xs hover:bg-opacity-90 transition-colors"
                          >
                            🔍 ดูรายละเอียด
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📸</div>
                  <h4 className="text-xl font-semibold text-black dark:text-white mb-2">
                    ไม่พบหลักฐานการโกง
                  </h4>
                  <p className="text-body dark:text-bodydark">
                    ไม่มีการบันทึกหลักฐานการโกงสำหรับเซสชันนี้
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Frame Detail Modal */}
      {selectedFrame && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                📸 รายละเอียดหลักฐาน
              </h3>
              <button
                onClick={() => setSelectedFrame(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image */}
                <div>
                  <img
                    src={`${
                      process.env.REACT_APP_API_BASE_URL ||
                      "http://localhost:8000"
                    }${selectedFrame.frame_url}`}
                    alt="Evidence Detail"
                    className="w-full rounded-lg shadow-lg"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=";
                    }}
                  />
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-black dark:text-white mb-2">
                      ข้อมูลเหตุการณ์
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-body dark:text-bodydark">
                          ประเภท:
                        </span>
                        <span className="font-medium text-black dark:text-white">
                          {selectedFrame.event_type === "mobile_phone_detected"
                            ? "📱 ตรวจพบโทรศัพท์"
                            : selectedFrame.event_type === "face_lost"
                            ? "👻 หน้าหายไป"
                            : selectedFrame.event_type === "head_down_detected"
                            ? "🔽 ก้มหน้าลง"
                            : selectedFrame.event_type === "head_turned_away"
                            ? "🔄 หันหน้าไป"
                            : selectedFrame.event_type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-body dark:text-bodydark">
                          คะแนนความเสี่ยง:
                        </span>
                        <span
                          className={`font-bold ${
                            selectedFrame.cheating_score >= 90
                              ? "text-red-500"
                              : selectedFrame.cheating_score >= 70
                              ? "text-orange-500"
                              : "text-yellow-500"
                          }`}
                        >
                          {Math.round(selectedFrame.cheating_score)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-body dark:text-bodydark">
                          ระดับหลักฐาน:
                        </span>
                        <span
                          className={`font-bold ${
                            selectedFrame.evidence_level === "critical"
                              ? "text-red-500"
                              : selectedFrame.evidence_level === "high"
                              ? "text-orange-500"
                              : selectedFrame.evidence_level === "medium"
                              ? "text-yellow-500"
                              : "text-gray-500"
                          }`}
                        >
                          {selectedFrame.evidence_level?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-body dark:text-bodydark">
                          ความเชื่อมั่น:
                        </span>
                        <span className="font-medium text-black dark:text-white">
                          {Math.round((selectedFrame.confidence || 0) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-body dark:text-bodydark">
                          เวลา:
                        </span>
                        <span className="font-medium text-black dark:text-white">
                          {new Date(selectedFrame.timestamp).toLocaleString(
                            "th-TH"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  {selectedFrame.metadata && (
                    <div>
                      <h4 className="font-semibold text-black dark:text-white mb-2">
                        ข้อมูลเพิ่มเติม
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs">
                        <pre className="whitespace-pre-wrap text-body dark:text-bodydark">
                          {JSON.stringify(selectedFrame.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCandidateDetail;
