import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatbotApi, documentApi, studentApi } from "../api";
import { DashboardLayout } from "../components/layout/DashboardLayout";

const menuItems = [
  "Attendance",
  "Chatbot",
  "Quizzes",
  "Quizzes History",
  "Studyplan",
  "Recommendations",
  "Quiz Results",
  "Analytics",
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const pdfInputRef = useRef(null);
  const [userName, setUserName] = useState("Akshaya");
  const [studentId, setStudentId] = useState(null);
  const [activeItem, setActiveItem] = useState("Chatbot");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [chatHistoryCollapsed, setChatHistoryCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  
  // Chatbot State
  const [previousChats, setPreviousChats] = useState(() => {
    let userId = "default";
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try { userId = JSON.parse(storedUser).id; } catch (e) {}
    }
    const stored = localStorage.getItem(`studentChats_${userId}`);
    return stored ? JSON.parse(stored) : [
      { id: 1, title: "Math revision plan", messages: [{ text: "Help me revise calculus before quiz.", sender: "user" }] },
      { id: 2, title: "Physics doubts", messages: [{ text: "Explain Newton's laws with examples.", sender: "user" }] },
      { id: 3, title: "Study timetable", messages: [{ text: "Make a weekly study timetable.", sender: "user" }] },
    ];
  });
  const [selectedChatId, setSelectedChatId] = useState(previousChats[0]?.id || null);

  // Quiz States
  const [quizTopic, setQuizTopic] = useState("");
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizNumQuestions, setQuizNumQuestions] = useState(5);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Studyplan States
  const [studySubjects, setStudySubjects] = useState("");
  const [studyExamDate, setStudyExamDate] = useState("");
  const [studyDailyHours, setStudyDailyHours] = useState(2);
  const [studyPlans, setStudyPlans] = useState([]);
  const [activeStudyPlan, setActiveStudyPlan] = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Recommendations States
  const [recommendations, setRecommendations] = useState(null);
  const [recommendationHistory, setRecommendationHistory] = useState([]);
  const [isRecsLoading, setIsRecsLoading] = useState(false);

  // Analytics States
  const [analytics, setAnalytics] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  // Attendance State
  const [attendanceData] = useState([
    { subject: "Math", present: 18, total: 20, icon: "📐", color: "from-blue-500 to-cyan-400" },
    { subject: "Physics", present: 16, total: 20, icon: "⚛️", color: "from-purple-500 to-pink-500" },
    { subject: "CS", present: 19, total: 20, icon: "💻", color: "from-orange-500 to-red-500" },
    { subject: "English", present: 17, total: 20, icon: "📚", color: "from-emerald-400 to-teal-500" },
  ]);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) {
      navigate("/");
      return;
    }
    const cu = JSON.parse(stored);
    if (cu?.name) setUserName(cu.name);
    if (cu?.id) setStudentId(cu.id);
  }, [navigate]);

  const handleMenuClick = (item) => {
    setActiveItem(item);
    if (item === "Quizzes History") fetchQuizHistory();
    else if (item === "Studyplan") fetchStudyPlans();
    else if (item === "Recommendations") fetchRecommendations();
    else if (item === "Analytics") fetchAnalytics();
  };

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
    localStorage.setItem(`studentChats_${studentId || "default"}`, JSON.stringify(updatedChats));
  };

  const handleSendChat = async () => {
    const message = chatInput.trim();
    if ((!message && !attachedFile) || isLoading) return;
    
    let currentChats = [...previousChats];
    setIsLoading(true);
    
    try {
      if (attachedFile) {
        await documentApi.uploadPdf(attachedFile);
        currentChats = currentChats.map((chat) => {
          if (chat.id !== selectedChatId) return chat;
          return { ...chat, messages: [...(chat.messages||[]), { text: `📄 Uploaded PDF: ${attachedFile.name}`, sender: "system" }] };
        });
        setAttachedFile(null);
      }
      
      if (message) {
        currentChats = currentChats.map((chat) => {
          if (chat.id !== selectedChatId) return chat;
          const messages = chat.messages || [];
          return { ...chat, title: messages.length === 0 ? (message.length > 34 ? message.slice(0, 34) + "..." : message) : chat.title, messages: [...messages, { text: message, sender: "user" }] };
        });
      }
      
      setPreviousChats(currentChats);
      setChatInput("");
      
      if (message) {
        const response = await chatbotApi.askQuestion(message);
        currentChats = currentChats.map((chat) => {
          if (chat.id !== selectedChatId) return chat;
          return { ...chat, messages: [...(chat.messages || []), { text: response.answer || response.data?.answer || "Sorry, I could not process that.", sender: "bot" }] };
        });
        setPreviousChats(currentChats);
      }
      
      localStorage.setItem(`studentChats_${studentId || "default"}`, JSON.stringify(currentChats));
    } catch (error) {
      alert("Failed to process request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttachPdf = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { alert("Select a PDF"); return; }
    setAttachedFile(file);
    event.target.value = "";
  };

  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) { alert("Enter a topic"); return; }
    setIsLoading(true);
    try {
      const response = await studentApi.generateQuiz({ topic: quizTopic, difficulty: quizDifficulty, number_of_questions: quizNumQuestions });
      setActiveQuiz({ id: response.data.quiz_id, topic: response.data.topic, difficulty: response.data.difficulty, questions: response.data.quiz });
      setSelectedAnswers({});
    } catch (error) {
      alert("Failed to generate quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    const numQ = activeQuiz.questions.length;
    const ansArray = [];
    for (let i = 0; i < numQ; i++) {
      if (!selectedAnswers[i]) { alert(`Answer Question ${i + 1}`); return; }
      ansArray.push(selectedAnswers[i]);
    }
    setIsLoading(true);
    try {
      const response = await studentApi.submitQuiz({ quiz_id: activeQuiz.id, answers: ansArray });
      setQuizResult({ ...response.data, questions: activeQuiz.questions, selectedAnswers: ansArray });
      setActiveQuiz(null);
      setActiveItem("Quiz Results");
    } catch (error) {
      alert("Failed to submit quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuizHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const response = await studentApi.getQuizHistory();
      setQuizHistory(response.data);
    } catch (error) {} finally { setIsHistoryLoading(false); }
  };

  const fetchStudyPlans = async () => {
    setIsGeneratingPlan(true);
    try {
      const response = await studentApi.getStudyPlanHistory();
      setStudyPlans(response.data);
    } catch (error) {} finally { setIsGeneratingPlan(false); }
  };

  const handleGenerateStudyPlan = async () => {
    if (!studySubjects || !studyExamDate) { alert("Fill all fields"); return; }
    setIsGeneratingPlan(true);
    try {
      const response = await studentApi.generateStudyPlan({ subjects: studySubjects.split(",").map(s => s.trim()), exam_date: studyExamDate, daily_hours: Number(studyDailyHours) });
      setActiveStudyPlan(typeof response.data.plan_content === "string" ? JSON.parse(response.data.plan_content) : response.data.plan_content);
      fetchStudyPlans();
    } catch (error) {
      alert("Failed to generate study plan");
    } finally { setIsGeneratingPlan(false); }
  };

  const fetchRecommendations = async () => {
    if (!studentId) return;
    setIsRecsLoading(true);
    try {
      const r1 = await studentApi.getRecommendations(studentId);
      setRecommendations(r1.data);
      const r2 = await studentApi.getRecommendationHistory(studentId);
      setRecommendationHistory(r2.data);
    } catch (error) {} finally { setIsRecsLoading(false); }
  };

  const fetchAnalytics = async () => {
    setIsAnalyticsLoading(true);
    try {
      const r = await studentApi.getDashboard(Date.now());
      setAnalytics(r.data);
    } catch (error) {} finally { setIsAnalyticsLoading(false); }
  };

  const selectedChat = previousChats.find((chat) => chat.id === selectedChatId);
  const selectedMessages = selectedChat?.messages || [];

  return (
    <DashboardLayout 
      role="student" 
      activeItem={activeItem} 
      setActiveItem={handleMenuClick} 
      userName={userName} 
      handleLogout={handleLogout}
    >
      <div className={`h-full flex flex-col ${activeItem === 'Chatbot' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {/* Render Dashboard Overview or Subview */}
        {activeItem === "Dashboard" ? (
          <div className="mx-auto w-full max-w-[1400px] flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight mb-2">Welcome back, {userName}</h1>
              <p className="text-sm lg:text-base text-gray-500 font-medium">Here's your academic overview for today.</p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {/* Stat Cards */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl">🎓</div>
                  <h3 className="font-bold text-gray-500">Attendance</h3>
                </div>
                <p className="text-4xl font-black text-foreground">92%</p>
                <p className="text-sm font-medium text-emerald-500 mt-2">↑ 3% from last month</p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 text-xl">📝</div>
                  <h3 className="font-bold text-gray-500">Quizzes Taken</h3>
                </div>
                <p className="text-4xl font-black text-foreground">14</p>
                <p className="text-sm font-medium text-indigo-500 mt-2">2 new this week</p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 text-xl">🎯</div>
                  <h3 className="font-bold text-gray-500">Avg Score</h3>
                </div>
                <p className="text-4xl font-black text-foreground">88%</p>
                <p className="text-sm font-medium text-emerald-500 mt-2">Top 10% of class</p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 text-xl">📚</div>
                  <h3 className="font-bold text-gray-500">Study Plans</h3>
                </div>
                <p className="text-4xl font-black text-foreground">4</p>
                <p className="text-sm font-medium text-gray-400 mt-2">Active this semester</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm min-h-[300px]">
                <h3 className="text-xl font-bold text-foreground mb-6">Recent Activity</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <p className="font-bold text-foreground">Completed Physics Quiz</p>
                      <p className="text-sm text-gray-500">Scored 90% in Kinematics</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <div>
                      <p className="font-bold text-foreground">Generated Math Study Plan</p>
                      <p className="text-sm text-gray-500">Focus on Calculus integration</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm min-h-[300px]">
                <h3 className="text-xl font-bold text-foreground mb-6">AI Recommendations</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <p className="font-bold text-primary mb-1">Needs Attention: Data Structures</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Your recent quiz scores indicate a drop in Trees and Graphs. Would you like to generate a focused study plan?</p>
                    <button onClick={() => setActiveItem("Chatbot")} className="mt-3 text-sm font-bold text-primary hover:underline">Discuss with Copilot →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`mx-auto w-full flex flex-col ${activeItem === 'Chatbot' ? 'max-w-[1800px] flex-1 min-h-0 overflow-hidden' : 'max-w-[1400px] min-h-[calc(100vh-10rem)] p-5 lg:p-7 bg-transparent'}`}>

          {activeItem === "Chatbot" && (
            <div className={`flex-1 min-h-0 grid gap-8 ${chatHistoryCollapsed ? "xl:grid-cols-[82px_1fr]" : "xl:grid-cols-[280px_1fr]"}`}>
              <section className="min-h-0 rounded-[2rem] border border-gray-100 bg-white p-5 lg:p-6 shadow-xl shadow-gray-200/40 transition-all flex flex-col">
                <div className="mb-5 flex items-center justify-between">
                  {!chatHistoryCollapsed && <h2 className="text-base font-black text-gray-800 tracking-tight pl-1">Chat History</h2>}
                  <button onClick={() => setChatHistoryCollapsed(!chatHistoryCollapsed)} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all shadow-sm font-bold text-base">{chatHistoryCollapsed ? ">" : "<"}</button>
                </div>
                {!chatHistoryCollapsed && (
                  <>
                    <button onClick={handleNewChat} className="mb-5 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3 text-xs font-black tracking-wide text-white transition-all hover:opacity-90 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-95 shadow-lg">+ NEW CONVERSATION</button>
                    <div className="space-y-2 overflow-y-auto flex-1 pr-3 custom-scrollbar">
                      {previousChats.map((chat) => (
                        <button key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`w-full rounded-xl px-3 py-1.5 text-left transition-all duration-300 ${selectedChatId === chat.id ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-none scale-[1.01]" : "bg-card text-foreground hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-border hover:shadow-sm"}`}>
                          <span className={`block truncate font-extrabold text-xs ${selectedChatId === chat.id ? "text-primary" : ""}`}>{chat.title}</span>
                          <span className={`block truncate text-[10px] font-medium leading-tight ${selectedChatId === chat.id ? "text-primary/70" : "text-gray-400 dark:text-gray-500"}`}>{chat.messages?.at(-1)?.text || "Empty chat"}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </section>
              <section className="min-h-0 flex flex-col justify-between rounded-[2rem] border border-gray-100 bg-white p-5 lg:p-6 shadow-xl shadow-gray-200/40">
                <div className="flex-1 min-h-0 overflow-y-auto mb-5 pr-3 lg:pr-5 space-y-4 custom-scrollbar">
                  {selectedChat ? (
                    <>
                      <div className="sticky top-0 bg-white/95 backdrop-blur-md pb-4 mb-2 border-b border-gray-50 z-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-500 mb-1.5">Current Thread</p>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">{selectedChat.title}</h2>
                      </div>
                      {selectedMessages.length > 0 ? (
                        selectedMessages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[68%] rounded-2xl px-5 py-3.5 shadow-sm ${msg.sender === "user" ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-tr-sm shadow-orange-500/20" : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm"}`}>
                              <p className="text-sm leading-6 whitespace-pre-wrap font-medium">{msg.text}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
                          <div className="text-7xl mb-6">👋</div>
                          <h2 className="text-xl font-black text-gray-900">Start a conversation!</h2>
                        </div>
                      )}
                      {isLoading && (
                        <div className="flex justify-start mt-4">
                          <div className="bg-gray-50 text-gray-400 rounded-2xl rounded-tl-sm px-5 py-4 border border-gray-100 flex gap-2 items-center shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{animationDelay: "0.15s"}}></div>
                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{animationDelay: "0.3s"}}></div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
                      <div className="text-7xl mb-6">✨</div>
                      <h2 className="text-xl font-black text-gray-900">What can KnowledgeX do for you?</h2>
                    </div>
                  )}
                </div>
                <div className="relative flex flex-col gap-3 mt-1 shrink-0">
                  {attachedFile && (
                    <div className="self-start bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
                      📄 {attachedFile.name}
                      <button onClick={() => setAttachedFile(null)} className="text-orange-400 hover:text-orange-700 ml-2 font-black transition-colors text-lg">✖</button>
                    </div>
                  )}
                  <div className="relative group">
                    <div className="absolute -inset-1.5 rounded-[2rem] bg-gradient-to-r from-orange-200 to-orange-300 opacity-20 blur-lg group-hover:opacity-35 transition-opacity duration-500"></div>
                    <div className="relative flex items-center gap-3 rounded-[2rem] border border-gray-200 bg-white p-2.5 shadow-xl shadow-gray-200/50">
                      <button onClick={() => pdfInputRef.current?.click()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gray-50 text-gray-500 hover:bg-orange-100 hover:text-orange-600 transition-colors shadow-sm">
                        <span className="text-xl font-bold">+</span>
                      </button>
                      <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handleAttachPdf} className="hidden" />
                      <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendChat()} className="min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none" placeholder="Message KnowledgeX..." />
                      <button onClick={handleSendChat} disabled={isLoading} className="flex h-11 px-6 items-center justify-center rounded-full bg-gradient-to-r from-gray-900 to-black text-sm font-black tracking-wide text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shrink-0">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeItem === "Attendance" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Your Attendance Overview</h2>
                <p className="mt-2 text-gray-500 font-medium">Track your class participation and ensure you meet minimum requirements.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {attendanceData.map((sub, i) => {
                  const pct = ((sub.present / sub.total) * 100).toFixed(0);
                  const isLow = pct < 75;
                  return (
                    <div key={i} className="group relative overflow-hidden bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-orange-100/40 hover:-translate-y-1 transition-all duration-300">
                      <div className={`absolute top-0 right-0 h-32 w-32 -mr-8 -mt-8 rounded-full bg-gradient-to-br ${sub.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}></div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${sub.color} text-2xl shadow-lg text-white`}>{sub.icon}</div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{sub.subject}</h3>
                            <p className="text-sm font-medium text-gray-500 mt-1">{sub.present} / {sub.total} Classes</p>
                          </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-sm font-black ${isLow ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>{pct}%</div>
                      </div>
                      <div className="relative">
                        <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider">
                          <span className="text-gray-400">Status</span>
                          <span className={isLow ? "text-red-500" : "text-emerald-500"}>{isLow ? "Warning" : "On Track"}</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-gray-50 overflow-hidden border border-gray-100">
                          <div className={`h-full rounded-full bg-gradient-to-r ${sub.color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeItem === "Quizzes" && (
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!activeQuiz ? (
                <div className="rounded-3xl border border-border bg-card p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                  <h2 className="text-3xl font-black text-foreground mb-2">Practice Quizzes</h2>
                  <p className="text-gray-500 font-medium mb-8">Generate custom AI quizzes on any topic instantly.</p>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Topic</label>
                      <input value={quizTopic} onChange={e => setQuizTopic(e.target.value)} placeholder="e.g. React Hooks, Neural Networks..." className="w-full rounded-2xl border border-border px-5 py-4 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all bg-transparent" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Difficulty</label>
                        <select value={quizDifficulty} onChange={e => setQuizDifficulty(e.target.value)} className="w-full rounded-2xl border border-border px-5 py-4 text-sm font-medium focus:border-primary outline-none bg-transparent">
                          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Questions</label>
                        <input type="number" value={quizNumQuestions} onChange={e => setQuizNumQuestions(Number(e.target.value))} className="w-full rounded-2xl border border-border px-5 py-4 text-sm font-medium focus:border-primary outline-none bg-transparent" min="1" max="20" />
                      </div>
                    </div>
                    <button onClick={handleGenerateQuiz} disabled={isLoading} className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all disabled:opacity-50 mt-4">
                      {isLoading ? "Generating..." : "Generate Quiz"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100/50">
                  <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-black text-gray-900">{activeQuiz.topic}</h2>
                    <span className="px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-bold uppercase tracking-wider">{activeQuiz.difficulty}</span>
                  </div>
                  <div className="space-y-8">
                    {activeQuiz.questions.map((q, i) => (
                      <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="font-bold text-gray-900 mb-4"><span className="text-orange-500 mr-2">Q{i+1}.</span>{q.question}</p>
                        <div className="space-y-3">
                          {q.options.map((opt, j) => (
                            <label key={j} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border ${selectedAnswers[i] === opt ? "border-orange-500 bg-orange-50 shadow-sm" : "border-gray-200 bg-white hover:border-orange-300"}`}>
                              <input type="radio" name={`q-${i}`} value={opt} checked={selectedAnswers[i] === opt} onChange={() => setSelectedAnswers(prev => ({...prev, [i]: opt}))} className="text-orange-500 focus:ring-orange-500" />
                              <span className={`text-sm font-medium ${selectedAnswers[i] === opt ? "text-orange-900" : "text-gray-700"}`}>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button onClick={handleSubmitQuiz} disabled={isLoading} className="w-full rounded-2xl bg-gray-900 py-4 font-bold text-white shadow-lg hover:bg-black transition-all disabled:opacity-50">
                      {isLoading ? "Submitting..." : "Submit Answers"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeItem === "Quiz Results" && quizResult && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-8 shadow-xl text-center mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg mb-6">
                  <span className="text-4xl font-black text-emerald-500">{((quizResult.score / quizResult.total_questions) * 100).toFixed(0)}%</span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Quiz Completed!</h2>
                <p className="text-gray-600 font-medium">You got {quizResult.correct_answers} out of {quizResult.total_questions} correct.</p>
              </div>
              <div className="space-y-6">
                {quizResult.questions.map((q, i) => {
                  const studentAns = quizResult.selectedAnswers[i];
                  const isCorrect = studentAns === q.correct_answer;
                  return (
                    <div key={i} className={`p-6 rounded-2xl border ${isCorrect ? "bg-emerald-50/30 border-emerald-100" : "bg-red-50/30 border-red-100"}`}>
                      <p className="font-bold text-gray-900 mb-4">{q.question}</p>
                      <div className="space-y-2 mb-4">
                        {q.options.map((opt, j) => {
                          let style = "bg-white border-gray-200 text-gray-500";
                          if (opt === q.correct_answer) style = "bg-emerald-100 border-emerald-500 text-emerald-900 font-bold";
                          else if (opt === studentAns && !isCorrect) style = "bg-red-100 border-red-500 text-red-900 font-bold";
                          return <div key={j} className={`p-3 rounded-xl border text-sm ${style}`}>{opt}</div>;
                        })}
                      </div>
                      <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">AI Explanation</p>
                        <p className="text-sm text-gray-700 font-medium leading-relaxed">{q.explanation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeItem === "Quizzes History" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black text-gray-900 mb-6">Past Quizzes</h2>
              {isHistoryLoading ? <div className="p-8 text-center text-gray-500 font-bold">Loading history...</div> : quizHistory.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-gray-500 font-medium">No past quizzes found. Generate and submit a quiz to see your history!</p>
                </div>
              ) : quizHistory.map(q => (
                <div key={q.quiz_id} className="flex justify-between items-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{q.topic}</h3>
                    <p className="text-sm text-gray-500 mt-1">Taken on {new Date(q.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-orange-500">{q.score}/{q.total_questions}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeItem === "Studyplan" && (
            <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
              <div className="rounded-3xl border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100/50 self-start">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Create Study Plan</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Subjects (comma separated)</label>
                    <input value={studySubjects} onChange={e => setStudySubjects(e.target.value)} className="w-full rounded-2xl border border-gray-200 px-5 py-4 text-sm font-medium focus:border-orange-500 outline-none" placeholder="Math, Physics, Chemistry" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Exam Date</label>
                    <input type="date" value={studyExamDate} onChange={e => setStudyExamDate(e.target.value)} className="w-full rounded-2xl border border-gray-200 px-5 py-4 text-sm font-medium focus:border-orange-500 outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Daily Study Hours</label>
                    <input type="number" value={studyDailyHours} onChange={e => setStudyDailyHours(e.target.value)} className="w-full rounded-2xl border border-gray-200 px-5 py-4 text-sm font-medium focus:border-orange-500 outline-none" />
                  </div>
                  <button onClick={handleGenerateStudyPlan} disabled={isGeneratingPlan} className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 py-4 font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                    {isGeneratingPlan ? "Generating..." : "Generate Plan"}
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                {activeStudyPlan && (
                  <div className="rounded-3xl border border-orange-100 bg-orange-50 p-6 shadow-md overflow-x-auto">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Your New Plan</h3>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-medium font-sans">{JSON.stringify(activeStudyPlan, null, 2)}</pre>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">History</h3>
                <div className="space-y-4">
                  {studyPlans.length === 0 ? (
                    <div className="p-5 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-gray-500 font-medium text-sm">No past study plans found. Generate your first plan above!</p>
                    </div>
                  ) : studyPlans.map((p, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveStudyPlan(typeof p.plan_content === 'string' ? JSON.parse(p.plan_content) : p.plan_content)}>
                      <p className="font-bold text-gray-900">{p.subjects.join(", ")}</p>
                      <p className="text-xs text-gray-500 mt-2">Exam: {new Date(p.exam_date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeItem === "Recommendations" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black text-gray-900">AI Recommendations</h2>
              {isRecsLoading ? <p className="font-bold text-gray-500">Loading...</p> : (!recommendations || recommendations.length === 0) ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-gray-500 font-medium">No recommendations available yet. Complete more quizzes or study plans to get personalized AI advice!</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {recommendations && recommendations.map((r, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-orange-100/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold">{i+1}</div>
                        <h3 className="text-lg font-bold text-gray-900 capitalize">{r.type}</h3>
                      </div>
                      <p className="text-sm text-gray-600 font-medium leading-relaxed">{r.content || r.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeItem === "Analytics" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black text-gray-900">Performance Analytics</h2>
              {isAnalyticsLoading ? <p className="font-bold text-gray-500">Loading...</p> : analytics && (
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30">
                    <p className="text-blue-100 font-bold uppercase tracking-wider text-xs mb-2">Quizzes Taken</p>
                    <p className="text-5xl font-black">{analytics.total_quizzes_taken || 0}</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                    <p className="text-emerald-100 font-bold uppercase tracking-wider text-xs mb-2">Average Score</p>
                    <p className="text-5xl font-black">{analytics.average_score?.toFixed(1) || 0}%</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30">
                    <p className="text-purple-100 font-bold uppercase tracking-wider text-xs mb-2">Study Plans</p>
                    <p className="text-5xl font-black">{analytics.total_study_plans || 0}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
