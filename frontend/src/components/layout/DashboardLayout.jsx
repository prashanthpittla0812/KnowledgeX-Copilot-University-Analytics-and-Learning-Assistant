import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  CheckCircle, 
  Calendar, 
  PieChart, 
  Settings, 
  LogOut,
  Sun,
  Moon,
  Menu,
  X
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

export function DashboardLayout({ children, role = "student", activeItem, setActiveItem, userName = "User", handleLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const studentLinks = [
    { name: "Dashboard", href: "/student-dashboard", icon: LayoutDashboard },
    { name: "Chatbot", href: "/student-dashboard/chatbot", icon: MessageSquare },
    { name: "Attendance", href: "/student-dashboard/attendance", icon: Calendar },
    { name: "Quizzes", href: "/student-dashboard/quizzes", icon: CheckCircle },
    { name: "Study Plan", href: "/student-dashboard/study-plan", icon: BookOpen },
    { name: "Analytics", href: "/student-dashboard/analytics", icon: PieChart },
  ];

  const facultyLinks = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Chatbot", icon: MessageSquare },
    { name: "Attendance", icon: Calendar },
    { name: "Quizzes", icon: CheckCircle },
    { name: "Analytics", icon: PieChart },
  ];

  const links = role === "faculty" ? facultyLinks : studentLinks;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden md:flex flex-col h-full border-r border-border bg-card shadow-sm z-20 transition-all duration-300"
      >
        <div className="flex items-center h-16 px-4 shrink-0 border-b border-border justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient flex items-center justify-center text-white font-bold shrink-0">
              K
            </div>
            {sidebarOpen && (
              <span className="font-black text-lg tracking-tight truncate whitespace-nowrap">KnowledgeX</span>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {links.map((link) => {
            const isActive = activeItem === link.name;
            return (
              <button
                key={link.name}
                onClick={() => setActiveItem(link.name)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm",
                  isActive 
                    ? "bg-primary/10 text-primary dark:bg-primary/20" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-foreground"
                )}
                title={!sidebarOpen ? link.name : undefined}
              >
                <link.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "")} />
                {sidebarOpen && <span className="truncate">{link.name}</span>}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" onClick={handleLogout} className={cn("w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30", !sidebarOpen && "justify-center px-0")}>
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3">Log out</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        {/* Navbar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-border bg-card/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="text-xl font-bold text-foreground hidden sm:block capitalize">
              {activeItem || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-foreground leading-none">{userName}</p>
                <p className="text-xs text-gray-500 mt-1 capitalize">{role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-background/50 p-4 lg:p-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 flex flex-col md:hidden shadow-2xl"
            >
              <div className="flex items-center h-16 px-4 shrink-0 border-b border-border justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient flex items-center justify-center text-white font-bold shrink-0">
                    K
                  </div>
                  <span className="font-black text-lg tracking-tight">KnowledgeX</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {links.map((link) => {
                  const isActive = activeItem === link.name;
                  return (
                    <button
                      key={link.name}
                      onClick={() => {
                        setActiveItem(link.name);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium",
                        isActive 
                          ? "bg-primary/10 text-primary dark:bg-primary/20" 
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-foreground"
                      )}
                    >
                      <link.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "")} />
                      <span>{link.name}</span>
                    </button>
                  );
                })}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
