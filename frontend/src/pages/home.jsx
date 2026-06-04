import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/select-login");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900/95 p-8 shadow-2xl shadow-black/20">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">KnowledgeX Copilot</h1>
          <p className="text-slate-400 mt-2">Select your role and sign in to continue.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 mb-8">
          <button
            onClick={() => navigate("/student-login")}
            className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
          >
            Student
          </button>

          <button
            onClick={() => navigate("/faculty-login")}
            className="rounded-2xl border border-orange-500 bg-slate-950/90 px-4 py-3 text-sm font-semibold text-orange-500 transition hover:bg-orange-500 hover:text-slate-950"
          >
            Faculty
          </button>

          <button
            onClick={() => navigate("/select-login")}
            className="rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-orange-500 hover:text-orange-500"
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-orange-400"
          >
            Login
          </button>
        </form>

        <div className="mt-6 border-t border-slate-700 pt-5 text-center text-sm text-slate-400">
          New user?{' '}
          <button
            type="button"
            onClick={() => navigate("/select-register")}
            className="font-semibold text-orange-400 hover:text-orange-300"
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
