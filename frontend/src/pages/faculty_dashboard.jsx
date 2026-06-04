import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { facultyMenuItems } from "./faculty_menu";

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Akshaya");
  const [activeItem, setActiveItem] = useState(facultyMenuItems[0]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) {
      navigate("/select-login");
      return;
    }
    const cu = JSON.parse(stored);
    if (cu && cu.name) setUserName(cu.name);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className={`rounded-3xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl shadow-black/20 transition-all ${collapsed ? 'w-20' : 'w-72'}`}>
          <div className="mb-6 flex items-center justify-between px-2">
            {!collapsed ? (
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-orange-400">Faculty</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Dashboard</h2>
              </div>
            ) : (
              <div className="text-orange-400 font-bold">F</div>
            )}
            <button onClick={() => setCollapsed((s) => !s)} className="text-slate-400 hover:text-white">
              {collapsed ? '>' : '<'}
            </button>
          </div>

          <nav className="space-y-2 px-2">
            {facultyMenuItems.map((item) => (
              <button
                key={item}
                onClick={() => setActiveItem(item)}
                className={`flex w-full items-center rounded-2xl px-3 py-2 text-left text-sm transition ${
                  activeItem === item
                    ? "bg-orange-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}>
                <span className="w-8 text-center mr-2 text-slate-200">{item[0]}</span>
                {!collapsed && <span>{item}</span>}
              </button>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-6 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-300 transition hover:border-orange-500 hover:text-white"
          >
            Logout
          </button>
        </aside>

        <main className="flex-1 rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">Welcome back,</p>
              <h1 className="text-4xl font-bold text-white">{userName}</h1>
            </div>
            <div className="rounded-3xl bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
              <span className="font-semibold text-orange-400">{activeItem}</span> active
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <p className="text-sm text-slate-400">Courses Assigned</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">4 active courses</h2>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <p className="text-sm text-slate-400">Next Meeting</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Faculty briefing in 2 days</h2>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <h3 className="text-xl font-semibold text-white">{activeItem}</h3>
            <p className="mt-3 text-slate-400">
              This is your {activeItem.toLowerCase()} section. Use the left sidebar to switch between dashboard options.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
