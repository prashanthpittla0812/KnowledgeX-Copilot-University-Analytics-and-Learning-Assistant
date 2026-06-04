import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
      <h1 className="text-4xl font-bold text-white mb-8">KnowledgeX Copilot</h1>
      <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900/95 p-8 text-center shadow-2xl shadow-black/20">
        <h1 className="text-4xl font-bold text-white mb-4">Welcome</h1>
        <p className="text-slate-400 mb-8">Choose Login or Register to continue.</p>

        <button
          onClick={() => navigate("/select-login")}
          className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-orange-400 mb-3"
        >
          Login
        </button>

        <button
          onClick={() => navigate("/select-register")}
          className="w-full rounded-2xl border border-orange-500 px-4 py-3 text-base font-semibold text-orange-500 transition hover:bg-orange-500 hover:text-slate-950"
        >
          Register
        </button>
      </div>
    </div>
  );
}
