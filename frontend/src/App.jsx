import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/home";
import Register from "./pages/register";
import StudentDashboard from "./pages/student_dashboard";
import FacultyDashboard from "./pages/faculty_dashboard";
import StudentAttendance from "./pages/StudentAttendance";
import ChangePassword from "./pages/change_password";
import AdminDashboard from "./pages/admin_dashboard";

function ProtectedRoute({ children, adminOnly = false }) {
  const userStr = localStorage.getItem("knowledgex_user");
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }
  
  if (adminOnly && user.role !== "admin") {
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
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student-dashboard/attendance" element={<StudentAttendance />} />
        <Route path="/faculty-dashboard" element={
          <ProtectedRoute>
            <FacultyDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard" element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </>
  );
}
