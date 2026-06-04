import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home";
import SelectLogin from "./pages/login";
import SelectRegister from "./pages/register";
import StudentLogin from "./pages/studentlogin";
import FacultyLogin from "./pages/facultylogin";
import StudentRegister from "./pages/student_register";
import FacultyRegister from "./pages/facultyregister";
import StudentDashboard from "./pages/student_dashboard";
import FacultyDashboard from "./pages/faculty_dashboard";
import StudentAttendance from "./pages/StudentAttendance";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/select-login" element={<SelectLogin />} />
      <Route path="/select-register" element={<SelectRegister />} />
      <Route path="/student-login" element={<StudentLogin />} />
      <Route path="/faculty-login" element={<FacultyLogin />} />
      <Route path="/student-register" element={<StudentRegister />} />
      <Route path="/faculty-register" element={<FacultyRegister />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
      <Route path="/student-dashboard/attendance" element={<StudentAttendance />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
