import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiService from "./services/api";
import ExamInterface from "./components/ExamInterface";
import DebugMonitoring from "./components/DebugMonitoring";
import CandidateLogin from "./components/CandidateLogin";
import CandidateDashboard from "./components/CandidateDashboard";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import DashboardLayout from "./components/DashboardLayout";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./components/AdminDashboard";
import AdminCompanies from "./components/AdminCompanies";
import AdminDepartments from "./components/AdminDepartments";
import AdminPositions from "./components/AdminPositions";
import AdminProgrammingLanguages from "./components/AdminProgrammingLanguages";
import AdminExams from "./components/AdminExams";
import AdminExamDetail from "./components/AdminExamDetail";
import AdminCandidates from "./components/AdminCandidates";
import AdminCandidateDetail from "./components/AdminCandidateDetail";
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
            marginRight: "10px",
          }}
          onClick={() => navigate("/exam")}
        >
          เข้าสู่หน้าทำการสอบ
        </button>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/candidate-login")}
        >
          เข้าสู่ระบบผู้สมัคร
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
              padding: "15px 20px",
              backgroundColor: "#9c27b0",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1em",
              fontWeight: "bold",
              transition: "all 0.3s ease",
            }}
            onClick={() => navigate("/admin/positions")}
          >
            💼 Position Management
          </button>
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
            onClick={() => navigate("/admin/programming-languages")}
          >
            💻 Programming Languages
          </button>
          <button
            style={{
              padding: "10px 15px",
              backgroundColor: "#ff5722",
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
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  // Load companies from database on component mount
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading companies from database...");
      const response = await apiService.getCompanies();
      console.log("✅ Companies loaded:", response);
      setCompanies(response || []);
    } catch (error) {
      console.error("❌ Failed to load companies:", error);
      alert("ไม่สามารถโหลดข้อมูลบริษัทได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingCompany) {
        // Update existing company
        console.log("💾 Updating company in database:", formData);
        const response = await apiService.updateCompany(
          editingCompany.id,
          formData
        );

        console.log("✅ Company updated:", response);
        alert("แก้ไขบริษัทเรียบร้อยแล้ว");
      } else {
        // Create new company
        console.log("💾 Saving company to database:", formData);
        const response = await apiService.createCompany(formData);

        console.log("✅ Company created:", response);
        alert("เพิ่มบริษัทเรียบร้อยแล้ว");
      }

      // Reset form and reload companies
      setFormData({ name: "", description: "" });
      setShowForm(false);
      setEditingCompany(null);
      await loadCompanies(); // Reload from database
    } catch (error) {
      console.error("❌ Failed to save company:", error);
      const action = editingCompany ? "แก้ไข" : "เพิ่ม";
      alert(
        `ไม่สามารถ${action}บริษัทได้: ` + (error.message || "กรุณาลองใหม่")
      );
    } finally {
      setSaving(false);
    }
  };

  const editCompany = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      description: company.description || "",
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingCompany(null);
    setFormData({ name: "", description: "" });
    setShowForm(false);
  };

  const deleteCompany = async (companyId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบบริษัทนี้?")) return;

    try {
      console.log("🗑️ Deleting company:", companyId);
      await apiService.deleteCompany(companyId);

      console.log("✅ Company deleted");
      alert("ลบบริษัทเรียบร้อยแล้ว");
      await loadCompanies(); // Reload from database
    } catch (error) {
      console.error("❌ Failed to delete company:", error);
      alert("ไม่สามารถลบบริษัทได้: " + (error.message || "กรุณาลองใหม่"));
    }
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
          onClick={() => {
            if (showForm) {
              cancelEdit();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? "ยกเลิก" : "+ เพิ่มบริษัทใหม่"}
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
          <h3>{editingCompany ? "แก้ไขข้อมูลบริษัท" : "เพิ่มบริษัทใหม่"}</h3>
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
              disabled={saving}
              style={{
                padding: "10px 20px",
                backgroundColor: saving ? "#ccc" : "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving
                ? editingCompany
                  ? "🔄 กำลังแก้ไข..."
                  : "🔄 กำลังบันทึก..."
                : editingCompany
                ? "💾 แก้ไข"
                : "💾 บันทึก"}
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
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p>🔄 กำลังโหลดข้อมูลบริษัท...</p>
          </div>
        ) : companies.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p>❌ ไม่มีข้อมูลบริษัท</p>
            <p style={{ color: "#666", fontSize: "14px" }}>
              คลิก "เพิ่มบริษัทใหม่" เพื่อเพิ่มบริษัทแรก
            </p>
          </div>
        ) : (
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
                    {company.description || "ไม่มีคำอธิบาย"}
                  </td>
                  <td
                    style={{
                      padding: "15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {new Date(company.created_at).toLocaleDateString("th-TH")}
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
                      onClick={() => editCompany(company)}
                    >
                      ✏️ แก้ไข
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
                      onClick={() => deleteCompany(company.id)}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Component to display positions for a department
function DepartmentPositions({ departmentId }) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPositions = async () => {
      try {
        const response = await apiService.getPositions(departmentId);
        setPositions(response || []);
      } catch (error) {
        console.error("Failed to load department positions:", error);
        setPositions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPositions();
  }, [departmentId]);

  if (loading) {
    return (
      <span style={{ color: "#666", fontSize: "12px" }}>กำลังโหลด...</span>
    );
  }

  if (positions.length === 0) {
    return (
      <span style={{ color: "#999", fontSize: "12px" }}>ไม่มีตำแหน่ง</span>
    );
  }

  return (
    <div>
      {positions.slice(0, 3).map((position, index) => (
        <span
          key={position.id}
          style={{
            display: "inline-block",
            backgroundColor: "#e3f2fd",
            color: "#1976d2",
            padding: "2px 6px",
            borderRadius: "3px",
            fontSize: "11px",
            marginRight: "4px",
            marginBottom: "2px",
          }}
        >
          {position.name}
        </span>
      ))}
      {positions.length > 3 && (
        <span style={{ color: "#666", fontSize: "11px" }}>
          +{positions.length - 3} อื่นๆ
        </span>
      )}
    </div>
  );
}

// Departments Management Page
function DepartmentsPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [allPositions, setAllPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    company_id: "",
    position_ids: [],
  });

  // Load departments, companies, and positions from database on component mount
  useEffect(() => {
    loadDepartments();
    loadCompanies();
    loadAllPositions();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading departments from database...");
      const response = await apiService.getDepartments();
      console.log("✅ Departments loaded:", response);
      setDepartments(response || []);
    } catch (error) {
      console.error("❌ Failed to load departments:", error);
      alert("ไม่สามารถโหลดข้อมูลแผนกได้");
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      console.log("🔍 Loading companies for dropdown...");
      const response = await apiService.getCompanies();
      console.log("✅ Companies loaded for dropdown:", response);
      setCompanies(response || []);
      // Set default company_id to first company if available
      if (response && response.length > 0 && !formData.company_id) {
        setFormData((prev) => ({
          ...prev,
          company_id: response[0].id.toString(),
        }));
      }
    } catch (error) {
      console.error("❌ Failed to load companies:", error);
      alert("ไม่สามารถโหลดข้อมูลบริษัทได้");
    }
  };

  const loadAllPositions = async () => {
    try {
      console.log("🔍 Loading all positions...");
      const response = await apiService.getPositions();
      console.log("✅ All positions loaded:", response);
      setAllPositions(response || []);
    } catch (error) {
      console.error("❌ Failed to load positions:", error);
      alert("ไม่สามารถโหลดข้อมูลตำแหน่งได้");
    }
  };

  const updatePositionsForDepartment = async (departmentId, positionIds) => {
    try {
      console.log(
        "🔄 Updating positions for department:",
        departmentId,
        positionIds
      );

      // Update each selected position to belong to this department
      for (const positionId of positionIds) {
        const position = allPositions.find((p) => p.id === positionId);
        if (position) {
          await apiService.updatePosition(positionId, {
            name: position.name,
            description: position.description,
            department_id: departmentId,
            programming_language_id: position.programming_language_id || null,
          });
        }
      }

      console.log("✅ Positions updated successfully");
    } catch (error) {
      console.error("❌ Failed to update positions:", error);
      throw error; // Re-throw to handle in main function
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingDepartment) {
        // Update existing department
        console.log("💾 Updating department in database:", formData);
        const response = await apiService.updateDepartment(
          editingDepartment.id,
          {
            name: formData.name,
            description: formData.description,
            company_id: parseInt(formData.company_id),
          }
        );

        console.log("✅ Department updated:", response);

        // Update positions to belong to this department
        await updatePositionsForDepartment(
          editingDepartment.id,
          formData.position_ids
        );

        alert("แก้ไขแผนกเรียบร้อยแล้ว");
      } else {
        // Create new department
        console.log("💾 Saving department to database:", formData);
        const response = await apiService.createDepartment(
          parseInt(formData.company_id),
          {
            name: formData.name,
            description: formData.description,
            company_id: parseInt(formData.company_id),
          }
        );

        console.log("✅ Department created:", response);

        // Update positions to belong to this new department
        if (formData.position_ids.length > 0) {
          await updatePositionsForDepartment(
            response.id,
            formData.position_ids
          );
        }

        alert("เพิ่มแผนกเรียบร้อยแล้ว");
      }

      // Reset form and reload departments
      setFormData({
        name: "",
        description: "",
        company_id: companies[0]?.id?.toString() || "",
        position_ids: [],
      });
      setShowForm(false);
      setEditingDepartment(null);
      await loadDepartments(); // Reload from database
      await loadAllPositions(); // Reload positions to reflect changes
    } catch (error) {
      console.error("❌ Failed to save department:", error);
      const action = editingDepartment ? "แก้ไข" : "เพิ่ม";
      alert(`ไม่สามารถ${action}แผนกได้: ` + (error.message || "กรุณาลองใหม่"));
    } finally {
      setSaving(false);
    }
  };

  const editDepartment = async (department) => {
    setEditingDepartment(department);

    // Load existing positions for this department
    let existingPositionIds = [];
    try {
      console.log("🔍 Loading positions for department:", department.id);
      const response = await apiService.getPositions(department.id);
      existingPositionIds = response.map((pos) => pos.id);
      console.log("✅ Existing positions loaded:", existingPositionIds);
    } catch (error) {
      console.error("❌ Failed to load department positions:", error);
    }

    setFormData({
      name: department.name,
      description: department.description || "",
      company_id: (
        department.company_id ||
        department.company?.id ||
        ""
      ).toString(),
      position_ids: existingPositionIds,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingDepartment(null);
    setFormData({
      name: "",
      description: "",
      company_id: companies[0]?.id?.toString() || "",
      position_ids: [],
    });
    setShowForm(false);
  };

  const deleteDepartment = async (departmentId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบแผนกนี้?")) return;

    try {
      console.log("🗑️ Deleting department:", departmentId);
      await apiService.deleteDepartment(departmentId);

      console.log("✅ Department deleted");
      alert("ลบแผนกเรียบร้อยแล้ว");
      await loadDepartments(); // Reload from database
    } catch (error) {
      console.error("❌ Failed to delete department:", error);
      alert("ไม่สามารถลบแผนกได้: " + (error.message || "กรุณาลองใหม่"));
    }
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
          onClick={() => {
            if (showForm) {
              cancelEdit();
            } else {
              setShowForm(true);
            }
          }}
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
          <h3>{editingDepartment ? "แก้ไขข้อมูลแผนก" : "เพิ่มแผนกใหม่"}</h3>
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
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                ตำแหน่งในแผนก (เลือกได้หลายตำแหน่ง):
              </label>
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "8px",
                  maxHeight: "150px",
                  overflowY: "auto",
                  backgroundColor: "white",
                }}
              >
                {allPositions.length === 0 ? (
                  <p
                    style={{
                      color: "#666",
                      margin: "10px 0",
                      textAlign: "center",
                    }}
                  >
                    ไม่มีตำแหน่งให้เลือก กรุณาสร้างตำแหน่งก่อน
                  </p>
                ) : (
                  allPositions.map((position) => (
                    <div key={position.id} style={{ marginBottom: "8px" }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.position_ids.includes(position.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                position_ids: [
                                  ...formData.position_ids,
                                  position.id,
                                ],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                position_ids: formData.position_ids.filter(
                                  (id) => id !== position.id
                                ),
                              });
                            }
                          }}
                          style={{ marginRight: "8px" }}
                        />
                        <span>
                          {position.name}
                          <small style={{ color: "#666", marginLeft: "8px" }}>
                            ({position.department_name || "ไม่ระบุแผนก"})
                          </small>
                        </span>
                      </label>
                    </div>
                  ))
                )}
              </div>
              <small style={{ color: "#666", fontSize: "12px" }}>
                หมายเหตุ: ตำแหน่งที่เลือกจะถูกเชื่อมโยงกับแผนกนี้
              </small>
            </div>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 20px",
                backgroundColor: saving ? "#ccc" : "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving
                ? editingDepartment
                  ? "🔄 กำลังแก้ไข..."
                  : "🔄 กำลังบันทึก..."
                : editingDepartment
                ? "💾 แก้ไข"
                : "💾 บันทึก"}
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
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p>🔄 กำลังโหลดข้อมูลแผนก...</p>
          </div>
        ) : departments.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p>❌ ไม่มีข้อมูลแผนก</p>
            <p style={{ color: "#666", fontSize: "14px" }}>
              คลิก "เพิ่มแผนกใหม่" เพื่อเพิ่มแผนกแรก
            </p>
          </div>
        ) : (
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
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {dept.id}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {dept.name}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {dept.description || "ไม่มีคำอธิบาย"}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {dept.company_name || dept.company?.name || "ไม่ระบุบริษัท"}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    <DepartmentPositions departmentId={dept.id} />
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
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
                      onClick={() => editDepartment(dept)}
                    >
                      ✏️ แก้ไข
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
                      onClick={() => deleteDepartment(dept.id)}
                    >
                      🗑️ ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Positions Management Page
function PositionsPage() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmingLanguages, setProgrammingLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    department_id: "",
    programming_language_id: "",
  });

  // Load positions, departments, and programming languages from database on component mount
  useEffect(() => {
    loadPositions();
    loadDepartments();
    loadProgrammingLanguages();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading positions from database...");
      const response = await apiService.getPositions();
      console.log("✅ Positions loaded:", response);
      setPositions(response || []);
    } catch (error) {
      console.error("❌ Failed to load positions:", error);
      alert("ไม่สามารถโหลดข้อมูลตำแหน่งได้");
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      console.log("🔍 Loading departments for dropdown...");
      const response = await apiService.getDepartments();
      console.log("✅ Departments loaded for dropdown:", response);
      setDepartments(response || []);
      // Set default department_id to first department if available
      if (response && response.length > 0 && !formData.department_id) {
        setFormData((prev) => ({
          ...prev,
          department_id: response[0].id.toString(),
        }));
      }
    } catch (error) {
      console.error("❌ Failed to load departments:", error);
      alert("ไม่สามารถโหลดข้อมูลแผนกได้");
    }
  };

  const loadProgrammingLanguages = async () => {
    try {
      console.log("🔍 Loading programming languages for dropdown...");
      const response = await apiService.request(
        "/api/v1/admin/programming-languages?active_only=true"
      );
      console.log("✅ Programming languages loaded for dropdown:", response);
      setProgrammingLanguages(response || []);
    } catch (error) {
      console.error("❌ Failed to load programming languages:", error);
      alert("ไม่สามารถโหลดข้อมูลภาษาโปรแกรมมิ่งได้");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingPosition) {
        // Update existing position
        console.log("💾 Updating position in database:", formData);
        const response = await apiService.updatePosition(editingPosition.id, {
          name: formData.name,
          description: formData.description,
          department_id: parseInt(formData.department_id),
          programming_language_id: formData.programming_language_id
            ? parseInt(formData.programming_language_id)
            : null,
        });

        console.log("✅ Position updated:", response);
        alert("แก้ไขตำแหน่งเรียบร้อยแล้ว");
      } else {
        // Create new position
        console.log("💾 Saving position to database:", formData);
        const response = await apiService.createPosition(
          parseInt(formData.department_id),
          {
            name: formData.name,
            description: formData.description,
            department_id: parseInt(formData.department_id),
            programming_language_id: formData.programming_language_id
              ? parseInt(formData.programming_language_id)
              : null,
          }
        );

        console.log("✅ Position created:", response);
        alert("เพิ่มตำแหน่งเรียบร้อยแล้ว");
      }

      // Reset form and reload positions
      setFormData({
        name: "",
        description: "",
        department_id: departments[0]?.id?.toString() || "",
        programming_language_id: "",
      });
      setShowForm(false);
      setEditingPosition(null);
      await loadPositions(); // Reload from database
    } catch (error) {
      console.error("❌ Failed to save position:", error);
      const action = editingPosition ? "แก้ไข" : "เพิ่ม";
      alert(
        `ไม่สามารถ${action}ตำแหน่งได้: ` + (error.message || "กรุณาลองใหม่")
      );
    } finally {
      setSaving(false);
    }
  };

  const editPosition = (position) => {
    setEditingPosition(position);
    setFormData({
      name: position.name,
      description: position.description || "",
      department_id: (
        position.department_id ||
        position.department?.id ||
        ""
      ).toString(),
      programming_language_id: (
        position.programming_language_id || ""
      ).toString(),
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingPosition(null);
    setFormData({
      name: "",
      description: "",
      department_id: departments[0]?.id?.toString() || "",
      programming_language_id: "",
    });
    setShowForm(false);
  };

  const deletePosition = async (positionId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบตำแหน่งนี้?")) return;

    try {
      console.log("🗑️ Deleting position:", positionId);
      await apiService.deletePosition(positionId);

      console.log("✅ Position deleted");
      alert("ลบตำแหน่งเรียบร้อยแล้ว");
      await loadPositions(); // Reload from database
    } catch (error) {
      console.error("❌ Failed to delete position:", error);
      alert("ไม่สามารถลบตำแหน่งได้: " + (error.message || "กรุณาลองใหม่"));
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>💼 จัดการตำแหน่งงาน</h1>

      <div style={{ marginBottom: "20px" }}>
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
            if (showForm) {
              cancelEdit();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? "ยกเลิก" : "+ เพิ่มตำแหน่งใหม่"}
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
          <h3>{editingPosition ? "แก้ไขข้อมูลตำแหน่ง" : "เพิ่มตำแหน่งใหม่"}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                เลือกแผนก:
              </label>
              <select
                value={formData.department_id}
                onChange={(e) =>
                  setFormData({ ...formData, department_id: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
                required
              >
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name} (
                    {department.company_name ||
                      department.company?.name ||
                      "ไม่ระบุบริษัท"}
                    )
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                ภาษาโปรแกรมมิ่งที่ต้องการ (ไม่บังคับ):
              </label>
              <select
                value={formData.programming_language_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    programming_language_id: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
              >
                <option value="">ไม่ระบุภาษาโปรแกรมมิ่ง</option>
                {programmingLanguages.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.name}{" "}
                    {language.version ? `(${language.version})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                ชื่อตำแหน่ง:
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
                placeholder="เช่น นักพัฒนาซอฟต์แวร์, นักวิเคราะห์ระบบ, ผู้จัดการโครงการ"
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
                placeholder="อธิบายหน้าที่และความรับผิดชอบของตำแหน่ง"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 20px",
                backgroundColor: saving ? "#ccc" : "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving
                ? editingPosition
                  ? "🔄 กำลังแก้ไข..."
                  : "🔄 กำลังบันทึก..."
                : editingPosition
                ? "💾 แก้ไข"
                : "💾 บันทึก"}
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
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p>🔄 กำลังโหลดข้อมูลตำแหน่ง...</p>
          </div>
        ) : positions.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p>❌ ไม่มีข้อมูลตำแหน่ง</p>
            <p style={{ color: "#666", fontSize: "14px" }}>
              คลิก "เพิ่มตำแหน่งใหม่" เพื่อเพิ่มตำแหน่งแรก
            </p>
          </div>
        ) : (
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
                  ชื่อตำแหน่ง
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
                  แผนก
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
                <th
                  style={{
                    padding: "15px",
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  ภาษาโปรแกรมมิ่ง
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.id}>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {position.id}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {position.name}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {position.description || "ไม่มีคำอธิบาย"}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {position.department_name || "ไม่ระบุแผนก"}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {position.company_name || "ไม่ระบุบริษัท"}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {position.programming_language_name ? (
                      <span
                        style={{
                          backgroundColor: "#e3f2fd",
                          color: "#1976d2",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      >
                        {position.programming_language_name}
                        {position.programming_language_version &&
                          ` (${position.programming_language_version})`}
                      </span>
                    ) : (
                      <span style={{ color: "#999", fontSize: "12px" }}>
                        ไม่ระบุ
                      </span>
                    )}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
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
                      onClick={() => editPosition(position)}
                    >
                      ✏️ แก้ไข
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
                      onClick={() => deletePosition(position.id)}
                    >
                      🗑️ ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Programming Languages Management Page
function ProgrammingLanguagesPage() {
  const navigate = useNavigate();
  const [programmingLanguages, setProgrammingLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    version: "",
    is_active: true,
  });

  // Load programming languages from database on component mount
  useEffect(() => {
    loadProgrammingLanguages();
  }, []);

  const loadProgrammingLanguages = async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading programming languages from database...");
      const response = await apiService.getProgrammingLanguages();
      console.log("✅ Programming languages loaded:", response);
      setProgrammingLanguages(response || []);
    } catch (error) {
      console.error("❌ Failed to load programming languages:", error);
      alert("ไม่สามารถโหลดข้อมูลภาษาโปรแกรมมิ่งได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingLanguage) {
        // Update existing programming language
        console.log("💾 Updating programming language in database:", formData);
        const response = await apiService.updateProgrammingLanguage(
          editingLanguage.id,
          {
            name: formData.name,
            description: formData.description,
            version: formData.version,
            is_active: formData.is_active,
          }
        );

        console.log("✅ Programming language updated:", response);
        alert("แก้ไขภาษาโปรแกรมมิ่งเรียบร้อยแล้ว");
      } else {
        // Create new programming language
        console.log("💾 Saving programming language to database:", formData);
        const response = await apiService.createProgrammingLanguage({
          name: formData.name,
          description: formData.description,
          version: formData.version,
          is_active: formData.is_active,
        });

        console.log("✅ Programming language created:", response);
        alert("เพิ่มภาษาโปรแกรมมิ่งเรียบร้อยแล้ว");
      }

      // Reset form and reload programming languages
      setFormData({
        name: "",
        description: "",
        version: "",
        is_active: true,
      });
      setShowForm(false);
      setEditingLanguage(null);
      await loadProgrammingLanguages(); // Reload from database
    } catch (error) {
      console.error("❌ Failed to save programming language:", error);
      const action = editingLanguage ? "แก้ไข" : "เพิ่ม";
      alert(
        `ไม่สามารถ${action}ภาษาโปรแกรมมิ่งได้: ` +
          (error.message || "กรุณาลองใหม่")
      );
    } finally {
      setSaving(false);
    }
  };

  const editLanguage = (language) => {
    setEditingLanguage(language);
    setFormData({
      name: language.name,
      description: language.description || "",
      version: language.version || "",
      is_active: language.is_active,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingLanguage(null);
    setFormData({
      name: "",
      description: "",
      version: "",
      is_active: true,
    });
    setShowForm(false);
  };

  const deleteLanguage = async (languageId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบภาษาโปรแกรมมิ่งนี้?")) return;

    try {
      console.log("🗑️ Deleting programming language:", languageId);
      await apiService.deleteProgrammingLanguage(languageId);

      console.log("✅ Programming language deleted");
      alert("ลบภาษาโปรแกรมมิ่งเรียบร้อยแล้ว");
      await loadProgrammingLanguages(); // Reload from database
    } catch (error) {
      console.error("❌ Failed to delete programming language:", error);
      alert(
        "ไม่สามารถลบภาษาโปรแกรมมิ่งได้: " + (error.message || "กรุณาลองใหม่")
      );
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>💻 จัดการภาษาโปรแกรมมิ่ง</h1>

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
          onClick={() => {
            if (showForm) {
              cancelEdit();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? "ยกเลิก" : "+ เพิ่มภาษาโปรแกรมมิ่งใหม่"}
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
          <h3>
            {editingLanguage
              ? "แก้ไขข้อมูลภาษาโปรแกรมมิ่ง"
              : "เพิ่มภาษาโปรแกรมมิ่งใหม่"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                ชื่อภาษาโปรแกรมมิ่ง:
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
                placeholder="เช่น Python, JavaScript, Java, C#, Go"
                required
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                เวอร์ชัน:
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) =>
                  setFormData({ ...formData, version: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
                placeholder="เช่น 3.9, ES6, 11, .NET 6"
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
                placeholder="อธิบายเกี่ยวกับภาษาโปรแกรมมิ่งนี้"
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  style={{ marginRight: "8px" }}
                />
                เปิดใช้งาน
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 20px",
                backgroundColor: saving ? "#ccc" : "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving
                ? editingLanguage
                  ? "🔄 กำลังแก้ไข..."
                  : "🔄 กำลังบันทึก..."
                : editingLanguage
                ? "💾 แก้ไข"
                : "💾 บันทึก"}
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
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p>🔄 กำลังโหลดข้อมูลภาษาโปรแกรมมิ่ง...</p>
          </div>
        ) : programmingLanguages.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p>❌ ไม่มีข้อมูลภาษาโปรแกรมมิ่ง</p>
            <p style={{ color: "#666", fontSize: "14px" }}>
              คลิก "เพิ่มภาษาโปรแกรมมิ่งใหม่" เพื่อเพิ่มภาษาแรก
            </p>
          </div>
        ) : (
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
                  ชื่อภาษา
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  เวอร์ชัน
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
                  จำนวนตำแหน่ง
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
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {programmingLanguages.map((language) => (
                <tr key={language.id}>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {language.id}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {language.name}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {language.version || "ไม่ระบุ"}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {language.description || "ไม่มีคำอธิบาย"}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    <span
                      style={{
                        backgroundColor:
                          language.position_count > 0 ? "#e8f5e8" : "#f5f5f5",
                        color: language.position_count > 0 ? "#2e7d32" : "#666",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    >
                      {language.position_count} ตำแหน่ง
                    </span>
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    <span
                      style={{
                        backgroundColor: language.is_active
                          ? "#e8f5e8"
                          : "#ffebee",
                        color: language.is_active ? "#2e7d32" : "#c62828",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    >
                      {language.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
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
                      onClick={() => editLanguage(language)}
                    >
                      ✏️ แก้ไข
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
                      onClick={() => deleteLanguage(language.id)}
                    >
                      🗑️ ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
      const response = await apiService.getExamTemplates();
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
        `/api/v1/admin/exam-templates/${examId}`
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
      await apiService.deleteExamTemplate(examId);
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
        "/api/v1/admin/exam-templates/generate-ai",
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
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
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
                              : "Coding"}
                          </span>
                          <span
                            style={{
                              backgroundColor: "#2196f3",
                              color: "white",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }}
                          >
                            {question.points || question.score || 10} pts
                          </span>
                          {question.Criteria && (
                            <span
                              style={{
                                backgroundColor: "#4caf50",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                              }}
                            >
                              🎯 {question.Criteria}
                            </span>
                          )}
                        </div>
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
  const { t } = useTranslation();
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

  // Load candidates from API
  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCandidates();
      setCandidates(response);
    } catch (error) {
      console.error("Error loading candidates:", error);
      setError(t("candidates.error_loading"));
    } finally {
      setLoading(false);
    }
  };

  // Load candidates on component mount
  useEffect(() => {
    loadCandidates();
    loadAssignmentOptions();
  }, []);

  // Load options for assignment dropdowns
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
      await apiService.createCandidate(formData);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
      });
      setShowForm(false);
      // Reload candidates list
      await loadCandidates();
      // Show success message (could be enhanced with toast notification)
      alert(t("candidates.create_success"));
    } catch (error) {
      console.error("Error creating candidate:", error);
      alert(error.message || t("candidates.create_error"));
    }
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

  // Assignment functions
  const openAssignmentForm = (candidate) => {
    setSelectedCandidate(candidate);
    setAssignmentData({
      candidate_id: candidate.id,
      exam_template_id: "",
      position_id: "",
      programming_language_id: "",
      start_time: "",
    });
    setShowAssignForm(true);
  };

  const closeAssignmentForm = () => {
    setShowAssignForm(false);
    setSelectedCandidate(null);
    setAssignmentData({
      candidate_id: "",
      exam_template_id: "",
      position_id: "",
      programming_language_id: "",
      start_time: "",
    });
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

      alert(t("candidates.assignment_success"));
      closeAssignmentForm();
      await loadCandidates(); // Reload to see updates
    } catch (error) {
      console.error("Error assigning to candidate:", error);
      alert(error.message || t("candidates.assignment_error"));
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>👥 {t("candidates.title")}</h1>

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
          {showForm ? t("candidates.cancel") : `+ ${t("candidates.add_new")}`}
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
          ← {t("candidates.back")}
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
          <h3>{t("candidates.add_new_candidate")}</h3>
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
                  {t("candidates.first_name")}:
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
                  placeholder={t("candidates.first_name_placeholder")}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  {t("candidates.last_name")}:
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
                  placeholder={t("candidates.last_name_placeholder")}
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
                  {t("candidates.email")}:
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
                  placeholder={t("candidates.email_placeholder")}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  {t("candidates.phone")}:
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
                  placeholder={t("candidates.phone_placeholder")}
                />
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
              {t("form.save")}
            </button>
          </form>
        </div>
      )}

      {/* Assignment Form */}
      {showAssignForm && selectedCandidate && (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#e3f2fd",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "2px solid #2196f3",
          }}
        >
          <h3>
            🎯 {t("candidates.assign_to")} {selectedCandidate.first_name}{" "}
            {selectedCandidate.last_name}
          </h3>
          <form onSubmit={handleAssignmentSubmit}>
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
                  {t("candidates.assign_exam")}:
                </label>
                <select
                  value={assignmentData.exam_template_id}
                  onChange={(e) =>
                    setAssignmentData({
                      ...assignmentData,
                      exam_template_id: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <option value="">{t("candidates.select_exam")}</option>
                  {examTemplates.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name} ({exam.position_name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  {t("candidates.assign_position")}:
                </label>
                <select
                  value={assignmentData.position_id}
                  onChange={(e) =>
                    setAssignmentData({
                      ...assignmentData,
                      position_id: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <option value="">{t("candidates.select_position")}</option>
                  {positions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                      {position.department && ` (${position.department.name})`}
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
                  {t("candidates.assign_programming_language")}:
                </label>
                <select
                  value={assignmentData.programming_language_id}
                  onChange={(e) =>
                    setAssignmentData({
                      ...assignmentData,
                      programming_language_id: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <option value="">
                    {t("candidates.select_programming_language")}
                  </option>
                  {programmingLanguages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  {t("candidates.scheduled_date")} ({t("candidates.optional")}):
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
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#2196f3",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {t("candidates.confirm_assignment")}
              </button>
              <button
                type="button"
                onClick={closeAssignmentForm}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#666",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {t("candidates.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p>{t("candidates.loading")}</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          style={{
            backgroundColor: "#ffebee",
            border: "1px solid #f44336",
            borderRadius: "4px",
            padding: "15px",
            marginBottom: "20px",
            color: "#c62828",
          }}
        >
          <p>{error}</p>
        </div>
      )}

      {/* No candidates state */}
      {!loading && !error && candidates.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>{t("candidates.no_candidates")}</p>
        </div>
      )}

      {/* Candidates table */}
      {!loading && !error && candidates.length > 0 && (
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
                  {t("candidates.table.id")}
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {t("candidates.table.name")}
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {t("candidates.table.email")}
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {t("candidates.table.phone")}
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {t("candidates.table.position")}
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {t("candidates.table.status")}
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {t("candidates.table.created_at")}
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "center",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {t("candidates.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {candidate.id}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    <span
                      style={{
                        color: "#1976d2",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      onClick={() =>
                        navigate(`/admin/candidates/${candidate.id}`)
                      }
                      title="ดูรายละเอียดและผลการสอบ"
                    >
                      {candidate.first_name} {candidate.last_name}
                    </span>
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {candidate.email}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {candidate.phone}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {candidate.position}
                  </td>
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
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
                  <td
                    style={{ padding: "15px", borderBottom: "1px solid #eee" }}
                  >
                    {candidate.created_at}
                  </td>
                  <td
                    style={{
                      padding: "15px",
                      borderBottom: "1px solid #eee",
                      textAlign: "center",
                    }}
                  >
                    <button
                      onClick={() => openAssignmentForm(candidate)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#2196f3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        marginRight: "5px",
                      }}
                      title={t("candidates.assign_tooltip")}
                    >
                      🎯 {t("candidates.assign")}
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/admin/candidates/${candidate.id}`)
                      }
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                      title="ดูผลการสอบและรายละเอียด"
                    >
                      📊 ดูผลสอบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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

// User Exam Page - Load available exams from database
function ExamPage() {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing candidate session
  useEffect(() => {
    const savedSession = localStorage.getItem("candidateSession");
    if (savedSession) {
      try {
        const candidateData = JSON.parse(savedSession);
        setCandidate(candidateData);
      } catch (err) {
        console.error("Error parsing saved session:", err);
        localStorage.removeItem("candidateSession");
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("candidateSession");
    setCandidate(null);
    navigate("/");
  };

  const handleStartExam = async (exam) => {
    try {
      console.log("Starting exam:", exam);

      // Create exam session for this candidate
      const sessionData = {
        candidate_id: candidate.id,
        template_id: exam.template_id,
        status: "in_progress",
      };

      // Call API to create/start exam session
      const response = await apiService.request(
        "/api/v1/candidate/start-exam",
        {
          method: "POST",
          body: JSON.stringify(sessionData),
        }
      );

      if (response.session_id) {
        // Navigate to exam interface with session ID
        navigate(`/exam/${response.session_id}`);
      } else {
        // Fallback: use existing session_id from exam data
        navigate(`/exam/${exam.session_id}`);
      }
    } catch (error) {
      console.error("Error starting exam:", error);
      // Fallback navigation if API fails
      navigate(`/exam/${exam.session_id || 1}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray dark:bg-boxdark-2 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-black dark:text-white">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Show candidate dashboard if logged in, otherwise redirect to login
  if (candidate) {
    return (
      <DashboardLayout user={candidate} onLogout={handleLogout}>
        <CandidateDashboard
          candidate={candidate}
          onLogout={handleLogout}
          onStartExam={handleStartExam}
        />
      </DashboardLayout>
    );
  }

  // Redirect to candidate login if not authenticated
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          ต้องเข้าสู่ระบบก่อนทำการสอบ
        </h2>
        <p className="text-gray-600 mb-6">
          กรุณาเข้าสู่ระบบเพื่อดูข้อสอบที่ได้รับมอบหมาย
        </p>
        <button
          onClick={() => navigate("/candidate-login")}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
        >
          เข้าสู่ระบบ
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

// Candidate Portal Component
function CandidatePortal() {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on component mount
  useEffect(() => {
    const savedSession = localStorage.getItem("candidateSession");
    if (savedSession) {
      try {
        const candidateData = JSON.parse(savedSession);
        setCandidate(candidateData);
      } catch (err) {
        console.error("Error parsing saved session:", err);
        localStorage.removeItem("candidateSession");
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (candidateData) => {
    setCandidate(candidateData);
    // Redirect to /exam after successful login
    navigate("/exam");
  };

  const handleLogout = () => {
    localStorage.removeItem("candidateSession");
    setCandidate(null);
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleStartExam = async (exam) => {
    try {
      console.log("Starting exam:", exam);

      // Create exam session for this candidate
      const sessionData = {
        candidate_id: candidate.id,
        template_id: exam.template_id,
        status: "in_progress",
      };

      // Call API to create/start exam session
      const response = await apiService.request(
        "/api/v1/candidate/start-exam",
        {
          method: "POST",
          body: JSON.stringify(sessionData),
        }
      );

      if (response.session_id) {
        // Navigate to exam interface with session ID
        navigate(`/exam/${response.session_id}`);
      } else {
        // Fallback: use existing session_id from exam data
        navigate(`/exam/${exam.session_id}`);
      }
    } catch (error) {
      console.error("Error starting exam:", error);
      // Fallback navigation if API fails
      navigate(`/exam/${exam.session_id || 1}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Show dashboard if candidate is logged in, otherwise show login
  if (candidate) {
    return (
      <CandidateDashboard
        candidate={candidate}
        onLogout={handleLogout}
        onStartExam={handleStartExam}
      />
    );
  }

  return (
    <CandidateLogin
      onLoginSuccess={handleLoginSuccess}
      onBackToHome={handleBackToHome}
    />
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
        <Route
          path="/admin"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/companies"
          element={
            <AdminLayout>
              <AdminCompanies />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <AdminLayout>
              <AdminDepartments />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/positions"
          element={
            <AdminLayout>
              <AdminPositions />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/programming-languages"
          element={
            <AdminLayout>
              <AdminProgrammingLanguages />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <AdminLayout>
              <AdminExams />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/exams/:id"
          element={
            <AdminLayout>
              <AdminExamDetail />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/candidates"
          element={
            <AdminLayout>
              <AdminCandidates />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/candidates/:id"
          element={
            <AdminLayout>
              <AdminCandidateDetail />
            </AdminLayout>
          }
        />
        <Route path="/candidate-login" element={<CandidatePortal />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/exam/:sessionId" element={<ExamInterface />} />
        <Route path="/debug/:sessionId" element={<DebugMonitoring />} />
        <Route path="/exam-completed" element={<ExamCompletedPage />} />
      </Routes>
    </Router>
  );
}

export default App;
