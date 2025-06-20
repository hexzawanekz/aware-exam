import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Avatar,
  Paper,
} from "@mui/material";
import {
  AdminPanelSettings as AdminIcon,
  Quiz as ExamIcon,
  School as SchoolIcon,
} from "@mui/icons-material";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleAdminAccess = () => {
    navigate("/admin");
  };

  const handleExamAccess = () => {
    // For demo purposes, navigate to a sample exam
    navigate("/exam/sample");
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: "center", mb: 6 }}>
        <SchoolIcon sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
        <Typography variant="h2" component="h1" gutterBottom color="primary">
          ระบบสอบเข้าเพื่อสมัครงาน
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph>
          ระบบสอบออนไลน์ที่ปลอดภัยและแม่นยำ พร้อมระบบตรวจจับการโกงแบบ AI
        </Typography>
        <Typography variant="body1" color="textSecondary">
          เลือกประเภทการเข้าใช้งานระบบ
        </Typography>
      </Paper>

      <Grid container spacing={4} justifyContent="center">
        {/* Admin Dashboard Card */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={4}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              transition: "transform 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1, textAlign: "center", p: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "primary.main",
                  margin: "0 auto 20px",
                }}
              >
                <AdminIcon sx={{ fontSize: 60 }} />
              </Avatar>

              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                color="primary"
              >
                ผู้ดูแลระบบ
              </Typography>

              <Typography variant="body1" color="textSecondary" paragraph>
                เข้าสู่หน้าจัดการระบบสำหรับผู้ดูแล
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  ฟีเจอร์สำหรับผู้ดูแล:
                </Typography>
                <Typography variant="body2" color="textSecondary" align="left">
                  • จัดการบริษัท แผนก และตำแหน่งงาน
                  <br />
                  • สร้างและแก้ไขข้อสอบ
                  <br />
                  • จัดการผู้สมัครและเซสชั่นการสอบ
                  <br />
                  • ดูรายงานผลการสอบและสถิติ
                  <br />
                  • ตรวจสอบกิจกรรมน่าสงสัย
                  <br />• Import ข้อสอบจาก Google Forms
                </Typography>
              </Box>
            </CardContent>

            <CardActions sx={{ p: 3, justifyContent: "center" }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleAdminAccess}
                sx={{ px: 4, py: 1.5 }}
              >
                เข้าสู่หน้าผู้ดูแล
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Exam Interface Card */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={4}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              transition: "transform 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1, textAlign: "center", p: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "secondary.main",
                  margin: "0 auto 20px",
                }}
              >
                <ExamIcon sx={{ fontSize: 60 }} />
              </Avatar>

              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                color="secondary"
              >
                ผู้สมัครงาน
              </Typography>

              <Typography variant="body1" color="textSecondary" paragraph>
                เข้าสู่หน้าทำการสอบสำหรับผู้สมัครงาน
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  ฟีเจอร์สำหรับผู้สมัคร:
                </Typography>
                <Typography variant="body2" color="textSecondary" align="left">
                  • ระบบตรวจจับใบหน้าแบบ Real-time
                  <br />
                  • ป้องกันการโกง (Anti-Cheat)
                  <br />
                  • ข้อสอบแบบ Random Questions
                  <br />
                  • รองรับคำถามหลายประเภท
                  <br />
                  • บันทึกวิดีโอระหว่างสอบ
                  <br />• ส่งผลการสอบอัตโนมัติ
                </Typography>
              </Box>
            </CardContent>

            <CardActions sx={{ p: 3, justifyContent: "center" }}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={handleExamAccess}
                sx={{ px: 4, py: 1.5 }}
              >
                เข้าสู่หน้าทำการสอบ
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Features Section */}
      <Paper elevation={2} sx={{ mt: 6, p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom color="primary">
          คุณสมบัติเด่นของระบบ
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                🔒 ระบบรักษาความปลอดภัย
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ตรวจจับการโกงด้วย AI, Face Recognition, และ Browser Security
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                🤖 AI Automation
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ตรวจข้อสอบอัตโนมัติ, คำนวณคะแนน, และจัดอันดับผู้สมัคร
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                📊 รายงานละเอียด
              </Typography>
              <Typography variant="body2" color="textSecondary">
                สถิติการสอบ, ผลการตรวจจับการโกง, และการวิเคราะห์ผลงาน
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Footer */}
      <Box sx={{ mt: 6, textAlign: "center" }}>
        <Typography variant="body2" color="textSecondary">
          © 2024 ระบบสอบเข้าเพื่อสมัครงาน - พัฒนาด้วย React, FastAPI และ n8n
        </Typography>
      </Box>
    </Container>
  );
};

export default LandingPage;
