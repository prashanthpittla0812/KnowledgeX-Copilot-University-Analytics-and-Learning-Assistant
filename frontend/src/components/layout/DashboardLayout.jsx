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
  History,
  FileText,
  Camera,
  User as UserIcon,
  Lock,
  Loader2,
  Image,
  Upload,
  Eye
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { materialApi, API_BASE_URL, api, USER_STORAGE_KEY } from "../../api";
import toast from "react-hot-toast";

export function DashboardLayout({ children, role = "student", activeItem, setActiveItem, userName = "User", handleLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("sidebarOpen");
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Profile / Settings State & Management ---
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = localStorage.getItem("knowledgex_user") || localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const displayUserName = currentUser?.name || userName;
  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL.replace("/api/v1", "")}/${path}`;
  };

  const userPhotoUrl = getPhotoUrl(currentUser?.profile_photo_path);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileName, setProfileName] = useState("");
  const [profileDept, setProfileDept] = useState("");
  const [profileDesg, setProfileDesg] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const photoMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const [viewImageOpen, setViewImageOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      toast.error("Could not access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
          handlePhotoChange({ target: { files: [file] } });
          stopCamera();
        }
      }, 'image/jpeg');
    }
  };

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || "");
      setProfileDept(currentUser.department || "");
      setProfileDesg(currentUser.designation || "");
      setPhotoPreviewUrl(getPhotoUrl(currentUser?.profile_photo_path));
    }
  }, [currentUser, settingsOpen]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(localUrl);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/auth/profile/photo", formData);
      
      const relativePath = response.data.profile_photo_path;
      
      const existingUserStr = localStorage.getItem("knowledgex_user");
      let mergedUser = {};
      if (existingUserStr) {
        mergedUser = JSON.parse(existingUserStr);
      }
      mergedUser.profile_photo_path = relativePath;
      localStorage.setItem("knowledgex_user", JSON.stringify(mergedUser));
      setCurrentUser(mergedUser);

      setPhotoPreviewUrl(getPhotoUrl(relativePath));
      toast.success("Profile photo updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload photo");
      setPhotoPreviewUrl(getPhotoUrl(currentUser?.profile_photo_path));
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await api.delete("/auth/profile/photo");
      
      const existingUserStr = localStorage.getItem("knowledgex_user");
      let mergedUser = {};
      if (existingUserStr) {
        mergedUser = JSON.parse(existingUserStr);
      }
      mergedUser.profile_photo_path = null;
      localStorage.setItem("knowledgex_user", JSON.stringify(mergedUser));
      setCurrentUser(mergedUser);
      setPhotoPreviewUrl(null);
      
      toast.success("Profile photo removed successfully!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to remove photo");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setIsSavingProfile(true);
    try {
      const response = await api.put("/auth/profile", {
        name: profileName,
        department: profileDept,
        designation: profileDesg
      });
      const updatedUser = response.data;
      
      const existingUserStr = localStorage.getItem("knowledgex_user");
      let mergedUser = updatedUser;
      if (existingUserStr) {
        mergedUser = { ...JSON.parse(existingUserStr), ...updatedUser };
      }
      localStorage.setItem("knowledgex_user", JSON.stringify(mergedUser));
      setCurrentUser(mergedUser);
      
      const curUserStr = localStorage.getItem("currentUser");
      if (curUserStr) {
        const parsed = JSON.parse(curUserStr);
        parsed.name = mergedUser.name;
        localStorage.setItem("currentUser", JSON.stringify(parsed));
      }

      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setIsSavingPassword(true);
    try {
      await api.put("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to change password");
    } finally {
      setIsSavingPassword(false);
    }
  };

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
      if (photoMenuRef.current && !photoMenuRef.current.contains(event.target)) {
        setPhotoMenuOpen(false);
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

  const deleteNotification = async (id, e) => {
    e.stopPropagation(); // Stop parent modal trigger propagation toggles
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await materialApi.deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const studentLinks = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Learning Resources", icon: BookOpen },
    { name: "Study Plan", icon: Calendar },
    { name: "Quizzes", icon: CheckCircle },
    { name: "Assessments", icon: FileText },
    { name: "Recommendations", icon: Lightbulb },
    { name: "Analytics", icon: PieChart },
  ];

  const facultyLinks = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Learning Materials", icon: BookOpen },
    { name: "Quizzes/Assessments", icon: CheckCircle },
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
      
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[5%] w-[50%] h-[50%] rounded-full bg-orange-100/50 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] rounded-full bg-orange-200/40 blur-[120px]" />
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
            "absolute top-[80px] p-1.5 rounded-md text-white hover:bg-white/10 transition-all cursor-pointer z-50",
            sidebarOpen ? "right-3" : "left-[26px]"
          )}
          title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <Menu className="w-5 h-5" />
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
            <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
              {activeItem?.startsWith("Assessment_") ? "Assessment Details" : activeItem}
            </h1>
          </div>

          {/* Center/Right Layout Section */}
          <div className="flex items-center gap-4 lg:gap-6">




            {/* 2. Notification Overlay Drawer Dropdown Node Context */}
            {false && (
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
                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-bold shrink-0 shadow-sm hover:ring-2 hover:ring-orange-500/50 transition-all cursor-pointer bg-gradient-to-br from-amber-500 to-orange-500"
              >
                {userPhotoUrl ? (
                  <img src={userPhotoUrl} alt={displayUserName} className="w-full h-full object-cover" />
                ) : (
                  displayUserName.charAt(0).toUpperCase()
                )}
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
                      <div 
                        className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          if (userPhotoUrl || photoPreviewUrl) {
                            setPhotoPreviewUrl(userPhotoUrl || photoPreviewUrl);
                            setViewImageOpen(true);
                            setProfileOpen(false);
                          }
                        }}
                      >
                        {userPhotoUrl ? (
                          <img src={userPhotoUrl} alt={displayUserName} className="w-full h-full object-cover" />
                        ) : (
                          displayUserName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-slate-900 truncate">{displayUserName}</p>
                        <p className="text-xs text-slate-500 capitalize">{role}</p>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      <Button variant="ghost" onClick={() => { setSettingsOpen(true); setProfileOpen(false); }} className="w-full text-slate-700 hover:bg-slate-50 justify-start cursor-pointer rounded-xl font-medium">
                        <Settings className="w-4 h-4 mr-3 text-slate-500" />
                        <span>Profile Settings</span>
                      </Button>
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
        <div className={cn(
          "flex-1 p-6 lg:p-8 custom-scrollbar",
          activeItem === "Chatbot" ? "overflow-hidden p-4 lg:p-4" : "overflow-y-auto"
        )}>
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

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
              className="absolute inset-0 bg-transparent"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white/95 p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.15)] border-t-4 border-t-orange-500 backdrop-blur-xl flex flex-col max-h-[90vh] overflow-hidden z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Profile Settings</h2>
                  <p className="text-xs text-slate-500">Manage your profile details and security settings</p>
                </div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs Selector */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mt-4 shrink-0">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2",
                    activeTab === "profile"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profile Info</span>
                </button>
                <button
                  onClick={() => setActiveTab("password")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2",
                    activeTab === "password"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <Lock className="w-4 h-4" />
                  <span>Change Password</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto mt-6 custom-scrollbar pr-1">
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    {/* Photo upload section */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-visible z-10">
                      {/* Decorative ambient background */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-orange-100/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none z-[-1]"></div>
                      
                      <div className="relative">
                        <div className="relative group w-24 h-24 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg ring-4 ring-orange-50 transition-all duration-300 hover:ring-orange-100">
                          {photoPreviewUrl ? (
                            <img src={photoPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            displayUserName.charAt(0).toUpperCase()
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhotoMenuOpen(!photoMenuOpen);
                            }}
                            className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center w-full h-full"
                          >
                            <Camera className="w-5 h-5 mb-0.5" />
                            <span className="text-[10px] font-semibold">Upload</span>
                          </button>
                        </div>
                        
                        {/* Hidden file input */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            handlePhotoChange(e);
                            setPhotoMenuOpen(false);
                          }}
                          className="hidden"
                          ref={fileInputRef}
                        />

                        {/* Photo Action Menu */}
                        <AnimatePresence>
                          {photoMenuOpen && (
                            <motion.div
                              ref={photoMenuRef}
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              className="absolute top-full left-0 mt-4 w-64 rounded-3xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-2xl z-[100] ring-1 ring-black/5 p-3"
                            >
                              <div className="flex flex-col space-y-2">
                                {photoPreviewUrl && (
                                  <button
                                    type="button"
                                    onClick={() => { setViewImageOpen(true); setPhotoMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm rounded-2xl transition-all cursor-pointer group"
                                  >
                                    <Eye className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                                    View image
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => { fileInputRef.current?.click(); setPhotoMenuOpen(false); }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm rounded-2xl transition-all cursor-pointer group"
                                >
                                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                                  Upload from device
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    startCamera();
                                    setPhotoMenuOpen(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm rounded-2xl transition-all cursor-pointer group"
                                >
                                  <Camera className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                                  Take picture
                                </button>
                                {photoPreviewUrl && (
                                  <button
                                    type="button"
                                    onClick={() => { handleRemovePhoto(); setPhotoMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 bg-white border border-red-100 hover:border-red-200 hover:bg-red-50 hover:shadow-sm rounded-2xl transition-all cursor-pointer group mt-2"
                                  >
                                    <Trash2 className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="text-center sm:text-left flex-1 relative z-10">
                        <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">Profile Picture</h4>
                        <p className="text-xs text-slate-500 mt-1 mb-3 max-w-sm leading-relaxed">
                          Click on the circle to upload a new profile photo. Supports PNG, JPG, or GIF up to 5MB.
                        </p>

                      </div>
                    </div>

                    {/* Profile details form */}
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Full Name</label>
                          <Input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="Enter your name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500">Email Address (Read-only)</label>
                          <Input
                            type="email"
                            value={currentUser?.email || ""}
                            disabled
                            className="bg-slate-50 text-slate-400 border-slate-200"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500">Role (Read-only)</label>
                          <Input
                            type="text"
                            value={currentUser?.role || role}
                            disabled
                            className="bg-slate-50 text-slate-400 border-slate-200 capitalize"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Department</label>
                          <Input
                            type="text"
                            value={profileDept}
                            onChange={(e) => setProfileDept(e.target.value)}
                            placeholder="e.g. Computer Science"
                          />
                        </div>
                        {(currentUser?.role === "student" || role === "student") && (
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Year</label>
                            <Input
                              type="text"
                              value={profileDesg}
                              onChange={(e) => setProfileDesg(e.target.value)}
                              placeholder="e.g. Year 2"
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          variant="gradient"
                          className="w-full sm:w-auto px-6 h-11 text-sm font-semibold cursor-pointer"
                          disabled={isSavingProfile}
                        >
                          {isSavingProfile ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            "Save Profile Details"
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === "password" && (
                  <form onSubmit={handleSavePassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Current Password</label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Must match new password"
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="gradient"
                        className="w-full sm:w-auto px-6 h-11 text-sm font-semibold cursor-pointer"
                        disabled={isSavingPassword}
                      >
                        {isSavingPassword ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          "Change Password"
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* View Image Modal */}
      <AnimatePresence>
        {viewImageOpen && photoPreviewUrl && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-3xl max-h-[90vh] flex flex-col items-center"
            >
              <button
                onClick={() => setViewImageOpen(false)}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img src={photoPreviewUrl} alt="Full size" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Camera Modal */}
      <AnimatePresence>
        {cameraOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-6 max-w-2xl w-full border border-slate-800"
            >
              <h3 className="text-white font-semibold mb-4 w-full text-left flex items-center gap-2">
                <Camera className="w-5 h-5 text-slate-400" />
                Take Picture
              </h3>
              <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex gap-4 mt-6 w-full justify-end">
                <Button variant="outline" onClick={stopCamera} className="bg-transparent text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white cursor-pointer">
                  Cancel
                </Button>
                <Button variant="gradient" onClick={capturePhoto} className="flex gap-2 cursor-pointer shadow-lg shadow-orange-500/20">
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}