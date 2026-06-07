import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, authApi } from "../api";
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
      await api.put("/auth/change-password", {
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 bg-card rounded-2xl border shadow-sm">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold">Change Password</h2>
          <p className="text-muted-foreground text-sm mt-2">
            For security reasons, you must change your temporary password before accessing the dashboard.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Password</label>
            <Input 
              type="password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter temporary password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <Input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <Input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Must match new password"
            />
          </div>
          
          <Button type="submit" className="w-full mt-6" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
          
          <div className="text-center mt-4">
            <Button variant="link" type="button" onClick={() => { authApi.logout(); navigate("/"); }}>
              Logout
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
