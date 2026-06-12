import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { chatbotApi, documentApi, studentApi, materialApi } from "../api";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { LearningResourcesTab } from "../components/student/LearningResourcesTab";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { StatCard } from "../components/ui/stat-card";
import { AnalyticsCard } from "../components/ui/analytics-card";
import { ChatBubble, ChatInput } from "../components/ui/chat";
import { Button } from "../components/ui/button";
import { BookOpen, AlertCircle, FileText, Calendar, CheckCircle, BarChart as BarChartIcon, GraduationCap, Target, Lightbulb, TrendingUp, X, Trash2, PanelLeftClose, PanelLeftOpen, Maximize, Minus, Plus, Bot, Paperclip, SquarePen, Search, MessageSquare, RotateCw, Sparkles, Play, Clock, History } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import CopilotFloatingButton from "./CopilotFloatingButton";

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
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [portalTarget, setPortalTarget] = useState(null);

  const [previousChats, setPreviousChats] = useState(() => {
    let userId = "default";
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try { userId = JSON.parse(storedUser).id; } catch (e) { }
    }
    const stored = localStorage.getItem(`studentChats_${userId}`);
    return stored ? JSON.parse(stored) : [
      { id: 1, title: "Math revision plan", messages: [{ text: "Help me revise calculus before quiz.", isUser: true }] },
      { id: 2, title: "Physics doubts", messages: [{ text: "Explain Newton's laws with examples.", isUser: true }] },
    ];
  });
  const [selectedChatId, setSelectedChatId] = useState(previousChats[0]?.id || null);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(true);
  const [activeMiniPopover, setActiveMiniPopover] = useState(null);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [chatbotMode, setChatbotMode] = useState("minimized");
  const [chatHistoryCollapsed, setChatHistoryCollapsed] = useState(false);
  // Quiz States
  const [quizTopic, setQuizTopic] = useState("");
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizNumQuestions, setQuizNumQuestions] = useState(25);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showPastQuizzes, setShowPastQuizzes] = useState(false);
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);


  // Studyplan States
  const [studySubjects, setStudySubjects] = useState("");
  const [studyExamDate, setStudyExamDate] = useState("");
  const [studyDailyHours, setStudyDailyHours] = useState(2);
  const [studySyllabus, setStudySyllabus] = useState("");
  const [studyPlans, setStudyPlans] = useState([]);
  const [activeStudyPlan, setActiveStudyPlan] = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [activeStudyPlanId, setActiveStudyPlanId] = useState(null);
  const [completedPlans, setCompletedPlans] = useState(() => {
    let userId = "default";
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try { userId = JSON.parse(storedUser).id; } catch (e) {}
    }
    const stored = localStorage.getItem(`completedStudyPlans_${userId}`);
    return stored ? JSON.parse(stored) : {};
  });

  const isPlanCompleted = activeStudyPlanId && completedPlans[activeStudyPlanId];

  const handleCompletePlan = () => {
    if (!activeStudyPlanId) return;
    let userId = "default";
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try { userId = JSON.parse(storedUser).id; } catch (e) {}
    }
    const updated = { ...completedPlans, [activeStudyPlanId]: true };
    setCompletedPlans(updated);
    localStorage.setItem(`completedStudyPlans_${userId}`, JSON.stringify(updated));
  };

  // Recommendations States
  const [recommendations, setRecommendations] = useState(null);
  const [isRecsLoading, setIsRecsLoading] = useState(false);

  // Recent Materials State
  const [recentMaterials, setRecentMaterials] = useState([]);

  // Dashboard Stats State
  const [dashboardStats, setDashboardStats] = useState(null);

  // Analytics States
  const [analytics, setAnalytics] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) {
      navigate("/");
      return;
    }
    const cu = JSON.parse(stored);
    if (cu?.name) setUserName(cu.name);
    if (cu?.id) setStudentId(cu.id);

    setPortalTarget(document.getElementById("main-workspace") || document.body);
  }, [navigate]);

  const fetchAssignedQuizzes = async () => {
    try {
      const res = await studentApi.getAssignedQuizzes();
      setAssignedQuizzes(res.data.quizzes || []);
    } catch (e) {
      console.error("Failed to fetch assigned quizzes", e);
    }
  };

  const fetchQuizHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const res = await studentApi.getQuizHistory();
      setQuizHistory(Array.isArray(res.data) ? res.data : (res.data.history || []));
    } catch (e) {
      console.error(e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchStudyPlans = async () => {
    try {
      const res = await studentApi.getStudyPlanHistory();
      const plans = res.data || [];
      setStudyPlans(plans);
      if (plans.length > 0) {
        const latestPlan = plans[0];
        const content = typeof latestPlan.plan_content === 'string' ? JSON.parse(latestPlan.plan_content) : latestPlan.plan_content;
        setActiveStudyPlan(content);
        setActiveStudyPlanId(latestPlan.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecommendations = async () => {
    if (!studentId) return;
    try {
      setIsRecsLoading(true);
      const res = await studentApi.getRecommendations(studentId);
      setRecommendations(res.data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsAnalyticsLoading(false);
  };

  const fetchRecentMaterials = async () => {
    try {
      const res = await studentApi.getRecentMaterials?.() || await materialApi?.getRecentMaterials();
      setRecentMaterials(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await studentApi.getDashboard();
      setDashboardStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeItem === "Dashboard") {
      fetchRecentMaterials();
      fetchDashboardStats();
    }
    if (activeItem === "Quizzes" || activeItem === "Analytics") {
      fetchQuizHistory();
      fetchAssignedQuizzes();
    }
    if (activeItem === "Study Plan") {
      fetchStudyPlans();
      fetchRecommendations();
      fetchQuizHistory();
    }
    if (activeItem === "Recommendations") fetchRecommendations();
    if (activeItem === "Analytics") fetchAnalytics();
  }, [activeItem, studentId]);

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

  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    const updatedChats = previousChats.filter(c => c.id !== chatId);
    setPreviousChats(updatedChats);
    localStorage.setItem(`studentChats_${studentId || "default"}`, JSON.stringify(updatedChats));
    if (selectedChatId === chatId) {
      setSelectedChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
  };

  const handleAttachFiles = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const handleSendChat = async () => {
    const message = chatInput.trim();
    if ((!message && attachedFiles.length === 0) || isLoading) return;

    let currentChats = [...previousChats];
    setIsChatSending(true);
    setIsLoading(true);

    try {
      let uploadedIds = [];
      const fileNamesList = attachedFiles.map(f => f.name).join(", ");

      // Represent the user's message in the chat immediately
      const displayMessage = message ? message : `Uploaded files: ${fileNamesList}`;
      const userText = fileNamesList && message ? `[Attached: ${fileNamesList}]\n\n${message}` : displayMessage;

      currentChats = currentChats.map((chat) => {
        if (chat.id !== selectedChatId) return chat;
        const messages = chat.messages || [];
        return {
          ...chat,
          title: messages.length === 0 ? (displayMessage.length > 30 ? displayMessage.slice(0, 30) + "..." : displayMessage) : chat.title,
          messages: [...messages, { text: userText, isUser: true }]
        };
      });

      setPreviousChats(currentChats);
      setChatInput("");

      // Upload files if any
      if (attachedFiles.length > 0) {
        const formData = new FormData();
        attachedFiles.forEach(file => {
          formData.append("files", file);
        });
        formData.append("asr_provider", "Whisper");

        const uploadRes = await documentApi.uploadMultimodalBatch(formData);
        if (uploadRes && uploadRes.uploaded) {
          uploadedIds = uploadRes.uploaded.map(doc => doc.id);
        }
        setAttachedFiles([]);
      }

      // If there is no message but files were uploaded, just summarize them.
      // If there is a message, ask the question (files are now in vector DB).
      if (!message && uploadedIds.length > 0) {
        try {
          const summaryRes = await chatbotApi.summarizeBatch(uploadedIds, "Short Summary");
          currentChats = currentChats.map((chat) => {
            if (chat.id !== selectedChatId) return chat;
            return {
              ...chat,
              messages: [...(chat.messages || []), {
                text: `**Summary of uploaded documents:**\n\n${summaryRes.summary}`,
                sources: [],
                isUser: false
              }]
            };
          });
          setPreviousChats(currentChats);
        } catch (e) {
          console.error("Batch summary error", e);
        }
      } else if (message) {
        try {
          // If we want the bot to specifically focus on the newly uploaded docs, 
          // we pass uploadedIds to the askQuestion API.
          const response = await chatbotApi.askQuestion(message, uploadedIds);
          currentChats = currentChats.map((chat) => {
            if (chat.id !== selectedChatId) return chat;
            return {
              ...chat,
              messages: [...(chat.messages || []), {
                text: response.answer || response.data?.answer || "Sorry, I could not process that.",
                sources: response.sources || response.data?.sources || [],
                isUser: false
              }]
            };
          });
          setPreviousChats(currentChats);
        } catch (e) {
          console.error(e);
        }
      }

      localStorage.setItem(`studentChats_${studentId || "default"}`, JSON.stringify(currentChats));
    } catch (error) {
      console.error("Error sending chat:", error);
    } finally {
      setIsLoading(false);
      setIsChatSending(false);
    }
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

  const handleTakeAssignedQuiz = async (quiz) => {
    setIsLoading(true);
    try {
      const response = await studentApi.getAssignedQuiz(quiz.id);
      setActiveQuiz({
        id: quiz.id,
        topic: quiz.topic_name,
        difficulty: quiz.difficulty,
        questions: response.data.questions,
        isAssigned: true
      });
      setSelectedAnswers({});
    } catch (error) {
      alert("Failed to load assigned quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    const numQ = activeQuiz.questions.length;
    const ansArray = [];

    if (activeQuiz.isAssigned) {
      for (let i = 0; i < numQ; i++) {
        if (!selectedAnswers[i]) return alert(`Answer Question ${i + 1}`);
        ansArray.push({
          question_id: activeQuiz.questions[i].question_id,
          selected_answer: selectedAnswers[i]
        });
      }
    } else {
      for (let i = 0; i < numQ; i++) {
        if (!selectedAnswers[i]) return alert(`Answer Question ${i + 1}`);
        ansArray.push(selectedAnswers[i]);
      }
    }

    setIsLoading(true);
    try {
      let response;
      if (activeQuiz.isAssigned) {
        response = await studentApi.submitAssignedQuiz({
          quiz_id: activeQuiz.id,
          answers: ansArray
        });
        alert("Quiz submitted successfully! Your teacher will review your performance.");
        fetchAssignedQuizzes();
      } else {
        response = await studentApi.submitQuiz({ quiz_id: activeQuiz.id, answers: ansArray });
        setQuizResult(response.data);
      }
      setActiveQuiz(null);
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || "Failed to submit quiz";
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStudyPlan = async () => {
    if (!studySubjects || !studyExamDate) return alert("Fill out all fields");
    setIsGeneratingPlan(true);
    try {
      const subs = studySubjects.split(",").map(s => s.trim());
      const response = await studentApi.generateStudyPlan({ 
        subjects: subs, 
        exam_date: studyExamDate, 
        daily_hours: parseFloat(studyDailyHours),
        syllabus: studySyllabus
      });
      const parsedPlan = typeof response.data.plan_content === 'string' ? JSON.parse(response.data.plan_content) : response.data.plan_content;
      setActiveStudyPlan(parsedPlan);
      setActiveStudyPlanId(response.data.id);
      setIsGenModalOpen(false);
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
              <StatCard title="Quizzes Taken" value={dashboardStats?.quizzes_taken ?? "0"} icon={CheckCircle} description="Total practice quizzes" />
              <StatCard title="Average Score" value={`${dashboardStats?.average_quiz_score ?? 0}%`} icon={Target} description="All time average" />
              <StatCard title="Study Streak" value={`${dashboardStats?.study_streak ?? 0} days`} icon={TrendingUp} description="Keep it up!" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <AnalyticsCard title="Upcoming Tasks" className="min-h-[300px]">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-accent flex items-center gap-2"><BookOpen className="w-4 h-4" /> Operating Systems Midterm</p>
                      <p className="text-sm text-foreground mt-1">Due in 3 days. Complete chapter 4 and 5 revision.</p>
                    </div>
                    <Button size="sm" onClick={() => setActiveItem("Study Plan")}>Plan</Button>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-primary flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Computer Networks Quiz</p>
                      <p className="text-sm text-foreground mt-1">Practice subnetting calculations.</p>
                    </div>
                    <Button size="sm" onClick={() => setActiveItem("Quizzes")}>Practice</Button>
                  </div>
                </div>
              </AnalyticsCard>
            </div>

            <AnalyticsCard title="Recently Uploaded Materials">
              <div className="space-y-4">
                {recentMaterials.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No recent materials.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentMaterials.slice(0, 3).map((m) => (
                      <div key={m.id} className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveItem("Learning Resources")}>
                        <div className="flex items-start justify-between mb-2">
                          <FileText className="text-primary w-6 h-6" />
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">{m.material_type}</span>
                        </div>
                        <h4 className="font-bold text-sm line-clamp-1">{m.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">By {m.faculty_name}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="ghost" className="w-full text-sm mt-2" onClick={() => setActiveItem("Learning Resources")}>
                  View All Resources
                </Button>
              </div>
            </AnalyticsCard>
          </div>
        ) : activeItem === "Quizzes" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {quizResult ? (
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <Button variant="ghost" onClick={() => setQuizResult(null)} className="pl-0 hover:bg-transparent hover:text-primary">← Back to Quizzes</Button>
                  <Button onClick={() => setActiveItem("Recommendations")} variant="default" className="gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Get AI Recommendations
                  </Button>
                </div>
                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center mb-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-background shadow-sm mb-6 border border-border">
                    <span className="text-4xl font-black text-emerald-500">{quizResult.score.toFixed(0)}%</span>
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
                              <p className="font-medium text-emerald-700">
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
                        <p className="font-bold text-foreground mb-4"><span className="text-primary mr-2">Q{i + 1}.</span>{q.question}</p>
                        <div className="space-y-3">
                          {q.options.map((opt, j) => (
                            <label key={j} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border ${selectedAnswers[i] === opt ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:border-primary/50"}`}>
                              <input type="radio" name={`q-${i}`} value={opt} checked={selectedAnswers[i] === opt} onChange={() => setSelectedAnswers(prev => ({ ...prev, [i]: opt }))} className="text-primary" />
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
            ) : showPastQuizzes ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <Button variant="ghost" onClick={() => setShowPastQuizzes(false)} className="pl-0 hover:bg-transparent hover:text-primary mb-4">← Back to Practice Quizzes</Button>
                <h3 className="text-2xl font-bold mt-2 mb-4">Past Quizzes History</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isHistoryLoading ? <p className="text-muted-foreground">Loading history...</p> : quizHistory.length === 0 ? <p className="text-muted-foreground">No past quizzes found.</p> : quizHistory.map((q, i) => (
                    <Card key={i} className="glass-card hover:border-primary/50 transition-colors">
                      <CardContent className="p-6">
                        <h4 className="text-lg font-bold truncate">{q.topic}</h4>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">{new Date(q.created_at || q.timestamp).toLocaleDateString()}</p>
                        <div className="text-2xl font-black text-primary">{q.score !== null ? `${Math.round(q.score)}%` : "Not Attempted"}</div>
                      </CardContent>
                    </Card>
                  ))}
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

                <div className="grid lg:grid-cols-3 gap-8 mb-10">
                  <AnalyticsCard title="Generate New Quiz" className="lg:col-span-2">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold mb-1 block">Topic</label>
                        <input value={quizTopic} onChange={e => setQuizTopic(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g., Data Structures" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold mb-1 block">Difficulty</label>
                          <select value={quizDifficulty} onChange={e => setQuizDifficulty(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none">
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold mb-1 block">Questions</label>
                          <input type="number" value={quizNumQuestions} onChange={e => setQuizNumQuestions(Number(e.target.value))} min="1" max="25" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
                        </div>
                      </div>
                      <Button onClick={handleGenerateQuiz} disabled={isLoading} className="w-full h-11">{isLoading ? "Generating..." : "Generate AI Quiz"}</Button>
                    </div>
                  </AnalyticsCard>

                  <Card onClick={() => setShowPastQuizzes(true)} className="glass-card cursor-pointer hover:border-primary/50 transition-all flex flex-col justify-center items-center p-6 text-center group h-full">
                    <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                      <History className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Past Quizzes</h3>
                    <p className="text-sm text-muted-foreground">View your generated practice history and scores.</p>
                  </Card>
                </div>

                {assignedQuizzes.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <BookOpen className="text-primary w-6 h-6" />
                      Assigned Quizzes (From Faculty)
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {assignedQuizzes.map((q, i) => (
                        <Card key={i} className="glass-card border-primary/30 bg-primary/5 hover:border-primary transition-colors">
                          <CardContent className="p-6">
                            <h4 className="text-lg font-bold truncate">{q.topic_name}</h4>
                            <p className="text-xs text-muted-foreground mt-1 mb-4">By {q.teacher_name} • {q.num_questions} Questions</p>
                            {q.is_completed ? (
                              <Button className="w-full bg-emerald-600 hover:bg-emerald-600 text-white cursor-not-allowed" disabled>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Quiz Taken
                              </Button>
                            ) : (
                              <Button onClick={() => handleTakeAssignedQuiz(q)} className="w-full" disabled={isLoading}>
                                Take Quiz
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : activeItem === "Learning Resources" ? (
          <LearningResourcesTab />
        ) : activeItem === "Study Plan" ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Study Plan</h1>
                <p className="text-muted-foreground mt-1">Personalized study plan generated for you</p>
              </div>
              {activeStudyPlan && (() => {
                const plan = activeStudyPlan.plan || activeStudyPlan;
                const dailySchedule = plan.daily_schedule || plan.schedule || [];
                
                // Helper to format date range
                const getDateRangeString = (schedule) => {
                  if (!Array.isArray(schedule) || schedule.length === 0) return "No Date Range";
                  const firstDateStr = schedule[0]?.date;
                  const lastDateStr = schedule[schedule.length - 1]?.date;
                  if (!firstDateStr || !lastDateStr) return "Custom Range";
                  
                  try {
                    const d1 = new Date(firstDateStr);
                    const d2 = new Date(lastDateStr);
                    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
                      return `${firstDateStr} – ${lastDateStr}`;
                    }
                    
                    const day1 = d1.getDate();
                    const month1 = d1.toLocaleDateString("en-US", { month: "short" });
                    const year1 = d1.getFullYear();
                    
                    const day2 = d2.getDate();
                    const month2 = d2.toLocaleDateString("en-US", { month: "short" });
                    const year2 = d2.getFullYear();
                    
                    if (year1 === year2) {
                      if (month1 === month2) {
                        return `${day1} – ${day2} ${month1} ${year1}`;
                      }
                      return `${day1} ${month1} – ${day2} ${month2} ${year1}`;
                    }
                    return `${day1} ${month1} ${year1} – ${day2} ${month2} ${year2}`;
                  } catch (e) {
                    return `${firstDateStr} – ${lastDateStr}`;
                  }
                };
                
                const dateRangeStr = getDateRangeString(dailySchedule);
                
                return (
                  <div className="flex items-center gap-3">
                    {!isPlanCompleted && (
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-750 text-white rounded-2xl gap-2 font-bold px-4 py-2 flex items-center shadow-sm"
                        onClick={handleCompletePlan}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Completed
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl gap-2 font-bold px-4 py-2"
                      onClick={() => setIsGenModalOpen(true)}
                    >
                      <RotateCw className="w-4 h-4" />
                      Regenerate Plan
                    </Button>
                    <div className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 rounded-2xl text-slate-600 font-bold text-sm shadow-sm">
                      <span>{dateRangeStr}</span>
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })()}
            </div>

            {activeStudyPlan ? (() => {
              let planObj = activeStudyPlan;
              if (typeof activeStudyPlan === 'string') {
                try {
                  planObj = JSON.parse(activeStudyPlan);
                } catch (e) {
                  console.error("Failed to parse activeStudyPlan", e);
                  planObj = {};
                }
              }
              const plan = planObj?.plan || planObj || {};
              const dailySchedule = Array.isArray(plan.daily_schedule) ? plan.daily_schedule : (Array.isArray(plan.schedule) ? plan.schedule : []);
              const tips = Array.isArray(plan.tips) ? plan.tips : [];
              const overview = plan.overview || "Your personalized study plan is ready.";
              
              // Helper to format individual date
              const formatDate = (dateStr) => {
                if (!dateStr) return "";
                try {
                  const d = new Date(dateStr);
                  if (isNaN(d.getTime())) return dateStr;
                  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
                } catch (e) {
                  return dateStr;
                }
              };

              // Helper for date range
              const getDateRangeString = (schedule) => {
                if (!Array.isArray(schedule) || schedule.length === 0) return "No Date Range";
                const firstDateStr = schedule[0]?.date;
                const lastDateStr = schedule[schedule.length - 1]?.date;
                if (!firstDateStr || !lastDateStr) return "Custom Range";
                
                try {
                  const d1 = new Date(firstDateStr);
                  const d2 = new Date(lastDateStr);
                  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
                    return `${firstDateStr} – ${lastDateStr}`;
                  }
                  
                  const day1 = d1.getDate();
                  const month1 = d1.toLocaleDateString("en-US", { month: "short" });
                  const year1 = d1.getFullYear();
                  
                  const day2 = d2.getDate();
                  const month2 = d2.toLocaleDateString("en-US", { month: "short" });
                  const year2 = d2.getFullYear();
                  
                  if (year1 === year2) {
                    if (month1 === month2) {
                      return `${day1} – ${day2} ${month1} ${year1}`;
                    }
                    return `${day1} ${month1} – ${day2} ${month2} ${year1}`;
                  }
                  return `${day1} ${month1} ${year1} – ${day2} ${month2} ${year2}`;
                } catch (e) {
                  return `${firstDateStr} – ${lastDateStr}`;
                }
              };

              const dateRangeStr = getDateRangeString(dailySchedule);

              // 1. Duration
              const uniqueDates = Array.isArray(dailySchedule) 
                ? [...new Set(dailySchedule.map(day => day?.date).filter(Boolean))] 
                : [];
              const durationDays = uniqueDates.length > 0 ? uniqueDates.length : dailySchedule.length;

              // Group daily schedule items by date
              const groupScheduleByDate = (schedule) => {
                if (!Array.isArray(schedule) || schedule.length === 0) return [];
                const groups = {};
                schedule.forEach(item => {
                  const dateStr = item?.date || "No Date";
                  if (!groups[dateStr]) {
                    groups[dateStr] = {
                      date: dateStr,
                      subjects: [],
                      duration_hours: 0,
                    };
                  }
                  groups[dateStr].subjects.push({
                    subject: item.subject,
                    topics: Array.isArray(item.topics) ? item.topics : (item.topics ? [item.topics] : []),
                    duration_hours: Number(item.duration_hours || item.hours || 0),
                  });
                  groups[dateStr].duration_hours += Number(item.duration_hours || item.hours || 0);
                });

                // Convert to sorted array of days
                return Object.values(groups).sort((a, b) => new Date(a.date) - new Date(b.date)).map((group, idx) => ({
                  day: idx + 1,
                  date: group.date,
                  subjects: group.subjects,
                  duration_hours: group.duration_hours,
                }));
              };

              const groupedSchedule = groupScheduleByDate(dailySchedule);

              // 2. Focus Subjects
              const subjects = Array.isArray(dailySchedule) 
                ? dailySchedule.map(day => (day?.subject ? String(day.subject).trim() : ""))
                    .filter(s => {
                      const lower = s.toLowerCase();
                      return lower && lower !== "review" && lower !== "revision" && lower !== "mock test" && lower !== "test" && lower !== "exam";
                    }) 
                : [];
              const uniqueSubjects = [...new Set(subjects)];
              const subjectsCount = uniqueSubjects.length;
              const subjectsListStr = uniqueSubjects.join(", ");
 
              // 3. Daily study hours range
              const hoursList = Array.isArray(dailySchedule)
                ? dailySchedule.map(day => Number(day?.duration_hours || day?.hours)).filter(h => !isNaN(h))
                : [];
              const minHours = hoursList.length > 0 ? Math.min(...hoursList) : 2;
              const maxHours = hoursList.length > 0 ? Math.max(...hoursList) : 4;
              const dailyHoursRangeStr = minHours === maxHours ? `${minHours} Hours` : `${minHours}–${maxHours} Hours`;
 
              // 4. Learning goals
              const getSubjectProgress = (subject) => {
                if (!Array.isArray(quizHistory) || quizHistory.length === 0 || !subject) return 40;
                const subLower = String(subject).toLowerCase();
                const matches = quizHistory.filter(q => 
                  q?.topic && (q.topic.toLowerCase().includes(subLower) || subLower.includes(q.topic.toLowerCase()))
                );
                if (matches.length > 0) {
                  const totalScore = matches.reduce((sum, q) => sum + (q?.score || 0), 0);
                  return Math.round(totalScore / matches.length);
                }
                return 40; // Fallback
              };

              const learningGoals = uniqueSubjects.slice(0, 2).map((subject, idx) => {
                const progress = getSubjectProgress(subject);
                if (idx === 0) {
                  return {
                    title: `Improve ${subject} score to 85%`,
                    progress: progress
                  };
                } else {
                  return {
                    title: `Understand ${subject} Concepts deeply`,
                    progress: progress
                  };
                }
              });
              const goalsCount = learningGoals.length;

              // 5. Weak Topics
              const getWeakTopics = () => {
                if (recommendations?.weak_topics && Array.isArray(recommendations.weak_topics) && recommendations.weak_topics.length > 0) {
                  return recommendations.weak_topics.slice(0, 3).filter(Boolean);
                }
                if (Array.isArray(quizHistory)) {
                  const lowQuizzes = quizHistory.filter(q => q && q.score !== null && q.score !== undefined && q.score < 70);
                  if (lowQuizzes.length > 0) {
                    return [...new Set(lowQuizzes.map(q => q.topic).filter(Boolean))].slice(0, 3);
                  }
                }
                const planTopics = [];
                if (Array.isArray(dailySchedule)) {
                  dailySchedule.forEach(day => {
                    if (day?.topics) {
                      if (Array.isArray(day.topics)) {
                        day.topics.forEach(t => {
                          if (t) planTopics.push(String(t));
                        });
                      } else {
                        planTopics.push(String(day.topics));
                      }
                    }
                  });
                }
                if (planTopics.length > 0) {
                  return [...new Set(planTopics)].slice(0, 3);
                }
                return ["Process Scheduling", "Relational Algebra", "Subnetting calculations"];
              };
              const weakTopics = getWeakTopics();

              // 6. Recommended Resources
              const getRecommendedResources = () => {
                if (recommendations?.recommended_materials && Array.isArray(recommendations.recommended_materials) && recommendations.recommended_materials.length > 0) {
                  return recommendations.recommended_materials.slice(0, 3).map(m => ({
                    name: m.resource || "Recommended Reading",
                    type: m.url?.includes("youtube") ? "Video" : "PDF"
                  }));
                }
                const planResources = [];
                if (Array.isArray(dailySchedule)) {
                  dailySchedule.forEach(day => {
                    if (day?.resources && Array.isArray(day.resources)) {
                      day.resources.forEach(r => {
                        if (r) {
                          planResources.push({
                            name: String(r),
                            type: String(r).toLowerCase().includes("video") ? "Video" : "PDF"
                          });
                        }
                      });
                    }
                  });
                }
                if (planResources.length > 0) {
                  const unique = [];
                  const seen = new Set();
                  for (const r of planResources) {
                    if (r.name && !seen.has(r.name)) {
                      seen.add(r.name);
                      unique.push(r);
                    }
                  }
                  return unique.slice(0, 3);
                }
                return [
                  { name: "DBMS Notes.pdf", type: "PDF" },
                  { name: "OS Process Scheduling", type: "Video" },
                  { name: "Computer Networks Handbook", type: "PDF" }
                ];
              };
              const recommendedResources = getRecommendedResources();

              const dayBadgeColors = [
                "bg-blue-50/70 border-blue-100 text-blue-700",
                "bg-emerald-50/70 border-emerald-100 text-emerald-700",
                "bg-amber-50/70 border-amber-100 text-amber-700",
                "bg-purple-50/70 border-purple-100 text-purple-700",
                "bg-pink-50/70 border-pink-100 text-pink-700",
                "bg-sky-50/70 border-sky-100 text-sky-700",
                "bg-teal-50/70 border-teal-100 text-teal-700"
              ];

              return (
                <div className="space-y-4">
                  {/* Top Summary Cards Grid */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Duration Card */}
                    <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Plan Duration</p>
                        <h3 className="text-xl font-bold text-slate-800 mt-0.5">{durationDays} {durationDays === 1 ? 'Day' : 'Days'}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">{dateRangeStr}</p>
                      </div>
                    </Card>

                    {/* Focus Subjects Card */}
                    <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Focus Subjects</p>
                        <h3 className="text-xl font-bold text-slate-800 mt-0.5">
                          {subjectsCount} {subjectsCount === 1 ? 'Subject' : 'Subjects'}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[140px]" title={subjectsListStr}>{subjectsListStr}</p>
                      </div>
                    </Card>

                    {/* Daily Study Time Card */}
                    <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Daily Study Time</p>
                        <h3 className="text-xl font-bold text-slate-800 mt-0.5">{dailyHoursRangeStr}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Recommended</p>
                      </div>
                    </Card>

                    {/* Goals Card */}
                    <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500 shrink-0">
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Goals</p>
                        <h3 className="text-xl font-bold text-slate-800 mt-0.5">{goalsCount} Goals</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">This Week</p>
                      </div>
                    </Card>
                  </div>

                  {/* Main Grid Columns Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* Left Timeline Card (Col span 9) */}
                    <Card className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm lg:col-span-9 flex flex-col lg:h-[calc(100vh-280px)]">
                      {isPlanCompleted ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in duration-500">
                          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4 shadow-sm border border-orange-200">
                            <CheckCircle className="w-8 h-8 animate-bounce" />
                          </div>
                          <h2 className="text-2xl font-black text-slate-800">Great Job! 🎉</h2>
                          <p className="text-sm font-semibold text-slate-500 mt-2 max-w-sm">
                            Congratulations! You have successfully completed your study plan. You've put in the work, and you are ready to ace your exams!
                          </p>
                          <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-center">
                            <Button 
                              onClick={() => setIsGenModalOpen(true)} 
                              className="h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Generate New Study Plan
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                const updated = { ...completedPlans };
                                delete updated[activeStudyPlanId];
                                setCompletedPlans(updated);
                                let userId = "default";
                                const storedUser = localStorage.getItem("currentUser");
                                if (storedUser) {
                                  try { userId = JSON.parse(storedUser).id; } catch (e) {}
                                }
                                localStorage.setItem(`completedStudyPlans_${userId}`, JSON.stringify(updated));
                              }}
                              className="text-xs text-slate-400 hover:text-slate-650 font-bold"
                            >
                              View Plan Details
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <CardHeader className="p-0 pb-4 shrink-0">
                            <CardTitle className="text-xl font-bold text-slate-800">Study Plan Overview</CardTitle>
                          </CardHeader>
                          <CardContent className="p-0 space-y-4 flex-1 flex flex-col min-h-0">
                        {/* Orange personalization banner */}
                        <div className="flex items-start gap-3 p-4 bg-orange-50/50 border border-orange-100/50 rounded-2xl text-orange-850 text-sm">
                          <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-orange-500" />
                          <p className="font-semibold">This plan is personalized based on your performance, quiz results, attendance and learning gaps.</p>
                        </div>

                        {/* Schedule list */}
                        <div className="divide-y divide-slate-100 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                          {groupedSchedule.map((day, idx) => {
                            const badgeStyle = dayBadgeColors[idx % dayBadgeColors.length];
                            return (
                              <div key={idx} className="py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 first:pt-0 last:pb-0">
                                {/* Day Badge */}
                                <div className={`w-32 px-4 py-3 rounded-2xl border text-center shrink-0 ${badgeStyle}`}>
                                  <p className="text-sm font-bold">Day {day.day}</p>
                                  <p className="text-[11px] mt-0.5 font-semibold opacity-90">{formatDate(day.date)}</p>
                                </div>

                                {/* Subjects & Topics List */}
                                <div className="flex-1 min-w-0 space-y-4">
                                  {day.subjects.map((sub, sIdx) => (
                                    <div key={sIdx}>
                                      <h4 className="font-bold text-slate-800 text-base">{sub.subject}</h4>
                                      <ul className="mt-1 space-y-1 text-slate-500 text-sm list-disc list-inside">
                                        {sub.topics.map((topic, tIdx) => (
                                          <li key={tIdx} className="font-medium">{String(topic)}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>

                                {/* Duration */}
                                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-sm shrink-0 mt-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{day.duration_hours} hrs</span>
                                </div>
                              </div>
                            );
                          })}
                          
                          <div className="py-4 flex justify-center border-t border-slate-100">
                            <Button
                              onClick={handleCompletePlan}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm flex items-center gap-2 transition-all text-xs"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark Plan as Completed
                            </Button>
                          </div>
                        </div>

                        {/* Green Tip Banner */}
                        <div className="flex items-center gap-3 p-4 bg-emerald-50/70 border border-emerald-100/50 rounded-2xl text-emerald-800 text-sm shrink-0">
                          <Lightbulb className="w-5 h-5 shrink-0 text-emerald-600" />
                          <p className="font-semibold">Tip: Stay consistent and take short breaks. You're doing great!</p>
                        </div>
                      </CardContent>
                      </>
                    )}
                  </Card>

                    {/* Right Sidebar Column (Col span 3) */}
                    <div className="lg:col-span-3 space-y-4 lg:h-[calc(100vh-280px)] lg:overflow-y-auto pr-1 custom-scrollbar">
                      {/* Learning Goals Card */}
                      {learningGoals.length > 0 && (
                        <Card className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                          <CardHeader className="p-0 pb-3">
                            <CardTitle className="text-lg font-bold text-slate-800">Learning Goals</CardTitle>
                          </CardHeader>
                          <CardContent className="p-0 space-y-4">
                            {learningGoals.map((goal, idx) => (
                              <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    {idx + 1}
                                  </div>
                                  <p className="text-sm font-bold text-slate-700 leading-snug">{goal.title}</p>
                                </div>
                                <div className="pl-9 space-y-1">
                                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                                    <span className="text-slate-400">Progress</span>
                                    <span className="text-slate-800">{goal.progress}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${goal.progress}%` }} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}



                      {/* Keep Going! Card */}
                      <div className="p-4 rounded-3xl bg-orange-50/50 border border-orange-100/50 text-orange-950 shadow-sm flex flex-col gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm shrink-0 font-bold text-sm">
                          ★
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-orange-950">Keep Going!</h4>
                          <p className="text-xs font-semibold text-orange-700/90 leading-relaxed mt-1">Consistency is the key to success. You've got this! 💪</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })() : (
              /* Beautiful Empty Onboarding Screen */
              <div className="flex flex-col items-center justify-center py-20 text-center max-w-xl mx-auto animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-6 shadow-sm border border-orange-100">
                  <GraduationCap className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">No Study Plan Active</h2>
                <p className="text-sm text-slate-400 mt-2 max-w-sm">Create a personalized, day-by-day revision schedule with AI to prepare for your upcoming exams.</p>
                <Button 
                  onClick={() => setIsGenModalOpen(true)} 
                  className="mt-6 h-12 px-6 bg-orange-500 hover:bg-orange-650 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
                >
                  <RotateCw className="w-4 h-4" />
                  Generate AI Study Plan
                </Button>
              </div>
            )}

            {/* Regenerate Plan Modal Popup */}
            {isGenModalOpen && (
              <div className="fixed inset-0 bg-black/20 z-[999] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Generate Study Plan</h3>
                      <p className="text-xs text-slate-400 mt-1">AI will create a day-by-day revision schedule</p>
                    </div>
                    <button 
                      onClick={() => setIsGenModalOpen(false)} 
                      className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Subjects (comma separated)</label>
                      <input 
                        value={studySubjects} 
                        onChange={e => setStudySubjects(e.target.value)} 
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all font-medium text-slate-700" 
                        placeholder="e.g. DBMS, Operating Systems, Computer Networks" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Syllabus / Topics to Cover (optional)</label>
                      <textarea 
                        value={studySyllabus} 
                        onChange={e => setStudySyllabus(e.target.value)} 
                        rows={3}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all font-medium text-slate-700 resize-none" 
                        placeholder="e.g. Relational algebra, SQL queries, Normalization, Process scheduling, Subnetting, Routing algorithms" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Exam Date</label>
                        <input 
                          type="date" 
                          value={studyExamDate} 
                          onChange={e => setStudyExamDate(e.target.value)} 
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-medium text-slate-700" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Daily Study Hours</label>
                        <input 
                          type="number" 
                          value={studyDailyHours} 
                          onChange={e => setStudyDailyHours(e.target.value)} 
                          min="1" 
                          max="12"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-medium text-slate-700" 
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleGenerateStudyPlan} 
                      disabled={isGeneratingPlan} 
                      className="w-full h-12 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-md mt-2 flex items-center justify-center gap-2"
                    >
                      {isGeneratingPlan ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>Generating AI Plan...</span>
                        </>
                      ) : (
                        <span>Generate AI Plan</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeItem === "Recommendations" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-black tracking-tight">AI Recommendations</h1>
              <p className="text-muted-foreground mt-1">Personalized guidance based on your recent quiz performance.</p>
            </div>

            {isRecsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Lightbulb className="w-12 h-12 mb-4 animate-pulse text-primary" />
                <p>Analyzing your performance...</p>
              </div>
            ) : !recommendations ? (
              <div className="text-center py-20 bg-[var(--card)] rounded-2xl border border-[var(--border)]">
                <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Take a quiz to generate personalized recommendations.</p>
                <Button onClick={() => setActiveItem("Quizzes")} className="mt-4">Go to Quizzes</Button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <AnalyticsCard title="Weak Topics Identified">
                    <ul className="space-y-3">
                      {recommendations.weak_topics?.length > 0 ? (
                        recommendations.weak_topics.map((topic, i) => (
                          <li key={i} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-red-600 font-medium">
                            <Target className="w-5 h-5" />
                            {topic}
                          </li>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No weak topics identified! Keep up the great work.</p>
                      )}
                    </ul>
                  </AnalyticsCard>

                  <AnalyticsCard title="Suggested Quizzes">
                    <ul className="space-y-3">
                      {recommendations.suggested_quizzes?.map((quiz, i) => (
                        <li key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span className="font-bold text-foreground">{quiz.topic}</span>
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-primary/10 text-primary">{quiz.difficulty}</span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">{quiz.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </AnalyticsCard>
                </div>

                <div className="space-y-8 lg:space-y-0 lg:h-full lg:flex lg:flex-col">
                  <AnalyticsCard title="Recommended Materials" className="lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
                    <ul className="space-y-3 max-h-[450px] lg:max-h-none lg:absolute lg:inset-6 overflow-y-auto custom-scrollbar pr-2">
                      {recommendations.recommended_materials?.map((mat, i) => (
                        <li key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-secondary" />
                            <span className="font-bold text-foreground">{mat.resource}</span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">For: {mat.topic}</p>
                          <p className="text-xs text-muted-foreground ml-6">{mat.reason}</p>
                          {mat.url && (
                            <a href={mat.url} target="_blank" rel="noopener noreferrer" className="ml-6 mt-1 text-xs text-blue-500 hover:underline flex items-center gap-1">
                              Go to Course →
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AnalyticsCard>
                </div>
              </div>
            )}
          </div>
        ) : activeItem === "Analytics" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Performance Analytics</h1>
              <p className="text-muted-foreground">Track your progress.</p>
            </div>

            {(() => {
              const totalQuizzes = quizHistory.length;
              const avgScore = totalQuizzes > 0 ? quizHistory.reduce((acc, q) => acc + q.score, 0) / totalQuizzes : 0;
              return (
                <>
                  <div className="grid sm:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Quizzes Taken" value={totalQuizzes} icon={FileText} />
                    <StatCard title="Average Score" value={`${avgScore.toFixed(1)}%`} icon={Target} trendColor="text-emerald-500" />
                    <StatCard title="Study Plans" value={studyPlans.length} icon={BookOpen} />
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    <AnalyticsCard title="Recent Quiz Performance">
                      <div className="h-[300px] mt-4">
                        {quizHistory.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={quizHistory.slice(0, 5).reverse()} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                              <XAxis dataKey="topic" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                              <Tooltip
                                cursor={{ fill: 'var(--muted)' }}
                                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                              />
                              <Bar dataKey="score" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <BarChartIcon className="w-8 h-8 mb-2 opacity-50" />
                            <p>No quiz data available.</p>
                          </div>
                        )}
                      </div>
                    </AnalyticsCard>

                    <AnalyticsCard title="Learning Trends">
                      <div className="h-[300px] mt-4">
                        {quizHistory.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={quizHistory.slice(0, 10).reverse()} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                              <XAxis dataKey="created_at" tickFormatter={(val) => new Date(val).toLocaleDateString()} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip
                                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                              />
                              <Line type="monotone" dataKey="score" stroke="#FB923C" strokeWidth={3} dot={{ r: 4, fill: '#FB923C', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
                            <p>Not enough data to show trends.</p>
                          </div>
                        )}
                      </div>
                    </AnalyticsCard>
                  </div>
                </>
              );
            })()}
          </div>
        ) : activeItem === "Chatbot" ? (
          <div className="flex h-full overflow-hidden animate-in fade-in duration-500 rounded-xl border border-border shadow-sm mt-4">
            {/* Sidebar for chat history */}
            <div className="w-1/4 min-w-[250px] border-r border-border bg-card/50 flex flex-col">
              <div className="p-4 border-b border-border flex justify-between items-center bg-card">
                <h3 className="font-bold text-foreground">Chat History</h3>
                <Button onClick={handleNewChat} size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary"><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {previousChats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`group p-3 rounded-xl cursor-pointer flex justify-between items-center transition-all ${selectedChatId === chat.id ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted bg-background border border-border/50 text-foreground'}`}
                  >
                    <div className="truncate text-sm font-medium pr-2">
                      {chat.title || "New chat"}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${selectedChatId === chat.id ? 'text-primary-foreground hover:bg-primary-foreground/20' : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'}`}
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-background/50 relative">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4 pb-32">
                {selectedMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">How can I help you learn today?</h2>
                    <p className="text-sm mt-2 max-w-md text-muted-foreground">Ask me to summarize uploaded documents, explain complex topics, or generate practice questions.</p>
                  </div>
                ) : (
                  selectedMessages.map((msg, i) => (
                    <ChatBubble
                      key={i}
                      message={msg.text}
                      isUser={msg.isUser}
                      sources={msg.sources}
                    />
                  ))
                )}
                {isChatSending && (
                  <ChatBubble message="" isUser={false} isTyping={true} />
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-10">
                <div className="max-w-4xl mx-auto flex flex-col gap-2">
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-2">
                      {attachedFiles.map((f, i) => (
                        <div key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end gap-2 w-full">
                    <ChatInput
                      input={chatInput}
                      setInput={setChatInput}
                      onSubmit={handleSendChat}
                      isSending={isChatSending}
                      onAttachClick={() => document.getElementById('chat-file-upload').click()}
                    />
                    <input
                      type="file"
                      id="chat-file-upload"
                      multiple
                      className="hidden"
                      onChange={handleAttachFiles}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-muted-foreground">Under Construction</h2>
          </div>
        )}
      </div>

      {activeItem !== "Quizzes" && isChatbotVisible && portalTarget && createPortal((
        <div className={`absolute z-[9999] bg-card border border-border shadow-2xl transition-all duration-300 flex flex-col overflow-hidden ${chatbotMode === "maximized"
            ? "inset-4 rounded-xl"
            : "bottom-24 right-8 w-[450px] h-[550px] rounded-2xl"
          }`}>
          {/* Header */}
          <div className="bg-[#0F172A] text-white px-4 py-3 flex justify-between items-center shrink-0 z-10 shadow-sm">
            <div className="font-bold flex items-center gap-2">
              <img src="/kx-robot.png" alt="KnowledgeX Copilot" className="w-6 h-6 object-contain" />
              KnowledgeX Copilot
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-full" onClick={() => setIsChatbotVisible(false)} title="Minimize">
                <Minus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-full" onClick={() => { setChatbotMode(chatbotMode === "maximized" ? "normal" : "maximized"); setIsChatHistoryOpen(true); }} title="Maximize">
                <Maximize className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-full" onClick={() => setIsChatbotVisible(false)} title="Close">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden bg-background">
            {/* Sidebar */}
            {chatbotMode === "maximized" && (
              <div className={`${isChatHistoryOpen ? 'w-64' : 'w-[60px]'} border-r border-border bg-card/80 flex flex-col shrink-0 transition-all duration-300 ${isChatHistoryOpen ? 'overflow-hidden' : 'overflow-visible'}`}>
                {isChatHistoryOpen ? (
                  <>
                    <div className="p-4 border-b border-border/50 flex items-center justify-between gap-2">
                      <Button onClick={handleNewChat} variant="outline" className="flex-1 justify-center shadow-sm bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-200 hover:border-orange-300 transition-all font-semibold">
                        New chat
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setIsChatHistoryOpen(false)} title="Close Sidebar" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground">
                        <PanelLeftClose className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="px-4 pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Recents
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
                      {previousChats.map(chat => (
                        <div
                          key={chat.id}
                          onClick={() => setSelectedChatId(chat.id)}
                          className={`group px-3 py-2.5 rounded-xl cursor-pointer flex justify-between items-center transition-all ${selectedChatId === chat.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}
                        >
                          <span className="truncate text-sm pr-2">{chat.title || "New chat"}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${selectedChatId === chat.id ? 'text-primary hover:text-red-500 hover:bg-red-500/10' : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'}`}
                            onClick={(e) => handleDeleteChat(e, chat.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-4 space-y-4">
                    <div className="relative group">
                      <Button variant="ghost" size="icon" onClick={() => setIsChatHistoryOpen(true)} className="w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground">
                        <PanelLeftOpen className="w-5 h-5" />
                      </Button>
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity font-medium">Open sidebar</div>
                    </div>

                    <div className="relative group">
                      <Button variant="ghost" size="icon" onClick={handleNewChat} className="w-10 h-10 rounded-xl text-orange-600 hover:bg-orange-100 transition-colors">
                        <SquarePen className="w-5 h-5" />
                      </Button>
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity font-medium">New chat</div>
                    </div>

                    <div className="relative group">
                      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-muted-foreground hover:bg-muted transition-colors" onClick={() => setActiveMiniPopover(activeMiniPopover === 'search' ? null : 'search')}>
                        <Search className="w-5 h-5" />
                      </Button>
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity font-medium">Search</div>

                      {activeMiniPopover === 'search' && (
                        <div className="absolute left-full top-[-50px] ml-4 w-80 bg-card border border-border shadow-2xl rounded-2xl p-3 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                          <input type="text" placeholder="Search chats..." className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm" />
                          <div className="text-xs font-semibold text-muted-foreground mb-2 px-1">Today</div>
                          <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {previousChats.map(chat => (
                              <div key={chat.id} className="text-sm truncate px-3 py-2 hover:bg-muted rounded-lg cursor-pointer flex items-center gap-3 transition-colors" onClick={() => { setSelectedChatId(chat.id); setActiveMiniPopover(null); }}>
                                <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                                {chat.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative group">
                      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-muted-foreground hover:bg-muted transition-colors" onClick={() => setActiveMiniPopover(activeMiniPopover === 'recents' ? null : 'recents')}>
                        <MessageSquare className="w-5 h-5" />
                      </Button>
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity font-medium">Recents</div>

                      {activeMiniPopover === 'recents' && (
                        <div className="absolute left-full top-[-50px] ml-4 w-72 bg-card border border-border shadow-2xl rounded-2xl p-2 z-50 flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                          <div className="text-[13px] font-bold mb-2 px-3 pt-2 text-foreground tracking-wide">Recents</div>
                          <div className="flex flex-col gap-0.5">
                            {previousChats.map(chat => (
                              <div key={chat.id} className="text-sm truncate px-3 py-2.5 hover:bg-muted rounded-lg cursor-pointer transition-colors" onClick={() => { setSelectedChatId(chat.id); setActiveMiniPopover(null); }}>
                                {chat.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative bg-background/50">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-32 custom-scrollbar">
                {selectedMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                    <Bot className="w-12 h-12 text-primary mb-3 opacity-50" />
                    <h3 className="font-bold text-foreground">Hi there! How can I be of help to you?</h3>
                  </div>
                ) : (
                  selectedMessages.map((msg, i) => (
                    <ChatBubble
                      key={i}
                      message={msg.text}
                      isUser={msg.isUser}
                      sources={msg.sources}
                    />
                  ))
                )}
                {isChatSending && (
                  <ChatBubble message="" isUser={false} isTyping={true} />
                )}
              </div>

              {/* Input Area */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-10 pointer-events-none">
                <div className="max-w-4xl mx-auto flex flex-col gap-2 pointer-events-auto bg-background/80 backdrop-blur-sm rounded-3xl p-1 shadow-sm border border-border">
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1 px-3 pt-2">
                      {attachedFiles.map((f, i) => (
                        <div key={i} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-semibold rounded-full border border-primary/20 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end gap-2 w-full">
                    <ChatInput
                      input={chatInput}
                      setInput={setChatInput}
                      onSubmit={handleSendChat}
                      isSending={isChatSending}
                      onAttachClick={() => document.getElementById('popup-chat-file-upload').click()}
                    />
                    <input
                      type="file"
                      id="popup-chat-file-upload"
                      multiple
                      className="hidden"
                      onChange={handleAttachFiles}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ), portalTarget)}

      {activeItem !== "Quizzes" && (
        <CopilotFloatingButton onClick={() => { setIsChatbotVisible(!isChatbotVisible); setChatbotMode("normal"); }} />
      )}
    </DashboardLayout>
  );
}
