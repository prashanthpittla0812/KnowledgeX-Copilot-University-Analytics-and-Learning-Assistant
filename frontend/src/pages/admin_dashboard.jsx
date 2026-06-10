import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api";
import { DashboardLayout } from "../components/layout/DashboardLayout";

import DashboardTab from "../components/admin/DashboardTab";
import StudentsTab from "../components/admin/StudentsTab";
import FacultyTab from "../components/admin/FacultyTab";
import AuditLogsTab from "../components/admin/AuditLogsTab";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) {
      navigate("/");
      return;
    }
    const cu = JSON.parse(stored);
    if (cu?.name) setUserName(cu.name);
  }, [navigate]);

  const handleLogout = () => {
    authApi.logout();
    window.location.href = "/";
  };

  return (
    <DashboardLayout
      role="admin"
      activeItem={activeTab}
      setActiveItem={setActiveTab}
      userName={userName}
      handleLogout={handleLogout}
    >
      {activeTab === "Dashboard" && <DashboardTab />}
      {activeTab === "Students" && <StudentsTab />}
      {activeTab === "Faculty" && <FacultyTab />}
      {activeTab === "Audit Logs" && <AuditLogsTab />}
    </DashboardLayout>
  );
}
