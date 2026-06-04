import { useNavigate } from "react-router-dom";

export default function SelectRegister() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900/95 p-8 text-center shadow-2xl shadow-black/20">
        <h1 className="text-3xl font-bold text-white mb-4">Register As</h1>
        <p className="text-slate-400 mb-6">Choose the role you want to register as.</p>

        <button
          onClick={() => navigate("/student-register")}
          className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-orange-400 mb-3"
        >
          Student
        </button>

        <button
          onClick={() => navigate("/faculty-register")}
          className="w-full rounded-2xl border border-orange-500 px-4 py-3 text-base font-semibold text-orange-500 transition hover:bg-orange-500 hover:text-slate-950"
        >
          Faculty
        </button>

        <button
          onClick={() => navigate("/")}
          className="mt-6 inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white"
        >
          Back to Welcome
        </button>
      </div>
    </div>
  );
}
