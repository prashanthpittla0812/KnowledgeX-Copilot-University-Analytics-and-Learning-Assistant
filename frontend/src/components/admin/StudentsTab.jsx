import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Button } from "../ui/button";
import { AnalyticsCard } from "../ui/analytics-card";
import toast from "react-hot-toast";

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchStudents();
  }, [filter]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const url = filter === "ALL" ? "/api/v1/admin/students" : `/api/v1/admin/students?status=${filter}`;
      const response = await api.get(url);
      setStudents(response.data);
    } catch (error) {
      toast.error("Failed to load students.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/v1/admin/students/${id}/approve`);
      toast.success("Student approved");
      fetchStudents();
    } catch (error) {
      toast.error("Failed to approve student");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/api/v1/admin/students/${id}/reject`);
      toast.success("Student rejected");
      fetchStudents();
    } catch (error) {
      toast.error("Failed to reject student");
    }
  };

  const handleResetPassword = async (id) => {
    if (!confirm("Are you sure you want to reset this student's password?")) return;
    try {
      const response = await api.put(`/admin/students/${id}/reset-password`);
      toast.success(`Password reset! New password: ${response.data.new_password}`, { duration: 10000 });
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const handleRemove = async (id) => {
    if (!confirm("Are you sure you want to completely remove this rejected student account?")) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success("Student account removed");
      fetchStudents();
    } catch (error) {
      toast.error("Failed to remove student account");
    }
  };

  const filterButtons = ["ALL", "PENDING", "APPROVED", "REJECTED"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Students</h1>
        <p className="text-muted-foreground mt-1">Manage student registrations and approvals.</p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4">
        <div className="flex gap-2 flex-wrap">
          {filterButtons.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                filter === f
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <AnalyticsCard title={`Student Records (${students.length})`}>
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold text-center">Type</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Registered</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">No students found.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{student.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{student.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        student.email_type === "DOMAIN" ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" :
                        "bg-slate-500/10 text-slate-600 border border-slate-500/20"
                      }`}>
                        {student.email_type || "EXTERNAL"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        student.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-600" :
                        student.status === "REJECTED" ? "bg-red-500/10 text-red-600" :
                        "bg-amber-500/10 text-amber-600"
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-center">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        {student.status === "APPROVED" && (
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleResetPassword(student.id)}>
                            Reset Pwd
                          </Button>
                        )}
                        {student.status === "REJECTED" && (
                          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={() => handleRemove(student.id)}>
                            Remove
                          </Button>
                        )}
                        {student.status === "PENDING" && (
                          <>
                            <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={() => handleReject(student.id)}>
                              Reject
                            </Button>
                            <Button size="sm" className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-orange-500/20" onClick={() => handleApprove(student.id)}>
                              Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AnalyticsCard>
    </div>
  );
}
