import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { facultyMenuItems } from "./faculty_menu";
import { facultyApi } from "../api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from "recharts";

const defaultFacultyChats = [
  { id: 1, title: "Course Syllabus AI", messages: [] },
];

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const pdfInputRef = useRef(null);
  const [userName, setUserName] = useState("Faculty");
  const [activeItem, setActiveItem] = useState(facultyMenuItems[0]);
  const [collapsed, setCollapsed] = useState(false);
  
  // Chatbot State
  const [chatHistoryCollapsed, setChatHistoryCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previousChats, setPreviousChats] = useState(() => {
    const stored = localStorage.getItem("facultyChats");
    return stored ? JSON.parse(stored) : defaultFacultyChats;
  });
  const [selectedChatId, setSelectedChatId] = useState(previousChats[0]?.id || null);

  // Global Loading State
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
    // Fetch data based on active tab
    if (activeItem === "Quiz Results") {
      fetchQuizzes();
    } else if (activeItem === "Analyze Results") {
      fetchLearningGaps();
    } else if (activeItem === "Send Recommendations") {
      fetchDashboardStats();
    } else if (activeItem === "Students Attendance") {
      fetchAttendance();
    }
  }, [activeItem]);

  // API Call Functions
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

  // Handlers for Conduct Quizzes
  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadTopic) {
      alert("Please provide a file and a topic name.");
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      await facultyApi.uploadDocument(formData, uploadTopic);
      alert("Document uploaded and chunked successfully!");
      setUploadFile(null);
      setUploadTopic("");
    } catch (e) {
      console.error(e);
      alert("Failed to upload document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizTopic) {
      alert("Please enter a topic name.");
      return;
    }
    setIsLoading(true);
    try {
      await facultyApi.generateQuiz({
        faculty_name: userName,
        topic_name: quizTopic,
        question_type: quizType,
        difficulty: quizDifficulty,
        num_questions: quizCount
      });
      alert("Quiz generated successfully!");
      setQuizTopic("");
    } catch (e) {
      console.error(e);
      alert("Failed to generate quiz.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers for Chatbot
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const handleNewChat = () => {
    const newChat = { id: Date.now(), title: "New chat", messages: [] };
    const updatedChats = [newChat, ...previousChats];
    setPreviousChats(updatedChats);
    setSelectedChatId(newChat.id);
    setChatInput("");
    localStorage.setItem("facultyChats", JSON.stringify(updatedChats));
  };

  const handleSendChat = () => {
    const message = chatInput.trim();
    if (!message) return;
    const updatedChats = previousChats.map((chat) => {
      if (chat.id !== selectedChatId) return chat;
      const messages = chat.messages || [{ text: chat.message }];
      return { ...chat, messages: [...messages, { text: message }] };
    });
    setPreviousChats(updatedChats);
    setChatInput("");
    localStorage.setItem("facultyChats", JSON.stringify(updatedChats));
  };

  const handleAttachPdf = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please select a PDF file");
      event.target.value = "";
      return;
    }
    const pdfMessage = { text: `Attached PDF: ${file.name}`, fileName: file.name, fileType: "pdf" };
    const updatedChats = previousChats.map((chat) => {
      if (chat.id !== selectedChatId) return chat;
      const messages = chat.messages || [{ text: chat.message }];
      return { ...chat, messages: [...messages, pdfMessage] };
    });
    setPreviousChats(updatedChats);
    localStorage.setItem("facultyChats", JSON.stringify(updatedChats));
    event.target.value = "";
  };

  const selectedChat = previousChats.find((chat) => chat.id === selectedChatId);
  const selectedMessages = selectedChat?.messages || (selectedChat?.message ? [{ text: selectedChat.message }] : []);

  return (
    <DashboardLayout
      role="faculty"
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      userName={userName}
      handleLogout={handleLogout}
    >
      <div className={`h-full flex flex-col ${activeItem === 'Chatbot' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        
        {/* Render Dashboard Overview or Subview */}
        {activeItem === "Dashboard" ? (
          <div className="mx-auto w-full max-w-[1400px] flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight mb-2">Welcome back, {userName}</h1>
              <p className="text-sm lg:text-base text-gray-500 font-medium">Here's your faculty overview for today.</p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl">🎓</div>
                  <h3 className="font-bold text-gray-500">Active Courses</h3>
                </div>
                <p className="text-4xl font-black text-foreground">4</p>
                <p className="text-sm font-medium text-primary mt-2">CS101, PHY204...</p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 text-xl">👥</div>
                  <h3 className="font-bold text-gray-500">Students</h3>
                </div>
                <p className="text-4xl font-black text-foreground">120</p>
                <p className="text-sm font-medium text-emerald-500 mt-2">↑ 5 enrolled recently</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm min-h-[300px]">
                <h3 className="text-xl font-bold text-foreground mb-6">Recent Alerts</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50">
                    <p className="font-bold text-red-600 dark:text-red-400 mb-1">Low Attendance Alert</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">5 students in CS101 have dropped below 75% attendance this week.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm min-h-[300px]">
                <h3 className="text-xl font-bold text-foreground mb-6">AI Recommendations</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <p className="font-bold text-primary mb-1">Suggest Study Plan: Data Structures</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Class average for Graph Theory was 65%. Would you like the AI to generate a supplementary study guide for the class?</p>
                    <button onClick={() => setActiveItem("Chatbot")} className="mt-3 text-sm font-bold text-primary hover:underline">Draft with Copilot →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeItem === "Open Chatbot" ? (
            <div className={`grid min-h-[calc(100vh-14rem)] gap-6 ${chatHistoryCollapsed ? "xl:grid-cols-[72px_1fr]" : "xl:grid-cols-[280px_1fr]"}`}>
              <section className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 transition-all">
                <div className="mb-4 flex items-center justify-between">
                  {!chatHistoryCollapsed && <h2 className="text-lg font-semibold text-gray-900">Previous Chats</h2>}
                  <button onClick={() => setChatHistoryCollapsed((value) => !value)} className="grid h-9 w-9 place-items-center rounded-full border border-orange-200 bg-white text-sm font-semibold text-orange-500 hover:border-orange-500">
                    {chatHistoryCollapsed ? ">" : "<"}
                  </button>
                </div>
                {chatHistoryCollapsed ? (
                  <button onClick={handleNewChat} className="grid h-11 w-full place-items-center rounded-2xl bg-orange-500 text-lg font-semibold text-white hover:bg-orange-600">+</button>
                ) : (
                  <>
                    <button onClick={handleNewChat} className="mb-4 w-full rounded-full bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">New Chat</button>
                    <div className="space-y-2">
                      {previousChats.map((chat) => {
                        const chatMessages = chat.messages || (chat.message ? [{ text: chat.message }] : []);
                        const lastMessage = chatMessages.at(-1)?.text || "Start a new conversation";
                        return (
                          <button key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`w-full rounded-2xl px-3 py-3 text-left text-sm transition ${selectedChatId === chat.id ? "bg-orange-500 text-white" : "bg-white text-gray-700 hover:bg-orange-100"}`}>
                            <span className="block truncate font-semibold">{chat.title}</span>
                            <span className={`mt-1 block truncate text-xs ${selectedChatId === chat.id ? "text-orange-50" : "text-gray-500"}`}>{lastMessage}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>

              <section className="flex min-h-[520px] flex-col justify-between rounded-2xl border border-orange-100 bg-white p-5">
                <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                  {selectedChat ? (
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">Current chat</p>
                      <h2 className="mt-3 text-2xl font-bold text-gray-900">{selectedChat.title}</h2>
                      {selectedMessages.length > 0 ? (
                        <div className="mt-6 space-y-3">
                          {selectedMessages.map((chatMessage, index) => (
                            <div key={index} className="ml-auto max-w-3xl rounded-2xl bg-orange-500 px-4 py-3 text-white">{chatMessage.text}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                          <h2 className="text-3xl font-semibold text-gray-900">How can KnowledgeX assist you today?</h2>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                      <h2 className="text-3xl font-semibold text-gray-900">What's on your mind today?</h2>
                    </div>
                  )}
                </div>
                <div className="mx-auto w-full max-w-4xl">
                  <div className="flex items-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-3 shadow-xl shadow-orange-100">
                    <button onClick={() => pdfInputRef.current?.click()} className="text-2xl text-gray-600 hover:text-orange-500">+</button>
                    <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" onChange={handleAttachPdf} className="hidden" />
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSendChat(); }} className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none" placeholder="Ask anything" />
                    <button onClick={handleSendChat} className="grid h-11 w-11 place-items-center rounded-full bg-black text-sm font-semibold text-white hover:bg-orange-600">Go</button>
                  </div>
                </div>
              </section>
            </div>
          ) : activeItem === "Conduct Quizzes" ? (
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="rounded-3xl border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100/50">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">1. Upload Knowledge Base</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Topic Name</label>
                    <input value={uploadTopic} onChange={e => setUploadTopic(e.target.value)} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-orange-500 outline-none" placeholder="e.g., Computer Networks Ch 1" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lecture PDF</label>
                    <input type="file" onChange={e => setUploadFile(e.target.files[0])} accept=".pdf" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-orange-700 hover:file:bg-orange-100" />
                  </div>
                  <button onClick={handleUploadDocument} disabled={isLoading} className="w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white shadow-lg hover:bg-orange-600 disabled:opacity-50">
                    {isLoading ? "Processing..." : "Upload & Process PDF"}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100/50">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">2. Generate Assessment</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Assessment Topic</label>
                    <input value={quizTopic} onChange={e => setQuizTopic(e.target.value)} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-orange-500 outline-none" placeholder="e.g., OSI Model" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Question Type</label>
                      <select value={quizType} onChange={e => setQuizType(e.target.value)} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-orange-500 outline-none">
                        <option value="MCQ">MCQ</option>
                        <option value="Theory">Theory</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Difficulty</label>
                      <select value={quizDifficulty} onChange={e => setQuizDifficulty(e.target.value)} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-orange-500 outline-none">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Questions</label>
                    <input type="number" value={quizCount} onChange={e => setQuizCount(Number(e.target.value))} min="1" max="50" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                  </div>
                  <button onClick={handleGenerateQuiz} disabled={isLoading} className="w-full rounded-2xl bg-gray-900 py-3 font-semibold text-white shadow-lg hover:bg-black disabled:opacity-50">
                    {isLoading ? "Generating..." : "Generate AI Quiz"}
                  </button>
                </div>
              </div>
            </div>
          ) : activeItem === "Quiz Results" ? (
            <div className="space-y-6">
              {!selectedQuiz ? (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Generated Assessments</h3>
                  {isLoading ? <p>Loading...</p> : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {quizzes.length === 0 && <p className="text-gray-500">No quizzes generated yet.</p>}
                      {quizzes.map(q => (
                        <div key={q.id} onClick={() => fetchQuizPerformance(q.id)} className="cursor-pointer rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all">
                          <h4 className="text-xl font-bold text-gray-900 truncate">{q.topic_name}</h4>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold uppercase">{q.difficulty}</span>
                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold uppercase">{q.question_type}</span>
                            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase">{q.num_questions} Qs</span>
                          </div>
                          <p className="mt-4 text-xs text-gray-400">Created: {new Date(q.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  <button onClick={() => setSelectedQuiz(null)} className="text-sm font-semibold text-orange-500 hover:text-orange-700">← Back to Quizzes</button>
                  <h3 className="text-2xl font-bold text-gray-900">Quiz Performance Metrics</h3>
                  {quizPerformance && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 text-center">
                        <p className="text-sm font-bold text-blue-800 uppercase tracking-wide">Avg Score</p>
                        <p className="text-4xl font-black text-blue-600 mt-2">{quizPerformance.summary?.average_score?.toFixed(1) || 0}%</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 text-center">
                        <p className="text-sm font-bold text-emerald-800 uppercase tracking-wide">High Score</p>
                        <p className="text-4xl font-black text-emerald-600 mt-2">{quizPerformance.summary?.highest_score || 0}%</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-red-50 border border-red-100 text-center">
                        <p className="text-sm font-bold text-red-800 uppercase tracking-wide">Low Score</p>
                        <p className="text-4xl font-black text-red-600 mt-2">{quizPerformance.summary?.lowest_score || 0}%</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-orange-50 border border-orange-100 text-center">
                        <p className="text-sm font-bold text-orange-800 uppercase tracking-wide">Total Attempts</p>
                        <p className="text-4xl font-black text-orange-600 mt-2">{quizPerformance.summary?.total_attempts || 0}</p>
                      </div>
                    </div>
                  )}
                  {quizPerformance && quizPerformance.student_results?.length > 0 && (
                    <div className="mt-8 rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="p-4 font-bold text-gray-700">Student Name</th>
                            <th className="p-4 font-bold text-gray-700">Score</th>
                            <th className="p-4 font-bold text-gray-700">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quizPerformance.student_results.map((r, i) => (
                            <tr key={i} className="border-b border-gray-100">
                              <td className="p-4 font-semibold text-gray-900">{r.student_name}</td>
                              <td className="p-4 font-bold text-orange-600">{r.percentage}%</td>
                              <td className="p-4 text-gray-500">{new Date(r.submitted_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeItem === "Analyze Results" ? (
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-gray-900">Learning Gap Analysis</h3>
              {isLoading ? <p>Analyzing AI Data...</p> : learningGaps && (
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h4 className="text-lg font-bold text-gray-900 mb-6">Topic Performance</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={learningGaps.topic_performance}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="topic" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                          <Tooltip cursor={{fill: '#fff7ed'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Bar dataKey="average_accuracy" fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-red-100 bg-red-50 p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-red-900 mb-4">Critical Weak Topics</h4>
                      <div className="space-y-3">
                        {learningGaps.weak_topics?.length === 0 && <p className="text-sm text-red-600">No weak topics identified.</p>}
                        {learningGaps.weak_topics?.map((wt, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-red-100">
                            <span className="font-semibold text-gray-900">{wt.topic}</span>
                            <span className="font-black text-red-600">{wt.average_accuracy}% Accuracy</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-emerald-900 mb-4">Strong Topics</h4>
                      <div className="space-y-3">
                        {learningGaps.strong_topics?.length === 0 && <p className="text-sm text-emerald-600">No strong topics identified.</p>}
                        {learningGaps.strong_topics?.map((st, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-emerald-100">
                            <span className="font-semibold text-gray-900">{st.topic}</span>
                            <span className="font-black text-emerald-600">{st.average_accuracy}% Accuracy</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeItem === "Send Recommendations" ? (
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">AI-Powered Teaching Insights</h3>
              {isLoading ? <p>Generating Insights...</p> : (
                <div className="grid gap-6">
                  <div className="rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 p-8 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white text-xl font-bold shrink-0">✨</div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Class Performance Insight</h4>
                        <p className="mt-2 text-gray-700 leading-relaxed font-medium">Based on recent quizzes, students are struggling with the OSI Model, specifically the Network Layer. We recommend dedicating the next lecture to practical routing examples or generating a targeted supplementary quiz.</p>
                        <button className="mt-4 rounded-full bg-gray-900 px-6 py-2 text-sm font-semibold text-white hover:bg-black transition-colors">Send Study Plan to Class</button>
                      </div>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-6">
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center">
                      <p className="text-sm text-gray-500 font-semibold uppercase">Avg Attendance</p>
                      <p className="text-3xl font-black text-gray-900 mt-2">{dashboardStats?.attendance_rate || 85}%</p>
                    </div>
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center">
                      <p className="text-sm text-gray-500 font-semibold uppercase">Total Assessments</p>
                      <p className="text-3xl font-black text-gray-900 mt-2">{dashboardStats?.total_quizzes || 0}</p>
                    </div>
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center">
                      <p className="text-sm text-gray-500 font-semibold uppercase">Active Students</p>
                      <p className="text-3xl font-black text-gray-900 mt-2">{dashboardStats?.active_students || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeItem === "Students Attendance" ? (
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-gray-900">Attendance Analytics</h3>
              {isLoading ? <p>Loading Attendance...</p> : (
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h4 className="text-lg font-bold text-gray-900 mb-6">Class Attendance Trends</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={attendanceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} domain={[0, 100]} />
                          <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Line type="monotone" dataKey="present_count" stroke="#f97316" strokeWidth={4} dot={{fill: '#f97316', strokeWidth: 2, r: 4}} activeDot={{r: 8}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-red-100 bg-red-50 p-6 shadow-sm flex flex-col">
                    <h4 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">⚠️ At Risk Students</h4>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                      {atRiskStudents.length === 0 && <p className="text-sm text-red-600 font-medium">No students are currently at risk.</p>}
                      {atRiskStudents.map((s, i) => (
                        <div key={i} className="bg-white p-4 rounded-2xl border border-red-100 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-bold text-gray-900">{s.student_name}</p>
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">{s.email}</p>
                          </div>
                          <span className="font-black text-red-600 text-lg">{s.attendance_percentage.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-gray-300 bg-white p-6">
              <h3 className="text-xl font-semibold text-gray-900">{activeItem}</h3>
              <p className="mt-3 text-gray-600">
                This section is under construction.
              </p>
            </div>
          )}
      </div>
    </DashboardLayout>
  );
}
