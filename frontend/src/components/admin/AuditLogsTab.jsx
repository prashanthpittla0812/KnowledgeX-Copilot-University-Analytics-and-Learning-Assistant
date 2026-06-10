import { useState, useEffect } from "react";
import { api } from "../../api";
import { AnalyticsCard } from "../ui/analytics-card";
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Track all system activities and administrative actions.</p>
      </div>

      <AnalyticsCard
        title="Recent System Activities"
        action={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{logs.length} entries</span>
          </div>
        }
      >
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Performed By</th>
                <th className="px-6 py-4 font-semibold">Target User</th>
                <th className="px-6 py-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No audit logs found.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{log.performed_by_name}</td>
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
      </AnalyticsCard>
    </div>
  );
}
