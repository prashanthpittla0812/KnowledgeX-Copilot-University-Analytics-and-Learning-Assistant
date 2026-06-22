import { useState, useEffect } from "react";
import { api } from "../../api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, GraduationCap, FileCheck, CheckCircle2 } from "lucide-react";
import { StatCard } from "../ui/stat-card";
import { AnalyticsCard } from "../ui/analytics-card";

export default function DashboardTab() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [department, setDepartment] = useState("All Departments");
  
  const DEPARTMENTS = ["All Departments", "CSE", "DSAI"];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-4 rounded-2xl shadow-xl ring-1 ring-black/5 min-w-[120px]">
          <p className="font-bold text-slate-500 text-xs uppercase tracking-wider mb-1">{payload[0].payload.name}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.name === 'Students' ? '#4f46e5' : '#9333ea' }}></div>
            <p className="text-2xl font-black text-slate-900">
              {payload[0].value}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    fetchAnalytics();
  }, [department]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/admin/analytics${department !== "All Departments" ? `?department=${encodeURIComponent(department)}` : ""}`);
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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's your admin summary for today.</p>
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          {DEPARTMENTS.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Students" value={data.total_students} icon={GraduationCap} description="Registered on platform" colorClass="bg-gradient-to-br from-indigo-500 to-blue-600 shadow-blue-500/30" ringClass="ring-blue-50" />
        <StatCard title="Total Faculty" value={data.total_faculty} icon={Users} description="Active faculty members" colorClass="bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-pink-500/30" ringClass="ring-pink-50" />
        <StatCard title="Pending Approvals" value={data.pending_students} icon={CheckCircle2} trend={data.pending_students > 0 ? `${data.pending_students} new` : null} trendColor="text-amber-500" description="Awaiting review" colorClass="bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30" ringClass="ring-orange-50" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsCard title="Student Status Distribution" className="min-h-[280px]">
          <div className="h-[220px]">
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

        <AnalyticsCard title="Platform Overview" className="min-h-[280px]">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Students', value: data.total_students },
                { name: 'Faculty', value: data.total_faculty },
              ]} margin={{ top: 10, right: 30, left: 20, bottom: 0 }} maxBarSize={80} barSize={64}>
                <defs>
                  <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                  <linearGradient id="facultyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d946ef" />
                    <stop offset="100%" stopColor="#9333ea" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs font-semibold text-slate-500" dy={10} />
                <YAxis axisLine={false} tickLine={false} className="text-xs font-semibold text-slate-500" dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                  {[
                    { name: 'Students', value: data.total_students },
                    { name: 'Faculty', value: data.total_faculty },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "url(#studentGradient)" : "url(#facultyGradient)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}
