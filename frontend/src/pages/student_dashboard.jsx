import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  "Attendance",
  "Open Chatbot",
  "Quizzes",
  "Quizzes History",
  "Studyplan",
  "Recommendations",
  "Quiz Results",
  "Analytics",
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Akshaya");
  const [activeItem, setActiveItem] = useState("Open Chatbot");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) {
      navigate("/select-login");
      return;
    }
    const cu = JSON.parse(stored);
    if (cu?.name) setUserName(cu.name);
  }, [navigate]);

  // ✅ MENU CLICK HANDLER (IMPORTANT UPDATE)
  const handleMenuClick = (item) => {
    setActiveItem(item);

    if (item === "Attendance") {
      navigate("/student-dashboard/attendance");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">

        {/* SIDEBAR */}
        <aside className={`rounded-3xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl transition-all ${collapsed ? "w-20" : "w-72"}`}>

          <div className="mb-6 flex items-center justify-between px-2">
            {!collapsed ? (
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-orange-400">
                  Student
                </p>
                <h2 className="mt-2 text-2xl font-bold">Dashboard</h2>
              </div>
            ) : (
              <div className="text-orange-400 font-bold">S</div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-white"
            >
              {collapsed ? ">" : "<"}
            </button>
          </div>

          {/* MENU */}
          <nav className="space-y-2 px-2">
            {menuItems.map((item) => (
              <button
                key={item}
                onClick={() => handleMenuClick(item)}
                className={`flex w-full items-center rounded-2xl px-3 py-2 text-left text-sm transition ${
                  activeItem === item
                    ? "bg-orange-500 text-black"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="w-8 text-center mr-2">{item[0]}</span>
                {!collapsed && <span>{item}</span>}
              </button>
            ))}
          </nav>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="mt-6 w-full rounded-2xl border border-slate-700 px-4 py-2 text-sm hover:border-orange-500 hover:text-white"
          >
            Logout
          </button>
        </aside>

        {/* MAIN */}
        <main className="flex-1 rounded-3xl border border-slate-800 bg-slate-900/95 p-8">

          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
            <div>
              <p className="text-slate-400">Welcome back</p>
              <h1 className="text-4xl font-bold">{userName}</h1>
            </div>

            <div className="bg-slate-950 px-4 py-2 rounded-2xl">
              <span className="text-orange-400 font-bold">
                {activeItem}
              </span>{" "}
              active
            </div>
          </div>

          <div className="mt-10 text-slate-400">
            Select an option from sidebar to view content
          </div>

        </main>

      </div>
    </div>
  );
}