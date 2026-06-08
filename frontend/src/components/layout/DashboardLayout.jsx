import React, { useState, useEffect } from "react";
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
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Bell,
  Search
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

export function DashboardLayout({ children, role = "student", activeItem, setActiveItem, userName = "User", handleLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("sidebarOpen");
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const studentLinks = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Chatbot", icon: MessageSquare },
    { name: "Attendance", icon: Calendar },
    { name: "Quizzes", icon: CheckCircle },
    { name: "Learning Resources", icon: BookOpen },
    { name: "Study Plan", icon: BookOpen },
    { name: "Recommendations", icon: Lightbulb },
    { name: "Analytics", icon: PieChart },
  ];

  const facultyLinks = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Attendance", icon: Calendar },
    { name: "Learning Materials", icon: BookOpen },
    { name: "Quizzes", icon: CheckCircle },
    { name: "Analytics", icon: PieChart },
  ];

  const links = role === "faculty" ? facultyLinks : studentLinks;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20 selection:text-primary transition-colors duration-300">

      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden md:flex flex-col h-full border-r border-slate-800 bg-sidebar shadow-lg z-20 text-slate-300"
      >
        <div className="flex items-center h-16 px-4 shrink-0 border-b border-slate-800 justify-between group">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
              K
            </div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="font-bold text-lg tracking-tight truncate whitespace-nowrap text-white"
              >
                KnowledgeX
              </motion.span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          <div className="px-3 mb-2">
            {sidebarOpen && <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Menu</p>}
          </div>
          {links.map((link) => {
            const isActive = activeItem === link.name;
            return (
              <button
                key={link.name}
                onClick={() => setActiveItem(link.name)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm group cursor-pointer",
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                )}
                title={!sidebarOpen ? link.name : undefined}
              >
                <link.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                {sidebarOpen && <span className="truncate">{link.name}</span>}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800">
          {sidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-2 mb-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{userName}</p>
                <p className="text-xs text-slate-500 capitalize">{role}</p>
              </div>
            </div>
          )}
          <Button variant="ghost" onClick={handleLogout} className={cn("w-full text-red-400 hover:bg-red-950/30 hover:text-red-300 cursor-pointer", !sidebarOpen && "justify-center px-0")}>
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3 font-medium">Log out</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-background">
        {/* Navbar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-slate-100 bg-white/90 backdrop-blur-md shadow-sm z-10 shrink-0 sticky top-0">
          {/* Left section: Hamburger for mobile + Active Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 md:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">{activeItem}</h1>
          </div>

          {/* Center/Right section: Search, Notifications, Profile Pill */}
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Search input (matches EduSmart reference) */}
            <div className="hidden sm:flex items-center relative w-60 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search for materials, topics, quizzes..."
                className="w-full bg-slate-100 border border-slate-200/50 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* Notification Bell */}
            <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 relative cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200" />

            {/* User Dropdown Profile Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <div className="flex items-center gap-2 justify-end">
                  <p className="text-sm font-bold text-foreground leading-none">{userName}</p>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                    {role}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Welcome back</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-sm border border-primary/20">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
          <motion.div
            key={activeItem}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-7xl h-full"
          >
            {children}
          </motion.div>
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-slate-800 z-50 flex flex-col md:hidden shadow-2xl text-slate-300"
            >
              <div className="flex items-center h-16 px-4 shrink-0 border-b border-slate-800 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
                    K
                  </div>
                  <span className="font-bold text-lg tracking-tight text-white">KnowledgeX</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
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
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium group text-sm cursor-pointer",
                        isActive
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <link.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
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

