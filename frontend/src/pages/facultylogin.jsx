import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FacultyLogin() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find((u) => u.role === "faculty" && u.id === employeeId && u.password === password);
    if (!user) {
      alert("Invalid credentials or user not registered");
      return;
    }
    localStorage.setItem("currentUser", JSON.stringify({ name: user.name, role: user.role, id: user.id }));
    navigate("/faculty-dashboard");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900/95 p-8 shadow-2xl shadow-black/20">
        <h1 className="text-3xl font-bold text-white mb-4">Faculty Login</h1>

        <input
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white mb-3 outline-none focus:border-orange-500"
          placeholder="Employee ID"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white mb-6 outline-none focus:border-orange-500"
          placeholder="Password"
        />

        <button
          onClick={handleLogin}
          className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-orange-400"
        >
          Login
        </button>

        <div className="mt-4 flex justify-between text-sm text-slate-400">
          <button onClick={() => navigate("/select-login")} className="underline hover:text-white">
            Back
          </button>
          <button onClick={() => navigate("/select-register")} className="underline hover:text-white">
            Register instead
          </button>
        </div>
      </div>
    </div>
  );
}
