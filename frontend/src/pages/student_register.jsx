import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentRegister() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    if (!name.trim() || !studentId.trim() || !password) {
      alert("Please enter name, student id and password");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    // prevent duplicate student id
    if (users.find((u) => u.id === studentId && u.role === "student")) {
      alert("Student ID already registered");
      return;
    }

    const user = { name: name.trim(), id: studentId.trim(), email: email.trim(), password, role: "student" };
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
    // set currentUser for convenience
    localStorage.setItem("currentUser", JSON.stringify({ name: user.name, role: user.role, id: user.id }));
    navigate("/student-login");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900/95 p-8 shadow-2xl shadow-black/20">
        <h1 className="text-3xl font-bold text-white mb-4">Student Register</h1>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white mb-3 outline-none focus:border-orange-500"
          placeholder="Name"
        />
        <input
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white mb-3 outline-none focus:border-orange-500"
          placeholder="Student ID"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white mb-3 outline-none focus:border-orange-500"
          placeholder="Email"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white mb-6 outline-none focus:border-orange-500"
          placeholder="Password"
        />

        <button
          onClick={handleRegister}
          className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-orange-400"
        >
          Register
        </button>

        <div className="mt-4 text-center text-sm text-slate-400">
          Already registered?
          <button onClick={() => navigate("/student-login")} className="underline hover:text-white ml-2">
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}
