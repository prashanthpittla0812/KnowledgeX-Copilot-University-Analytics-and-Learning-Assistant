import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { facultyMenuItems } from "./faculty_menu";
import { facultyApi } from "../api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { StatCard } from "../components/ui/stat-card";
import { AnalyticsCard } from "../components/ui/analytics-card";
import { ChatBubble, ChatInput } from "../components/ui/chat";
import { BookOpen, Users, AlertCircle, FileText, Send, CheckCircle, BarChart as BarChartIcon, BookMarked } from "lucide-react";
import { Button } from "../components/ui/button";
import { LearningMaterialsTab } from "../components/faculty/LearningMaterialsTab";
import { MultimodalUploadTab } from "../components/faculty/MultimodalUploadTab";

const defaultFacultyChats = [];

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const pdfInputRef = useRef(null);
  const [userName, setUserName] = useState("Faculty");
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Conduct Quizzes State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTopic, setUploadTopic] = useState("");
  const [quizTopic, setQuizTopic] = useState("");
  const [quizType, setQuizType] = useState("MCQ");
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizCount, setQuizCount] = useState(5);

  // Quiz Results State
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizPerformance, setQuizPerformance] = useState(null);

  // Analyze Results State
  const [learningGaps, setLearningGaps] = useState(null);
  const [selectedQuizGaps, setSelectedQuizGaps] = useState(null);

  // Recommendations State
  const [dashboardStats, setDashboardStats] = useState(null);

  // Attendance States
  const [attendanceData, setAttendanceData] = useState([]);
  const [studentStats, setStudentStats] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [atRiskStudents, setAtRiskStudents] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) {
      navigate("/");
      return;
    }
    const cu = JSON.parse(stored);
    if (cu && cu.name) setUserName(cu.name);
  }, [navigate]);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const res = await facultyApi.getGeneratedQuizzes();
      setQuizzes(res.data.quizzes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuizPerformance = async (quizId) => {
    try {
      setIsLoading(true);
      const [res, gapsRes] = await Promise.all([
        facultyApi.getQuizResults(quizId),
        facultyApi.getLearningGaps(quizId).catch(() => ({ data: null }))
      ]);
      setQuizPerformance(res.data);
      if (gapsRes && gapsRes.data) setSelectedQuizGaps(gapsRes.data);
      setSelectedQuiz(quizId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLearningGaps = async () => {
    try {
      setIsLoading(true);
      const res = await facultyApi.getLearningGaps();
      setLearningGaps(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const res = await facultyApi.getDashboard();
      setDashboardStats(res.data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      const [trends, riskRes] = await Promise.all([
        facultyApi.getAttendance(),
        facultyApi.getAtRiskStudents()
      ]);
      if (trends.data?.trends) {
        setAttendanceData(trends.data.trends);
      }
      if (trends.data?.summary) {
        setAttendanceSummary(trends.data.summary);
      }
      if (riskRes.data?.at_risk) {
        setStudentStats(riskRes.data.at_risk);
      }
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeItem === "Quizzes") {
      fetchQuizzes();
    } else if (activeItem === "Analytics") {
      fetchLearningGaps();
      fetchDashboardStats();
    } else if (activeItem === "Attendance") {
      fetchAttendanceData();
    }
  }, [activeItem]);

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadTopic) return alert("Provide file and topic");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      await facultyApi.uploadDocument(formData, uploadTopic);
      alert("Document uploaded!");
      setUploadFile(null);
      setUploadTopic("");
    } catch (e) {
      console.error(e);
      alert("Failed upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizTopic) return alert("Enter topic.");
    setIsGenerating(true);
    try {
      await facultyApi.generateQuiz({
        faculty_name: userName,
        topic_name: quizTopic,
        question_type: quizType,
        difficulty: quizDifficulty,
        num_questions: quizCount
      });
      alert("Quiz generated!");
      setQuizTopic("");
      fetchQuizzes();
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.detail || e.response?.data?.message || "Failed generation.";
      alert(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <DashboardLayout
      role="faculty"
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      userName={userName}
      handleLogout={handleLogout}
    >
      <div className={`h-full w-full flex flex-col ${activeItem === 'Chatbot' ? 'overflow-hidden' : ''}`}>
        
        {/* OVERVIEW DASHBOARD */}
        {activeItem === "Dashboard" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Overview</h1>
              <p className="text-muted-foreground mt-1">Here's your faculty summary for today.</p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Active Courses" value="4" icon={BookOpen} description="CS101, PHY204..." />
              <StatCard title="Total Students" value="120" icon={Users} trend="↑ 5" trendColor="text-emerald-500" description="enrolled recently" />
              <StatCard title="Generated Quizzes" value="18" icon={FileText} description="Across all courses" />
              <StatCard title="Avg Attendance" value="85%" icon={AlertCircle} trend="↓ 2%" trendColor="text-red-500" description="this week" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <AnalyticsCard title="Recent Alerts" className="min-h-[300px]">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <p className="font-bold text-destructive mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Low Attendance Alert</p>
                    <p className="text-sm text-foreground">5 students in CS101 have dropped below 75% attendance this week.</p>
                  </div>
                </div>
              </AnalyticsCard>

              <AnalyticsCard title="AI Recommendations" className="min-h-[300px]">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="font-bold text-primary mb-1">Suggest Study Plan: Data Structures</p>
                    <p className="text-sm text-foreground mb-3">Class average for Graph Theory was 65%. Would you like to generate a targeted study guide?</p>
                    <Button variant="default" size="sm" onClick={() => setActiveItem("Chatbot")}>Draft with Copilot</Button>
                  </div>
                </div>
              </AnalyticsCard>
            </div>
          </div>
        ) : activeItem === "Learning Materials" ? (
          <LearningMaterialsTab />
        ) : activeItem === "Multimodal Content" ? (
          <MultimodalUploadTab />
        ) : activeItem === "Quizzes" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!selectedQuiz ? (
              <>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight">Assessments</h1>
                    <p className="text-muted-foreground">Manage and create AI quizzes.</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 mb-8">
                  <AnalyticsCard title="1. Upload Knowledge Base">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold mb-1 block">Topic Name</label>
                        <input value={uploadTopic} onChange={e=>setUploadTopic(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g., Computer Networks Ch 1" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-1 block">Lecture PDF</label>
                        <input type="file" onChange={e=>setUploadFile(e.target.files[0])} accept=".pdf" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:text-primary file:font-semibold hover:file:bg-primary/20 cursor-pointer" />
                      </div>
                      <Button onClick={handleUploadDocument} disabled={isUploading || isGenerating} className="w-full h-11">{isUploading ? "Uploading..." : "Upload & Process PDF"}</Button>
                    </div>
                  </AnalyticsCard>

                  <AnalyticsCard title="2. Generate Assessment">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold mb-1 block">Assessment Topic</label>
                        <input value={quizTopic} onChange={e=>setQuizTopic(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g., OSI Model" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold mb-1 block">Type</label>
                          <select value={quizType} onChange={e=>setQuizType(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none">
                            <option value="MCQ">MCQ</option>
                            <option value="Theory">Theory</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold mb-1 block">Difficulty</label>
                          <select value={quizDifficulty} onChange={e=>setQuizDifficulty(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none">
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>
                      <Button onClick={handleGenerateQuiz} disabled={isLoading} className="w-full h-11" variant="secondary">{isLoading ? "Generating..." : "Generate AI Quiz"}</Button>
                    </div>
                  </AnalyticsCard>
                </div>

                <h3 className="text-xl font-bold mb-4">Generated Quizzes</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quizzes.length === 0 && <p className="text-muted-foreground">No quizzes generated yet.</p>}
                  {quizzes.map(q => (
                    <Card key={q.id} onClick={() => fetchQuizPerformance(q.id)} className="cursor-pointer hover:border-primary/50 transition-colors glass-card">
                      <CardContent className="p-6">
                        <h4 className="text-xl font-bold truncate mb-3">{q.topic_name}</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">{q.difficulty}</span>
                          <span className="px-2 py-1 rounded-md bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider">{q.question_type}</span>
                          <span className="px-2 py-1 rounded-md bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider">{q.num_questions} Qs</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Created: {new Date(q.created_at).toLocaleDateString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <Button variant="ghost" onClick={() => setSelectedQuiz(null)} className="pl-0 hover:bg-transparent hover:text-primary">← Back to Quizzes</Button>
                <h3 className="text-2xl font-bold">Quiz Performance</h3>
                {quizPerformance && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Avg Score" value={`${quizPerformance.summary?.average_score?.toFixed(1) || 0}%`} icon={BarChart} />
                    <StatCard title="High Score" value={`${quizPerformance.summary?.highest_score || 0}%`} icon={CheckCircle} trendColor="text-emerald-500" />
                    <StatCard title="Low Score" value={`${quizPerformance.summary?.lowest_score || 0}%`} icon={AlertCircle} trendColor="text-red-500" />
                    <StatCard title="Total Attempts" value={quizPerformance.summary?.total_attempts || 0} icon={Users} />
                  </div>
                )}
                {quizPerformance?.student_results?.length > 0 && (
                  <Card className="glass-card mt-8">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="p-4 font-semibold text-muted-foreground">Student Name</th>
                          <th className="p-4 font-semibold text-muted-foreground">Score</th>
                          <th className="p-4 font-semibold text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizPerformance.student_results.map((r, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-4 font-medium">{r.student_name}</td>
                            <td className="p-4 font-bold text-primary">{r.percentage}%</td>
                            <td className="p-4 text-muted-foreground">{new Date(r.submitted_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}
                
                {selectedQuizGaps && selectedQuizGaps.ai_recommendations && (
                  <Card className="glass-card mt-8 bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2 text-primary">
                        <AlertCircle className="w-5 h-5" />
                        AI Recommendations & Learning Gaps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap leading-relaxed">{selectedQuizGaps.ai_recommendations}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
              </div>
            )}
          </div>
        ) : activeItem === "Analytics" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Analytics</h1>
              <p className="text-muted-foreground">Learning gaps and topic performance.</p>
            </div>
            
            {isLoading ? <p className="text-muted-foreground">Loading Analytics...</p> : learningGaps && (
              <div className="grid lg:grid-cols-2 gap-8">
                <AnalyticsCard title="Student Performance" className="min-h-[400px]">
                  <div className="flex flex-wrap gap-2 mt-4 mb-6">
                    {learningGaps.student_performance.map((sp, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm">
                        <span className="font-semibold">{sp.student_name}</span>
                        <span className="text-primary font-black">{sp.average_score}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={learningGaps.student_performance} margin={{ bottom: 30, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="student_name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: 'var(--muted-foreground)', angle: -45, textAnchor: 'end'}} interval={0} height={60} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} domain={[0, 100]} />
                        <Tooltip cursor={{fill: 'var(--muted)', opacity: 0.4}} contentStyle={{backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)'}} />
                        <Bar dataKey="average_score" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </AnalyticsCard>
                
                <div className="space-y-6">
                  <AnalyticsCard title="Weak Topics" className="border-red-500/20 bg-red-500/5">
                    <div className="space-y-3 mt-4">
                      {learningGaps.weak_topics?.length === 0 && <p className="text-sm text-muted-foreground">No weak topics identified.</p>}
                      {learningGaps.weak_topics?.map((wt, i) => (
                        <div key={i} className="flex justify-between items-center bg-background/50 p-4 rounded-xl border border-red-500/20">
                          <span className="font-semibold">{wt.topic}</span>
                          <span className="font-black text-red-500">{wt.average_accuracy}% Accuracy</span>
                        </div>
                      ))}
                    </div>
                  </AnalyticsCard>
                  <AnalyticsCard title="Strong Topics" className="border-emerald-500/20 bg-emerald-500/5">
                    <div className="space-y-3 mt-4">
                      {learningGaps.strong_topics?.length === 0 && <p className="text-sm text-muted-foreground">No strong topics identified.</p>}
                      {learningGaps.strong_topics?.map((st, i) => (
                        <div key={i} className="flex justify-between items-center bg-background/50 p-4 rounded-xl border border-emerald-500/20">
                          <span className="font-semibold">{st.topic}</span>
                          <span className="font-black text-emerald-500">{st.average_accuracy}% Accuracy</span>
                        </div>
                      ))}
                    </div>
                  </AnalyticsCard>
                </div>
              </div>
            )}
          </div>
        ) : activeItem === "Attendance" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Attendance</h1>
              <p className="text-muted-foreground">Track participation and at-risk students.</p>
            </div>
            
            {isLoading ? <p className="text-muted-foreground">Loading Attendance...</p> : (
              <div className="space-y-8">
                {attendanceSummary && (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Today's Present" value={attendanceSummary.today_present || 0} icon={CheckCircle} trendColor="text-emerald-500" description="Present today" />
                    <StatCard title="Today's Absent" value={attendanceSummary.today_absent || 0} icon={AlertCircle} trendColor="text-red-500" description="Absent today" />
                    <StatCard title="Avg Attendance" value={`${attendanceSummary.average_attendance_percentage || 0}%`} icon={BarChartIcon} description="Class average" />
                    <StatCard title="Total Records" value={attendanceSummary.total_records || 0} icon={Users} description="Total tracked days" />
                  </div>
                )}
                
                <div className="grid lg:grid-cols-3 gap-8">
                  <AnalyticsCard title="Class Attendance Trends" className="lg:col-span-2 min-h-[400px]">
                  <div className="h-[300px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={attendanceData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} domain={[0, 100]} />
                        <Tooltip contentStyle={{backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)'}} />
                        <Line type="monotone" dataKey="present_count" stroke="var(--primary)" strokeWidth={3} dot={{fill: 'var(--primary)', strokeWidth: 2, r: 4}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </AnalyticsCard>
                
                <AnalyticsCard title="Student Attendance Records" className="border-border bg-[var(--background)]">
                  <div className="flex-1 overflow-y-auto space-y-3 mt-4 custom-scrollbar">
                    {studentStats.length === 0 && <p className="text-sm text-muted-foreground">No students found.</p>}
                    {studentStats.map((s, i) => {
                      const isRisk = s.attendance_percentage < 75;
                      return (
                      <div key={i} className={`p-4 rounded-xl border flex justify-between items-center ${isRisk ? 'border-red-500/20 bg-red-500/5' : 'border-border bg-muted/30'}`}>
                        <div>
                          <p className={`font-bold ${isRisk ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>{s.student_name}</p>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">Present: {s.present_days} | Absent: {s.absent_days}</p>
                        </div>
                        <span className={`font-black text-lg ${isRisk ? 'text-red-500' : 'text-primary'}`}>{s.attendance_percentage.toFixed(0)}%</span>
                      </div>
                    )})}
                  </div>
                </AnalyticsCard>
              </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-muted-foreground">Under Construction</h2>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
