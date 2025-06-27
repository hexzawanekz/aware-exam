import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";

const CandidateDashboard = ({ candidate, onLogout, onStartExam }) => {
  const { t } = useTranslation();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingExamId, setStartingExamId] = useState(null);

  useEffect(() => {
    if (candidate) {
      loadExams();
    }
  }, [candidate]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCandidateExams(candidate.id);
      if (response) {
        setExams(response.exams || []);
      }
    } catch (err) {
      console.error("Error loading exams:", err);
      setError(t("candidate_dashboard.error_loading_exams"));
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (exam) => {
    try {
      setStartingExamId(exam.session_id);
      if (onStartExam) {
        await onStartExam(exam);
      }
    } catch (error) {
      console.error("Error starting exam:", error);
      setError(t("candidate_dashboard.exam_start_error"));
    } finally {
      setStartingExamId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "รอสอบ":
        return "bg-yellow-100 text-yellow-800";
      case "กำลังสอบ":
        return "bg-blue-100 text-blue-800";
      case "ผ่านการสอบ":
        return "bg-green-100 text-green-800";
      case "ไม่ผ่านการสอบ":
        return "bg-red-100 text-red-800";
      case "ยกเลิก":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusTranslation = (status) => {
    const statusMap = {
      รอสอบ: t("candidate_dashboard.status.waiting"),
      กำลังสอบ: t("candidate_dashboard.status.in_progress"),
      ผ่านการสอบ: t("candidate_dashboard.status.passed"),
      ไม่ผ่านการสอบ: t("candidate_dashboard.status.failed"),
      ยกเลิก: t("candidate_dashboard.status.cancelled"),
    };
    return statusMap[status] || status;
  };

  const canStartExam = (exam) => {
    return exam.status === "รอสอบ" && startingExamId !== exam.session_id;
  };

  const canContinueExam = (exam) => {
    return exam.status === "กำลังสอบ" && startingExamId !== exam.session_id;
  };

  const isStartingExam = (exam) => {
    return startingExamId === exam.session_id;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-270 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-black dark:text-white">
            {t("candidate_dashboard.loading_exams")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-270">
      {/* Breadcrumb */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          {t("candidate_dashboard.title")}
        </h2>

        <nav>
          <ol className="flex items-center gap-2">
            <li>
              <div className="font-medium text-primary">
                {t("candidate_dashboard.welcome")}, {candidate.first_name}{" "}
                {candidate.last_name}
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* Header Card */}
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-xl font-semibold text-black dark:text-white">
              📚 {t("candidate_dashboard.assigned_exams")}
            </h4>
            <p className="text-sm text-body dark:text-bodydark mt-2">
              เลือกข้อสอบที่คุณต้องการทำและเริ่มต้นการสอบด้วยระบบตรวจจับการโกงด้วย
              AI
            </p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center justify-center rounded-md border border-meta-3 py-2 px-4 text-center font-medium text-meta-3 hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            {t("candidate_dashboard.logout")}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-sm border border-stroke bg-white px-5 py-3 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex">
            <div className="w-full">
              <h5 className="text-sm font-medium text-[#BC1C21]">{error}</h5>
            </div>
          </div>
        </div>
      )}

      {exams.length === 0 ? (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-bodydark2">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-black dark:text-white">
              {t("candidate_dashboard.no_exams")}
            </h3>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {exams.map((exam) => (
            <div
              key={exam.session_id}
              className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                  <svg
                    className="fill-primary dark:fill-white"
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.8334 1.83337H5.50008C4.39551 1.83337 3.50008 2.72879 3.50008 3.83337V18.1667C3.50008 19.2713 4.39551 20.1667 5.50008 20.1667H16.5001C17.6047 20.1667 18.5001 19.2713 18.5001 18.1667V7.16671L12.8334 1.83337Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12.8334 1.83337V7.16671H18.5001"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex rounded-full py-1 px-3 text-xs font-medium ${
                      exam.status === "รอสอบ"
                        ? "bg-success bg-opacity-10 text-success"
                        : exam.status === "กำลังสอบ"
                        ? "bg-warning bg-opacity-10 text-warning"
                        : exam.status === "ผ่านการสอบ"
                        ? "bg-success bg-opacity-10 text-success"
                        : "bg-danger bg-opacity-10 text-danger"
                    }`}
                  >
                    {getStatusTranslation(exam.status)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h4 className="text-title-md font-bold text-black dark:text-white mb-2">
                    {exam.name}
                  </h4>
                  {exam.description && (
                    <p className="text-sm text-body dark:text-bodydark mb-4">
                      {exam.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <p className="text-body dark:text-bodydark">
                        ⏱️ {t("candidate_dashboard.exam_info.duration")}
                      </p>
                      <p className="font-medium text-black dark:text-white">
                        {exam.duration_minutes}{" "}
                        {t("candidate_dashboard.exam_info.minutes")}
                      </p>
                    </div>
                    <div>
                      <p className="text-body dark:text-bodydark">
                        📊 {t("candidate_dashboard.exam_info.questions")}
                      </p>
                      <p className="font-medium text-black dark:text-white">
                        {exam.questions_count}{" "}
                        {t("candidate_dashboard.exam_info.questions_count")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-body dark:text-bodydark">
                        💼 ตำแหน่ง:
                      </span>
                      <span className="font-medium text-black dark:text-white">
                        {exam.position_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-body dark:text-bodydark">
                        🏢 แผนก:
                      </span>
                      <span className="font-medium text-black dark:text-white">
                        {exam.department_name}
                      </span>
                    </div>
                    {exam.company_name && (
                      <div className="flex justify-between">
                        <span className="text-body dark:text-bodydark">
                          🏭 บริษัท:
                        </span>
                        <span className="font-medium text-black dark:text-white">
                          {exam.company_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  {canStartExam(exam) ? (
                    <button
                      onClick={() => handleStartExam(exam)}
                      className="w-full rounded-lg border border-primary bg-primary p-3 font-medium text-white transition hover:bg-opacity-90"
                    >
                      🔒 {t("candidate_dashboard.start_exam")}
                    </button>
                  ) : canContinueExam(exam) ? (
                    <button
                      onClick={() => handleStartExam(exam)}
                      className="w-full rounded-lg border border-warning bg-warning p-3 font-medium text-white transition hover:bg-opacity-90"
                    >
                      📝 {t("candidate_dashboard.continue_exam")}
                    </button>
                  ) : isStartingExam(exam) ? (
                    <button
                      disabled
                      className="w-full rounded-lg border border-primary bg-primary p-3 font-medium text-white opacity-50 cursor-not-allowed"
                    >
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t("candidate_dashboard.starting_exam")}
                      </div>
                    </button>
                  ) : exam.status === "ผ่านการสอบ" ||
                    exam.status === "ไม่ผ่านการสอบ" ? (
                    <button
                      disabled
                      className="w-full rounded-lg border border-stroke bg-gray p-3 font-medium text-bodydark cursor-not-allowed"
                    >
                      ✅ {t("candidate_dashboard.exam_completed")}
                    </button>
                  ) : (
                    <div className="w-full text-center p-3 text-sm text-bodydark2 dark:text-bodydark">
                      {getStatusTranslation(exam.status)}
                    </div>
                  )}

                  <div className="mt-3 text-center text-xs text-bodydark2 dark:text-bodydark bg-gray dark:bg-meta-4 py-2 px-3 rounded">
                    🤖 ระบบตรวจจับการโกงด้วย AI • 📹 เปิดกล้องตลอดเวลา
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;
