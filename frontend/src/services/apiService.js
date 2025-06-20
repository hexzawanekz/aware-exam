const API_BASE_URL = "http://localhost:8000";

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}/api/v1${endpoint}`;
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
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Dashboard Stats
  async getDashboardStats() {
    return this.request("/admin/dashboard/stats");
  }

  // Companies
  async getCompanies() {
    return this.request("/admin/companies");
  }

  async createCompany(data) {
    return this.request("/admin/companies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCompany(id, data) {
    return this.request(`/admin/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCompany(id) {
    return this.request(`/admin/companies/${id}`, {
      method: "DELETE",
    });
  }

  // Departments
  async getDepartments() {
    return this.request("/admin/departments");
  }

  async createDepartment(companyId, data) {
    return this.request(`/admin/companies/${companyId}/departments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id, data) {
    return this.request(`/admin/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id) {
    return this.request(`/admin/departments/${id}`, {
      method: "DELETE",
    });
  }

  // Positions
  async getPositions() {
    return this.request("/admin/positions");
  }

  async createPosition(departmentId, data) {
    return this.request(`/admin/departments/${departmentId}/positions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePosition(id, data) {
    return this.request(`/admin/positions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePosition(id) {
    return this.request(`/admin/positions/${id}`, {
      method: "DELETE",
    });
  }

  // Exam Templates
  async getExamTemplates() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/exam-templates`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching exam templates:", error);
      throw error;
    }
  }

  async createExamTemplate(examData) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/exam-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(examData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating exam template:", error);
      throw error;
    }
  }

  async updateExamTemplate(id, data) {
    return this.request(`/admin/exam-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteExamTemplate(id) {
    return this.request(`/admin/exam-templates/${id}`, {
      method: "DELETE",
    });
  }

  // AI Exam Generation
  async generateAIExam(examConfig) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/exam-templates/generate-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(examConfig),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating AI exam:", error);
      throw error;
    }
  }

  async getConfigOptions() {
    return this.request("/admin/exam-generation/config-options");
  }

  // Candidates
  async getCandidates() {
    return this.request("/admin/candidates");
  }

  async createCandidate(data) {
    return this.request("/admin/candidates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCandidate(id, data) {
    return this.request(`/admin/candidates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCandidate(id) {
    return this.request(`/admin/candidates/${id}`, {
      method: "DELETE",
    });
  }

  // Exam Sessions
  async getExamSessions() {
    return this.request("/admin/exam-sessions");
  }

  async getExamSessionDetail(id) {
    return this.request(`/admin/exam-sessions/${id}`);
  }
}

export default new ApiService();
