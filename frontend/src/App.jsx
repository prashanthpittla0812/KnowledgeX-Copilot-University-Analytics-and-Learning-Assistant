import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

const Home = lazy(() => import("./pages/home"));
const Register = lazy(() => import("./pages/register"));
const StudentDashboard = lazy(() => import("./pages/student_dashboard"));
const FacultyDashboard = lazy(() => import("./pages/faculty_dashboard"));
const StudentAttendance = lazy(() => import("./pages/StudentAttendance"));
const ChangePassword = lazy(() => import("./pages/change_password"));
const AdminDashboard = lazy(() => import("./pages/admin_dashboard"));
const VerifyLoginOtp = lazy(() => import("./pages/VerifyLoginOtp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyResetOtp = lazy(() => import("./pages/VerifyResetOtp"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

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
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div></div>}>
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
      </Suspense>
    </>
  );
}
