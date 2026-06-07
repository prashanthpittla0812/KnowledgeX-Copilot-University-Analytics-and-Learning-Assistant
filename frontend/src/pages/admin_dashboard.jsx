import { useState, useEffect } from "react";
import { api, authApi } from "../api";
import { motion } from "framer-motion";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { Button } from "../components/ui/button";
import toast from "react-hot-toast";
import { 
  LogOut, 
  Users, 
  GraduationCap, 
  BarChart3, 
  History,
  LayoutDashboard
} from "lucide-react";

import DashboardTab from "../components/admin/DashboardTab";
import StudentsTab from "../components/admin/StudentsTab";
import FacultyTab from "../components/admin/FacultyTab";
import AuditLogsTab from "../components/admin/AuditLogsTab";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("knowledgex_user"));
    setCurrentUser(user);
  }, []);

  const handleLogout = () => {
    authApi.logout();
    window.location.href = "/";
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Students", icon: GraduationCap },
    { name: "Faculty", icon: Users },
    { name: "Audit Logs", icon: History },
  ];

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-64 bg-card border-r flex flex-col fixed h-full z-20"
      >
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
              K
            </div>
            <div>
              <h2 className="font-bold text-foreground">KnowledgeX</h2>
              <p className="text-xs text-muted-foreground font-medium">Admin Portal</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                activeTab === item.name
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.name ? "text-primary-foreground" : ""}`} />
              {item.name}
            </button>
          ))}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 max-w-7xl">
        <header className="flex justify-between items-center mb-8 bg-card border rounded-2xl p-4 px-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{activeTab}</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage platform settings and users.</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="text-right">
              <p className="text-sm font-semibold">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground">System Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {currentUser?.name?.charAt(0)}
            </div>
          </div>
        </header>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "Dashboard" && <DashboardTab />}
          {activeTab === "Students" && <StudentsTab />}
          {activeTab === "Faculty" && <FacultyTab />}
          {activeTab === "Audit Logs" && <AuditLogsTab />}
        </motion.div>
      </main>
    </div>
  );
}
