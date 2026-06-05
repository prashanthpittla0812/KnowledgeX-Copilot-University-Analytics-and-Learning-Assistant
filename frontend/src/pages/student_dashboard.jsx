import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatbotApi, documentApi, studentApi } from "../api";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { StatCard } from "../components/ui/stat-card";
import { AnalyticsCard } from "../components/ui/analytics-card";
import { ChatBubble, ChatInput } from "../components/ui/chat";
import { Button } from "../components/ui/button";
import { BookOpen, AlertCircle, FileText, Calendar, CheckCircle, BarChart, GraduationCap, Target, Lightbulb, TrendingUp } from "lucide-react";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const pdfInputRef = useRef(null);
  const [userName, setUserName] = useState("Student");
  const [studentId, setStudentId] = useState(null);
  const [activeItem, setActiveItem] = useState("Dashboard");
  
  // Chatbot State
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  
  const [previousChats, setPreviousChats] = useState(() => {
    let userId = "default";
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try { userId = JSON.parse(storedUser).id; } catch (e) {}
    }
    const stored = localStorage.getItem(`studentChats_${userId}`);
    return stored ? JSON.parse(stored) : [
      { id: 1, title: "Math revision plan", messages: [{ text: "Help me revise calculus before quiz.", isUser: true }] },
      { id: 2, title: "Physics doubts", messages: [{ text: "Explain Newton's laws with examples.", isUser: true }] },
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
  const [isRecsLoading, setIsRecsLoading] = useState(false);

  // Analytics States
  const [analytics, setAnalytics] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  // Attendance State
  const [attendanceData] = useState([
    { subject: "Math", present: 18, total: 20 },
    { subject: "Physics", present: 16, total: 20 },
    { subject: "Computer Science", present: 19, total: 20 },
    { subject: "English", present: 17, total: 20 },
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

  useEffect(() => {
    if (activeItem === "Quizzes" && quizHistory.length === 0) fetchQuizHistory();
    else if (activeItem === "Study Plan") fetchStudyPlans();
    else if (activeItem === "Analytics") {
      fetchAnalytics();
      fetchRecommendations();
    }
  }, [activeItem]);

  const fetchQuizHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const res = await studentApi.getQuizHistory();
      setQuizHistory(res.data.history || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchStudyPlans = async () => {
    try {
      const res = await studentApi.getStudyPlans();
      setStudyPlans(res.data.plans || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setIsRecsLoading(true);
      const res = await studentApi.getRecommendations();
      setRecommendations(res.data.recommendations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setIsAnalyticsLoading(true);
      const res = await studentApi.getAnalytics();
      setAnalytics(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyticsLoading(false);
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
    localStorage.setItem(`studentChats_${studentId || "default"}`, JSON.stringify(updated));
  };

  const handleSendChat = async () => {
    const message = chatInput.trim();
    if ((!message && !attachedFile) || isLoading) return;
    
    let currentChats = [...previousChats];
    setIsChatSending(true);
    setIsLoading(true);
    
    try {
      if (attachedFile) {
        await documentApi.uploadPdf(attachedFile);
        currentChats = currentChats.map((chat) => {
          if (chat.id !== selectedChatId) return chat;
          return { ...chat, messages: [...(chat.messages||[]), { text: `Attached PDF: ${attachedFile.name}`, isUser: true }] };
        });
        setAttachedFile(null);
      }
      
      if (message) {
        currentChats = currentChats.map((chat) => {
          if (chat.id !== selectedChatId) return chat;
          const messages = chat.messages || [];
          return { ...chat, title: messages.length === 0 ? (message.length > 30 ? message.slice(0, 30) + "..." : message) : chat.title, messages: [...messages, { text: message, isUser: true }] };
        });
      }
      
      setPreviousChats(currentChats);
      setChatInput("");
      
      if (message) {
        const response = await chatbotApi.askQuestion(message);
        currentChats = currentChats.map((chat) => {
          if (chat.id !== selectedChatId) return chat;
          return { ...chat, messages: [...(chat.messages || []), { text: response.answer || response.data?.answer || "Sorry, I could not process that.", isUser: false }] };
        });
        setPreviousChats(currentChats);
      }
      
      localStorage.setItem(`studentChats_${studentId || "default"}`, JSON.stringify(currentChats));
    } catch (error) {
      alert("Failed to process request.");
    } finally {
      setIsLoading(false);
      setIsChatSending(false);
    }
  };

  const handleAttachPdf = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") return alert("Select a PDF");
    setAttachedFile(file);
    const msg = { text: `Prepared PDF: ${file.name}`, isUser: true };
    const updated = previousChats.map(chat => {
      if (chat.id !== selectedChatId) return chat;
      return { ...chat, messages: [...(chat.messages || []), msg] };
    });
    setPreviousChats(updated);
  };

  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) return alert("Enter a topic");
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
      if (!selectedAnswers[i]) return alert(`Answer Question ${i + 1}`);
      ansArray.push(selectedAnswers[i]);
    }
    setIsLoading(true);
    try {
      const response = await studentApi.submitQuiz({ quiz_id: activeQuiz.id, answers: ansArray });
      setQuizResult(response.data);
      setActiveQuiz(null);
    } catch (error) {
      alert("Failed to submit quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStudyPlan = async () => {
    if (!studySubjects || !studyExamDate) return alert("Fill out all fields");
    setIsGeneratingPlan(true);
    try {
      const subs = studySubjects.split(",").map(s => s.trim());
      const response = await studentApi.generateStudyPlan({ subjects: subs, exam_date: studyExamDate, daily_study_hours: studyDailyHours });
      setActiveStudyPlan(typeof response.data.plan === 'string' ? JSON.parse(response.data.plan) : response.data.plan);
      fetchStudyPlans();
    } catch (error) {
      alert("Failed to generate plan");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const selectedChat = previousChats.find((chat) => chat.id === selectedChatId);
  const selectedMessages = selectedChat?.messages || [];

  return (
    <DashboardLayout
      role="student"
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
              <p className="text-muted-foreground mt-1">Here's your learning progress for today.</p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Quizzes Taken" value="12" icon={CheckCircle} description="Across 3 subjects" />
              <StatCard title="Average Score" value="82%" icon={Target} trend="↑ 4%" trendColor="text-emerald-500" description="since last week" />
              <StatCard title="Study Streak" value="5 days" icon={TrendingUp} description="Keep it up!" />
              <StatCard title="Total Attendance" value="88%" icon={Calendar} trendColor="text-primary" description="Good standing" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <AnalyticsCard title="Upcoming Tasks" className="min-h-[300px]">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-accent flex items-center gap-2"><BookOpen className="w-4 h-4"/> Operating Systems Midterm</p>
                      <p className="text-sm text-foreground mt-1">Due in 3 days. Complete chapter 4 and 5 revision.</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setActiveItem("Study Plan")}>Plan</Button>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-primary flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Computer Networks Quiz</p>
                      <p className="text-sm text-foreground mt-1">Practice subnetting calculations.</p>
                    </div>
                    <Button size="sm" onClick={() => setActiveItem("Quizzes")}>Practice</Button>
                  </div>
                </div>
              </AnalyticsCard>

              <AnalyticsCard title="Attendance Summary" className="min-h-[300px]">
                <div className="space-y-4">
                  {attendanceData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-muted-foreground">
                          {item.subject.charAt(0)}
                        </div>
                        <p className="font-bold">{item.subject}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg">{((item.present / item.total) * 100).toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">{item.present}/{item.total} classes</p>
                      </div>
                    </div>
                  ))}
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
                        <Lightbulb className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">KnowledgeX AI Tutor</h2>
                      <p className="text-muted-foreground">Ask questions, clarify doubts, or request explanations on any academic topic.</p>
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
            {quizResult ? (
              <div className="max-w-3xl mx-auto">
                <Button variant="ghost" onClick={() => setQuizResult(null)} className="pl-0 mb-4 hover:bg-transparent hover:text-primary">← Back to Quizzes</Button>
                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center mb-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-background shadow-sm mb-6 border border-border">
                    <span className="text-4xl font-black text-emerald-500">{((quizResult.score / quizResult.total_questions) * 100).toFixed(0)}%</span>
                  </div>
                  <h2 className="text-3xl font-black text-foreground mb-2">Quiz Completed!</h2>
                  <p className="text-muted-foreground">You got {quizResult.correct_answers} out of {quizResult.total_questions} correct.</p>
                </div>
                <div className="space-y-6">
                  {quizResult.results?.map((res, i) => {
                    const isCorrect = res.status === "correct";
                    return (
                      <Card key={i} className={`glass-card border-l-4 ${isCorrect ? "border-l-emerald-500" : "border-l-red-500"}`}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <p className="font-bold text-foreground text-lg">{res.question}</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${isCorrect ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                              {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="p-4 rounded-xl border border-border bg-[var(--background)]">
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Your Answer</p>
                              <p className={`font-medium ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                                {res.student_answer || "(No Answer)"}
                              </p>
                            </div>
                            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Correct Answer</p>
                              <p className="font-medium text-emerald-700 dark:text-emerald-400">
                                {res.correct_answer}
                              </p>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-muted/50 border border-border">
                            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">AI Explanation</p>
                            <p className="text-sm text-foreground leading-relaxed">{res.explanation}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : activeQuiz ? (
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">{activeQuiz.topic} Quiz</h2>
                  <span className="px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">{activeQuiz.difficulty}</span>
                </div>
                <div className="space-y-6">
                  {activeQuiz.questions.map((q, i) => (
                    <Card key={i} className="glass-card">
                      <CardContent className="p-6">
                        <p className="font-bold text-foreground mb-4"><span className="text-primary mr-2">Q{i+1}.</span>{q.question}</p>
                        <div className="space-y-3">
                          {q.options.map((opt, j) => (
                            <label key={j} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border ${selectedAnswers[i] === opt ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:border-primary/50"}`}>
                              <input type="radio" name={`q-${i}`} value={opt} checked={selectedAnswers[i] === opt} onChange={() => setSelectedAnswers(prev => ({...prev, [i]: opt}))} className="text-primary" />
                              <span className={`text-sm font-medium ${selectedAnswers[i] === opt ? "text-foreground" : "text-muted-foreground"}`}>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button onClick={handleSubmitQuiz} disabled={isLoading} className="w-full h-12 text-lg">
                    {isLoading ? "Submitting..." : "Submit Answers"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight">Practice Quizzes</h1>
                    <p className="text-muted-foreground">Generate AI quizzes to test your knowledge.</p>
                  </div>
                </div>

                <AnalyticsCard title="Generate New Quiz" className="max-w-2xl">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold mb-1 block">Topic</label>
                      <input value={quizTopic} onChange={e=>setQuizTopic(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g., Data Structures" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold mb-1 block">Difficulty</label>
                        <select value={quizDifficulty} onChange={e=>setQuizDifficulty(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none">
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-1 block">Questions</label>
                        <input type="number" value={quizNumQuestions} onChange={e=>setQuizNumQuestions(Number(e.target.value))} min="1" max="20" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
                      </div>
                    </div>
                    <Button onClick={handleGenerateQuiz} disabled={isLoading} className="w-full h-11">{isLoading ? "Generating..." : "Generate AI Quiz"}</Button>
                  </div>
                </AnalyticsCard>

                <h3 className="text-xl font-bold mt-10 mb-4">Past Quizzes</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isHistoryLoading ? <p className="text-muted-foreground">Loading history...</p> : quizHistory.length === 0 ? <p className="text-muted-foreground">No past quizzes found.</p> : quizHistory.map((q, i) => (
                    <Card key={i} className="glass-card hover:border-primary/50 transition-colors">
                      <CardContent className="p-6">
                        <h4 className="text-lg font-bold truncate">{q.topic}</h4>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">{new Date(q.timestamp).toLocaleDateString()}</p>
                        <div className="text-2xl font-black text-primary">{q.score}/{q.total_questions}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : activeItem === "Study Plan" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Study Plans</h1>
              <p className="text-muted-foreground">Generate structured learning schedules.</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <AnalyticsCard title="Create Plan" className="self-start">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Subjects (comma separated)</label>
                    <input value={studySubjects} onChange={e => setStudySubjects(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="Math, Physics" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Exam Date</label>
                    <input type="date" value={studyExamDate} onChange={e => setStudyExamDate(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Daily Study Hours</label>
                    <input type="number" value={studyDailyHours} onChange={e => setStudyDailyHours(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <Button onClick={handleGenerateStudyPlan} disabled={isGeneratingPlan} className="w-full h-11">
                    {isGeneratingPlan ? "Generating..." : "Generate AI Plan"}
                  </Button>
                </div>
              </AnalyticsCard>
              
              <div className="space-y-6">
                {activeStudyPlan && (
                  <Card className="glass-card border-primary/50 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-xl">Your New Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap text-sm font-sans">{JSON.stringify(activeStudyPlan, null, 2)}</pre>
                    </CardContent>
                  </Card>
                )}
                <h3 className="text-xl font-bold">Plan History</h3>
                <div className="space-y-4">
                  {studyPlans.length === 0 && <p className="text-muted-foreground">No past plans found.</p>}
                  {studyPlans.map((p, i) => (
                    <Card key={i} className="glass-card cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveStudyPlan(typeof p.plan_content === 'string' ? JSON.parse(p.plan_content) : p.plan_content)}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold">{p.subjects.join(", ")}</p>
                          <p className="text-xs text-muted-foreground mt-1">Exam: {new Date(p.exam_date).toLocaleDateString()}</p>
                        </div>
                        <GraduationCap className="w-5 h-5 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : activeItem === "Analytics" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Performance Analytics</h1>
              <p className="text-muted-foreground">Track your progress and AI recommendations.</p>
            </div>
            
            {isAnalyticsLoading ? <p className="text-muted-foreground">Loading Analytics...</p> : analytics && (
              <div className="grid sm:grid-cols-3 gap-6 mb-8">
                <StatCard title="Quizzes Taken" value={analytics.total_quizzes_taken || 0} icon={FileText} />
                <StatCard title="Average Score" value={`${analytics.average_score?.toFixed(1) || 0}%`} icon={Target} trendColor="text-emerald-500" />
                <StatCard title="Study Plans" value={analytics.total_study_plans || 0} icon={BookOpen} />
              </div>
            )}

            <h3 className="text-xl font-bold mt-8 mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-primary"/> AI Recommendations</h3>
            {isRecsLoading ? <p className="text-muted-foreground">Loading recommendations...</p> : (!recommendations || recommendations.length === 0) ? (
              <p className="text-muted-foreground">No recommendations available yet.</p>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {recommendations.map((r, i) => (
                  <Card key={i} className="glass-card">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{i+1}</div>
                        <h3 className="font-bold capitalize">{r.type}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{r.content || r.message}</p>
                    </CardContent>
                  </Card>
                ))}
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
