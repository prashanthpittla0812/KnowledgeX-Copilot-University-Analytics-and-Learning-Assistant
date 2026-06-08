import React, { useState, useEffect, useRef } from "react";
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
  Search,
  Check,
  Trash2
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

export function DashboardLayout({ children, role = "student", activeItem, setActiveItem, userName = "User", handleLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("sidebarOpen");
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Search and Notification Functional State Management ---
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
  
  // Initialized with realistic system updates relevant to your academic platform modules
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Learning Material",
      description: "Operating Systems Chapter 4 PDF notes uploaded.",
      time: "10m ago",
      isUnread: true,
    },
    {
      id: 2,
      title: "Upcoming Quiz Reminder",
      description: "Computer Networks Quiz is scheduled for tomorrow.",
      time: "2h ago",
      isUnread: true,
    },
    {
      id: 3,
      title: "Attendance Updated",
      description: "Your overall attendance summary metrics have been refreshed.",
      time: "1d ago",
      isUnread: false,
    },
  ]);

  // Compute live counter badge status
  const unreadCount = notifications.filter(n => n.isUnread).length;

  // Handle outside UI click bounds to close dropdown cleanly
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // --- Notification Action Controllers ---
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isUnread: false } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation(); // Stop parent modal trigger propagation toggles
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

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
  const motivityLogoPath = "/motivity.webp";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20 selection:text-primary transition-colors duration-300">

      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden md:flex flex-col h-full border-r border-slate-800 bg-sidebar shadow-lg z-20 text-slate-300 animate-none"
      >
        {/* Brand Container with Motivity Labs Logo stacked exactly on top */}
        <div className="flex flex-col shrink-0 border-b border-slate-800 bg-[#0b1329] px-6 py-5 relative group">
          
          {/* Motivity Labs Logo Container */}
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center mb-5 w-full"
            >
              <img 
                src={motivityLogoPath}
                alt="Motivity Labs" 
                className="h-12 w-auto object-contain"
              />
            </motion.div>
          )}

          {/* KnowledgeX Logo Row */}
          <div className="flex items-center h-10 justify-start gap-3 w-full">
            <div className="w-9 h-9 rounded-xl bg-[#ff9f43] flex items-center justify-center text-white font-bold shrink-0 shadow-md">
              K
            </div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="font-bold text-2xl tracking-tight truncate whitespace-nowrap text-white"
              >
                KnowledgeX
              </motion.span>
            )}
            
            {/* Sidebar Toggle Arrow Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer absolute right-3 top-4"
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Link Items */}
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

        {/* Footer Profile Status Block & Signout */}
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

      {/* Main App Workspace Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-background">
        {/* Navbar Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-slate-100 bg-white/90 backdrop-blur-md shadow-sm z-30 shrink-0 sticky top-0">
          
          {/* Left Layout Section */}
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

          {/* Center/Right Layout Section */}
          <div className="flex items-center gap-4 lg:gap-6">
            
            {/* 1. Global Context Search Engine Control Field */}
            <div className="hidden sm:flex items-center relative w-60 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for materials, topics, quizzes..."
                className="w-full bg-slate-100 border border-slate-200/50 rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 placeholder-slate-400 transition-all duration-200"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 2. Notification Overlay Drawer Dropdown Node Context */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={cn(
                  "p-2 rounded-full text-slate-600 relative transition-colors cursor-pointer",
                  notificationsOpen ? "bg-slate-100" : "hover:bg-slate-100"
                )}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-orange-500 text-[10px] font-bold text-white flex items-center justify-center px-1 border border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Overlay Popover Menu Layer */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden text-slate-800 z-50"
                  >
                    {/* Header Controls Banner */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-bold">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    {/* Messages Dynamic Listing Row */}
                    <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => markAsRead(item.id)}
                            className={cn(
                              "p-4 flex gap-3 transition-colors relative group/item cursor-pointer",
                              item.isUnread ? "bg-orange-50/30 hover:bg-orange-50/60" : "hover:bg-slate-50"
                            )}
                          >
                            {/* Visual Status Indicator Node Dot */}
                            {item.isUnread && (
                              <span className="absolute top-5 left-2 w-1.5 h-1.5 rounded-full bg-orange-500" />
                            )}
                            
                            <div className="flex-1 min-w-0 pl-1">
                              <div className="flex justify-between items-start gap-2">
                                <p className={cn("text-xs font-semibold truncate", item.isUnread ? "text-slate-900" : "text-slate-700")}>
                                  {item.title}
                                </p>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{item.time}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 leading-normal line-clamp-2">
                                {item.description}
                              </p>
                            </div>

                            {/* Clear Specific Single Event Row Control */}
                            <button
                              onClick={(e) => deleteNotification(item.id, e)}
                              className="opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-slate-200/60 text-slate-400 hover:text-red-500 transition-all self-center shrink-0 cursor-pointer"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <Bell className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">No new alerts or system messages found.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Router View Port Outlet Container Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
          <motion.div
            key={activeItem}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-7xl h-full"
          >
            {/* If there is an active search, you can choose to handle rendering an intercept layout or filter inside your view injection modules directly */}
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay Drawer Panel */}
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
              {/* Mobile Sidebar Header Layout */}
              <div className="flex flex-col shrink-0 border-b border-slate-800 bg-[#0b1329] px-6 py-5 relative">
                
                {/* Mobile Motivity Labs Brand Logo Image */}
                <div className="flex flex-col items-center justify-center mb-5 w-full">
                  <img 
                    src={motivityLogoPath}
                    alt="Motivity Labs" 
                    className="h-12 w-auto object-contain"
                  />
                </div>

                {/* Mobile Identity / Navigation Toggle Row */}
                <div className="flex items-center h-10 justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#ff9f43] flex items-center justify-center text-white font-bold shrink-0 shadow-md">
                      K
                    </div>
                    <span className="font-bold text-2xl tracking-tight text-white">KnowledgeX</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mobile Device Link Mappings */}
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