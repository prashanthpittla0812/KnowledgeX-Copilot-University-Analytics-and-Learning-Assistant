import { useState, useEffect } from "react";
import { api } from "../../api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, GraduationCap, FileCheck, CheckCircle2 } from "lucide-react";

export default function DashboardTab() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get("/api/v1/admin/analytics");
      setData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading Analytics...</div>;
  if (!data) return <div>Failed to load data.</div>;

  const statusData = [
    { name: "Approved", value: data.approved_students, color: "#10b981" },
    { name: "Pending", value: data.pending_students, color: "#f59e0b" },
    { name: "Rejected", value: data.rejected_students, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={data.total_students} icon={GraduationCap} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard title="Total Faculty" value={data.total_faculty} icon={Users} color="text-purple-500" bg="bg-purple-500/10" />
        <StatCard title="Pending Approvals" value={data.pending_students} icon={CheckCircle2} color="text-amber-500" bg="bg-amber-500/10" />
        <StatCard title="Total Quizzes" value={data.total_quizzes} icon={FileCheck} color="text-emerald-500" bg="bg-emerald-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold mb-4">Student Status Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold mb-4">Platform Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Students', value: data.total_students },
                { name: 'Faculty', value: data.total_faculty },
                { name: 'Quizzes', value: data.total_quizzes },
              ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'var(--muted)', opacity: 0.4}} contentStyle={{borderRadius: '12px'}} />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-card p-6 rounded-2xl border shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
