import { useNavigate } from "react-router-dom";

export default function StudentAttendance() {
  const navigate = useNavigate();

  const attendanceData = [
    { subject: "Math", present: 18, total: 20 },
    { subject: "Physics", present: 16, total: 20 },
    { subject: "CS", present: 19, total: 20 },
    { subject: "English", present: 17, total: 20 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-orange-400">
            Student Attendance
          </h1>

          <button
            onClick={() => navigate("/student-dashboard")}
            className="border border-orange-500 px-4 py-2 rounded-lg hover:bg-orange-500 hover:text-black"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Attendance Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {attendanceData.map((sub, index) => {
            const percent = ((sub.present / sub.total) * 100).toFixed(1);

            return (
              <div
                key={index}
                className="bg-slate-900 p-5 rounded-2xl border border-slate-800"
              >
                <h2 className="text-xl font-semibold text-white">
                  {sub.subject}
                </h2>

                <p className="text-slate-400 mt-2">
                  Present: {sub.present} / {sub.total}
                </p>

                <div className="mt-3 bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>

                <p className="mt-2 text-sm text-orange-400">
                  {percent}% Attendance
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}