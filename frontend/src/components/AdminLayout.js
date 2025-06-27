import React from "react";
import DashboardLayout from "./DashboardLayout";

const AdminLayout = ({ children }) => {
  // Mock admin user for demo
  const adminUser = {
    first_name: "Admin",
    last_name: "User",
    role: "admin",
    email: "admin@example.com",
  };

  const handleLogout = () => {
    // Handle admin logout
    localStorage.removeItem("adminSession");
    window.location.href = "/";
  };

  return (
    <DashboardLayout user={adminUser} onLogout={handleLogout}>
      {children}
    </DashboardLayout>
  );
};

export default AdminLayout;
