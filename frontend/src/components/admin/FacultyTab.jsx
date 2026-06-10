import { useState, useEffect } from "react";
import { api } from "../../api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import toast from "react-hot-toast";

export default function FacultyTab() {
  const [faculty, setFaculty] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ name: "", email: "", department: "", designation: "" });

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/v1/admin/faculty");
      setFaculty(response.data);
    } catch (error) {
      toast.error("Failed to load faculty.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/v1/admin/faculty", newFaculty);
      toast.success(`Faculty created! Temp password: ${response.data.temporary_password}`, { duration: 10000 });
      setIsModalOpen(false);
      setNewFaculty({ name: "", email: "", department: "", designation: "" });
      fetchFaculty();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create faculty");
    }
  };

  const handleResetPassword = async (id) => {
    if (!confirm("Are you sure you want to reset this faculty's password?")) return;
    try {
      const response = await api.put(`/api/v1/admin/faculty/${id}/reset-password`);
      toast.success(`Password reset! New password: ${response.data.new_password}`, { duration: 10000 });
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("Are you sure you want to deactivate this faculty account?")) return;
    try {
      await api.delete(`/api/v1/admin/faculty/${id}`);
      toast.success("Faculty deactivated");
      fetchFaculty();
    } catch (error) {
      toast.error("Failed to deactivate faculty");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
        <h2 className="font-semibold">Manage Faculty</h2>
        <Button onClick={() => setIsModalOpen(true)}>+ Add New Faculty</Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Department</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : faculty.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No faculty found.</td></tr>
            ) : (
              faculty.map((f) => (
                <tr key={f.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium">{f.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{f.email}</td>
                  <td className="px-6 py-4">{f.department || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      f.is_active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                    }`}>
                      {f.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleResetPassword(f.id)}>Reset Pwd</Button>
                      {f.is_active && (
                        <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleDeactivate(f.id)}>
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-xl border">
            <h3 className="text-lg font-bold mb-4">Create Faculty Account</h3>
            <form onSubmit={handleCreateFaculty} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input required value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" required value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input value={newFaculty.department} onChange={e => setNewFaculty({...newFaculty, department: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Designation</label>
                <Input value={newFaculty.designation} onChange={e => setNewFaculty({...newFaculty, designation: e.target.value})} />
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create Account</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
