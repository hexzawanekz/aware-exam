const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Exam related API calls
  async getExam(examId) {
    return this.request(`/api/v1/exam/${examId}`);
  }

  async submitExam(examId, answers) {
    return this.request(`/api/v1/exam/${examId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  }

  async startExam(examId, candidateData) {
    return this.request(`/api/v1/exam/${examId}/start`, {
      method: "POST",
      body: JSON.stringify(candidateData),
    });
  }

  // Face verification
  async verifyFace(examId, imageData) {
    const formData = new FormData();
    formData.append("image", imageData);

    return this.request(`/api/v1/exam/${examId}/verify-face`, {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Activity logging
  async logActivity(examId, activityData) {
    return this.request(`/api/v1/exam/${examId}/log-activity`, {
      method: "POST",
      body: JSON.stringify(activityData),
    });
  }

  // Get exam session
  async getExamSession(sessionId) {
    return this.request(`/api/v1/exam/session/${sessionId}`);
  }

  // Upload video chunk
  async uploadVideoChunk(examId, videoChunk) {
    const formData = new FormData();
    formData.append("video", videoChunk);

    return this.request(`/api/v1/exam/${examId}/upload-video`, {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Admin API endpoints
  async getDashboardStats() {
    return this.request("/api/v1/admin/dashboard/stats");
  }

  // Companies
  async getCompanies() {
    return this.request("/api/v1/admin/companies");
  }

  async createCompany(companyData) {
    return this.request("/api/v1/admin/companies", {
      method: "POST",
      body: JSON.stringify(companyData),
    });
  }

  async updateCompany(companyId, companyData) {
    return this.request(`/api/v1/admin/companies/${companyId}`, {
      method: "PUT",
      body: JSON.stringify(companyData),
    });
  }

  async deleteCompany(companyId) {
    return this.request(`/api/v1/admin/companies/${companyId}`, {
      method: "DELETE",
    });
  }

  // Departments
  async getDepartments(companyId = null) {
    const endpoint = companyId
      ? `/api/v1/admin/companies/${companyId}/departments`
      : "/api/v1/admin/departments";
    return this.request(endpoint);
  }

  async createDepartment(companyId, departmentData) {
    return this.request(`/api/v1/admin/companies/${companyId}/departments`, {
      method: "POST",
      body: JSON.stringify(departmentData),
    });
  }

  async updateDepartment(departmentId, departmentData) {
    return this.request(`/api/v1/admin/departments/${departmentId}`, {
      method: "PUT",
      body: JSON.stringify(departmentData),
    });
  }

  async deleteDepartment(departmentId) {
    return this.request(`/api/v1/admin/departments/${departmentId}`, {
      method: "DELETE",
    });
  }

  // Positions
  async getPositions(departmentId = null) {
    const endpoint = departmentId
      ? `/api/v1/admin/departments/${departmentId}/positions`
      : "/api/v1/admin/positions";
    return this.request(endpoint);
  }

  async createPosition(departmentId, positionData) {
    return this.request(`/api/v1/admin/departments/${departmentId}/positions`, {
      method: "POST",
      body: JSON.stringify(positionData),
    });
  }

  async updatePosition(positionId, positionData) {
    return this.request(`/api/v1/admin/positions/${positionId}`, {
      method: "PUT",
      body: JSON.stringify(positionData),
    });
  }

  async deletePosition(positionId) {
    return this.request(`/api/v1/admin/positions/${positionId}`, {
      method: "DELETE",
    });
  }

  // Exam Templates
  async getExamTemplates(positionId = null) {
    const endpoint = positionId
      ? `/api/v1/admin/positions/${positionId}/exam-templates`
      : "/api/v1/admin/exam-templates";
    return this.request(endpoint);
  }

  async createExamTemplate(positionId, examData) {
    return this.request(
      `/api/v1/admin/positions/${positionId}/exam-templates`,
      {
        method: "POST",
        body: JSON.stringify(examData),
      }
    );
  }

  async updateExamTemplate(examId, examData) {
    return this.request(`/api/v1/admin/exam-templates/${examId}`, {
      method: "PUT",
      body: JSON.stringify(examData),
    });
  }

  async deleteExamTemplate(examId) {
    return this.request(`/api/v1/admin/exam-templates/${examId}`, {
      method: "DELETE",
    });
  }

  // Candidates
  async getCandidates() {
    return this.request("/api/v1/admin/candidates");
  }

  async createCandidate(candidateData) {
    return this.request("/api/v1/admin/candidates", {
      method: "POST",
      body: JSON.stringify(candidateData),
    });
  }

  async updateCandidate(candidateId, candidateData) {
    return this.request(`/api/v1/admin/candidates/${candidateId}`, {
      method: "PUT",
      body: JSON.stringify(candidateData),
    });
  }

  async deleteCandidate(candidateId) {
    return this.request(`/api/v1/admin/candidates/${candidateId}`, {
      method: "DELETE",
    });
  }

  // Exam Sessions
  async getExamSessions() {
    return this.request("/api/v1/admin/exam-sessions");
  }

  async getExamSessionDetails(sessionId) {
    return this.request(`/api/v1/admin/exam-sessions/${sessionId}`);
  }
}

export default new ApiService();
