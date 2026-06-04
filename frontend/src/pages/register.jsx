import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      alert("Please enter name, email and password");
      return;
    }

    try {
      await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: "student",
      });
      alert("Account created successfully. Please log in.");
      navigate("/");
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create account. Please try again.";
      alert(message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-white via-orange-50 to-orange-200 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-orange-100 bg-white/90 p-8 shadow-2xl shadow-orange-300/30 backdrop-blur">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Registration</h1>
        <p className="mb-6 text-sm text-gray-600">Create your student account to continue.</p>

        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-orange-500"
            placeholder="Full Name"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-orange-500"
            placeholder="Email"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-orange-500"
            placeholder="Password"
          />

          <button
            onClick={handleRegister}
            className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-orange-600"
          >
            Register
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
