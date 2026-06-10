import { useState, useEffect } from "react";
import { api } from "../../api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, GraduationCap, FileCheck, CheckCircle2 } from "lucide-react";
import { StatCard } from "../ui/stat-card";
import { AnalyticsCard } from "../ui/analytics-card";

export default function DashboardTab() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get("/admin/analytics");
      setData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  );
  if (!data) return <div className="text-center text-muted-foreground py-12">Failed to load data.</div>;

  const statusData = [
    { name: "Approved", value: data.approved_students, color: "#10b981" },
    { name: "Pending", value: data.pending_students, color: "#f59e0b" },
    { name: "Rejected", value: data.rejected_students, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Here's your admin summary for today.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={data.total_students} icon={GraduationCap} description="Registered on platform" />
        <StatCard title="Total Faculty" value={data.total_faculty} icon={Users} description="Active faculty members" />
        <StatCard title="Pending Approvals" value={data.pending_students} icon={CheckCircle2} trend={data.pending_students > 0 ? `${data.pending_students} new` : null} trendColor="text-amber-500" description="Awaiting review" />
        <StatCard title="Total Quizzes" value={data.total_quizzes} icon={FileCheck} description="Generated across platform" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsCard title="Student Status Distribution" className="min-h-[350px]">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-muted-foreground font-medium">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Platform Overview" className="min-h-[350px]">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Students', value: data.total_students },
                { name: 'Faculty', value: data.total_faculty },
                { name: 'Quizzes', value: data.total_quizzes },
              ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" />
                <Tooltip cursor={{fill: 'var(--muted)', opacity: 0.4}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0'}} />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}
