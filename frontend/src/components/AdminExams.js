import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";

const AdminExams = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [configOptions, setConfigOptions] = useState(null);
  const [aiFormData, setAiFormData] = useState({
    company: "",
    department: "",
    position: "",
    programmingLanguage: "",
    difficultyLevel: "",
    multipleChoiceCount: 10,
    codingQuestionCount: 2,
    examDuration: 60,
  });

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (showAIDialog && !configOptions) {
      loadConfigOptions();
    }
  }, [showAIDialog, configOptions]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExamTemplates();
      setExams(response.data || []);
    } catch (error) {
      console.error("Error loading exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfigOptions = async () => {
    try {
      const options = await apiService.getConfigOptions();
      setConfigOptions(options);
    } catch (error) {
      console.error("Error loading config options:", error);
    }
  };

  const viewExamDetails = (examId) => {
    navigate(`/admin/exams/${examId}`);
  };

  const deleteExam = async (examId) => {
    if (!window.confirm(t("admin.confirm_delete_exam"))) return;

    try {
      await apiService.deleteExamTemplate(examId);
      loadExams();
    } catch (error) {
      console.error("Error deleting exam:", error);
    }
  };

  const handleAIExamGeneration = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // Validate required fields
      if (
        !aiFormData.company ||
        !aiFormData.department ||
        !aiFormData.position ||
        !aiFormData.programmingLanguage ||
        !aiFormData.difficultyLevel
      ) {
        throw new Error(t("admin.all_fields_required"));
      }

      const aiConfig = {
        company: parseInt(aiFormData.company),
        department: parseInt(aiFormData.department),
        position: parseInt(aiFormData.position),
        programming_language: aiFormData.programmingLanguage,
        level: aiFormData.difficultyLevel,
        multiple_choice_count: parseInt(aiFormData.multipleChoiceCount),
        coding_question_count: parseInt(aiFormData.codingQuestionCount),
        duration_minutes: parseInt(aiFormData.examDuration),
      };

      const response = await apiService.request(
        "/api/v1/admin/exam-templates/generate-ai",
        {
          method: "POST",
          body: JSON.stringify(aiConfig),
        }
      );

      if (!response || !response.exam_template) {
        throw new Error(t("admin.invalid_response"));
      }

      setShowAIDialog(false);
      setAiFormData({
        company: "",
        department: "",
        position: "",
        programmingLanguage: "",
        difficultyLevel: "",
        multipleChoiceCount: 10,
        codingQuestionCount: 2,
        examDuration: 60,
      });
      loadExams();
    } catch (error) {
      console.error("Error in AI exam generation:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("th-TH");
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          📝 {t("admin.exams")}
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            onClick={() => setShowAIDialog(true)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            🤖 {t("admin.generate_ai_exam")}
          </button>
        </div>
      </div>

      {/* AI Exam Generation Modal */}
      {showAIDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-boxdark">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-black dark:text-white">
                🤖 {t("admin.generate_ai_exam")}
              </h3>
              <button
                onClick={() => setShowAIDialog(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAIExamGeneration} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.company")}
                  </label>
                  <select
                    value={aiFormData.company}
                    onChange={(e) =>
                      setAiFormData({
                        ...aiFormData,
                        company: e.target.value,
                        department: "",
                        position: "",
                      })
                    }
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    required
                  >
                    <option value="">{t("admin.select_company")}</option>
                    {configOptions?.companies?.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.department")}
                  </label>
                  <select
                    value={aiFormData.department}
                    onChange={(e) =>
                      setAiFormData({
                        ...aiFormData,
                        department: e.target.value,
                        position: "",
                      })
                    }
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    required
                    disabled={!aiFormData.company}
                  >
                    <option value="">{t("admin.select_department")}</option>
                    {configOptions?.companies
                      ?.find((c) => c.id == aiFormData.company)
                      ?.departments?.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.position")}
                  </label>
                  <select
                    value={aiFormData.position}
                    onChange={(e) =>
                      setAiFormData({ ...aiFormData, position: e.target.value })
                    }
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    required
                    disabled={!aiFormData.department}
                  >
                    <option value="">{t("admin.select_position")}</option>
                    {configOptions?.companies
                      ?.find((c) => c.id == aiFormData.company)
                      ?.departments?.find((d) => d.id == aiFormData.department)
                      ?.positions?.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.programming_language")}
                  </label>
                  <select
                    value={aiFormData.programmingLanguage}
                    onChange={(e) =>
                      setAiFormData({
                        ...aiFormData,
                        programmingLanguage: e.target.value,
                      })
                    }
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    required
                  >
                    <option value="">
                      {t("admin.select_programming_language")}
                    </option>
                    {configOptions?.programming_languages?.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  {t("admin.difficulty_level")}
                </label>
                <select
                  value={aiFormData.difficultyLevel}
                  onChange={(e) =>
                    setAiFormData({
                      ...aiFormData,
                      difficultyLevel: e.target.value,
                    })
                  }
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                >
                  <option value="">{t("admin.select_difficulty_level")}</option>
                  {configOptions?.levels?.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.multiple_choice_count")}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={aiFormData.multipleChoiceCount}
                    onChange={(e) =>
                      setAiFormData({
                        ...aiFormData,
                        multipleChoiceCount: parseInt(e.target.value),
                      })
                    }
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.coding_question_count")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={aiFormData.codingQuestionCount}
                    onChange={(e) =>
                      setAiFormData({
                        ...aiFormData,
                        codingQuestionCount: parseInt(e.target.value),
                      })
                    }
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.exam_duration")} ({t("admin.minutes")})
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="180"
                    value={aiFormData.examDuration}
                    onChange={(e) =>
                      setAiFormData({
                        ...aiFormData,
                        examDuration: parseInt(e.target.value),
                      })
                    }
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4.5">
                <button
                  type="button"
                  onClick={() => setShowAIDialog(false)}
                  className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <span className="flex items-center">
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {t("admin.generating_exam")}
                    </span>
                  ) : (
                    `🚀 ${t("admin.generate_exam")}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exams Table */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="px-4 py-6 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("admin.exam_templates")}
          </h4>
        </div>

        <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-7 md:px-6 2xl:px-7.5">
          <div className="col-span-2 flex items-center">
            <p className="font-medium">{t("admin.exam_name")}</p>
          </div>
          <div className="col-span-1 hidden items-center sm:flex">
            <p className="font-medium">{t("admin.programming_language")}</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="font-medium">{t("admin.questions")}</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="font-medium">{t("admin.duration")}</p>
          </div>
          <div className="col-span-1 hidden items-center sm:flex">
            <p className="font-medium">{t("admin.created_date")}</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="font-medium">{t("common.actions")}</p>
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2 text-sm text-body dark:text-bodydark">
              {t("common.loading")}
            </p>
          </div>
        ) : exams.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-body dark:text-bodydark">
              {t("admin.no_exams")}
            </p>
          </div>
        ) : (
          exams.map((exam, key) => (
            <div
              className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-7 md:px-6 2xl:px-7.5"
              key={key}
            >
              <div className="col-span-2 flex items-center">
                <div className="flex flex-col">
                  <p className="text-sm text-black dark:text-white font-medium">
                    {exam.name}
                  </p>
                  {exam.description && (
                    <p className="text-xs text-body dark:text-bodydark">
                      {exam.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="col-span-1 hidden items-center sm:flex">
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {exam.programming_language}
                </span>
              </div>
              <div className="col-span-1 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {exam.questions_count || 0}
                </p>
              </div>
              <div className="col-span-1 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {exam.duration_minutes} {t("admin.minutes")}
                </p>
              </div>
              <div className="col-span-1 hidden items-center sm:flex">
                <p className="text-sm text-black dark:text-white">
                  {exam.created_at ? formatDate(exam.created_at) : "-"}
                </p>
              </div>
              <div className="col-span-1 flex items-center space-x-3.5">
                <button
                  onClick={() => viewExamDetails(exam.id)}
                  className="hover:text-primary"
                  title={t("admin.view_details")}
                >
                  <svg
                    className="fill-current"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.20624 8.99981 3.20624C14.5686 3.20624 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.85605 8.99999C2.4748 10.0406 4.89356 13.2656 8.99981 13.2656C13.1061 13.2656 15.5248 10.0406 16.1436 8.99999C15.5248 7.95936 13.1061 4.73436 8.99981 4.73436C4.89356 4.73436 2.4748 7.95936 1.85605 8.99999Z"
                      fill=""
                    />
                    <path
                      d="M9 11.3906C7.67812 11.3906 6.60938 10.3219 6.60938 9C6.60938 7.67813 7.67812 6.60938 9 6.60938C10.3219 6.60938 11.3906 7.67813 11.3906 9C11.3906 10.3219 10.3219 11.3906 9 11.3906ZM9 8.10938C8.50313 8.10938 8.10938 8.50313 8.10938 9C8.10938 9.49688 8.50313 9.89063 9 9.89063C9.49688 9.89063 9.89063 9.49688 9.89063 9C9.89063 8.50313 9.49688 8.10938 9 8.10938Z"
                      fill=""
                    />
                  </svg>
                </button>
                <button
                  onClick={() => deleteExam(exam.id)}
                  className="hover:text-danger"
                  title={t("common.delete")}
                >
                  <svg
                    className="fill-current"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.59789 6.1594L4.52539 13.9688C4.63789 15.0313 5.51602 15.8438 6.60664 15.8438H11.3660C12.4566 15.8438 13.3348 15.0313 13.4473 13.9688L14.3748 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502Z"
                      fill=""
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminExams;
