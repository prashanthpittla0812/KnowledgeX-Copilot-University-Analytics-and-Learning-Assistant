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
  Trash2,
  GraduationCap,
  Users,
  History
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { materialApi } from "../../api";

export function DashboardLayout({ children, role = "student", activeItem, setActiveItem, userName = "User", handleLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("sidebarOpen");
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Notification Functional State Management ---
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);


  const [notifications, setNotifications] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await materialApi.getNotifications();
      setNotifications(res.data.map(n => ({
        id: n.id,
        title: n.title,
        description: n.message,
        time: new Date(n.created_at).toLocaleDateString(),
        isUnread: !n.is_read,
        link: n.link
      })));
    } catch (e) {
      console.error(e);
    }
  };

  // Compute live counter badge status
  const unreadCount = notifications.filter(n => n.isUnread).length;

  // Handle outside UI click bounds to close dropdown cleanly
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // --- Notification Action Controllers ---
  const handleNotificationClick = (item) => {
    setNotifications(prev =>
      prev.map(n => (n.id === item.id ? { ...n, isUnread: false } : n))
    );
    if (item.link) {
      setActiveItem(item.link);
      setNotificationsOpen(false);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
    try {
      await materialApi.markNotificationsRead();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation(); // Stop parent modal trigger propagation toggles
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const studentLinks = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Quizzes", icon: CheckCircle },
    { name: "Learning Resources", icon: BookOpen },
    { name: "Study Plan", icon: BookOpen },
    { name: "Recommendations", icon: Lightbulb },
    { name: "Analytics", icon: PieChart },
  ];

  const facultyLinks = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Learning Materials", icon: BookOpen },
    { name: "Quizzes", icon: CheckCircle },
    { name: "Analytics", icon: PieChart },
  ];

  const adminLinks = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Students", icon: GraduationCap },
    { name: "Faculty", icon: Users },
    { name: "Audit Logs", icon: History },
  ];

  const links = role === "admin" ? adminLinks : role === "faculty" ? facultyLinks : studentLinks;
  const motivityLogoPath = "/motivity.webp";

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#fdfaf6] selection:bg-orange-500/20 selection:text-orange-900 transition-colors duration-300">

      {/* Decorative Mesh Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-orange-400/20 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-amber-400/20 blur-[100px]" />
        <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full bg-blue-400/10 blur-[100px]" />
      </div>

      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden md:flex flex-col h-full border-r border-white/10 bg-gradient-to-b from-slate-900 via-[#0F172A] to-[#0B1329] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_10px_0_30px_rgba(0,0,0,0.5)] z-20 text-slate-300 animate-none relative backdrop-blur-xl"
      >
        {/* Brand Container with Motivity Labs Logo stacked exactly on top */}
        <div className="flex flex-col shrink-0 border-b border-slate-800 bg-[#0b1329] px-6 py-5 relative group">

          <div className="flex items-center h-10 justify-start gap-3 w-full">
            <div 
              onClick={() => !sidebarOpen && setSidebarOpen(true)}
              className={cn(
                "w-9 h-9 rounded-xl bg-[#ff9f43] flex items-center justify-center text-white font-bold shrink-0 shadow-md transition-all", 
                !sidebarOpen && "cursor-pointer hover:ring-2 hover:ring-orange-400/50 hover:scale-105"
              )}
              title={!sidebarOpen ? "Expand Sidebar" : ""}
            >
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
          </div>
        </div>

        {/* Sidebar Toggle Button (Permanently visible, aligned with MENU) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "absolute top-[80px] p-1.5 rounded-md bg-slate-300 hover:bg-white text-slate-900 transition-all cursor-pointer shadow-sm z-50",
            sidebarOpen ? "right-3" : "left-[26px]"
          )}
          title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

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
                    ? "bg-white/95 text-slate-900 shadow-[0_4px_12px_rgba(255,255,255,0.1),_inset_0_1px_0_rgba(255,255,255,1)]"
                    : "text-slate-400 hover:bg-white/10 hover:text-white shadow-[inset_0_1px_0_rgba(255,255,255,0)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                )}
                title={!sidebarOpen ? link.name : undefined}
              >
                <link.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-slate-900" : "text-slate-400 group-hover:text-white")} />
                {sidebarOpen && <span className="truncate">{link.name}</span>}
              </button>
            );
          })}
        </div>

        {/* Footer Motivity Labs Branding */}
        <div className="p-4 border-t border-white/5 flex justify-center items-center mt-auto bg-black/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {sidebarOpen ? (
            <div className="flex flex-col items-center">
               <span className="text-[10px] text-slate-500 font-semibold mb-2 uppercase tracking-widest">Powered By</span>
               <div className="bg-white rounded-full px-4 py-1.5 flex items-center justify-center shadow-sm">
                 <img src={motivityLogoPath} alt="Motivity Labs" className="h-5 w-auto object-contain" />
               </div>
            </div>
          ) : (
            <div className="flex justify-center w-full">
               <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                 <img src={motivityLogoPath} alt="Motivity Labs" className="h-4 w-auto object-contain" />
               </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main App Workspace Content */}
      <main id="main-workspace" className="flex-1 flex flex-col h-full min-w-0 bg-transparent z-10 relative">
        {/* Navbar Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-white/40 bg-white/40 backdrop-blur-2xl shadow-sm z-30 shrink-0 sticky top-0">

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




            {/* 2. Notification Overlay Drawer Dropdown Node Context */}
            {role !== "faculty" && (
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
                              onClick={() => handleNotificationClick(item)}
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
            )}

            {/* 3. User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm hover:ring-2 hover:ring-orange-500/50 transition-all cursor-pointer"
              >
                {userName.charAt(0).toUpperCase()}
              </button>
              
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden text-slate-800 z-50"
                  >
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-slate-900 truncate">{userName}</p>
                        <p className="text-xs text-slate-500 capitalize">{role}</p>
                      </div>
                    </div>
                    <div className="p-2">
                      <Button variant="ghost" onClick={handleLogout} className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 justify-start cursor-pointer rounded-xl">
                        <LogOut className="w-4 h-4 mr-3" />
                        <span className="font-semibold">Log out</span>
                      </Button>
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
                          ? "bg-white text-slate-900 shadow-md"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <link.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-slate-900" : "text-slate-400 group-hover:text-white")} />
                      <span>{link.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Footer Motivity Labs Branding */}
              <div className="p-4 border-t border-slate-800 flex justify-center items-center mt-auto">
                <div className="flex flex-col items-center">
                   <span className="text-[10px] text-slate-500 font-semibold mb-2 uppercase tracking-widest">Powered By</span>
                   <div className="bg-white rounded-full px-4 py-1.5 flex items-center justify-center shadow-sm">
                     <img src={motivityLogoPath} alt="Motivity Labs" className="h-5 w-auto object-contain" />
                   </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}