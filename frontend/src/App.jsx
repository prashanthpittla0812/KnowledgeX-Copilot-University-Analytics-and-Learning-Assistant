import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/home";
import Register from "./pages/register";
import StudentDashboard from "./pages/student_dashboard";
import FacultyDashboard from "./pages/faculty_dashboard";
import StudentAttendance from "./pages/StudentAttendance";
import ChangePassword from "./pages/change_password";
import AdminDashboard from "./pages/admin_dashboard";
import VerifyLoginOtp from "./pages/VerifyLoginOtp";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyResetOtp from "./pages/VerifyResetOtp";
import ResetPassword from "./pages/ResetPassword";

function ProtectedRoute({ children, allowedRoles }) {
  const userStr = localStorage.getItem("knowledgex_user");
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "student") {
      return <Navigate to="/student-dashboard" replace />;
    }
    if (user.role === "faculty") {
      return <Navigate to="/faculty-dashboard" replace />;
    }
    if (user.role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/verify-login-otp" element={<VerifyLoginOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/student-dashboard" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student-dashboard/attendance" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentAttendance />
          </ProtectedRoute>
        } />
        <Route path="/faculty-dashboard" element={
          <ProtectedRoute allowedRoles={["faculty"]}>
            <FacultyDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </>
  );
}
