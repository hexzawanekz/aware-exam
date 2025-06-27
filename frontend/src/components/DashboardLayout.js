import React, { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const DashboardLayout = ({ children, user, onLogout }) => {
  const [sidebarToggle, setSidebarToggle] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = JSON.parse(localStorage.getItem("darkMode"));
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode);
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Close sidebar when clicking outside
  const handleClickOutside = () => {
    if (sidebarToggle) {
      setSidebarToggle(false);
    }
  };

  return (
    <div
      className={`${darkMode ? "dark text-bodydark bg-boxdark-2" : ""}`}
      onClick={handleClickOutside}
    >
      {/* Page Wrapper */}
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          sidebarToggle={sidebarToggle}
          setSidebarToggle={setSidebarToggle}
          user={user}
          onLogout={onLogout}
        />

        {/* Content Area */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* Header */}
          <Header
            sidebarToggle={sidebarToggle}
            setSidebarToggle={setSidebarToggle}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            user={user}
            onLogout={onLogout}
          />

          {/* Main Content */}
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
