import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, authApi } from "../services/api";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import toast from "react-hot-toast";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await api.put("/api/v1/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      
      toast.success("Password changed successfully!");
      
      // Update local storage user object
      const userStr = localStorage.getItem("knowledgex_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user.must_change_password = false;
        localStorage.setItem("knowledgex_user", JSON.stringify(user));
        
        // Navigate to appropriate dashboard
        if (user.role === "faculty") navigate("/faculty-dashboard");
        else if (user.role === "admin") navigate("/admin-dashboard");
        else if (user.role === "student") navigate("/student-dashboard");
        else navigate("/");
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to change password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background overflow-hidden p-4">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full bg-primary/20 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.3, 0.4, 0.3]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-orange-500/20 blur-[100px]"
        />
      </div>

      {/* Centered Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="mx-auto flex w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 items-center justify-center text-white font-black text-3xl shadow-2xl shadow-orange-500/30 mb-6"
          >
            K
          </motion.div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs mb-4 border border-primary/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" /> 
            Security Verification
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">Change Password</h1>
          <p className="text-gray-500 font-medium mt-2">Update your temporary credentials to continue</p>
        </div>

        <div className="rounded-[2rem] border border-white/20 bg-white/70 p-6 sm:p-10 shadow-2xl shadow-black/5 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Temporary Password</label>
              <Input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter temporary password"
                className="h-12 bg-white/50 border-gray-200 focus:bg-white"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">New Password</label>
              <Input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="h-12 bg-white/50 border-gray-200 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Confirm New Password</label>
              <Input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Must match new password"
                className="h-12 bg-white/50 border-gray-200 focus:bg-white"
              />
            </div>
            
            <Button 
              type="submit" 
              variant="gradient" 
              className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 mt-4 group cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Password"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
            
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => { authApi.logout(); navigate("/"); }}
                className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Logout & Go Back
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
