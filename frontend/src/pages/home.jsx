import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { authApi } from "../api";

export default function Home() {
  const navigate = useNavigate();

  const [role, setRole] = useState(""); // "student" | "faculty" | "admin"
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const canCreateAccount = !role || role === "student";

  const handleSelect = (r) => {
    setRole(r);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!role) {
      alert("Please select a role first (Student, Faculty or Admin)");
      return;
    }
    if (!identifier.trim() || !password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      const { user } = await authApi.login({
        email: identifier.trim(),
        password,
      });

      if (!user) {
        alert("Logged in successfully, but could not retrieve user details.");
        return;
      }
      if (user.role !== role) {
        alert("Selected role does not match your account role.");
        return;
      }

      if (role === "student") navigate("/student-dashboard");
      else if (role === "faculty") navigate("/faculty-dashboard");
      else navigate("/");
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Invalid credentials or user not registered for the selected role";
      alert(message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-white via-orange-50 to-orange-200 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-orange-100 bg-white/90 p-8 shadow-2xl shadow-orange-300/30 backdrop-blur">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">KnowledgeX Copilot</h1>
          <p className="text-gray-600 mt-2">Select your role and sign in to continue.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 mb-8">
          <button
            onClick={() => handleSelect("student")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${role === "student" ? "bg-orange-600" : "bg-orange-400 hover:bg-orange-600"}`}
          >
            Student
          </button>

          <button
            onClick={() => handleSelect("faculty")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${role === "faculty" ? "bg-orange-600" : "bg-orange-400 hover:bg-orange-600"}`}
          >
            Faculty
          </button>

          <button
            onClick={() => handleSelect("admin")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${role === "admin" ? "bg-orange-600" : "bg-orange-400 hover:bg-orange-600"}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-orange-600"
          >
            Login
          </button>
        </form>

        <div className="mt-6 border-t border-gray-300 pt-5 text-center text-sm text-gray-600">
          New Student?{' '}
          <button
            type="button"
            disabled={!canCreateAccount}
            onClick={() => {
              if (canCreateAccount) navigate("/register");
            }}
            className={`font-semibold transition ${
              canCreateAccount
                ? "text-orange-500 hover:text-orange-600"
                : "cursor-not-allowed text-gray-400"
            }`}
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
