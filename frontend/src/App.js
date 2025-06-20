import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import apiService from "./services/apiService";
import ExamInterface from "./components/ExamInterface";
import DebugMonitoring from "./components/DebugMonitoring";
import "./i18n/config";

// Landing Page Component
function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>🎉 ระบบสอบเข้าเพื่อสมัครงาน</h1>
      <p>ระบบทำงานปกติแล้ว!</p>
      <div style={{ marginTop: "20px" }}>
        <button
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/admin")}
        >
          เข้าสู่หน้าผู้ดูแล
        </button>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#dc004e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/exam")}
        >
          เข้าสู่หน้าทำการสอบ
        </button>
      </div>
    </div>
  );
}

// Simple Admin Page
function AdminPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "15px",
          padding: "40px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          textAlign: "center",
          maxWidth: "500px",
          width: "90%",
        }}
      >
        <h1
          style={{
            color: "#333",
            marginBottom: "30px",
            fontSize: "2.5em",
            fontWeight: "bold",
          }}
        >
          🎯 Admin Dashboard
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "40px",
            fontSize: "1.1em",
            lineHeight: "1.6",
          }}
        >
          Welcome to the exam management system
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
            marginBottom: "30px",
          }}
        >
          <button
            style={{
              padding: "15px 20px",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1em",
              fontWeight: "bold",
              transition: "all 0.3s ease",
            }}
            onClick={() => navigate("/admin/companies")}
          >
            🏢 Company Management
          </button>
          <button
            style={{
              padding: "15px 20px",
              backgroundColor: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1em",
              fontWeight: "bold",
              transition: "all 0.3s ease",
            }}
            onClick={() => navigate("/admin/departments")}
          >
            🏬 Department Management
          </button>
          <button
            style={{
              padding: "10px 15px",
              backgroundColor: "#9c27b0",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => navigate("/admin/exams")}
          >
            Exam Management
          </button>
          <button
            style={{
              padding: "10px 15px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => navigate("/admin/candidates")}
          >
            Candidate Management
          </button>
        </div>
      </div>

      <button
        style={{
          marginTop: "30px",
          padding: "10px 20px",
          backgroundColor: "#666",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        onClick={() => navigate("/")}
      >
        ← Back to Home
      </button>
    </div>
  );
}

// Companies Management Page
function CompaniesPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([
    {
      id: 1,
      name: "Tech Solutions Inc",
      description: "Software development company",
      created_at: "2025-06-13",
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCompany = {
      id: companies.length + 1,
      ...formData,
      created_at: new Date().toISOString().split("T")[0],
    };
    setCompanies([...companies, newCompany]);
    setFormData({ name: "", description: "" });
    setShowForm(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>🏢 Company Management</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "10px",
          }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add New Company"}
        </button>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#666",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/admin")}
        >
          ← Back
        </button>
      </div>

      {showForm && (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h3>Add New Company</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Company Name:
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
                required
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Description:
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  height: "80px",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </form>
        </div>
      )}

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#f5f5f5" }}>
            <tr>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                ID
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                Company Name
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                Description
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                Created Date
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td
                  style={{
                    padding: "15px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {company.id}
                </td>
                <td
                  style={{
                    padding: "15px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {company.name}
                </td>
                <td
                  style={{
                    padding: "15px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {company.description}
                </td>
                <td
                  style={{
                    padding: "15px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {company.created_at}
                </td>
                <td
                  style={{
                    padding: "15px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <button
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#ff9800",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                      marginRight: "5px",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Departments Management Page
function DepartmentsPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([
    {
      id: 1,
      name: "แผนกพัฒนาซอฟต์แวร์",
      description: "พัฒนาและดูแลระบบซอฟต์แวร์",
      company_name: "บริษัท เทคโนโลยี จำกัด",
      company_id: 1,
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    company_id: 1,
  });

  // Mock companies data
  const companies = [
    { id: 1, name: "บริษัท เทคโนโลยี จำกัด" },
    { id: 2, name: "บริษัท นวัตกรรม จำกัด" },
    { id: 3, name: "บริษัท ดิจิทัล จำกัด" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedCompany = companies.find(
      (c) => c.id === parseInt(formData.company_id)
    );
    const newDepartment = {
      id: departments.length + 1,
      ...formData,
      company_name: selectedCompany?.name || "ไม่ระบุ",
      created_at: new Date().toISOString().split("T")[0],
    };
    setDepartments([...departments, newDepartment]);
    setFormData({ name: "", description: "", company_id: 1 });
    setShowForm(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>🏬 จัดการแผนก</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "10px",
          }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "ยกเลิก" : "+ เพิ่มแผนกใหม่"}
        </button>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#666",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/admin")}
        >
          ← กลับ
        </button>
      </div>

      {showForm && (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h3>เพิ่มแผนกใหม่</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                เลือกบริษัท:
              </label>
              <select
                value={formData.company_id}
                onChange={(e) =>
                  setFormData({ ...formData, company_id: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
                required
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                ชื่อแผนก:
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
                placeholder="เช่น แผนกการตลาด, แผนกบุคคล, แผนกบัญชี"
                required
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                คำอธิบาย:
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  height: "80px",
                }}
                placeholder="อธิบายหน้าที่และความรับผิดชอบของแผนก"
              />
            </div>
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              บันทึก
            </button>
          </form>
        </div>
      )}

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#f5f5f5" }}>
            <tr>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                ID
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                ชื่อแผนก
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                คำอธิบาย
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                บริษัท
              </th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id}>
                <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                  {dept.id}
                </td>
                <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                  {dept.name}
                </td>
                <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                  {dept.description}
                </td>
                <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                  {dept.company_name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Exams Management Page
function ExamsPage() {
  console.log(
    "🚀 ExamsPage component loaded - LATEST VERSION with toUpperCase fix"
  );
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showExamDetails, setShowExamDetails] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
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

  // Load exams on component mount
  useEffect(() => {
    loadExams();
  }, []);

  // Load config options when AI dialog is shown
  useEffect(() => {
    if (showAIDialog && !configOptions) {
      const loadConfigOptions = async () => {
        try {
          const options = await apiService.getConfigOptions();
          setConfigOptions(options);
        } catch (error) {
          console.error("Error loading config options:", error);
          alert("Error loading configuration options");
        }
      };
      loadConfigOptions();
    }
  }, [showAIDialog, configOptions]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await apiService.request("/admin/exam-templates");
      console.log("📚 Loaded exams response:", response);
      console.log("📋 Exams data:", response.data);
      console.log("🔢 Number of exams:", response.data?.length);

      // Log each exam's details
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((exam, index) => {
          console.log(`📝 Exam ${index + 1}:`, {
            id: exam.id,
            name: exam.name,
            questions_count: exam.questions_count,
            is_active: exam.is_active,
            programming_language: exam.programming_language,
          });
        });
      }

      setExams(response.data || []);
    } catch (error) {
      console.error("Error loading exams:", error);
      alert("Error loading exams");
    } finally {
      setLoading(false);
    }
  };

  const viewExamDetails = async (examId) => {
    try {
      console.log("🔍 Loading exam details for ID:", examId);
      const response = await apiService.request(
        `/admin/exam-templates/${examId}`
      );
      console.log("📋 Exam details response:", response);
      console.log("📝 Questions data:", response.data?.questions);
      console.log("📊 Questions count:", response.data?.questions?.length);

      // Additional debug info for questions structure
      if (response.data?.questions) {
        response.data.questions.forEach((question, index) => {
          console.log(`Question ${index + 1}:`, {
            id: question?.id,
            type: question?.type,
            question: question?.question,
            options: question?.options,
            optionsType: typeof question?.options,
            optionsLength: question?.options?.length,
          });

          // Debug each option
          if (question?.options && Array.isArray(question.options)) {
            question.options.forEach((option, optIndex) => {
              console.log(`  Option ${optIndex}:`, {
                option,
                type: typeof option,
                id: option?.id,
                text: option?.text,
              });
            });
          }
        });
      }

      setSelectedExam(response.data);
      setShowExamDetails(true);
    } catch (error) {
      console.error("Error loading exam details:", error);
      alert("Error loading exam details: " + error.message);
    }
  };

  const deleteExam = async (examId) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;

    try {
      await apiService.request(`/admin/exam-templates/${examId}`, {
        method: "DELETE",
      });
      alert("Exam deleted successfully");
      loadExams(); // Reload the list
    } catch (error) {
      console.error("Error deleting exam:", error);
      alert("Error deleting exam");
    }
  };

  const handleAIExamGeneration = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      console.log("🚀 Starting AI exam generation...", aiFormData);
      console.log("📋 Config options available:", configOptions);

      // Validate required fields first
      if (!aiFormData.company) {
        throw new Error("Please select a company");
      }
      if (!aiFormData.department) {
        throw new Error("Please select a department");
      }
      if (!aiFormData.position) {
        throw new Error("Please select a position");
      }
      if (!aiFormData.programmingLanguage) {
        throw new Error("Please select a programming language");
      }
      if (!aiFormData.difficultyLevel) {
        throw new Error("Please select a difficulty level");
      }

      // Get selected company, department, position names
      const selectedCompany = configOptions?.companies?.find(
        (c) => c.id == aiFormData.company
      );
      const selectedDepartment = selectedCompany?.departments?.find(
        (d) => d.id == aiFormData.department
      );
      const selectedPosition = selectedDepartment?.positions?.find(
        (p) => p.id == aiFormData.position
      );

      console.log("🏢 Selected company:", selectedCompany);
      console.log("🏬 Selected department:", selectedDepartment);
      console.log("👤 Selected position:", selectedPosition);

      if (!selectedCompany || !selectedDepartment || !selectedPosition) {
        throw new Error("Please select company, department, and position");
      }

      // Simplified: Use backend API directly (handles draft creation + AI generation + database update)
      console.log("🤖 Generating AI exam via backend API...");

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

      console.log("📝 AI Config to send:", aiConfig);

      const response = await apiService.request(
        "/admin/exam-templates/generate-ai",
        {
          method: "POST",
          body: JSON.stringify(aiConfig),
        }
      );

      console.log("📡 Raw API response:", response);

      // Validate API response
      if (!response || !response.exam_template) {
        throw new Error("Invalid response from server: missing exam_template");
      }

      const aiResult = {
        exam_id: response.exam_template.id,
        exam_title: response.exam_template.name,
        questions: response.questions || [],
        processing_time: response.processing_time || 0,
      };

      console.log("✅ AI exam generated successfully:", aiResult);

      // Success message with exam details
      alert(
        `✅ AI Exam Generated Successfully!\n\n` +
          `📝 Exam: ${aiResult.exam_title}\n` +
          `🎯 Questions: ${aiResult.questions?.length || 0}\n` +
          `⏱️ Duration: ${aiFormData.examDuration} minutes\n` +
          `🆔 Exam ID: ${aiResult.exam_id}\n\n` +
          `The exam has been automatically saved to the database.`
      );

      setShowAIDialog(false);
      // Reset form
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

      // Reload exams list to show the new exam
      loadExams();
    } catch (error) {
      console.error("❌ Error in AI exam generation:", error);
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        formData: aiFormData,
        configOptions: configOptions,
      });

      let errorMessage = error.message;

      // Provide more specific error messages
      if (error.message.includes("HTTP error! status: 400")) {
        errorMessage =
          "Form validation failed. Please check all required fields are filled correctly.";
      } else if (error.message.includes("HTTP error! status: 500")) {
        errorMessage =
          "Server error occurred. Please try again or contact support.";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage =
          "Cannot connect to server. Please check if the backend is running on http://localhost:8000";
      }

      alert(
        `❌ Error in AI Exam Generation:\n\n${errorMessage}\n\n` +
          `Debug info:\n` +
          `• Form data: ${JSON.stringify(aiFormData, null, 2)}\n` +
          `• Check browser console for more details`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>📝 Exam Management</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "10px",
          }}
          onClick={() => setShowAIDialog(true)}
        >
          🤖 Generate AI Exam
        </button>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#9c27b0",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "10px",
          }}
          onClick={() => {
            console.log("Create new exam clicked!");
            // TODO: Open create exam dialog
          }}
        >
          Add New Exam
        </button>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#666",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/admin")}
        >
          ← Back
        </button>
      </div>

      {/* AI Exam Generation Dialog */}
      {showAIDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "30px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h2>🤖 Generate AI Exam</h2>

            <form onSubmit={handleAIExamGeneration}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginBottom: "15px",
                }}
              >
                <div>
                  <label style={{ display: "block", marginBottom: "5px" }}>
                    Company:
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
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                    required
                  >
                    <option value="">Select Company</option>
                    {configOptions?.companies?.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px" }}>
                    Department:
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
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                    required
                    disabled={!aiFormData.company}
                  >
                    <option value="">Select Department</option>
                    {configOptions?.companies
                      ?.find((c) => c.id == aiFormData.company)
                      ?.departments?.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginBottom: "15px",
                }}
              >
                <div>
                  <label style={{ display: "block", marginBottom: "5px" }}>
                    Position:
                  </label>
                  <select
                    value={aiFormData.position}
                    onChange={(e) =>
                      setAiFormData({ ...aiFormData, position: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                    required
                    disabled={!aiFormData.department}
                  >
                    <option value="">Select Position</option>
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
                  <label style={{ display: "block", marginBottom: "5px" }}>
                    Programming Language:
                  </label>
                  <select
                    value={aiFormData.programmingLanguage}
                    onChange={(e) =>
                      setAiFormData({
                        ...aiFormData,
                        programmingLanguage: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                    required
                  >
                    <option value="">Select Language</option>
                    {configOptions?.programming_languages?.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  Difficulty Level:
                </label>
                <select
                  value={aiFormData.difficultyLevel}
                  onChange={(e) =>
                    setAiFormData({
                      ...aiFormData,
                      difficultyLevel: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                  required
                >
                  <option value="">Select Level</option>
                  {configOptions?.levels?.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <label style={{ display: "block", marginBottom: "5px" }}>
                    Multiple Choice Questions:
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
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px" }}>
                    Coding Questions:
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
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px" }}>
                    Duration (minutes):
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
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAIDialog(false)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#666",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: isGenerating ? "#ccc" : "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isGenerating ? "not-allowed" : "pointer",
                  }}
                >
                  {isGenerating
                    ? "⏳ Generating Exam..."
                    : "🚀 Generate AI Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exams List */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h2>📋 Exam Templates</h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Loading exams...</p>
          </div>
        ) : exams.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>No exams found. Generate your first AI exam!</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      border: "1px solid #ddd",
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      border: "1px solid #ddd",
                    }}
                  >
                    Language
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      border: "1px solid #ddd",
                    }}
                  >
                    Questions
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      border: "1px solid #ddd",
                    }}
                  >
                    Duration
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      border: "1px solid #ddd",
                    }}
                  >
                    Position
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      border: "1px solid #ddd",
                    }}
                  >
                    Created
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      border: "1px solid #ddd",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      <strong>{exam.name}</strong>
                      <br />
                      <small style={{ color: "#666" }}>
                        {exam.description}
                      </small>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      <span
                        style={{
                          backgroundColor: "#e3f2fd",
                          color: "#1976d2",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {exam.programming_language}
                      </span>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      {exam.questions_count} questions
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      {exam.duration_minutes} min
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      {exam.position ? (
                        <div>
                          <strong>{exam.position.name}</strong>
                          <br />
                          <small style={{ color: "#666" }}>
                            {exam.position.department_name} -{" "}
                            {exam.position.company_name}
                          </small>
                        </div>
                      ) : (
                        <span style={{ color: "#999" }}>No position</span>
                      )}
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      {new Date(exam.created_at).toLocaleDateString()}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #ddd",
                        textAlign: "center",
                      }}
                    >
                      <button
                        onClick={() => viewExamDetails(exam.id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#2196f3",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          marginRight: "5px",
                          fontSize: "12px",
                        }}
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => deleteExam(exam.id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#f44336",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exam Details Modal */}
      {showExamDetails && selectedExam && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "30px",
              maxWidth: "800px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2>📝 {selectedExam.name}</h2>
              <button
                onClick={() => setShowExamDetails(false)}
                style={{
                  backgroundColor: "#666",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p>
                <strong>Description:</strong>{" "}
                {selectedExam.description || "ไม่มีคำอธิบาย"}
              </p>
              <p>
                <strong>Programming Language:</strong>{" "}
                {selectedExam.programming_language || "ไม่ระบุ"}
              </p>
              <p>
                <strong>Duration:</strong>{" "}
                {selectedExam.duration_minutes || "ไม่ระบุ"} minutes
              </p>
              <p>
                <strong>Total Questions:</strong>{" "}
                {selectedExam.questions_count || 0}
              </p>
              {selectedExam.position && (
                <p>
                  <strong>Position:</strong>{" "}
                  {selectedExam.position.name || "ไม่ระบุ"} -{" "}
                  {selectedExam.position.department_name || "ไม่ระบุ"} -{" "}
                  {selectedExam.position.company_name || "ไม่ระบุ"}
                </p>
              )}
            </div>

            <h3>Questions:</h3>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {selectedExam.questions &&
              Array.isArray(selectedExam.questions) &&
              selectedExam.questions.length > 0 ? (
                selectedExam.questions.map((question, index) => {
                  // Safety check for each question
                  if (!question) return null;

                  return (
                    <div
                      key={question.id || index}
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        padding: "15px",
                        marginBottom: "15px",
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <h4>Question {index + 1}</h4>
                        <span
                          style={{
                            backgroundColor:
                              question.type === "multiple_choice"
                                ? "#4caf50"
                                : "#ff9800",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        >
                          {question.type === "multiple_choice"
                            ? "Multiple Choice"
                            : "Coding"}{" "}
                          ({question.score || 10} pts)
                        </span>
                      </div>

                      <p>
                        <strong>Q:</strong>{" "}
                        {question.question || question.text || "ไม่มีคำถาม"}
                      </p>

                      {question.type === "multiple_choice" &&
                        question.options && (
                          <div style={{ marginLeft: "20px" }}>
                            {(() => {
                              console.log(
                                "🔍 Question options:",
                                question.options
                              );
                              console.log(
                                "🔍 Question correct_answer:",
                                question.correct_answer
                              );

                              // Handle different data formats safely
                              const optionsArray = Array.isArray(
                                question.options
                              )
                                ? question.options
                                : [];

                              return optionsArray.map((option, optionIndex) => {
                                // Enhanced safety checks
                                if (!option && option !== 0 && option !== "")
                                  return null;

                                // Detect different option formats
                                let optionText = "";
                                let optionId = "";
                                let isCorrect = false;

                                try {
                                  if (typeof option === "string") {
                                    // Simple string format
                                    optionText = option;
                                    optionId = String.fromCharCode(
                                      65 + optionIndex
                                    );
                                    isCorrect =
                                      option === question.correct_answer;
                                  } else if (
                                    option &&
                                    typeof option === "object"
                                  ) {
                                    // Object format
                                    optionText =
                                      option.text ||
                                      option.value ||
                                      String(option);
                                    optionId =
                                      option.id ||
                                      option.key ||
                                      String.fromCharCode(65 + optionIndex);
                                    isCorrect =
                                      (option.id &&
                                        option.id ===
                                          question.correct_answer) ||
                                      (option.key &&
                                        option.key ===
                                          question.correct_answer) ||
                                      optionText === question.correct_answer;
                                  } else {
                                    // Fallback for other types
                                    optionText = String(option);
                                    optionId = String.fromCharCode(
                                      65 + optionIndex
                                    );
                                    isCorrect =
                                      String(option) ===
                                      String(question.correct_answer);
                                  }

                                  return (
                                    <div
                                      key={optionIndex}
                                      style={{
                                        padding: "5px 0",
                                        color: isCorrect ? "#4caf50" : "#333",
                                        fontWeight: isCorrect
                                          ? "bold"
                                          : "normal",
                                      }}
                                    >
                                      {optionId}) {optionText}
                                      {isCorrect && " ✓"}
                                    </div>
                                  );
                                } catch (err) {
                                  console.error(
                                    "Error rendering option:",
                                    err,
                                    option
                                  );
                                  return (
                                    <div
                                      key={optionIndex}
                                      style={{
                                        padding: "5px 0",
                                        color: "#999",
                                      }}
                                    >
                                      {String.fromCharCode(65 + optionIndex)})
                                      [Error rendering option]
                                    </div>
                                  );
                                }
                              });
                            })()}
                            {question.explanation && (
                              <div
                                style={{
                                  marginTop: "10px",
                                  padding: "10px",
                                  backgroundColor: "#e8f5e8",
                                  borderRadius: "4px",
                                }}
                              >
                                <strong>Explanation:</strong>{" "}
                                {question.explanation}
                              </div>
                            )}
                          </div>
                        )}

                      {question.type === "coding" && (
                        <div style={{ marginLeft: "20px" }}>
                          {question.expected_output && (
                            <div
                              style={{
                                marginTop: "10px",
                                padding: "10px",
                                backgroundColor: "#f0f0f0",
                                borderRadius: "4px",
                                fontFamily: "monospace",
                              }}
                            >
                              <strong>Expected Solution:</strong>
                              <pre
                                style={{
                                  margin: "5px 0",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {question.expected_output}
                              </pre>
                            </div>
                          )}
                          {question.description && (
                            <p>
                              <strong>Description:</strong>{" "}
                              {question.description}
                            </p>
                          )}
                          {question.sample_input && (
                            <p>
                              <strong>Sample Input:</strong>{" "}
                              <code>{question.sample_input}</code>
                            </p>
                          )}
                          {question.sample_output && (
                            <p>
                              <strong>Sample Output:</strong>{" "}
                              <code>{question.sample_output}</code>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#666",
                  }}
                >
                  <p>No questions available for this exam.</p>
                  <p>
                    <small>
                      This might be a draft exam or the questions are still
                      being generated.
                    </small>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Candidates Management Page
function CandidatesPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([
    {
      id: 1,
      first_name: "สมชาย",
      last_name: "ใจดี",
      email: "somchai@email.com",
      phone: "081-234-5678",
      position: "นักพัฒนาซอฟต์แวร์",
      status: "ผ่านการสอบ",
      created_at: "2025-06-13",
    },
    {
      id: 2,
      first_name: "สมหญิง",
      last_name: "รักงาน",
      email: "somying@email.com",
      phone: "082-345-6789",
      position: "นักออกแบบ UI/UX",
      status: "ผ่านการสอบ",
      created_at: "2025-06-12",
    },
    {
      id: 3,
      first_name: "สมศักดิ์",
      last_name: "ขยันเรียน",
      email: "somsak@email.com",
      phone: "083-456-7890",
      position: "นักวิเคราะห์ระบบ",
      status: "รอสอบ",
      created_at: "2025-06-11",
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    status: "รอสอบ",
  });

  // Mock positions data
  const positions = [
    "นักพัฒนาซอฟต์แวร์",
    "นักวิเคราะห์ระบบ",
    "นักออกแบบ UI/UX",
    "นักการตลาดดิจิทัล",
    "เจ้าหน้าที่บุคคล",
    "นักบัญชี",
    "ผู้จัดการโครงการ",
  ];

  const statusOptions = [
    "รอสอบ",
    "กำลังสอบ",
    "ผ่านการสอบ",
    "ไม่ผ่านการสอบ",
    "ยกเลิก",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCandidate = {
      id: candidates.length + 1,
      ...formData,
      created_at: new Date().toISOString().split("T")[0],
    };
    setCandidates([...candidates, newCandidate]);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      position: "",
      status: "รอสอบ",
    });
    setShowForm(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "รอสอบ":
        return "#ff9800";
      case "กำลังสอบ":
        return "#2196f3";
      case "ผ่านการสอบ":
        return "#4caf50";
      case "ไม่ผ่านการสอบ":
        return "#f44336";
      case "ยกเลิก":
        return "#9e9e9e";
      default:
        return "#666";
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>👥 จัดการผู้สมัคร</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "10px",
          }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "ยกเลิก" : "+ เพิ่มผู้สมัครใหม่"}
        </button>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#666",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/admin")}
        >
          ← กลับ
        </button>
      </div>

      {showForm && (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h3>เพิ่มผู้สมัครใหม่</h3>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                marginBottom: "15px",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  ชื่อ:
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                  placeholder="ชื่อจริง"
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  นามสกุล:
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                  placeholder="นามสกุล"
                  required
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                marginBottom: "15px",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  อีเมล:
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                  placeholder="example@email.com"
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  เบอร์โทรศัพท์:
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                  placeholder="081-234-5678"
                  required
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                marginBottom: "15px",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  ตำแหน่งที่สมัคร:
                </label>
                <select
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                  required
                >
                  <option value="">เลือกตำแหน่ง</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  สถานะ:
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              บันทึก
            </button>
          </form>
        </div>
      )}

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#f5f5f5" }}>
            <tr>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                ID
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                ชื่อ-นามสกุล
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                อีเมล
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                เบอร์โทร
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                ตำแหน่ง
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                สถานะ
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                วันที่สมัคร
              </th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.id}>
                <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                  {candidate.id}
                </td>
                <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                  <span
                    style={{
                      color:
                        candidate.status === "ผ่านการสอบ"
                          ? "#1976d2"
                          : "inherit",
                      cursor:
                        candidate.status === "ผ่านการสอบ"
                          ? "pointer"
                          : "default",
                      textDecoration:
                        candidate.status === "ผ่านการสอบ"
                          ? "underline"
                          : "none",
                    }}
                    onClick={() =>
                      candidate.status === "ผ่านการสอบ" &&
                      navigate(`/admin/candidates/${candidate.id}`)
                    }
                  >
                    {candidate.first_name} {candidate.last_name}
                  </span>
                </td>
                <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                  {candidate.email}
                </td>
                <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                  {candidate.phone}
                </td>
                <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                  {candidate.position}
                </td>
                <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor: getStatusColor(candidate.status),
                      color: "white",
                      fontSize: "12px",
                    }}
                  >
                    {candidate.status}
                  </span>
                </td>
                <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                  {candidate.created_at}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Candidate Detail Page
function CandidateDetailPage() {
  const navigate = useNavigate();
  const [candidateData, setCandidateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract candidate ID from URL
  const candidateId = window.location.pathname.split("/").pop();

  useEffect(() => {
    loadCandidateResults();
  }, [candidateId]);

  const loadCandidateResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/v1/exam/candidates/${candidateId}/results`
      );

      if (!response.ok) {
        throw new Error("Failed to load candidate results");
      }

      const data = await response.json();
      setCandidateData(data);
    } catch (err) {
      console.error("Error loading candidate results:", err);
      setError(err.message);
      // Fall back to mock data if API fails
      setCandidateData({
        id: 1,
        first_name: "สมชาย",
        last_name: "ใจดี",
        email: "somchai@email.com",
        phone: "081-234-5678",
        position: "นักพัฒนาซอฟต์แวร์",
        status: "ผ่านการสอบ",
        exam_score: 85,
        exam_date: "2025-06-13 14:30:00",
        exam_duration: "60 นาที",
        cheating_percentage: 15,
        ai_confidence: 92,
        proctoring_events: [
          {
            timestamp: "14:35:22",
            event_type: "face_lost",
            description: "ไม่พบใบหน้าในกรอบ",
            severity: "medium",
            duration: "3 วินาที",
          },
          {
            timestamp: "14:42:15",
            event_type: "suspicious_movement",
            description: "ความเคลื่อนไหวน่าสงสัย",
            severity: "low",
            duration: "2 วินาที",
          },
          {
            timestamp: "14:58:30",
            event_type: "multiple_faces",
            description: "พบใบหน้ามากกว่า 1 คน",
            severity: "high",
            duration: "5 วินาที",
          },
          {
            timestamp: "15:12:45",
            event_type: "phone_detected",
            description: "พบวัตถุคล้ายมือถือ",
            severity: "high",
            duration: "8 วินาที",
          },
          {
            timestamp: "15:25:10",
            event_type: "tab_switch",
            description: "เปลี่ยนแท็บเบราว์เซอร์",
            severity: "high",
            duration: "1 วินาที",
          },
        ],
        video_segments: [
          { timestamp: "14:35:22", url: "/videos/candidate_1_segment_1.mp4" },
          { timestamp: "14:58:30", url: "/videos/candidate_1_segment_2.mp4" },
          { timestamp: "15:12:45", url: "/videos/candidate_1_segment_3.mp4" },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>กำลังโหลดข้อมูล...</h2>
        <div style={{ fontSize: "50px" }}>⏳</div>
      </div>
    );
  }

  if (!candidateData) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>ไม่พบข้อมูลผู้สมัคร</h2>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#666",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/admin/candidates")}
        >
          ← กลับรายการผู้สมัคร
        </button>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "low":
        return "#ff9800";
      case "medium":
        return "#f44336";
      case "high":
        return "#d32f2f";
      default:
        return "#666";
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

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: "20px" }}>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#666",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/admin/candidates")}
        >
          ← กลับรายการผู้สมัคร
        </button>
      </div>

      <h1>📋 รายละเอียดผู้สมัคร</h1>

      {/* Candidate Info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h3>ข้อมูลผู้สมัคร</h3>
          <p>
            <strong>ชื่อ:</strong> {candidateData.first_name}{" "}
            {candidateData.last_name}
          </p>
          <p>
            <strong>อีเมล:</strong> {candidateData.email}
          </p>
          <p>
            <strong>เบอร์โทร:</strong> {candidateData.phone}
          </p>
          <p>
            <strong>ตำแหน่ง:</strong> {candidateData.position}
          </p>
          <p>
            <strong>สถานะ:</strong>{" "}
            <span style={{ color: "#4caf50" }}>{candidateData.status}</span>
          </p>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h3>ผลการสอบ</h3>
          <p>
            <strong>คะแนน:</strong>{" "}
            <span style={{ fontSize: "24px", color: "#1976d2" }}>
              {candidateData.exam_score}/100
            </span>
          </p>
          <p>
            <strong>วันที่สอบ:</strong> {candidateData.exam_date}
          </p>
          <p>
            <strong>ระยะเวลา:</strong> {candidateData.exam_duration}
          </p>
          <p>
            <strong>สถานะ:</strong>{" "}
            <span style={{ color: "#4caf50" }}>ผ่าน</span>
          </p>
        </div>
      </div>

      {/* AI Proctoring Analysis */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "30px",
        }}
      >
        <h3>🤖 การวิเคราะห์ AI Proctoring</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "15px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <h4>เปอร์เซนต์การโกง</h4>
            <div
              style={{
                fontSize: "32px",
                color:
                  candidateData.cheating_percentage > 30
                    ? "#f44336"
                    : candidateData.cheating_percentage > 15
                    ? "#ff9800"
                    : "#4caf50",
              }}
            >
              {candidateData.cheating_percentage}%
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "15px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <h4>ความมั่นใจของ AI</h4>
            <div style={{ fontSize: "32px", color: "#1976d2" }}>
              {candidateData.ai_confidence}%
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "15px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <h4>เหตุการณ์ต้องสงสัย</h4>
            <div style={{ fontSize: "32px", color: "#f44336" }}>
              {candidateData.proctoring_events.length}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "15px",
            backgroundColor: "#e3f2fd",
            borderRadius: "8px",
          }}
        >
          <p>
            <strong>🔗 N8N Workflow Status:</strong>{" "}
            <span style={{ color: "#4caf50" }}>✅ AI Analysis Completed</span>
          </p>
          <p>
            <strong>📊 Analysis Model:</strong> YOLOv8 + Face Recognition +
            Behavior Detection
          </p>
          <p>
            <strong>⏱️ Processing Time:</strong> 2.3 seconds
          </p>
        </div>
      </div>

      {/* Proctoring Events Timeline */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "30px",
        }}
      >
        <h3>⏰ Timeline เหตุการณ์ต้องสงสัย</h3>
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {candidateData.proctoring_events.map((event, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "15px",
                borderBottom: "1px solid #eee",
                backgroundColor: index % 2 === 0 ? "#fafafa" : "white",
              }}
            >
              <div style={{ marginRight: "15px", fontSize: "20px" }}>
                {getSeverityIcon(event.severity)}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong style={{ color: getSeverityColor(event.severity) }}>
                    {event.timestamp}
                  </strong>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: getSeverityColor(event.severity),
                      color: "white",
                      fontSize: "12px",
                    }}
                  >
                    {event.severity ? event.severity.toUpperCase() : "N/A"}
                  </span>
                </div>
                <div style={{ marginTop: "5px" }}>
                  <strong>{event.description}</strong>
                </div>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
                >
                  ระยะเวลา: {event.duration}
                </div>
              </div>
              <button
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
                onClick={() => alert(`เปิดคลิปวิดีโอที่ ${event.timestamp}`)}
              >
                📹 ดูคลิป
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Video Segments */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h3>🎥 คลิปวิดีโอที่บันทึกไว้</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "15px",
          }}
        >
          {candidateData.video_segments.map((segment, index) => (
            <div
              key={index}
              style={{
                padding: "15px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>🎬</div>
              <p>
                <strong>เวลา:</strong> {segment.timestamp}
              </p>
              <button
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                onClick={() => alert(`เปิดวิดีโอ: ${segment.url}`)}
              >
                ▶️ เล่นวิดีโอ
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple Exam Page
function ExamPage() {
  const navigate = useNavigate();
  const [examSessions] = useState([
    { id: "demo-session-1", name: "ข้อสอบ JavaScript Developer", duration: 60 },
    { id: "demo-session-2", name: "ข้อสอบ Python Developer", duration: 90 },
    { id: "demo-session-3", name: "ข้อสอบ React Developer", duration: 75 },
    {
      id: "real-session-1",
      name: "🎯 ระบบตรวจจับการโกง (OpenCV)",
      duration: 30,
    },
    {
      id: "real-session-2",
      name: "🤖 ระบบตรวจจับการโกง (YOLO11 Pose)",
      duration: 30,
    },
  ]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>📝 หน้าทำการสอบ</h1>
      <p>ยินดีต้อนรับสู่ระบบสอบออนไลน์</p>

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#e3f2fd",
          borderRadius: "8px",
        }}
      >
        <h3>📋 ข้อสอบที่พร้อมทำ</h3>
        {examSessions.map((session) => (
          <div
            key={session.id}
            style={{
              backgroundColor: "white",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h4 style={{ margin: "0 0 5px 0" }}>{session.name}</h4>
              <p style={{ margin: 0, color: "#666" }}>
                เวลาในการทำ: {session.duration} นาที
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                onClick={() => navigate(`/exam/${session.id}`)}
              >
                🚀 เริ่มทำการสอบ
              </button>
              <button
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ff9800",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                onClick={() => navigate(`/debug/${session.id}`)}
              >
                🔬 Debug Mode
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#fff3e0",
          borderRadius: "8px",
        }}
      >
        <h3>⚠️ ข้อปฏิบัติในการสอบ</h3>
        <ul style={{ textAlign: "left" }}>
          <li>ห้ามออกจากหน้าจอระหว่างทำการสอบ</li>
          <li>ระบบจะตรวจจับใบหน้าตลอดเวลา</li>
          <li>ห้ามใช้เครื่องมือช่วยเหลือภายนอก</li>
          <li>กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</li>
        </ul>
      </div>

      <div style={{ marginTop: "30px", textAlign: "center" }}>
        <button
          style={{
            padding: "15px 30px",
            backgroundColor: "#666",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
          }}
          onClick={() => navigate("/")}
        >
          ← กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
}

// Exam Completed Page
function ExamCompletedPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <div style={{ fontSize: "72px", marginBottom: "20px" }}>✅</div>
        <h1 style={{ color: "#4caf50", marginBottom: "20px" }}>
          การสอบเสร็จสิ้น
        </h1>
        <p style={{ fontSize: "18px", color: "#666", marginBottom: "30px" }}>
          ขอบคุณสำหรับการทำข้อสอบ ผลการสอบจะถูกส่งทางอีเมลภายใน 24 ชั่วโมง
        </p>

        <div
          style={{
            backgroundColor: "#e8f5e8",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "30px",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", color: "#2e7d32" }}>
            ข้อมูลการส่งข้อสอบ
          </h3>
          <p style={{ margin: "5px 0", color: "#2e7d32" }}>
            📅 วันที่ส่ง: {new Date().toLocaleDateString("th-TH")}
          </p>
          <p style={{ margin: "5px 0", color: "#2e7d32" }}>
            ⏰ เวลาที่ส่ง: {new Date().toLocaleTimeString("th-TH")}
          </p>
        </div>

        <button
          style={{
            padding: "15px 30px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
          }}
          onClick={() => navigate("/")}
        >
          🏠 กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/companies" element={<CompaniesPage />} />
        <Route path="/admin/departments" element={<DepartmentsPage />} />
        <Route path="/admin/exams" element={<ExamsPage />} />
        <Route path="/admin/candidates" element={<CandidatesPage />} />
        <Route path="/admin/candidates/:id" element={<CandidateDetailPage />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/exam/:sessionId" element={<ExamInterface />} />
        <Route path="/debug/:sessionId" element={<DebugMonitoring />} />
        <Route path="/exam-completed" element={<ExamCompletedPage />} />
      </Routes>
    </Router>
  );
}

export default App;
