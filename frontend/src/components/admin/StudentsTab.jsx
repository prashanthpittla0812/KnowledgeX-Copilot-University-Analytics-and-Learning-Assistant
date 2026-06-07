import { useState, useEffect } from "react";
import { api } from "../../api";
import { Button } from "../ui/button";
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
      const url = filter === "ALL" ? "/admin/students" : `/admin/students?status=${filter}`;
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
      await api.put(`/admin/students/${id}/approve`);
      toast.success("Student approved");
      fetchStudents();
    } catch (error) {
      toast.error("Failed to approve student");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/students/${id}/reject`);
      toast.success("Student rejected");
      fetchStudents();
    } catch (error) {
      toast.error("Failed to reject student");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Registered</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">No students found.</td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium">{student.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{student.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      student.status === "APPROVED" ? "bg-green-500/10 text-green-600" :
                      student.status === "REJECTED" ? "bg-red-500/10 text-red-600" :
                      "bg-amber-500/10 text-amber-600"
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(student.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {student.status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleReject(student.id)}>
                          Reject
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(student.id)}>
                          Approve
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
