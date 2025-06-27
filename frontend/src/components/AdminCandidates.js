import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";

const AdminCandidates = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [editingCandidate, setEditingCandidate] = useState(null);

  // Assignment form data
  const [assignmentData, setAssignmentData] = useState({
    candidate_id: "",
    exam_template_id: "",
    position_id: "",
    programming_language_id: "",
    start_time: "",
  });

  // Options for dropdowns
  const [examTemplates, setExamTemplates] = useState([]);
  const [positions, setPositions] = useState([]);
  const [programmingLanguages, setProgrammingLanguages] = useState([]);

  // Retake management
  const [candidateExams, setCandidateExams] = useState([]);
  const [loadingCandidateExams, setLoadingCandidateExams] = useState(false);

  useEffect(() => {
    loadCandidates();
    loadAssignmentOptions();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCandidates();
      setCandidates(response);
    } catch (error) {
      console.error("Error loading candidates:", error);
      setError(t("admin.error_loading_candidates"));
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentOptions = async () => {
    try {
      const [examsResponse, positionsResponse, languagesResponse] =
        await Promise.all([
          apiService.getAvailableExamTemplates(),
          apiService.getPositions(),
          apiService.getProgrammingLanguages(),
        ]);

      setExamTemplates(examsResponse || []);
      setPositions(positionsResponse || []);
      setProgrammingLanguages(languagesResponse || []);
    } catch (error) {
      console.error("Error loading assignment options:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCandidate) {
        await apiService.updateCandidate(editingCandidate.id, formData);
      } else {
        await apiService.createCandidate(formData);
      }
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
      });
      setEditingCandidate(null);
      setShowForm(false);
      await loadCandidates();
    } catch (error) {
      console.error("Error saving candidate:", error);
    }
  };

  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone || "",
    });
    setShowForm(true);
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (!window.confirm(t("admin.confirm_delete"))) return;

    try {
      await apiService.deleteCandidate(candidateId);
      await loadCandidates();
    } catch (error) {
      console.error("Error deleting candidate:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "รอสอบ":
        return "bg-warning/10 text-warning";
      case "กำลังสอบ":
        return "bg-primary/10 text-primary";
      case "ผ่านการสอบ":
        return "bg-success/10 text-success";
      case "ไม่ผ่านการสอบ":
        return "bg-danger/10 text-danger";
      case "ยกเลิก":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const openAssignmentForm = async (candidate) => {
    setSelectedCandidate(candidate);
    setAssignmentData({
      candidate_id: candidate.id,
      exam_template_id: "",
      position_id: "",
      programming_language_id: "",
      start_time: "",
    });
    setShowAssignForm(true);

    // Load candidate's existing exams
    await loadCandidateExams(candidate.id);
  };

  const closeAssignmentForm = () => {
    setShowAssignForm(false);
    setSelectedCandidate(null);
    setCandidateExams([]);
    setAssignmentData({
      candidate_id: "",
      exam_template_id: "",
      position_id: "",
      programming_language_id: "",
      start_time: "",
    });
  };

  const loadCandidateExams = async (candidateId) => {
    try {
      setLoadingCandidateExams(true);
      const response = await apiService.request(
        `/api/v1/candidate/exams/${candidateId}`
      );
      setCandidateExams(response.exams || []);
    } catch (error) {
      console.error("Error loading candidate exams:", error);
      setCandidateExams([]);
    } finally {
      setLoadingCandidateExams(false);
    }
  };

  const handleCancelExam = async (sessionId) => {
    if (!window.confirm(t("candidates.confirm_cancel_exam"))) return;

    try {
      await apiService.cancelExamSession(sessionId);
      // Reload candidate exams to update the list
      if (selectedCandidate) {
        await loadCandidateExams(selectedCandidate.id);
      }
      alert(t("candidates.cancel_exam_success"));
    } catch (error) {
      console.error("Error cancelling exam:", error);
      alert(error.message || t("candidates.cancel_exam_error"));
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      // Assign exam if selected
      if (assignmentData.exam_template_id) {
        await apiService.assignExamToCandidate({
          candidate_id: assignmentData.candidate_id,
          exam_template_id: parseInt(assignmentData.exam_template_id),
          start_time: assignmentData.start_time || undefined,
        });
      }

      // Update candidate with position if selected
      if (assignmentData.position_id) {
        await apiService.updateCandidate(assignmentData.candidate_id, {
          position_id: parseInt(assignmentData.position_id),
        });
      }

      // Update candidate with programming language if selected
      if (assignmentData.programming_language_id) {
        await apiService.updateCandidate(assignmentData.candidate_id, {
          programming_language_id: parseInt(
            assignmentData.programming_language_id
          ),
        });
      }

      closeAssignmentForm();
      await loadCandidates();
    } catch (error) {
      console.error("Error assigning to candidate:", error);
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          👥 {t("admin.candidates")}
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            {showForm ? t("common.cancel") : `+ ${t("admin.add_candidate")}`}
          </button>
        </div>
      </div>

      {/* Add Candidate Form */}
      {showForm && (
        <div className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              {editingCandidate
                ? t("admin.edit_candidate")
                : t("admin.add_new_candidate")}
            </h3>
          </div>
          <div className="p-7">
            <form onSubmit={handleSubmit}>
              <div className="mb-5.5 grid grid-cols-1 gap-5.5 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.first_name")}
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    placeholder={t("admin.first_name_placeholder")}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.last_name")}
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    placeholder={t("admin.last_name_placeholder")}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.email")}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder={t("admin.email_placeholder")}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.phone")} ({t("admin.optional")})
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder={t("admin.phone_placeholder")}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCandidate(null);
                    setFormData({
                      first_name: "",
                      last_name: "",
                      email: "",
                      phone: "",
                    });
                  }}
                  className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-95"
                >
                  {t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Form */}
      {showAssignForm && selectedCandidate && (
        <div className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              🎯 {t("admin.assign_to")} {selectedCandidate.first_name}{" "}
              {selectedCandidate.last_name}
            </h3>
          </div>
          <div className="p-7">
            {/* Existing Exams Section */}
            <div className="mb-6">
              <h4 className="mb-3 text-lg font-medium text-black dark:text-white">
                📋 {t("candidates.existing_exams")}
              </h4>
              {loadingCandidateExams ? (
                <div className="text-center py-3">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                  <span className="ml-2 text-sm">{t("common.loading")}</span>
                </div>
              ) : candidateExams.length === 0 ? (
                <p className="text-sm text-body dark:text-bodydark">
                  {t("candidates.no_existing_exams")}
                </p>
              ) : (
                <div className="space-y-2">
                  {candidateExams.map((exam) => (
                    <div
                      key={exam.session_id}
                      className="flex items-center justify-between rounded border border-stroke p-3 dark:border-strokedark"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-black dark:text-white">
                            {exam.original_name || exam.name}
                          </span>
                          {exam.is_retake && (
                            <span className="rounded bg-warning/10 px-2 py-1 text-xs text-warning">
                              {t("candidates.attempt_number")}{" "}
                              {exam.attempt_number}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-body dark:text-bodydark">
                          <span>
                            {t("admin.status")}:
                            <span
                              className={`ml-1 font-medium ${
                                exam.status === "รอสอบ"
                                  ? "text-warning"
                                  : exam.status === "กำลังสอบ"
                                  ? "text-primary"
                                  : exam.status === "เสร็จสิ้น" ||
                                    exam.status === "ผ่านการสอบ"
                                  ? "text-success"
                                  : exam.status === "ไม่ผ่านการสอบ"
                                  ? "text-danger"
                                  : "text-gray-500"
                              }`}
                            >
                              {exam.status}
                            </span>
                          </span>
                          {exam.score !== null && (
                            <span>
                              {t("admin.score")}:{" "}
                              <span className="font-medium">{exam.score}%</span>
                            </span>
                          )}
                          {exam.scheduled_date && (
                            <span>
                              {t("candidates.scheduled_date")}:{" "}
                              {new Date(exam.scheduled_date).toLocaleString(
                                "th-TH"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      {exam.can_start && (
                        <button
                          type="button"
                          onClick={() => handleCancelExam(exam.session_id)}
                          className="ml-2 rounded bg-danger px-3 py-1.5 text-xs font-medium text-white hover:bg-opacity-90"
                        >
                          {t("candidates.cancel_exam")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleAssignmentSubmit}>
              <div className="mb-5.5 grid grid-cols-1 gap-5.5 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.assign_exam")} ({t("admin.optional")})
                    <span className="ml-2 text-xs text-success">
                      ✓ {t("candidates.retake_allowed")}
                    </span>
                  </label>
                  <select
                    value={assignmentData.exam_template_id}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        exam_template_id: e.target.value,
                      })
                    }
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  >
                    <option value="">{t("admin.select_exam")}</option>
                    {examTemplates.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.name} ({exam.position_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.assign_position")} ({t("admin.optional")})
                  </label>
                  <select
                    value={assignmentData.position_id}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        position_id: e.target.value,
                      })
                    }
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  >
                    <option value="">{t("admin.select_position")}</option>
                    {positions.map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.name}
                        {position.department &&
                          ` (${position.department.name})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.assign_programming_language")} (
                    {t("admin.optional")})
                  </label>
                  <select
                    value={assignmentData.programming_language_id}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        programming_language_id: e.target.value,
                      })
                    }
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  >
                    <option value="">
                      {t("admin.select_programming_language")}
                    </option>
                    {programmingLanguages.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    {t("admin.scheduled_date")} ({t("admin.optional")})
                  </label>
                  <input
                    type="datetime-local"
                    value={assignmentData.start_time}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        start_time: e.target.value,
                      })
                    }
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4.5">
                <button
                  type="button"
                  onClick={closeAssignmentForm}
                  className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-95"
                >
                  {t("admin.confirm_assignment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-sm border border-danger bg-danger/10 px-6 py-4">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Candidates Table */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="px-4 py-6 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("admin.candidates_list")}
          </h4>
        </div>

        <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
          <div className="col-span-1 flex items-center">
            <p className="font-medium">ID</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="font-medium">{t("admin.candidate_name")}</p>
          </div>
          <div className="col-span-2 hidden items-center sm:flex">
            <p className="font-medium">{t("admin.email")}</p>
          </div>
          <div className="col-span-1 hidden items-center sm:flex">
            <p className="font-medium">{t("admin.status")}</p>
          </div>
          <div className="col-span-2 flex items-center">
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
        ) : candidates.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-body dark:text-bodydark">
              {t("admin.no_candidates")}
            </p>
          </div>
        ) : (
          candidates.map((candidate, key) => (
            <div
              className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
              key={key}
            >
              <div className="col-span-1 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {candidate.id}
                </p>
              </div>
              <div className="col-span-2 flex items-center">
                <div className="flex flex-col">
                  <p className="text-sm text-black dark:text-white font-medium">
                    {candidate.first_name} {candidate.last_name}
                  </p>
                  {candidate.phone && (
                    <p className="text-xs text-body dark:text-bodydark">
                      {candidate.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="col-span-2 hidden items-center sm:flex">
                <p className="text-sm text-black dark:text-white">
                  {candidate.email}
                </p>
              </div>
              <div className="col-span-1 hidden items-center sm:flex">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                    candidate.status || "ไม่มีสถานะ"
                  )}`}
                >
                  {candidate.status || t("admin.no_status")}
                </span>
              </div>
              <div className="col-span-2 flex items-center space-x-3.5">
                <button
                  onClick={() => navigate(`/admin/candidates/${candidate.id}`)}
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
                  onClick={() => openAssignmentForm(candidate)}
                  className="hover:text-success"
                  title={t("admin.assign_tooltip")}
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
                      d="M6.10352 5.74844C6.10352 5.13469 6.60352 4.60156 7.24414 4.60156H10.7559C11.3965 4.60156 11.8965 5.10156 11.8965 5.74219V7.86562C12.2684 8.10938 12.5266 8.49688 12.5266 8.96875C12.5266 9.69531 11.9496 10.2723 11.2512 10.2723H10.6465V15.0645C10.6465 15.7617 10.0695 16.3387 9.37227 16.3387H8.62773C7.93047 16.3387 7.35352 15.7617 7.35352 15.0645V10.2723H6.74883C6.05156 10.2723 5.47461 9.69531 5.47461 8.96875C5.47461 8.49688 5.73281 8.10938 6.10352 7.86562V5.74844ZM7.35352 5.89219V7.5H10.6465V5.89219H7.35352ZM6.74883 8.82031H11.2512V9.03906H6.74883V8.82031ZM8.62773 10.2723V15.0645H9.37227V10.2723H8.62773Z"
                      fill=""
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleEditCandidate(candidate)}
                  className="hover:text-primary"
                  title={t("common.edit")}
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
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteCandidate(candidate.id)}
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

export default AdminCandidates;
