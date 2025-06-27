import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";

const AdminExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExamDetails();
  }, [id]);

  const loadExamDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.request(
        `/api/v1/admin/exam-templates/${id}`
      );
      setExam(response.data);
    } catch (error) {
      console.error("Failed to load exam details:", error);
      setError(t("admin.error_loading_exam"));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("th-TH");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="flex items-center justify-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="ml-3 text-sm text-body dark:text-bodydark">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin/exams")}
            className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            ← {t("admin.back_to_exams")}
          </button>
        </div>
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center py-10">
            <p className="text-body dark:text-bodydark">
              {error || t("admin.exam_not_found")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/exams")}
            className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            ← {t("admin.back_to_exams")}
          </button>
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            📝 {exam.name}
          </h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            onClick={() => navigate(`/admin/exams/${id}/edit`)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
          >
            ✏️ {t("common.edit")}
          </button>
        </div>
      </div>

      {/* Exam Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <span className="text-xl">📊</span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {exam.questions?.length || 0}
              </h4>
              <span className="text-sm font-medium">
                {t("admin.total_questions")}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <span className="text-xl">⏱️</span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {exam.duration_minutes}
              </h4>
              <span className="text-sm font-medium">{t("admin.minutes")}</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <span className="text-xl">💻</span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {exam.programming_language}
              </h4>
              <span className="text-sm font-medium">
                {t("admin.programming_language")}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <span className="text-xl">📅</span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {exam.created_at ? formatDate(exam.created_at) : "-"}
              </h4>
              <span className="text-sm font-medium">
                {t("admin.created_date")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Information */}
      <div className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            {t("admin.exam_information")}
          </h3>
        </div>
        <div className="p-7">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                {t("admin.exam_name")}
              </label>
              <p className="text-body dark:text-bodydark">{exam.name}</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                {t("admin.programming_language")}
              </label>
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {exam.programming_language}
              </span>
            </div>
            {exam.description && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  {t("admin.description")}
                </label>
                <p className="text-body dark:text-bodydark">
                  {exam.description}
                </p>
              </div>
            )}
            {exam.position && (
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  {t("admin.position")}
                </label>
                <p className="text-body dark:text-bodydark">
                  {exam.position.name}
                  {exam.position.department_name && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {" "}
                      • {exam.position.department_name}
                    </span>
                  )}
                  {exam.position.company_name && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {" "}
                      • {exam.position.company_name}
                    </span>
                  )}
                </p>
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                {t("admin.status")}
              </label>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                  exam.is_active
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {exam.is_active ? t("common.active") : t("common.inactive")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Criteria Analysis Summary */}
      {exam.questions &&
        exam.questions.length > 0 &&
        (() => {
          // Calculate criteria breakdown
          const criteriaStats = {};
          let totalPoints = 0;

          exam.questions.forEach((q) => {
            const criteria = q.Criteria || t("admin.general_knowledge");
            const points = q.points || q.score || 10;
            totalPoints += points;

            if (!criteriaStats[criteria]) {
              criteriaStats[criteria] = { count: 0, points: 0 };
            }
            criteriaStats[criteria].count += 1;
            criteriaStats[criteria].points += points;
          });

          const hasValidCriteria = Object.keys(criteriaStats).some(
            (key) => key !== t("admin.general_knowledge")
          );

          return (
            hasValidCriteria && (
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    📊 {t("admin.criteria_analysis")} ({totalPoints}{" "}
                    {t("admin.total_points")})
                  </h3>
                </div>
                <div className="p-7">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(criteriaStats).map(([criteria, stats]) => (
                      <div
                        key={criteria}
                        className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-gray-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-black dark:text-white">
                            🎯 {criteria}
                          </h4>
                          <span className="text-lg font-bold text-primary">
                            {stats.points}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-body dark:text-bodydark">
                          <span>
                            {stats.count} {t("admin.questions")}
                          </span>
                          <span>
                            {((stats.points / totalPoints) * 100).toFixed(1)}%{" "}
                            {t("admin.of_total")}
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(stats.points / totalPoints) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          );
        })()}

      {/* Questions List */}
      {exam.questions && exam.questions.length > 0 && (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              {t("admin.questions_list")} ({exam.questions.length}{" "}
              {t("admin.questions")})
            </h3>
          </div>
          <div className="p-7">
            <div className="space-y-6">
              {exam.questions.map((question, index) => (
                <div
                  key={index}
                  className="rounded-sm border border-stroke bg-gray-50 p-6 dark:border-strokedark dark:bg-gray-800"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
                        {index + 1}
                      </span>
                      <span className="text-lg font-medium text-black dark:text-white">
                        {t("admin.question")} {index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        {question.type}
                      </span>
                      {/* Enhanced scoring display with points and criteria */}
                      {(question.points || question.score) && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {question.points || question.score}{" "}
                          {t("admin.points")}
                        </span>
                      )}
                      {question.Criteria && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          🎯 {question.Criteria}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-base text-black dark:text-white leading-relaxed">
                      {question.question}
                    </p>
                    {question.Criteria && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs font-medium text-body dark:text-bodydark">
                          {t("admin.criteria")}:
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                          🎯 {question.Criteria}
                        </span>
                        {(question.points || question.score) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            💯 {question.points || question.score}{" "}
                            {t("admin.points")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Multiple Choice Question Details */}
                  {question.type === "multiple_choice" &&
                    question.options &&
                    question.options.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-body dark:text-bodydark">
                          {t("admin.answer_options")}:
                        </p>
                        <div className="space-y-2 pl-4">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`flex items-center gap-3 p-3 rounded border ${
                                question.correct_answer === option
                                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                              }`}
                            >
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${
                                  question.correct_answer === option
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                                }`}
                              >
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span
                                className={`text-sm ${
                                  question.correct_answer === option
                                    ? "text-green-800 dark:text-green-200 font-medium"
                                    : "text-body dark:text-bodydark"
                                }`}
                              >
                                {typeof option === "string"
                                  ? option
                                  : option.text}
                              </span>
                              {question.correct_answer === option && (
                                <span className="ml-auto text-green-600 dark:text-green-400 font-medium">
                                  ✓ {t("admin.correct_answer")}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Coding Question Details */}
                  {question.type === "coding" && (
                    <div className="space-y-4">
                      {question.expected_output && (
                        <div>
                          <p className="mb-2 text-sm font-medium text-body dark:text-bodydark">
                            {t("admin.expected_output")}:
                          </p>
                          <pre className="overflow-x-auto rounded border bg-gray-100 p-4 text-sm dark:bg-gray-900">
                            <code className="text-black dark:text-white">
                              {question.expected_output}
                            </code>
                          </pre>
                        </div>
                      )}
                      {question.sample_input && (
                        <div>
                          <p className="mb-2 text-sm font-medium text-body dark:text-bodydark">
                            {t("admin.sample_input")}:
                          </p>
                          <pre className="overflow-x-auto rounded border bg-gray-100 p-3 text-sm dark:bg-gray-900">
                            <code className="text-black dark:text-white">
                              {question.sample_input}
                            </code>
                          </pre>
                        </div>
                      )}
                      {question.sample_output && (
                        <div>
                          <p className="mb-2 text-sm font-medium text-body dark:text-bodydark">
                            {t("admin.sample_output")}:
                          </p>
                          <pre className="overflow-x-auto rounded border bg-gray-100 p-3 text-sm dark:bg-gray-900">
                            <code className="text-black dark:text-white">
                              {question.sample_output}
                            </code>
                          </pre>
                        </div>
                      )}
                      {question.description && (
                        <div>
                          <p className="mb-2 text-sm font-medium text-body dark:text-bodydark">
                            {t("admin.description")}:
                          </p>
                          <p className="text-sm text-body dark:text-bodydark">
                            {question.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Essay Question Details */}
                  {question.type === "essay" && question.correct_answer && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-body dark:text-bodydark">
                        {t("admin.model_answer")}:
                      </p>
                      <div className="rounded border bg-gray-100 p-4 dark:bg-gray-900">
                        <p className="text-sm text-body dark:text-bodydark">
                          {question.correct_answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExamDetail;
