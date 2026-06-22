import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api } from "../../api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AnalyticsCard } from "../ui/analytics-card";
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
      const response = await api.get("/admin/faculty");
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
      const response = await api.post("/admin/faculty", newFaculty);
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
      const response = await api.put(`/admin/faculty/${id}/reset-password`);
      toast.success(`Password reset! New password: ${response.data.new_password}`, { duration: 10000 });
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("Are you sure you want to deactivate this faculty account?")) return;
    try {
      await api.delete(`/admin/faculty/${id}`);
      toast.success("Faculty deactivated");
      fetchFaculty();
    } catch (error) {
      toast.error("Failed to deactivate faculty");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Faculty</h1>
          <p className="text-muted-foreground mt-1">Manage faculty accounts and credentials.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-orange-500/20 font-semibold"
        >
          + Add New Faculty
        </Button>
      </div>

      {/* Faculty Table */}
      <AnalyticsCard title={`Faculty Members (${faculty.length})`}>
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold text-center">Department</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
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
              ) : faculty.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No faculty found.</td></tr>
              ) : (
                faculty.map((f) => (
                  <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{f.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{f.email}</td>
                    <td className="px-6 py-4 text-muted-foreground text-center">{f.department || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        f.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                      }`}>
                        {f.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleResetPassword(f.id)}>Reset Pwd</Button>
                        {f.is_active && (
                          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={() => handleDeactivate(f.id)}>
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
      </AnalyticsCard>

      {/* Create Faculty Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[300] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-amber-400" />
            
            <h3 className="text-xl font-bold text-slate-800 mb-1 mt-2">Create Faculty Account</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Fill in the details below to create a new faculty member.</p>
            
            <form onSubmit={handleCreateFaculty} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Name</label>
                <Input required value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} className="rounded-xl border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100/50 transition-all bg-slate-50/50" placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Email</label>
                <Input type="email" required value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})} className="rounded-xl border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100/50 transition-all bg-slate-50/50" placeholder="john.doe@university.edu" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Department</label>
                <Input value={newFaculty.department} onChange={e => setNewFaculty({...newFaculty, department: e.target.value})} className="rounded-xl border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100/50 transition-all bg-slate-50/50" placeholder="Computer Science" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Designation</label>
                <Input value={newFaculty.designation} onChange={e => setNewFaculty({...newFaculty, designation: e.target.value})} className="rounded-xl border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100/50 transition-all bg-slate-50/50" placeholder="Professor" />
              </div>
              <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-slate-100">
                <Button type="button" variant="outline" className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors border-0" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 transition-all border-0">
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
