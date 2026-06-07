import { useState, useEffect } from "react";
import { api } from "../../api";
import toast from "react-hot-toast";
import { Clock } from "lucide-react";

export default function AuditLogsTab() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/admin/audit-logs");
      setLogs(response.data);
    } catch (error) {
      toast.error("Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent System Activities
          </h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Action</th>
              <th className="px-6 py-4 font-semibold">Performed By</th>
              <th className="px-6 py-4 font-semibold">Target User</th>
              <th className="px-6 py-4 font-semibold text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No audit logs found.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium font-mono text-xs">{log.action}</td>
                  <td className="px-6 py-4">{log.performed_by_name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{log.target_user_name || "-"}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
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
