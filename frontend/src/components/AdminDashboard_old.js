import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Department as DepartmentIcon,
  Work as WorkIcon,
  Quiz as QuizIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import apiService from "../services/apiService";

function TabPanel({ children, value, index, ...other }) {
  console.log(
    `TabPanel ${index} - value: ${value}, hidden: ${value !== index}`
  );
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [dialogData, setDialogData] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Data states
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [examTemplates, setExamTemplates] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [examSessions, setExamSessions] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_companies: 0,
    total_departments: 0,
    total_positions: 0,
    total_exam_templates: 0,
    total_candidates: 0,
    total_exam_sessions: 0,
    active_exams: 0,
    recent_candidates: 0,
  });

  // State สำหรับ AI Exam Generation
  const [aiExamDialog, setAiExamDialog] = useState(false);
  const [aiExamConfig, setAiExamConfig] = useState({
    company_id: "",
    department_id: "",
    position_id: "",
    programming_language: "",
    level: "",
    multiple_choice_count: 10,
    coding_question_count: 3,
    duration_minutes: 60,
    additional_requirements: "",
  });
  const [configOptions, setConfigOptions] = useState({
    companies: [],
    programming_languages: [],
    levels: [],
    question_types: [],
    duration_options: [],
  });
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentTab]);

  const loadData = async () => {
    try {
      // Load data based on current tab
      switch (currentTab) {
        case 0: // Overview
          const statsResponse = await apiService.getDashboardStats();
          setDashboardStats(statsResponse);
          break;
        case 1: // Companies
          const companiesResponse = await apiService.getCompanies();
          setCompanies(companiesResponse.companies || []);
          break;
        case 2: // Departments
          const departmentsResponse = await apiService.getDepartments();
          setDepartments(departmentsResponse.departments || []);
          break;
        case 3: // Positions
          const positionsResponse = await apiService.getPositions();
          setPositions(positionsResponse || []);
          break;
        case 4: // Exam Templates
          const templatesResponse = await apiService.getExamTemplates();
          setExamTemplates(templatesResponse || []);
          break;
        case 5: // Candidates
          const candidatesResponse = await apiService.getCandidates();
          setCandidates(candidatesResponse.candidates || []);
          break;
        case 6: // Exam Sessions
          const sessionsResponse = await apiService.getExamSessions();
          setExamSessions(sessionsResponse.exam_sessions || []);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
      showSnackbar("เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const openCreateDialog = async (type) => {
    console.log("openCreateDialog called with type:", type);
    setDialogType(type);
    setDialogData({});

    // โหลดข้อมูลที่จำเป็นสำหรับ dialog
    if (type === "exam") {
      try {
        console.log("Loading positions...");
        const positionsResponse = await apiService.getPositions();
        console.log("Positions loaded:", positionsResponse);
        setPositions(positionsResponse || []);
      } catch (error) {
        console.error("Error loading positions:", error);
        showSnackbar("ไม่สามารถโหลดข้อมูลตำแหน่งได้", "error");
      }
    }

    console.log("Setting openDialog to true");
    setOpenDialog(true);
    console.log("openCreateDialog finished");
  };

  const openEditDialog = (type, data) => {
    setDialogType(type);
    setDialogData(data);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setDialogData({});
  };

  const handleSave = async () => {
    try {
      let response;

      switch (dialogType) {
        case "company":
          if (dialogData.id) {
            response = await apiService.updateCompany(
              dialogData.id,
              dialogData
            );
          } else {
            response = await apiService.createCompany(dialogData);
          }
          break;
        case "department":
          if (dialogData.id) {
            response = await apiService.updateDepartment(
              dialogData.id,
              dialogData
            );
          } else {
            response = await apiService.createDepartment(
              dialogData.company_id,
              dialogData
            );
          }
          break;
        case "position":
          if (dialogData.id) {
            response = await apiService.updatePosition(
              dialogData.id,
              dialogData
            );
          } else {
            response = await apiService.createPosition(
              dialogData.department_id,
              dialogData
            );
          }
          break;
        case "exam":
          if (dialogData.id) {
            response = await apiService.updateExamTemplate(
              dialogData.id,
              dialogData
            );
          } else {
            response = await apiService.createExamTemplate(dialogData);
          }
          break;
        case "candidate":
          if (dialogData.id) {
            response = await apiService.updateCandidate(
              dialogData.id,
              dialogData
            );
          } else {
            response = await apiService.createCandidate(dialogData);
          }
          break;
        default:
          break;
      }

      showSnackbar("บันทึกข้อมูลเรียบร้อยแล้ว", "success");
      handleDialogClose();
      loadData();
    } catch (error) {
      console.error("Error saving data:", error);
      showSnackbar("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
    }
  };

  // ฟังก์ชันโหลดตัวเลือกการตั้งค่า
  const loadConfigOptions = async () => {
    try {
      const data = await apiService.getExamGenerationConfigOptions();
      setConfigOptions(data);
    } catch (error) {
      console.error("Error loading config options:", error);
    }
  };

  // ฟังก์ชันเปิด AI Exam Dialog
  const openAiExamDialog = async () => {
    await loadConfigOptions();
    setAiExamDialog(true);
  };

  // ฟังก์ชันปิด AI Exam Dialog
  const closeAiExamDialog = () => {
    setAiExamDialog(false);
    setAiExamConfig({
      company_id: "",
      department_id: "",
      position_id: "",
      programming_language: "",
      level: "",
      multiple_choice_count: 10,
      coding_question_count: 3,
      duration_minutes: 60,
      additional_requirements: "",
    });
  };

  // ฟังก์ชันสร้างข้อสอบด้วย AI
  const generateAiExam = async () => {
    try {
      setIsGeneratingExam(true);

      const result = await apiService.generateAiExam(aiExamConfig);

      if (result.success) {
        showSnackbar(
          `${result.message} (สร้าง ${result.exam_template.questions_count} คำถาม ใช้เวลา ${result.processing_time}s)`,
          "success"
        );
        closeAiExamDialog();
        loadData(); // รีเฟรชรายการข้อสอบ
      } else {
        showSnackbar(result.error || "ไม่สามารถสร้างข้อสอบได้", "error");
      }
    } catch (error) {
      console.error("Error generating AI exam:", error);
      showSnackbar("เกิดข้อผิดพลาดในการสร้างข้อสอบ", "error");
    } finally {
      setIsGeneratingExam(false);
    }
  };

  // ฟังก์ชันจัดการการเปลี่ยนแปลงใน AI Config
  const handleAiConfigChange = (field, value) => {
    setAiExamConfig((prev) => ({
      ...prev,
      [field]: value,
    }));

    // รีเซ็ต department และ position เมื่อเปลี่ยน company
    if (field === "company_id") {
      setAiExamConfig((prev) => ({
        ...prev,
        department_id: "",
        position_id: "",
      }));
    }
    // รีเซ็ต position เมื่อเปลี่ยน department
    else if (field === "department_id") {
      setAiExamConfig((prev) => ({
        ...prev,
        position_id: "",
      }));
    }
  };

  // ฟังก์ชันดึงแผนกตาม company ที่เลือก
  const getSelectedCompanyDepartments = () => {
    const company = configOptions.companies.find(
      (c) => c.id === aiExamConfig.company_id
    );
    return company ? company.departments : [];
  };

  // ฟังก์ชันดึงตำแหน่งตาม department ที่เลือก
  const getSelectedDepartmentPositions = () => {
    const departments = getSelectedCompanyDepartments();
    const department = departments.find(
      (d) => d.id === aiExamConfig.department_id
    );
    return department ? department.positions : [];
  };

  // Dashboard Overview Component
  const DashboardOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <BusinessIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
              <Box>
                <Typography variant="h6">บริษัท</Typography>
                <Typography variant="h4">
                  {dashboardStats.total_companies}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <QuizIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
              <Box>
                <Typography variant="h6">ข้อสอบ</Typography>
                <Typography variant="h4">
                  {dashboardStats.total_exam_templates}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <PersonIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
              <Box>
                <Typography variant="h6">ผู้สมัคร</Typography>
                <Typography variant="h4">
                  {dashboardStats.total_candidates}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Alert severity="info">
          <Typography variant="h6">ยินดีต้อนรับสู่ระบบจัดการข้อสอบ</Typography>
          <Typography>
            ใช้แท็บด้านบนเพื่อจัดการบริษัท แผนก ตำแหน่ง ข้อสอบ และผู้สมัคร
          </Typography>
        </Alert>
      </Grid>
    </Grid>
  );

  // Companies Management Component
  const CompaniesManagement = () => (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">จัดการบริษัท</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openCreateDialog("company")}
        >
          เพิ่มบริษัท
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ชื่อบริษัท</TableCell>
              <TableCell>คำอธิบาย</TableCell>
              <TableCell>วันที่สร้าง</TableCell>
              <TableCell align="center">การจัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell>{company.name}</TableCell>
                <TableCell>{company.description}</TableCell>
                <TableCell>
                  {new Date(company.created_at).toLocaleDateString("th-TH")}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={() => openEditDialog("company", company)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Exam Templates Management Component
  const ExamTemplatesManagement = () => {
    console.log("ExamTemplatesManagement rendering");
    return (
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5">จัดการข้อสอบ</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={openAiExamDialog}
              sx={{ mr: 1 }}
            >
              สร้างข้อสอบด้วย AI
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                console.log("Button clicked!");
                openCreateDialog("exam");
              }}
            >
              สร้างข้อสอบใหม่
            </Button>
          </Box>
        </Box>

        {/* Exam Templates Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ชื่อข้อสอบ</TableCell>
                <TableCell>ตำแหน่ง</TableCell>
                <TableCell>ภาษาโปรแกรม</TableCell>
                <TableCell>จำนวนคำถาม</TableCell>
                <TableCell>เวลา (นาที)</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {examTemplates.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>{exam.name}</TableCell>
                  <TableCell>
                    {exam.position ? `${exam.position.name} (${exam.position.department_name})` : '-'}
                  </TableCell>
                  <TableCell>{exam.programming_language}</TableCell>
                  <TableCell>{exam.questions_count}</TableCell>
                  <TableCell>{exam.duration_minutes}</TableCell>
                  <TableCell>
                    <Chip
                      label={exam.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      color={exam.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => openEditDialog("exam", exam)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  // Create/Edit Dialog Component
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Box sx={{ mr: 2, p: 1, bgcolor: "primary.main", borderRadius: 1 }}>
              <AddIcon sx={{ color: "white" }} />
            </Box>
            สร้างข้อสอบด้วย AI
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* บริษัท */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>บริษัท</InputLabel>
                <Select
                  value={aiExamConfig.company_id}
                  onChange={(e) =>
                    handleAiConfigChange("company_id", e.target.value)
                  }
                  label="บริษัท"
                >
                  {configOptions.companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* แผนก */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!aiExamConfig.company_id}>
                <InputLabel>แผนก</InputLabel>
                <Select
                  value={aiExamConfig.department_id}
                  onChange={(e) =>
                    handleAiConfigChange("department_id", e.target.value)
                  }
                  label="แผนก"
                >
                  {getSelectedCompanyDepartments().map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ตำแหน่ง */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!aiExamConfig.department_id}>
                <InputLabel>ตำแหน่ง</InputLabel>
                <Select
                  value={aiExamConfig.position_id}
                  onChange={(e) =>
                    handleAiConfigChange("position_id", e.target.value)
                  }
                  label="ตำแหน่ง"
                >
                  {getSelectedDepartmentPositions().map((position) => (
                    <MenuItem key={position.id} value={position.id}>
                      {position.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ภาษาโปรแกรมมิ่ง */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>ภาษาโปรแกรมมิ่ง</InputLabel>
                <Select
                  value={aiExamConfig.programming_language}
                  onChange={(e) =>
                    handleAiConfigChange("programming_language", e.target.value)
                  }
                  label="ภาษาโปรแกรมมิ่ง"
                >
                  {configOptions.programming_languages.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {lang}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ระดับ */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>ระดับ</InputLabel>
                <Select
                  value={aiExamConfig.level}
                  onChange={(e) =>
                    handleAiConfigChange("level", e.target.value)
                  }
                  label="ระดับ"
                >
                  {configOptions.levels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      <Box>
                        <Typography variant="body1">{level.label}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {level.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* จำนวนข้อสอบปรนัย */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ข้อสอบปรนัย (4 ตัวเลือก)"
                type="number"
                value={aiExamConfig.multiple_choice_count}
                onChange={(e) =>
                  handleAiConfigChange(
                    "multiple_choice_count",
                    parseInt(e.target.value)
                  )
                }
                inputProps={{ min: 1, max: 50 }}
                helperText="1-50 ข้อ"
              />
            </Grid>

            {/* จำนวนข้อสอบเขียนโปรแกรม */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ข้อสอบแก้ไข Bug / เขียนโปรแกรม"
                type="number"
                value={aiExamConfig.coding_question_count}
                onChange={(e) =>
                  handleAiConfigChange(
                    "coding_question_count",
                    parseInt(e.target.value)
                  )
                }
                inputProps={{ min: 0, max: 10 }}
                helperText="0-10 ข้อ"
              />
            </Grid>

            {/* ระยะเวลาสอบ */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>ระยะเวลาสอบ (นาที)</InputLabel>
                <Select
                  value={aiExamConfig.duration_minutes}
                  onChange={(e) =>
                    handleAiConfigChange("duration_minutes", e.target.value)
                  }
                  label="ระยะเวลาสอบ (นาที)"
                >
                  {configOptions.duration_options.map((duration) => (
                    <MenuItem key={duration} value={duration}>
                      {duration} นาที
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ข้อกำหนดเพิ่มเติม */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ข้อกำหนดเพิ่มเติม (ไม่บังคับ)"
                multiline
                rows={3}
                value={aiExamConfig.additional_requirements}
                onChange={(e) =>
                  handleAiConfigChange(
                    "additional_requirements",
                    e.target.value
                  )
                }
                placeholder="เช่น เน้นเรื่อง Database, API, Security หรือหัวข้อเฉพาะที่ต้องการ..."
                helperText="ระบุหัวข้อหรือทักษะเฉพาะที่ต้องการให้ AI สร้างข้อสอบ"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAiExamDialog} disabled={isGeneratingExam}>
            ยกเลิก
          </Button>
          <Button
            onClick={generateAiExam}
            variant="contained"
            disabled={
              isGeneratingExam ||
              !aiExamConfig.company_id ||
              !aiExamConfig.department_id ||
              !aiExamConfig.position_id ||
              !aiExamConfig.programming_language ||
              !aiExamConfig.level
            }
            startIcon={
              isGeneratingExam ? <CircularProgress size={20} /> : <AddIcon />
            }
          >
            {isGeneratingExam ? "กำลังสร้างข้อสอบ..." : "สร้างข้อสอบด้วย AI"}
          </Button>
        </DialogActions>
      </Dialog>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ชื่อข้อสอบ</TableCell>
              <TableCell>ภาษาโปรแกรม</TableCell>
              <TableCell>ระยะเวลา (นาที)</TableCell>
              <TableCell>จำนวนคำถาม</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell align="center">การจัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {examTemplates.map((exam) => (
              <TableRow key={exam.id}>
                <TableCell>{exam.name}</TableCell>
                <TableCell>
                  <Chip
                    label={exam.programming_language}
                    color="primary"
                    size="small"
                  />
                </TableCell>
                <TableCell>{exam.duration_minutes}</TableCell>
                <TableCell>{exam.questions_count}</TableCell>
                <TableCell>
                  <Chip
                    label={exam.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    color={exam.is_active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => openEditDialog("exam", exam)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Create/Edit Dialog Component
  const CreateEditDialog = () => {
    console.log(
      "CreateEditDialog rendering - openDialog:",
      openDialog,
      "dialogType:",
      dialogType
    );

    const handleInputChange = (field, value) => {
      setDialogData((prev) => ({ ...prev, [field]: value }));
    };

    const getDialogTitle = () => {
      const action = dialogData.id ? "แก้ไข" : "สร้าง";
      const type =
        {
          company: "บริษัท",
          department: "แผนก",
          position: "ตำแหน่ง",
          exam: "ข้อสอบ",
          candidate: "ผู้สมัคร",
        }[dialogType] || "";
      return `${action}${type}`;
    };

    return (
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            {dialogType === "company" && (
              <>
                <TextField
                  fullWidth
                  label="ชื่อบริษัท"
                  value={dialogData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="คำอธิบาย"
                  value={dialogData.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  margin="normal"
                  multiline
                  rows={3}
                />
                <TextField
                  fullWidth
                  label="URL โลโก้"
                  value={dialogData.logo_url || ""}
                  onChange={(e) =>
                    handleInputChange("logo_url", e.target.value)
                  }
                  margin="normal"
                />
              </>
            )}

            {dialogType === "exam" && (
              <>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="ชื่อข้อสอบ"
                      value={dialogData.name || ""}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="คำอธิบาย"
                      value={dialogData.description || ""}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      margin="normal"
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>ตำแหน่ง</InputLabel>
                      <Select
                        value={dialogData.position_id || ""}
                        onChange={(e) =>
                          handleInputChange("position_id", e.target.value)
                        }
                        label="ตำแหน่ง"
                      >
                        {positions.map((position) => (
                          <MenuItem key={position.id} value={position.id}>
                            {position.name} ({position.department_name})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="ภาษาโปรแกรม"
                      value={dialogData.programming_language || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "programming_language",
                          e.target.value
                        )
                      }
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="ระยะเวลา (นาที)"
                      type="number"
                      value={dialogData.duration_minutes || 60}
                      onChange={(e) =>
                        handleInputChange(
                          "duration_minutes",
                          parseInt(e.target.value)
                        )
                      }
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>สถานะ</InputLabel>
                      <Select
                        value={
                          dialogData.is_active !== undefined
                            ? dialogData.is_active
                            : true
                        }
                        onChange={(e) =>
                          handleInputChange("is_active", e.target.value)
                        }
                        label="สถานะ"
                      >
                        <MenuItem value={true}>เปิดใช้งาน</MenuItem>
                        <MenuItem value={false}>ปิดใช้งาน</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Question Editor Section */}
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    จัดการคำถาม
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      const newQuestion = {
                        id: Date.now(),
                        type: "multiple_choice",
                        question: "",
                        options: [
                          { id: "a", text: "" },
                          { id: "b", text: "" },
                          { id: "c", text: "" },
                          { id: "d", text: "" },
                        ],
                        correct_answer: "",
                        score: 10,
                      };
                      const questions = dialogData.questions || [];
                      handleInputChange("questions", [
                        ...questions,
                        newQuestion,
                      ]);
                    }}
                    sx={{ mb: 2 }}
                  >
                    เพิ่มคำถาม
                  </Button>

                  {(dialogData.questions || []).map((question, index) => (
                    <Paper key={question.id} sx={{ p: 2, mb: 2 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <Typography variant="subtitle1">
                          คำถามที่ {index + 1} (
                          {question.type === "multiple_choice"
                            ? "ปรนัย"
                            : "เขียนโปรแกรม"}
                          )
                        </Typography>
                        <IconButton
                          color="error"
                          onClick={() => {
                            const questions = dialogData.questions.filter(
                              (q) => q.id !== question.id
                            );
                            handleInputChange("questions", questions);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      <TextField
                        fullWidth
                        label="คำถาม"
                        value={question.question}
                        onChange={(e) => {
                          const questions = [...(dialogData.questions || [])];
                          const qIndex = questions.findIndex(
                            (q) => q.id === question.id
                          );
                          questions[qIndex] = {
                            ...questions[qIndex],
                            question: e.target.value,
                          };
                          handleInputChange("questions", questions);
                        }}
                        margin="normal"
                        multiline
                        rows={2}
                      />

                      {question.type === "multiple_choice" && (
                        <>
                          {question.options.map((option, optIndex) => (
                            <TextField
                              key={option.id}
                              fullWidth
                              label={`ตัวเลือก ${option.id.toUpperCase()}`}
                              value={option.text}
                              onChange={(e) => {
                                const questions = [
                                  ...(dialogData.questions || []),
                                ];
                                const qIndex = questions.findIndex(
                                  (q) => q.id === question.id
                                );
                                const newOptions = [
                                  ...questions[qIndex].options,
                                ];
                                newOptions[optIndex] = {
                                  ...newOptions[optIndex],
                                  text: e.target.value,
                                };
                                questions[qIndex] = {
                                  ...questions[qIndex],
                                  options: newOptions,
                                };
                                handleInputChange("questions", questions);
                              }}
                              margin="normal"
                              size="small"
                            />
                          ))}
                          <FormControl fullWidth margin="normal">
                            <InputLabel>คำตอบที่ถูกต้อง</InputLabel>
                            <Select
                              value={question.correct_answer}
                              onChange={(e) => {
                                const questions = [
                                  ...(dialogData.questions || []),
                                ];
                                const qIndex = questions.findIndex(
                                  (q) => q.id === question.id
                                );
                                questions[qIndex] = {
                                  ...questions[qIndex],
                                  correct_answer: e.target.value,
                                };
                                handleInputChange("questions", questions);
                              }}
                              label="คำตอบที่ถูกต้อง"
                            >
                              {question.options.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                  {option.id.toUpperCase()}.{" "}
                                  {option.text ||
                                    `ตัวเลือก ${option.id.toUpperCase()}`}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </>
                      )}

                      <TextField
                        fullWidth
                        label="คะแนน"
                        type="number"
                        value={question.score}
                        onChange={(e) => {
                          const questions = [...(dialogData.questions || [])];
                          const qIndex = questions.findIndex(
                            (q) => q.id === question.id
                          );
                          questions[qIndex] = {
                            ...questions[qIndex],
                            score: parseInt(e.target.value),
                          };
                          handleInputChange("questions", questions);
                        }}
                        margin="normal"
                        size="small"
                        sx={{ width: 120 }}
                      />
                    </Paper>
                  ))}
                </Box>
              </>
            )}

            {dialogType === "candidate" && (
              <>
                <TextField
                  fullWidth
                  label="ชื่อ"
                  value={dialogData.first_name || ""}
                  onChange={(e) =>
                    handleInputChange("first_name", e.target.value)
                  }
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="นามสกุล"
                  value={dialogData.last_name || ""}
                  onChange={(e) =>
                    handleInputChange("last_name", e.target.value)
                  }
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="อีเมล"
                  type="email"
                  value={dialogData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="เบอร์โทรศัพท์"
                  value={dialogData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  margin="normal"
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained">
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          <AssessmentIcon sx={{ mr: 2, verticalAlign: "middle" }} />
          ระบบจัดการข้อสอบ - Admin Dashboard
        </Typography>

        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="ภาพรวม" />
          <Tab label="บริษัท" />
          <Tab label="แผนก" />
          <Tab label="ตำแหน่ง" />
          <Tab label="ข้อสอบ" />
          <Tab label="ผู้สมัคร" />
          <Tab label="ผลการสอบ" />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <DashboardOverview />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <CompaniesManagement />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Box>
            <Typography variant="h5">จัดการแผนก</Typography>
            <Typography color="textSecondary">กำลังพัฒนา...</Typography>
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <Box>
            <Typography variant="h5">จัดการตำแหน่ง</Typography>
            <Typography color="textSecondary">กำลังพัฒนา...</Typography>
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
          <ExamTemplatesManagement />
        </TabPanel>

        <TabPanel value={currentTab} index={5}>
          <Box>
            <Typography variant="h5">จัดการผู้สมัคร</Typography>
            <Typography color="textSecondary">กำลังพัฒนา...</Typography>
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={6}>
          <Box>
            <Typography variant="h5">รายงานผลการสอบ</Typography>
            <Typography color="textSecondary">กำลังพัฒนา...</Typography>
          </Box>
        </TabPanel>
      </Paper>

      <CreateEditDialog />

      {/* AI Exam Generation Dialog */}
      <Dialog
        open={aiExamDialog}
        onClose={closeAiExamDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Box sx={{ mr: 2, p: 1, bgcolor: "primary.main", borderRadius: 1 }}>
              <AddIcon sx={{ color: "white" }} />
            </Box>
            สร้างข้อสอบด้วย AI
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* บริษัท */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>บริษัท</InputLabel>
                <Select
                  value={aiExamConfig.company_id}
                  onChange={(e) =>
                    handleAiConfigChange("company_id", e.target.value)
                  }
                  label="บริษัท"
                >
                  {configOptions.companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* แผนก */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!aiExamConfig.company_id}>
                <InputLabel>แผนก</InputLabel>
                <Select
                  value={aiExamConfig.department_id}
                  onChange={(e) =>
                    handleAiConfigChange("department_id", e.target.value)
                  }
                  label="แผนก"
                >
                  {getSelectedCompanyDepartments().map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ตำแหน่ง */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!aiExamConfig.department_id}>
                <InputLabel>ตำแหน่ง</InputLabel>
                <Select
                  value={aiExamConfig.position_id}
                  onChange={(e) =>
                    handleAiConfigChange("position_id", e.target.value)
                  }
                  label="ตำแหน่ง"
                >
                  {getSelectedDepartmentPositions().map((position) => (
                    <MenuItem key={position.id} value={position.id}>
                      {position.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ภาษาโปรแกรมมิ่ง */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>ภาษาโปรแกรมมิ่ง</InputLabel>
                <Select
                  value={aiExamConfig.programming_language}
                  onChange={(e) =>
                    handleAiConfigChange("programming_language", e.target.value)
                  }
                  label="ภาษาโปรแกรมมิ่ง"
                >
                  {configOptions.programming_languages.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {lang}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ระดับ */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>ระดับ</InputLabel>
                <Select
                  value={aiExamConfig.level}
                  onChange={(e) =>
                    handleAiConfigChange("level", e.target.value)
                  }
                  label="ระดับ"
                >
                  {configOptions.levels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      <Box>
                        <Typography variant="body1">{level.label}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {level.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* จำนวนข้อสอบปรนัย */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ข้อสอบปรนัย (4 ตัวเลือก)"
                type="number"
                value={aiExamConfig.multiple_choice_count}
                onChange={(e) =>
                  handleAiConfigChange(
                    "multiple_choice_count",
                    parseInt(e.target.value)
                  )
                }
                inputProps={{ min: 1, max: 50 }}
                helperText="1-50 ข้อ"
              />
            </Grid>

            {/* จำนวนข้อสอบเขียนโปรแกรม */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ข้อสอบแก้ไข Bug / เขียนโปรแกรม"
                type="number"
                value={aiExamConfig.coding_question_count}
                onChange={(e) =>
                  handleAiConfigChange(
                    "coding_question_count",
                    parseInt(e.target.value)
                  )
                }
                inputProps={{ min: 0, max: 10 }}
                helperText="0-10 ข้อ"
              />
            </Grid>

            {/* ระยะเวลาสอบ */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>ระยะเวลาสอบ (นาที)</InputLabel>
                <Select
                  value={aiExamConfig.duration_minutes}
                  onChange={(e) =>
                    handleAiConfigChange("duration_minutes", e.target.value)
                  }
                  label="ระยะเวลาสอบ (นาที)"
                >
                  {configOptions.duration_options.map((duration) => (
                    <MenuItem key={duration} value={duration}>
                      {duration} นาที
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ข้อกำหนดเพิ่มเติม */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ข้อกำหนดเพิ่มเติม (ไม่บังคับ)"
                multiline
                rows={3}
                value={aiExamConfig.additional_requirements}
                onChange={(e) =>
                  handleAiConfigChange(
                    "additional_requirements",
                    e.target.value
                  )
                }
                placeholder="เช่น เน้นเรื่อง Database, API, Security หรือหัวข้อเฉพาะที่ต้องการ..."
                helperText="ระบุหัวข้อหรือทักษะเฉพาะที่ต้องการให้ AI สร้างข้อสอบ"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAiExamDialog} disabled={isGeneratingExam}>
            ยกเลิก
          </Button>
          <Button
            onClick={generateAiExam}
            variant="contained"
            disabled={
              isGeneratingExam ||
              !aiExamConfig.company_id ||
              !aiExamConfig.department_id ||
              !aiExamConfig.position_id ||
              !aiExamConfig.programming_language ||
              !aiExamConfig.level
            }
          >
            {isGeneratingExam ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                กำลังสร้าง...
              </>
            ) : (
              "สร้างข้อสอบ"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;
