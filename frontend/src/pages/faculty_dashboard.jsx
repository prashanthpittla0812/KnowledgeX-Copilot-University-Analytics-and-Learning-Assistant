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
import { BookOpen, Users, AlertCircle, FileText, Send } from "lucide-react";
import { Button } from "../components/ui/button";

const defaultFacultyChats = [
  { id: 1, title: "Course Syllabus AI", messages: [] },
];

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const pdfInputRef = useRef(null);
  const [userName, setUserName] = useState("Faculty");
  const [activeItem, setActiveItem] = useState(facultyMenuItems[0]);
  
  // Chatbot State
  const [chatHistoryCollapsed, setChatHistoryCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previousChats, setPreviousChats] = useState(() => {
    const stored = localStorage.getItem("facultyChats");
    return stored ? JSON.parse(stored) : defaultFacultyChats;
  });
  const [selectedChatId, setSelectedChatId] = useState(previousChats[0]?.id || null);

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

  // Recommendations State
  const [dashboardStats, setDashboardStats] = useState(null);

  // Attendance State
  const [attendanceData, setAttendanceData] = useState([]);
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

  useEffect(() => {
    if (activeItem === "Quizzes") {
      fetchQuizzes();
    } else if (activeItem === "Analytics") {
      fetchLearningGaps();
      fetchDashboardStats();
    } else if (activeItem === "Attendance") {
      fetchAttendance();
    }
  }, [activeItem]);

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
      const res = await facultyApi.getQuizResults(quizId);
      setQuizPerformance(res.data);
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

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const res1 = await facultyApi.getAttendance();
      const res2 = await facultyApi.getAtRiskStudents();
      setAttendanceData(res1.data || []);
      setAtRiskStudents(res2.data.at_risk || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadTopic) return alert("Provide file and topic");
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizTopic) return alert("Enter topic.");
    setIsLoading(true);
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
      alert("Failed generation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const handleNewChat = () => {
    const newChat = { id: Date.now(), title: "New chat", messages: [] };
    const updated = [newChat, ...previousChats];
    setPreviousChats(updated);
    setSelectedChatId(newChat.id);
    setChatInput("");
    localStorage.setItem("facultyChats", JSON.stringify(updated));
  };

  const handleSendChat = () => {
    const message = chatInput.trim();
    if (!message) return;
    setIsChatSending(true);
    const updatedChats = previousChats.map(chat => {
      if (chat.id !== selectedChatId) return chat;
      const msgs = chat.messages || [];
      return { ...chat, messages: [...msgs, { text: message, isUser: true }] };
    });
    setPreviousChats(updatedChats);
    setChatInput("");
    localStorage.setItem("facultyChats", JSON.stringify(updatedChats));
    
    // Simulate AI response
    setTimeout(() => {
      const respChats = updatedChats.map(chat => {
        if (chat.id !== selectedChatId) return chat;
        return { ...chat, messages: [...chat.messages, { text: "I'm analyzing your request. Here are some insights from the knowledge base...", isUser: false }] };
      });
      setPreviousChats(respChats);
      localStorage.setItem("facultyChats", JSON.stringify(respChats));
      setIsChatSending(false);
    }, 1000);
  };

  const handleAttachPdf = (event) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    const msg = { text: `Attached: ${file.name}`, isUser: true, fileType: "pdf" };
    const updated = previousChats.map(chat => {
      if (chat.id !== selectedChatId) return chat;
      return { ...chat, messages: [...(chat.messages || []), msg] };
    });
    setPreviousChats(updated);
    localStorage.setItem("facultyChats", JSON.stringify(updated));
  };

  const selectedChat = previousChats.find((chat) => chat.id === selectedChatId);
  const selectedMessages = selectedChat?.messages || [];

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
        ) : activeItem === "Chatbot" ? (
            <div className="grid h-[calc(100vh-160px)] gap-6 xl:grid-cols-[280px_1fr]">
              <Card className="flex flex-col hidden xl:flex glass-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Chat History</CardTitle>
                </CardHeader>
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                  <Button onClick={handleNewChat} className="w-full mb-4">New Chat</Button>
                  {previousChats.map((chat) => (
                    <button key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`w-full text-left p-3 rounded-xl text-sm transition-all ${selectedChatId === chat.id ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"}`}>
                      <span className="block font-semibold truncate">{chat.title}</span>
                      <span className={`block text-xs truncate mt-1 ${selectedChatId === chat.id ? "text-primary-foreground/80" : "opacity-70"}`}>
                        {chat.messages?.at(-1)?.text || "New chat"}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="flex flex-col overflow-hidden relative glass-card border-primary/20">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                  {selectedMessages.length > 0 ? (
                    selectedMessages.map((msg, i) => (
                      <ChatBubble key={i} message={msg.text} isUser={msg.isUser} />
                    ))
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center max-w-md mx-auto">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">KnowledgeX Copilot</h2>
                      <p className="text-muted-foreground">Upload documents, generate quizzes, or ask questions about student performance.</p>
                    </div>
                  )}
                  {isChatSending && <ChatBubble message="" isUser={false} isTyping={true} />}
                </div>
                <div className="p-4 bg-[var(--sidebar)]/80 backdrop-blur-md border-t border-[var(--border)] shrink-0">
                  <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handleAttachPdf} className="hidden" />
                  <ChatInput 
                    input={chatInput} 
                    setInput={setChatInput} 
                    onSubmit={handleSendChat} 
                    isSending={isChatSending}
                    onAttachClick={() => pdfInputRef.current?.click()}
                  />
                </div>
              </Card>
            </div>
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
                      <Button onClick={handleUploadDocument} disabled={isLoading} className="w-full h-11">{isLoading ? "Uploading..." : "Upload & Process PDF"}</Button>
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
                <AnalyticsCard title="Topic Performance" className="min-h-[400px]">
                  <div className="h-[300px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={learningGaps.topic_performance}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="topic" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} />
                        <Tooltip cursor={{fill: 'var(--muted)', opacity: 0.4}} contentStyle={{backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)'}} />
                        <Bar dataKey="average_accuracy" fill="var(--primary)" radius={[4, 4, 0, 0]} />
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
                
                <AnalyticsCard title="⚠️ At Risk Students" className="border-red-500/20 bg-red-500/5">
                  <div className="flex-1 overflow-y-auto space-y-3 mt-4 custom-scrollbar">
                    {atRiskStudents.length === 0 && <p className="text-sm text-muted-foreground">No students are currently at risk.</p>}
                    {atRiskStudents.map((s, i) => (
                      <div key={i} className="bg-background/50 p-4 rounded-xl border border-red-500/20 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-foreground">{s.student_name}</p>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">{s.email}</p>
                        </div>
                        <span className="font-black text-red-500 text-lg">{s.attendance_percentage.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </AnalyticsCard>
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
