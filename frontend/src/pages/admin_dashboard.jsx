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
        className="w-[280px] bg-sidebar border-r border-slate-800 flex flex-col fixed h-full z-20 text-slate-300 shadow-lg"
      >
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
              K
            </div>
            <div>
              <h2 className="font-bold text-white tracking-tight">KnowledgeX</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Admin Portal</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          <div className="px-3 mb-2">
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Admin Menu</p>
          </div>
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold cursor-pointer ${
                activeTab === item.name
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.name ? "text-white" : "text-slate-400"}`} />
              {item.name}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800">
          {currentUser && (
            <div className="flex items-center gap-3 px-3 py-2 mb-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{currentUser?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{currentUser?.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 ml-[280px] min-h-screen bg-background flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 lg:px-8 border-b border-border bg-white shadow-sm sticky top-0 z-10">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <p className="text-sm font-bold text-foreground leading-none">{currentUser?.name}</p>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">System Administrator</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-sm border border-primary/20">
              {currentUser?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 lg:p-8 custom-scrollbar">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-7xl h-full"
          >
            {activeTab === "Dashboard" && <DashboardTab />}
            {activeTab === "Students" && <StudentsTab />}
            {activeTab === "Faculty" && <FacultyTab />}
            {activeTab === "Audit Logs" && <AuditLogsTab />}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
