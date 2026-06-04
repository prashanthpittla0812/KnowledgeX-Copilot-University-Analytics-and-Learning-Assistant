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
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-200 text-gray-900 p-6">

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-orange-500">
            Student Attendance
          </h1>

          <button
            onClick={() => navigate("/student-dashboard")}
            className="border border-orange-500 px-4 py-2 rounded-lg text-orange-500 hover:bg-orange-500 hover:text-white"
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
                className="bg-white/90 p-5 rounded-2xl border border-orange-100 shadow-lg shadow-orange-300/20 backdrop-blur"
              >
                <h2 className="text-xl font-semibold text-gray-900">
                  {sub.subject}
                </h2>

                <p className="text-gray-600 mt-2">
                  Present: {sub.present} / {sub.total}
                </p>

                <div className="mt-3 bg-gray-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>

                <p className="mt-2 text-sm text-orange-500">
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
