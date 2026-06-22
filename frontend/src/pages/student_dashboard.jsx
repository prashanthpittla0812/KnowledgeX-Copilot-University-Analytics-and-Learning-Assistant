import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { chatbotApi, documentApi, studentApi, materialApi } from "../api";
import {DashboardLayout} from "../components/layout/DashboardLayout";
      import {LearningResourcesTab} from "../components/student/LearningResourcesTab";
      import {StudentAssessmentView} from "../components/student/StudentAssessmentView";
      import {Card, CardHeader, CardTitle, CardContent} from "../components/ui/card";
      import {StatCard} from "../components/ui/stat-card";
      import {AnalyticsCard} from "../components/ui/analytics-card";
      import {ChatBubble, ChatInput} from "../components/ui/chat";
      import {Button} from "../components/ui/button";
      import {BookOpen, AlertCircle, FileText, Calendar, CheckCircle, BarChart as BarChartIcon, GraduationCap, Target, Lightbulb, TrendingUp, X, Trash2, PanelLeftClose, PanelLeftOpen, Maximize, Minus, Plus, Bot, Paperclip, SquarePen, Search, MessageSquare, RotateCw, Sparkles, Play, Clock, History, Award, ChevronRight, ArrowDown} from "lucide-react";
      import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, RadialBarChart, RadialBar, Legend} from "recharts";
      import CopilotFloatingButton from "./CopilotFloatingButton";

      export default function StudentDashboard() {
  const navigate = useNavigate();
      const pdfInputRef = useRef(null);
      const [userName, setUserName] = useState("Student");
      const [studentId, setStudentId] = useState(null);
      const [activeItem, setActiveItem] = useState("Dashboard");
      const [activeAssessmentTab, setActiveAssessmentTab] = useState("Active");
      const [selectedQuizPeriod, setSelectedQuizPeriod] = useState("All Time");
      const [selectedTrendPeriod, setSelectedTrendPeriod] = useState("All Time");
      const [selectedSkillSubject, setSelectedSkillSubject] = useState("All Subjects");

      // Chatbot State
      const [chatInput, setChatInput] = useState("");
      const [isChatSending, setIsChatSending] = useState(false);
      const [isLoading, setIsLoading] = useState(false);
      const [loadingQuizId, setLoadingQuizId] = useState(null);
      const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
      const [loadingMessage, setLoadingMessage] = useState("Generate AI Quiz");

  useEffect(() => {
        let interval;
      if (isGeneratingQuiz) {
      const messages = [
      "🧠 AI is analyzing the topic...",
      "⚙️ Generating questions...",
      "⚖️ Calibrating difficulty...",
      "✨ Finalizing your quiz..."
      ];
      let i = 0;
      setLoadingMessage(messages[0]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
      setLoadingMessage(messages[i]);
      }, 2000);
    } else {
        setLoadingMessage("Generate AI Quiz");
    }
    return () => clearInterval(interval);
  }, [isGeneratingQuiz]);
      const [attachedFiles, setAttachedFiles] = useState([]);
      const [portalTarget, setPortalTarget] = useState(null);

  const [previousChats, setPreviousChats] = useState(() => {
        let userId = "default";
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
      try {userId = JSON.parse(storedUser).id; } catch (e) { }
    }
      const stored = localStorage.getItem(`studentChats_${userId}`);
      return stored ? JSON.parse(stored) : [
        {id: Date.now(), title: "New chat", messages: [] }
      ];
  });
      const [selectedChatId, setSelectedChatId] = useState(previousChats[0]?.id || null);
      const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(true);
      const [activeMiniPopover, setActiveMiniPopover] = useState(null);
      const [isChatbotVisible, setIsChatbotVisible] = useState(false);
      const [chatbotMode, setChatbotMode] = useState("minimized");
      const [chatHistoryCollapsed, setChatHistoryCollapsed] = useState(false);

      const messagesEndRef = useRef(null);
      const [isAtBottom, setIsAtBottom] = useState(true);

  const handleChatScroll = (e) => {
    const {scrollTop, scrollHeight, clientHeight} = e.target;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 20);
  };

  useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [previousChats, selectedChatId, isChatSending]);
      // Quiz States
      const [quizSubject, setQuizSubject] = useState("Computer Networks");
      const [quizTopic, setQuizTopic] = useState("");
      const [quizDifficulty, setQuizDifficulty] = useState("medium");
      const [quizNumQuestions, setQuizNumQuestions] = useState(0);
      const [activeQuiz, setActiveQuiz] = useState(null);
      const [selectedAnswers, setSelectedAnswers] = useState({ });
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
      try {userId = JSON.parse(storedUser).id; } catch (e) { }
    }
      const stored = localStorage.getItem(`completedStudyPlans_${userId}`);
      return stored ? JSON.parse(stored) : { };
  });

      const isPlanCompleted = activeStudyPlanId && completedPlans[activeStudyPlanId];

  const handleCompletePlan = () => {
    if (!activeStudyPlanId) return;
      let userId = "default";
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
      try {userId = JSON.parse(storedUser).id; } catch (e) { }
    }
      const updated = {...completedPlans, [activeStudyPlanId]: true };
      setCompletedPlans(updated);
      localStorage.setItem(`completedStudyPlans_${userId}`, JSON.stringify(updated));

      // Clear the active plan from view once completed
      setActiveStudyPlan(null);
      setActiveStudyPlanId(null);
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

  const formatTopicForDisplay = (topic) => {
    if (!topic) return "";
      const match1 = topic.match(/Specific Topic: (.*?) \(Category: .*?\)/i);
      if (match1) return match1[1];
      const match2 = topic.match(/^(.*?) - (.*?)$/);
      if (match2) return match2[2];
      return topic;
  };

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
      if (activeItem === "Quizzes" || activeItem === "Assessments" || activeItem === "Analytics") {
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
    const newChat = {id: Date.now(), title: "New chat", messages: [] };
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

  const handleRemoveFile = (indexToRemove) => {
    setAttachedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSendChat = async (isVoiceInput = false) => {
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
      messages: [...messages, {text: userText, isUser: true, inputType: isVoiceInput === true ? "VOICE" : "TEXT" }]
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
      isUser: false,
      inputType: "TEXT"
              }]
            };
          });
      setPreviousChats(currentChats);
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Summary of uploaded documents: ${summaryRes.summary}`));
          }
        } catch (e) {
          console.error("Batch summary error", e);
          throw e;
        }
      } else if (message) {
        try {
          // If we want the bot to specifically focus on the newly uploaded docs,
          // we pass uploadedIds to the askQuestion API.
          const response = await chatbotApi.askQuestion(message, uploadedIds, isVoiceInput === true ? "VOICE" : "TEXT");
          const answerText = response.answer || response.data?.answer || "Sorry, I could not process that.";
          currentChats = currentChats.map((chat) => {
            if (chat.id !== selectedChatId) return chat;
      return {
        ...chat,
        messages: [...(chat.messages || []), {
        text: answerText,
      sources: response.sources || response.data?.sources || [],
      isUser: false,
      inputType: "TEXT"
              }]
            };
          });
      setPreviousChats(currentChats);
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(answerText));
          }
        } catch (e) {
          console.error(e);
          throw e;
        }
      }

      localStorage.setItem(`studentChats_${studentId || "default"}`, JSON.stringify(currentChats));
    } catch (error) {
        console.error("Error sending chat:", error);
        const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || "Failed to process the request or load the model. Please try again.";
        const updatedChats = currentChats.map((chat) => {
          if (chat.id !== selectedChatId) return chat;
          return {
            ...chat,
            messages: [...(chat.messages || []), {
              text: `⚠️ **Error:** ${errorMsg}`,
              isUser: false,
              inputType: "TEXT"
            }]
          };
        });
        setPreviousChats(updatedChats);
        localStorage.setItem(`studentChats_${studentId || "default"}`, JSON.stringify(updatedChats));
    } finally {
        setIsLoading(false);
      setIsChatSending(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) return alert("Enter a specific topic");
      const numQ = Number(quizNumQuestions);
      if (!numQ || numQ < 1 || numQ > 25) return alert("Enter a valid number of questions between 1 and 25");
      setIsGeneratingQuiz(true);
      setIsLoading(true);
      try {
      const combinedTopic = quizSubject === "Other" ? quizTopic : `Specific Topic: ${quizTopic} (Category: ${quizSubject})`;
      const response = await studentApi.generateQuiz({topic: combinedTopic, difficulty: quizDifficulty, number_of_questions: numQ });
      setActiveQuiz({id: response.data.quiz_id, topic: response.data.topic, difficulty: response.data.difficulty, questions: response.data.quiz });
      setSelectedAnswers({ });
    } catch (error) {
        alert("Failed to generate quiz");
    } finally {
        setIsGeneratingQuiz(false);
      setIsLoading(false);
    }
  };

  const handleTakeAssignedQuiz = async (quiz) => {
        setLoadingQuizId(quiz.id);
      try {
      const response = await studentApi.getAssignedQuiz(quiz.id);
      setActiveQuiz({
        id: quiz.id,
      topic: quiz.topic_name,
      difficulty: quiz.difficulty,
      questions: response.data.questions,
      isAssigned: true
      });
      setSelectedAnswers({ });
    } catch (error) {
        alert("Failed to load assigned quiz");
    } finally {
        setLoadingQuizId(null);
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
      fetchQuizHistory();
      fetchDashboardStats();
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
                <StatCard title="Quizzes Taken" value={dashboardStats?.quizzes_taken ?? "0"} icon={CheckCircle} description="Total practice quizzes" colorClass="bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-indigo-500/20" />
                <StatCard title="Average Score" value={`${dashboardStats?.average_quiz_score ?? 0}%`} icon={Target} description="All time average" colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20" />
                <StatCard title="Study Streak" value={`${dashboardStats?.study_streak ?? 0} ${dashboardStats?.study_streak === 1 ? 'day' : 'days'}`} icon={TrendingUp} description="Keep it up!" colorClass="bg-gradient-to-br from-sky-400 to-sky-600 shadow-sky-500/20" />
                <StatCard title="Docs Uploaded" value={dashboardStats?.documents_uploaded ?? "0"} icon={FileText} description="Total resources" colorClass="bg-gradient-to-br from-violet-400 to-violet-600 shadow-violet-500/20" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <AnalyticsCard title="Quick Launch" className="min-h-[240px]">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <div
                      onClick={() => setActiveItem("Study Plan")}
                      className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group"
                    >
                      <div className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-orange-500/30 shadow-lg group-hover:scale-110 transition-transform">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-orange-900 text-center">Generate Study Plan</p>
                    </div>
                    <div
                      onClick={() => setActiveItem("Quizzes")}
                      className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group"
                    >
                      <div className="w-14 h-14 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-indigo-500/30 shadow-lg group-hover:scale-110 transition-transform">
                        <Target className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-indigo-900 text-center">Take a Practice Quiz</p>
                    </div>
                  </div>
                </AnalyticsCard>

                <AnalyticsCard title="AI Insights" className="min-h-[240px] bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                  <div className="flex flex-col justify-center h-full space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg text-blue-900">Your Learning Pulse</h3>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      💡 You've maintained a {dashboardStats?.study_streak ?? 0}-day study streak and taken {(dashboardStats?.quizzes_taken ?? 0)} quizzes. Keep up the momentum by focusing on your weak areas today!
                    </p>
                    <Button variant="outline" className="w-fit mt-2 border-blue-300 text-blue-700 hover:bg-blue-100 hover:text-blue-900" onClick={() => setActiveItem("Recommendations")}>
                      View Recommendations
                    </Button>
                  </div>
                </AnalyticsCard>
              </div>


            </div>
          ) : activeItem === "Quizzes" ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {quizResult ? (
                <div className="max-w-3xl mx-auto">
                  <div className="flex justify-between items-center mb-4">
                    <Button variant="ghost" onClick={() => { setQuizResult(null); setQuizTopic(""); setQuizDifficulty("medium"); setQuizNumQuestions(0); }} className="pl-0 hover:bg-transparent hover:text-primary">← Back to Quizzes</Button>
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
                    <h2 className="text-2xl font-bold">{formatTopicForDisplay(activeQuiz.topic)} Quiz</h2>
                    <span className="px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">{activeQuiz.difficulty}</span>
                  </div>
                  <div className="space-y-6">
                    {activeQuiz.questions.map((q, i) => (
                      <Card key={i} className="glass-card">
                        <CardContent className="p-6">
                          <p className="font-bold text-foreground mb-4"><span className="text-primary mr-2">Q{i + 1}.</span>{q.question}</p>
                          {!q.options || q.options.length === 0 ? (
                            <div className="mt-2">
                              <input
                                type="text"
                                value={selectedAnswers[i] || ""}
                                onChange={(e) => setSelectedAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                                placeholder="Type your answer here..."
                                className="w-full max-w-md rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all text-slate-800"
                              />
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {q.options.map((opt, j) => (
                                <label key={j} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border ${selectedAnswers[i] === opt ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:border-primary/50"}`}>
                                  <input type="radio" name={`q-${i}`} value={opt} checked={selectedAnswers[i] === opt} onChange={() => setSelectedAnswers(prev => ({ ...prev, [i]: opt }))} className="text-primary" />
                                  <span className={`text-sm font-medium ${selectedAnswers[i] === opt ? "text-foreground" : "text-muted-foreground"}`}>
                                    <span className="font-bold mr-2 uppercase">{String.fromCharCode(97 + j)})</span> {opt}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                          {selectedAnswers[i] && (
                            <div className="flex justify-end mt-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAnswers(prev => {
                                    const newAnswers = { ...prev };
                                    delete newAnswers[i];
                                    return newAnswers;
                                  });
                                }}
                                className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                                Clear
                              </button>
                            </div>
                          )}
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
                          <h4 className="text-lg font-bold truncate">{formatTopicForDisplay(q.topic)}</h4>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-semibold mb-1 block">Subject</label>
                            <select value={quizSubject} onChange={e => setQuizSubject(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none">
                              <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                              <option value="Computer Networks">Computer Networks</option>
                              <option value="Operating Systems">Operating Systems</option>
                              <option value="Database Management Systems">Database Management Systems</option>
                              <option value="Java Programming">Java Programming</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-semibold mb-1 block">Specific Topic</label>
                            <input value={quizTopic} onChange={e => setQuizTopic(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g., Data Structures" />
                          </div>
                        </div>
                        <div>
                          {recentMaterials && recentMaterials.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 items-center">
                              <span className="text-xs font-semibold text-muted-foreground">Suggested:</span>
                              {recentMaterials.slice(0, 3).map((m, idx) => (
                                <button key={idx} onClick={() => setQuizTopic(m.title)} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-colors border border-primary/20">
                                  {m.title.length > 25 ? m.title.substring(0, 25) + "..." : m.title}
                                </button>
                              ))}
                            </div>
                          )}
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
                            <input type="number" value={quizNumQuestions} onChange={e => setQuizNumQuestions(Number(e.target.value) > 25 ? 25 : e.target.value)} min="0" max="25" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
                          </div>
                        </div>
                        <Button onClick={handleGenerateQuiz} disabled={isGeneratingQuiz || isLoading} className="w-full h-11 transition-all disabled:opacity-100 disabled:bg-orange-400 disabled:text-white font-bold">{loadingMessage}</Button>
                      </div>
                    </AnalyticsCard>

                    <AnalyticsCard title="Recent History" className="h-full">
                      <div className="flex flex-col h-full space-y-4">
                        {(!quizHistory || quizHistory.length === 0) ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                            <History className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No quizzes taken yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                            {quizHistory.slice(0, 3).map((q, i) => (
                              <div key={i} className="flex justify-between items-center p-3 rounded-lg border bg-card/50 hover:bg-accent/5 transition-colors">
                                <div className="min-w-0 pr-3">
                                  <h4 className="font-semibold text-sm truncate">{formatTopicForDisplay(q.topic)}</h4>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{q.difficulty}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className={`text-sm font-black ${q.score >= 70 ? "text-emerald-500" : q.score >= 40 ? "text-orange-500" : "text-red-500"}`}>
                                    {q.score !== null ? `${Math.round(q.score)}%` : "N/A"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <Button variant="ghost" className="w-full text-xs shrink-0" onClick={() => setShowPastQuizzes(true)}>
                          View All History <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </AnalyticsCard>
                  </div>

                  {assignedQuizzes.filter(q => !q.question_type || !q.question_type.startsWith('Assessment')).length > 0 && (
                    <div className="mb-10">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <BookOpen className="text-primary w-6 h-6" />
                        Assigned Quizzes (From Faculty)
                      </h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignedQuizzes.filter(q => !q.question_type || !q.question_type.startsWith('Assessment')).map((q, i) => (
                          <Card key={q.id} className="glass-card border-primary/30 bg-primary/5 hover:border-primary transition-colors">
                            <CardContent className="p-6">
                              <h4 className="text-lg font-bold truncate">{formatTopicForDisplay(q.topic_name)}</h4>
                              <p className="text-xs text-muted-foreground mt-1 mb-4">By {q.teacher_name} • {q.num_questions} Questions</p>
                              {q.is_completed ? (
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-600 text-white cursor-not-allowed" disabled>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Quiz Taken
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleTakeAssignedQuiz(q)}
                                  className="w-full"
                                  disabled={loadingQuizId === q.id}
                                >
                                  {loadingQuizId === q.id ? "Loading..." : "Take Quiz"}
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
          ) : activeItem === "Assessments" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h1 className="text-3xl font-black tracking-tight">Assessments</h1>
                  <p className="text-muted-foreground">View and submit your assigned assessments.</p>
                </div>
              </div>

              <div className="flex space-x-2 border-b border-slate-200 mb-6">
                <button
                  className={`py-2 px-4 font-semibold text-sm transition-colors ${activeAssessmentTab === "Active" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setActiveAssessmentTab("Active")}
                >
                  Active
                </button>
                <button
                  className={`py-2 px-4 font-semibold text-sm transition-colors ${activeAssessmentTab === "Completed" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setActiveAssessmentTab("Completed")}
                >
                  Completed
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedQuizzes
                  .filter(q => q.question_type && q.question_type.startsWith('Assessment'))
                  .filter(q => activeAssessmentTab === "Active" ? !q.is_completed : q.is_completed)
                  .map((q, i) => (
                    <Card key={q.id} className="glass-card border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveItem(`Assessment_${q.id}`)}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md">
                            {q.question_type}
                          </span>
                          {q.is_completed && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2">{q.topic_name}</h4>
                        <p className="text-xs text-slate-500 mb-4">By {q.teacher_name}</p>

                        <div className="flex items-center text-xs text-slate-600 font-medium">
                          <FileText className="w-4 h-4 mr-1.5" />
                          {q.num_questions} Questions
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {assignedQuizzes.filter(q => q.question_type && q.question_type.startsWith('Assessment')).filter(q => activeAssessmentTab === "Active" ? !q.is_completed : q.is_completed).length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 mb-1">No {activeAssessmentTab.toLowerCase()} assessments</h3>
                  <p className="text-slate-500">You don't have any {activeAssessmentTab.toLowerCase()} assessments right now.</p>
                </div>
              )}
            </div>
          ) : activeItem === "Learning Resources" ? (
            <LearningResourcesTab />
          ) : activeItem === "Study Plan" ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!isGenModalOpen ? (
                <>
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
                            className="border border-slate-100 bg-white hover:bg-slate-50 hover:shadow-md text-slate-600 rounded-3xl gap-2 font-bold px-5 py-2.5 shadow-sm transition-all"
                            onClick={() => setIsGenModalOpen(true)}
                          >
                            <RotateCw className="w-4 h-4" />
                            Regenerate Plan
                          </Button>
                          <div className="flex items-center gap-2 border border-slate-100 bg-white px-5 py-2.5 rounded-3xl text-slate-600 font-bold text-sm shadow-sm transition-all">
                            <span>{isPlanCompleted ? '-' : dateRangeStr}</span>
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
                      if (!Array.isArray(quizHistory) || quizHistory.length === 0 || !subject) return null;
                      const subLower = String(subject).toLowerCase();
                      const matches = quizHistory.filter(q =>
                        q?.topic && (q.topic.toLowerCase().includes(subLower) || subLower.includes(q.topic.toLowerCase()))
                      );
                      if (matches.length > 0) {
                        const totalScore = matches.reduce((sum, q) => sum + (q?.score || 0), 0);
                        return Math.round(totalScore / matches.length);
                      }
                      return null; // No data yet
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
                          <StatCard
                            title="Plan Duration"
                            value={`${isPlanCompleted ? 0 : durationDays} ${isPlanCompleted ? 'Days' : (durationDays === 1 ? 'Day' : 'Days')}`}
                            icon={Calendar}
                            description={isPlanCompleted ? '-' : dateRangeStr}
                            colorClass="bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/20"
                          />
                          <StatCard
                            title="Focus Subjects"
                            value={`${isPlanCompleted ? 0 : subjectsCount} ${isPlanCompleted ? 'Subjects' : (subjectsCount === 1 ? 'Subject' : 'Subjects')}`}
                            icon={BookOpen}
                            description={isPlanCompleted ? '-' : subjectsListStr}
                            colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20"
                          />
                          <StatCard
                            title="Daily Study Time"
                            value={isPlanCompleted ? '0 Hours' : dailyHoursRangeStr}
                            icon={Clock}
                            description="Recommended"
                            colorClass="bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20"
                          />
                          <StatCard
                            title="Goals"
                            value={`${isPlanCompleted ? 0 : goalsCount} ${isPlanCompleted ? 'Goals' : (goalsCount === 1 ? 'Goal' : 'Goals')}`}
                            icon={Target}
                            description="AI Generated"
                            colorClass="bg-gradient-to-br from-pink-400 to-pink-600 shadow-pink-500/20"
                          />
                        </div>

                        {/* Main Grid Columns Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                          {/* Left Timeline Card (Col span 9) */}
                          <Card className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm lg:col-span-9 flex flex-col lg:h-[calc(100vh-200px)]">
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
                                        try { userId = JSON.parse(storedUser).id; } catch (e) { }
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
                          <div className="lg:col-span-3 space-y-4 lg:h-[calc(100vh-200px)] lg:overflow-y-auto pr-1 custom-scrollbar">
                            {/* Learning Goals Card */}
                            {!isPlanCompleted && learningGoals.length > 0 && (
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
                                          <span className={goal.progress !== null ? "text-slate-800" : "text-slate-400"}>
                                            {goal.progress !== null ? `${goal.progress}%` : "Not Started"}
                                          </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                          <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${goal.progress || 0}%` }} />
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
                </>
              ) : (
                <div className="flex-1 min-h-[50vh]" />
              )}

              {/* Regenerate Plan Modal Popup */}
              {isGenModalOpen && createPortal(
                <div
                  className="absolute inset-0 bg-transparent z-[999] flex items-center justify-center p-4"
                  onClick={() => setIsGenModalOpen(false)}
                >
                  <div
                    className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-lg shadow-[0_20px_50px_rgba(15,23,42,0.15)] border-t-4 border-t-orange-500 animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                </div>,
                document.getElementById("main-workspace") || document.body
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
                              <span className="font-bold text-foreground">{formatTopicForDisplay(quiz.topic)}</span>
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
                            <p className="text-xs text-muted-foreground ml-6">For: {formatTopicForDisplay(mat.topic)}</p>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                  <BarChartIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-800">Performance Analytics</h1>
                  <p className="text-sm font-semibold text-slate-500">Track your progress and learning trends.</p>
                </div>
              </motion.div>

              {(() => {
                const totalQuizzes = quizHistory.length;
                const avgScore = totalQuizzes > 0 ? quizHistory.reduce((acc, q) => acc + q.score, 0) / totalQuizzes : 0;

                const topicScores = {};
                quizHistory.forEach(q => {
                  if (!topicScores[q.topic]) topicScores[q.topic] = { total: 0, count: 0 };
                  topicScores[q.topic].total += q.score;
                  topicScores[q.topic].count += 1;
                });
                const topicMasteryData = Object.keys(topicScores).map(topic => {
                  const cleanTopic = formatTopicForDisplay(topic);
                  return {
                    topic: cleanTopic.length > 10 ? cleanTopic.substring(0, 10) + '...' : cleanTopic,
                    fullTopic: cleanTopic,
                    score: Math.round(topicScores[topic].total / topicScores[topic].count)
                  };
                });
                const weakTopics = topicMasteryData.filter(t => t.score < 60);

                const subjectMap = {
                  "Artificial Intelligence": ["artificial intelligence", "ai", "machine learning", "deep learning", "neural network", "natural language processing", "nlp"],
                  "Data Structures & Algorithms": ["data structures", "algorithms", "dsa", "tree", "graph", "sorting", "searching", "stack", "queue", "array", "arrays", "linked list"],
                  "Computer Networks": ["network", "networks", "physical layer", "osi", "tcp", "ip", "ethernet", "routing"],
                  "Operating Systems": ["operating system", "operating systems", "os", "process", "thread", "memory management", "scheduling"],
                  "Database Management Systems": ["database", "dbms", "sql", "query", "schema", "normalization", "nosql"],
                  "Java Programming": ["java", "object oriented", "oop", "class", "inheritance", "polymorphism", "exception"],
                  "Other": []
                };

                const filteredSkillData = selectedSkillSubject === "All Subjects"
                  ? topicMasteryData
                  : topicMasteryData.filter(t => (subjectMap[selectedSkillSubject] || []).some(sub => t.fullTopic.toLowerCase().includes(sub)));
                const subjectColors = {
                  "Data Structures & Algorithms": "url(#mathGradient)",
                  "Computer Networks": "url(#csGradient)",
                  "Operating Systems": "url(#dataGradient)",
                  "Database Management Systems": "url(#gkGradient)",
                  "Java Programming": "url(#barGradient)",
                  "default": "url(#barGradient)"
                };

                const getSubjectForTopic = (topic) => {
                  if (!topic) return "Other";
                  const match = topic.match(/Category: (.*?)\)/i);
                  if (match && subjectMap[match[1]]) return match[1];
                  const t = topic.toLowerCase();
                  for (const [subject, keywords] of Object.entries(subjectMap)) {
                    if (subject === "Other") continue;
                    if (t.includes(subject.toLowerCase())) return subject;
                    for (const k of keywords) {
                      const regex = new RegExp(`\\b${k}\\b`, 'i');
                      if (regex.test(t)) return subject;
                    }
                  }
                  return "Other";
                };

                const CustomTooltip = ({ active, payload, label, isDate = false, isStreak = false }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          {isStreak ? (payload[0].payload.subject ? `${payload[0].payload.subject} (${label})` : label) : (isDate ? new Date(label).toLocaleDateString() : (payload[0].payload.subject ? `${payload[0].payload.subject}: ${payload[0].payload.topic || label}` : label))}
                        </p>
                        <p className="text-lg font-black text-indigo-600">
                          {isStreak ? "Study Time: " : "Score: "}
                          <span className="text-slate-800">{payload[0].value}{isStreak ? " hrs" : "%"}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                };

                return (
                  <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                      <StatCard
                        title="Quizzes Taken"
                        value={totalQuizzes}
                        icon={FileText}
                        colorClass="bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-indigo-500/20"
                      />
                      <StatCard
                        title="Average Score"
                        value={`${avgScore.toFixed(1)}%`}
                        icon={Target}
                        colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20"
                      />
                      <StatCard
                        title="Study Plans"
                        value={studyPlans.length}
                        icon={BookOpen}
                        colorClass="bg-gradient-to-br from-sky-400 to-sky-600 shadow-sky-500/20"
                      />
                      <StatCard
                        title="Highest Score"
                        value={`${totalQuizzes > 0 ? Math.max(...quizHistory.map(q => q.score)).toFixed(1) : 0}%`}
                        icon={Award}
                        colorClass="bg-gradient-to-br from-purple-400 to-purple-600 shadow-purple-500/20"
                      />
                    </div>

                    {(() => {
                      const getWeeklyLabel = (dateStr) => {
                        const d = new Date(dateStr);
                        const month = d.toLocaleString('default', { month: 'short' });
                        const year = d.getFullYear();
                        const day = d.getDate();
                        let weekRange = '';
                        if (day <= 7) weekRange = '1-7';
                        else if (day <= 14) weekRange = '8-14';
                        else if (day <= 21) weekRange = '15-21';
                        else weekRange = '22-31';
                        return `${month} ${weekRange}, ${year}`;
                      };

                      const currentMonthWeeks = (() => {
                        const now = new Date();
                        const year = now.getFullYear();
                        const monthName = now.toLocaleString('default', { month: 'short' });
                        const currentDay = now.getDate();

                        const rawWeeks = [
                          { num: 1, startDay: 1, endDay: 7, range: "1-7" },
                          { num: 2, startDay: 8, endDay: 14, range: "8-14" },
                          { num: 3, startDay: 15, endDay: 21, range: "15-21" },
                          { num: 4, startDay: 22, endDay: 31, range: "22-31" }
                        ];

                        const weeks = [];
                        for (const rw of rawWeeks) {
                          if (currentDay >= rw.startDay) {
                            const isCurrent = currentDay >= rw.startDay && currentDay <= rw.endDay;
                            const weekLabel = isCurrent 
                              ? `This Week (${monthName} ${rw.range})`
                              : `Week ${rw.num} (${monthName} ${rw.range})`;
                            
                            weeks.push({
                              label: weekLabel,
                              value: `${monthName} ${rw.range}, ${year}`
                            });
                          }
                        }
                        return weeks.reverse();
                      })();

                      const periods = [
                        { label: "All Time", value: "All Time" },
                        ...currentMonthWeeks
                      ];

                      const filteredQuizHistory = (() => {
                        let baseHistory = quizHistory;
                        if (selectedQuizPeriod !== "All Time") {
                          baseHistory = quizHistory.filter(q => getWeeklyLabel(q.created_at) === selectedQuizPeriod);
                        }

                        return baseHistory
                          .filter(q => q.score !== null)
                          .map(q => {
                            const displayTopic = formatTopicForDisplay(q.topic);
                            let subjectName = getSubjectForTopic(q.topic);
                            if (subjectName === "default") subjectName = "Other";
                            const shortSubjectMap = {
                              "Artificial Intelligence": "AI",
                              "Data Structures & Algorithms": "DSA",
                              "Computer Networks": "CN",
                              "Operating Systems": "OS",
                              "Database Management Systems": "DBMS",
                              "Java Programming": "Java",
                              "Other": "Other"
                            };
                            return { ...q, topic: displayTopic, subject: subjectName, subjectShort: shortSubjectMap[subjectName] || "Other" };
                          });
                      })();

                      const currentStreak = (() => {
                        const dateMap = {};
                        studyPlans.forEach(planObj => {
                          const plan = planObj.plan || planObj;
                          const schedule = plan.daily_schedule || [];
                          schedule.forEach(item => {
                            if (item.date && (item.duration_hours || 0) > 0) {
                              const dateStr = item.date.split('T')[0];
                              dateMap[dateStr] = (dateMap[dateStr] || 0) + item.duration_hours;
                            }
                          });
                        });
                        quizHistory.forEach(q => {
                          if (q.created_at) {
                            const dateStr = q.created_at.split('T')[0];
                            dateMap[dateStr] = (dateMap[dateStr] || 0) + 0.5;
                          }
                        });

                        const today = new Date();
                        const formatDateStr = (d) => {
                          const y = d.getFullYear();
                          const m = String(d.getMonth() + 1).padStart(2, '0');
                          const dayStr = String(d.getDate()).padStart(2, '0');
                          return `${y}-${m}-${dayStr}`;
                        };

                        const todayStr = formatDateStr(today);
                        const yesterday = new Date(today);
                        yesterday.setDate(today.getDate() - 1);
                        const yesterdayStr = formatDateStr(yesterday);

                        if (!dateMap[todayStr] && !dateMap[yesterdayStr]) {
                          return 0;
                        }

                        let streak = 0;
                        let checkDate = dateMap[todayStr] ? today : yesterday;
                        while (true) {
                          const checkStr = formatDateStr(checkDate);
                          if (dateMap[checkStr] && dateMap[checkStr] > 0) {
                            streak++;
                            checkDate.setDate(checkDate.getDate() - 1);
                          } else {
                            break;
                          }
                        }
                        return streak;
                      })();

                      const trendPeriods = [
                        { label: "All Time", value: "All Time" },
                        ...currentMonthWeeks
                      ];

                      const streakData = (() => {
                        if (selectedTrendPeriod === "All Time") {
                          const dateMap = {}; // dateStr -> { hours, subjects: Set }

                          // 1. Process all study plans
                          studyPlans.forEach(planObj => {
                            const plan = planObj.plan || planObj;
                            const schedule = plan.daily_schedule || [];
                            schedule.forEach(item => {
                              if (item.date) {
                                const dateStr = item.date.split('T')[0];
                                if (!dateMap[dateStr]) {
                                  dateMap[dateStr] = { hours: 0, subjects: new Set() };
                                }
                                dateMap[dateStr].hours += item.duration_hours || 0;
                                if (item.subject) {
                                  dateMap[dateStr].subjects.add(item.subject);
                                }
                              }
                            });
                          });

                          // 2. Process all quiz history
                          quizHistory.forEach(q => {
                            if (q.created_at) {
                              const dateStr = q.created_at.split('T')[0];
                              if (!dateMap[dateStr]) {
                                dateMap[dateStr] = { hours: 0, subjects: new Set() };
                              }
                              dateMap[dateStr].hours += 0.5;
                              if (q.topic) {
                                dateMap[dateStr].subjects.add(formatTopicForDisplay(q.topic));
                              }
                            }
                          });

                          // Convert map to sorted array
                          const rawDates = Object.keys(dateMap).sort();
                          
                          if (rawDates.length === 0) {
                            return [];
                          }

                          const minDate = new Date(rawDates[0]);
                          const today = new Date();
                          const startDate = minDate < today ? minDate : today;
                          const endDate = rawDates[rawDates.length - 1] > today ? new Date(rawDates[rawDates.length - 1]) : today;

                          const data = [];
                          const cur = new Date(startDate);
                          
                          while (cur <= endDate) {
                            const y = cur.getFullYear();
                            const m = String(cur.getMonth() + 1).padStart(2, '0');
                            const dayVal = String(cur.getDate()).padStart(2, '0');
                            const dateStr = `${y}-${m}-${dayVal}`;
                            
                            const dayData = dateMap[dateStr] || { hours: 0, subjects: new Set() };
                            const subjectsArr = Array.from(dayData.subjects);
                            const subjectLabel = subjectsArr.length > 0 ? subjectsArr.slice(0, 2).join(", ") : "Study Session";
                            
                            data.push({
                              name: cur.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
                              hours: dayData.hours,
                              subject: subjectLabel,
                              date: dateStr
                            });
                            
                            cur.setDate(cur.getDate() + 1);
                          }
                          return data;
                        } else if (selectedTrendPeriod === "Last 7 Days") {
                          const data = [];
                          const today = new Date();
                          for (let i = 6; i >= 0; i--) {
                            const d = new Date(today);
                            d.setDate(today.getDate() - i);
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const dayStr = String(d.getDate()).padStart(2, '0');
                            const dateString = `${y}-${m}-${dayStr}`;

                            let hours = 0;
                            let subject = "Study Session";

                            if (activeStudyPlan) {
                              const plan = activeStudyPlan.plan || activeStudyPlan;
                              const schedule = plan.daily_schedule || [];
                              const match = schedule.find(item => {
                                if (!item.date) return false;
                                return item.date.startsWith(dateString);
                              });
                              if (match) {
                                hours += match.duration_hours || 0;
                                subject = match.subject || subject;
                              }
                            }

                            const quizzesOnDay = quizHistory.filter(q => {
                              if (!q.created_at) return false;
                              return q.created_at.startsWith(dateString);
                            });
                            hours += quizzesOnDay.length * 0.5;
                            if (quizzesOnDay.length > 0 && subject === "Study Session") {
                              subject = formatTopicForDisplay(quizzesOnDay[0].topic) || "Quiz Practice";
                            }

                            data.push({
                              name: d.toLocaleDateString('default', { weekday: 'short' }),
                              hours: hours,
                              subject: subject,
                              date: dateString
                            });
                          }
                          return data;
                        } else {
                          // A specific week selection
                          const match = selectedTrendPeriod.match(/([a-zA-Z]+) (\d+)-(\d+), (\d+)/);
                          if (match) {
                            const monthName = match[1];
                            const startDay = parseInt(match[2]);
                            const endDay = parseInt(match[3]);
                            const year = parseInt(match[4]);

                            const dummyDate = new Date(`${monthName} 1, ${year}`);
                            const monthIndex = dummyDate.getMonth();

                            const data = [];
                            for (let d = startDay; d <= endDay; d++) {
                              const targetDate = new Date(year, monthIndex, d);
                              const y = targetDate.getFullYear();
                              const m = String(targetDate.getMonth() + 1).padStart(2, '0');
                              const dayStr = String(targetDate.getDate()).padStart(2, '0');
                              const dateString = `${y}-${m}-${dayStr}`;

                              let hours = 0;
                              let subject = "Study Session";

                              if (activeStudyPlan) {
                                const plan = activeStudyPlan.plan || activeStudyPlan;
                                const schedule = plan.daily_schedule || [];
                                const match = schedule.find(item => {
                                  if (!item.date) return false;
                                  return item.date.startsWith(dateString);
                                });
                                if (match) {
                                  hours += match.duration_hours || 0;
                                  subject = match.subject || subject;
                                }
                              }

                              const quizzesOnDay = quizHistory.filter(q => {
                                if (!q.created_at) return false;
                                return q.created_at.startsWith(dateString);
                              });
                              hours += quizzesOnDay.length * 0.5;
                              if (quizzesOnDay.length > 0 && subject === "Study Session") {
                                subject = formatTopicForDisplay(quizzesOnDay[0].topic) || "Quiz Practice";
                              }

                              data.push({
                                name: targetDate.toLocaleDateString('default', { weekday: 'short' }) + ` ${d}`,
                                hours: hours,
                                subject: subject,
                                date: dateString
                              });
                            }
                            return data;
                          }
                          return [];
                        }
                      })();

                      return (
                        <div className="grid lg:grid-cols-2 gap-8 pb-10">
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                            <AnalyticsCard
                              title="Recent Quiz Performance"
                              className="border-slate-100 shadow-sm rounded-3xl bg-white/80 backdrop-blur-xl"
                              action={
                                <select
                                  value={selectedQuizPeriod}
                                  onChange={(e) => setSelectedQuizPeriod(e.target.value)}
                                  className="text-sm border border-slate-200 bg-white text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                  {periods.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                  ))}
                                </select>
                              }
                            >
                              <div className="h-[220px] mt-4">
                                {filteredQuizHistory.length > 0 ? (
                                  <div className="h-full flex flex-col">
                                    <div className="flex-1 min-h-0">
                                      <ResponsiveContainer width="100%" height="100%">
                                        {(() => {
                                          const chartData = selectedQuizPeriod === "All Time" 
                                            ? filteredQuizHistory.slice(0, 15).reverse() 
                                            : [...filteredQuizHistory].reverse();
                                          
                                          const shortSubjectColors = {
                                            "AI": "url(#aiGradient)",
                                            "DSA": "url(#mathGradient)",
                                            "CN": "url(#dataGradient)",
                                            "OS": "url(#csGradient)",
                                            "DBMS": "url(#gkGradient)",
                                            "Java": "url(#barGradient)",
                                            "Other": "#cbd5e1"
                                          };

                                          return (
                                          <BarChart
                                            data={chartData}
                                            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                          >
                                          <defs>
                                            <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="#A855F7" />
                                              <stop offset="100%" stopColor="#E879F9" />
                                            </linearGradient>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="#F87171" />
                                              <stop offset="100%" stopColor="#DC2626" />
                                            </linearGradient>
                                            <linearGradient id="mathGradient" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="#EC4899" />
                                              <stop offset="100%" stopColor="#8B5CF6" />
                                            </linearGradient>
                                            <linearGradient id="csGradient" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="#F59E0B" />
                                              <stop offset="100%" stopColor="#EF4444" />
                                            </linearGradient>
                                            <linearGradient id="dataGradient" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="#10B981" />
                                              <stop offset="100%" stopColor="#3B82F6" />
                                            </linearGradient>
                                            <linearGradient id="gkGradient" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="#8B5CF6" />
                                              <stop offset="100%" stopColor="#6366F1" />
                                            </linearGradient>
                                          </defs>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                          <XAxis dataKey="subjectShort" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 10, dy: 5 }} />
                                          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                                          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#e2e8f0' }} />
                                          <Bar dataKey="score" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                            {chartData.map((entry, index) => (
                                              <Cell key={`cell-${index}`} fill={shortSubjectColors[entry.subjectShort] || shortSubjectColors["Other"]} />
                                            ))}
                                          </Bar>
                                        </BarChart>
                                          );
                                        })()}
                                      </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-4 mt-2">
                                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gradient-to-b from-purple-500 to-fuchsia-500"></div><span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">AI</span></div>
                                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gradient-to-b from-pink-500 to-violet-500"></div><span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">DSA</span></div>
                                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gradient-to-b from-emerald-500 to-blue-500"></div><span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">CN</span></div>
                                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gradient-to-b from-amber-500 to-red-500"></div><span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">OS</span></div>
                                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500"></div><span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">DBMS</span></div>
                                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gradient-to-b from-red-400 to-red-600"></div><span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Java</span></div>
                                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-300"></div><span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Other</span></div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <BarChartIcon className="w-10 h-10 mb-3 opacity-30" />
                                    <p className="font-semibold">No quiz data available for this period.</p>
                                  </div>
                                )}
                              </div>
                            </AnalyticsCard>
                          </motion.div>

                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                            <AnalyticsCard
                              title={
                                <div className="flex items-center gap-3">
                                  <span>Study Streaks</span>
                                  {currentStreak > 0 && (
                                    <span className="flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-sm animate-pulse">
                                      🔥 {currentStreak} Day{currentStreak > 1 ? 's' : ''} Streak
                                    </span>
                                  )}
                                </div>
                              }
                              className="border-slate-100 shadow-sm rounded-3xl bg-white/80 backdrop-blur-xl"
                              action={
                                <select
                                  value={selectedTrendPeriod}
                                  onChange={(e) => setSelectedTrendPeriod(e.target.value)}
                                  className="text-sm border border-slate-200 bg-white text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                >
                                  {trendPeriods.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                  ))}
                                </select>
                              }
                            >
                              <div className="h-[220px] mt-4">
                                {streakData.length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                      data={streakData}
                                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                    >
                                      <defs>
                                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                                          <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}h`} />
                                      <Tooltip content={<CustomTooltip isDate={true} isStreak={true} />} />
                                      <Area type="monotone" dataKey="hours" stroke="#0EA5E9" strokeWidth={4} fillOpacity={1} fill="url(#areaGradient)" activeDot={{ r: 8, fill: '#0EA5E9', stroke: '#fff', strokeWidth: 2 }} />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
                                    <p className="font-semibold">
                                      {selectedTrendPeriod === "All Time"
                                        ? "No study history or plans available. Please generate a study plan or take a quiz."
                                        : "Not enough study data available."}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </AnalyticsCard>
                          </motion.div>

                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                            <AnalyticsCard
                              title="Topic Mastery Heatmap"
                              className="border-slate-100 shadow-sm rounded-3xl bg-white/80 backdrop-blur-xl h-full flex flex-col"
                              action={
                                <select
                                  value={selectedSkillSubject}
                                  onChange={(e) => setSelectedSkillSubject(e.target.value)}
                                  className="text-sm border border-slate-200 bg-white text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                  <option value="All Subjects">All Subjects</option>
                                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                                  <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                                  <option value="Computer Networks">Computer Networks</option>
                                  <option value="Operating Systems">Operating Systems</option>
                                  <option value="Database Management Systems">Database Management Systems</option>
                                  <option value="Java Programming">Java Programming</option>
                                </select>
                              }
                            >
                              <div className="mt-4 flex-1 flex flex-col min-h-[300px]">
                                {filteredSkillData.length > 0 ? (
                                  <>
                                    <div className="flex-1 overflow-auto custom-scrollbar pr-2 max-h-[300px]">
                                      <table className="w-full text-left border-collapse">
                                        <thead>
                                          <tr>
                                            <th className="p-2 text-xs font-semibold text-slate-500 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-sm z-10">Topic</th>
                                            {(selectedSkillSubject === "All Subjects" ? Object.keys(subjectMap) : [selectedSkillSubject]).map(col => (
                                              <th key={col} className="p-2 text-xs font-semibold text-slate-500 text-center border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                                                {col === "Artificial Intelligence" ? "AI" : col === "Computer Networks" ? "CN" : col === "Data Structures & Algorithms" ? "DSA" : col === "Operating Systems" ? "OS" : col === "Database Management Systems" ? "DBMS" : col === "Java Programming" ? "Java" : col}
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {filteredSkillData.map((t, idx) => {
                                            const cols = selectedSkillSubject === "All Subjects" ? Object.keys(subjectMap) : [selectedSkillSubject];
                                            return (
                                              <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="p-2 text-xs font-medium text-slate-700 truncate max-w-[120px]" title={t.fullTopic}>
                                                  {t.fullTopic}
                                                </td>
                                                {cols.map(col => {
                                                  const subjectForThisTopic = getSubjectForTopic(t.fullTopic);
                                                  const shouldShow = subjectForThisTopic === col;

                                                  if (shouldShow) {
                                                    let colorClass = "bg-slate-100 text-slate-500";
                                                    if (t.score >= 75) colorClass = "bg-emerald-100 text-emerald-700";
                                                    else if (t.score >= 50) colorClass = "bg-amber-100 text-amber-700";
                                                    else if (t.score >= 25) colorClass = "bg-rose-100 text-rose-700";

                                                    return (
                                                      <td key={col} className="p-2 text-center">
                                                        <div className={`py-1 px-1.5 rounded text-[11px] font-bold inline-block min-w-[36px] ${colorClass}`}>
                                                          {t.score}%
                                                        </div>
                                                      </td>
                                                    );
                                                  } else {
                                                    return <td key={col} className="p-2 text-center text-slate-300 font-medium">-</td>;
                                                  }
                                                })}
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] sm:text-xs mt-4 pt-3 border-t border-slate-100 text-slate-500 flex-wrap">
                                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-400 rounded-sm"></div> 75-100%</div>
                                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-400 rounded-sm"></div> 50-74%</div>
                                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-rose-400 rounded-sm"></div> 25-49%</div>
                                      <div className="flex items-center gap-1.5 border border-slate-200 w-3 h-3 rounded-sm bg-white"></div> &lt;25%
                                    </div>
                                  </>
                                ) : (
                                  <div className="h-full flex flex-col items-center justify-center text-slate-400 flex-1">
                                    <p className="font-semibold px-4 text-center">No topic data available yet.</p>
                                  </div>
                                )}
                              </div>
                            </AnalyticsCard>
                          </motion.div>



                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
                            <AnalyticsCard title="Weak Areas Radar" className="border-slate-100 shadow-sm rounded-3xl bg-white/80 backdrop-blur-xl">
                              <div className="mt-4">
                                {weakTopics.length > 0 ? (
                                  <div className="space-y-3 p-2">
                                    {weakTopics.slice(0, 4).map((t, i) => (
                                      <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-red-50/50 border border-red-100">
                                        <div>
                                          <h4 className="font-bold text-red-900">{t.fullTopic}</h4>
                                          <p className="text-sm font-semibold text-red-700 mt-1">Avg Score: {t.score}%</p>
                                        </div>
                                        <Button size="sm" variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-500 hover:text-white" onClick={() => { setActiveItem("Study Plan"); }}>Plan</Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <CheckCircle className="w-12 h-12 mb-3 text-emerald-400 opacity-50" />
                                    <p className="font-semibold text-center px-4">No weak areas identified! You are scoring above 60% in all topics.</p>
                                  </div>
                                )}
                              </div>
                            </AnalyticsCard>
                          </motion.div>
                        </div>
                      );
                    })()}
                  </>
                );
              })()}
            </motion.div>
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
                <div
                  className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar"
                  onScroll={handleChatScroll}
                >
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
                  <div ref={messagesEndRef} />
                </div>

                <button
                  onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className={`absolute bottom-36 right-8 p-3 bg-white text-black hover:bg-slate-100 rounded-full shadow-md border border-slate-200 transition-all duration-300 z-10 ${isAtBottom ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}`}
                  title="Scroll to bottom"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>

                <div className="p-4 bg-background/95 backdrop-blur-md border-t border-border/20 shrink-0">
                  <div className="max-w-4xl mx-auto flex flex-col gap-2">
                    {attachedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-2">
                        {attachedFiles.map((f, i) => (
                          <div key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20 flex items-center gap-1 group">
                            <Paperclip className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{f.name}</span>
                            <button onClick={() => handleRemoveFile(i)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-primary/20 rounded-full transition-all ml-1">
                              <X className="w-3 h-3" />
                            </button>
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
          ) : activeItem?.startsWith("Assessment_") ? (
            <StudentAssessmentView quizId={activeItem.split("_")[1]} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-muted-foreground">Under Construction</h2>
            </div>
          )}
        </div>

        {activeItem !== "Quizzes" && isChatbotVisible && portalTarget && createPortal((
          <div className={`absolute z-[9999] bg-card border border-border shadow-2xl transition-all duration-300 flex flex-col overflow-hidden ${chatbotMode === "maximized"
            ? "inset-4 rounded-xl"
            : "bottom-24 right-12 w-[450px] h-[550px] rounded-2xl"
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
                <div
                  className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-4 custom-scrollbar"
                  onScroll={handleChatScroll}
                >
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
                  <div ref={messagesEndRef} />
                </div>
                <button
                  onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className={`absolute bottom-28 right-6 p-2 bg-white text-black hover:bg-slate-100 rounded-full shadow-md border border-slate-200 transition-all duration-300 z-10 ${isAtBottom ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}`}
                  title="Scroll to bottom"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Input Area */}
                <div className="p-4 bg-background/95 backdrop-blur-md border-t border-border/20 shrink-0">
                  <div className="max-w-4xl mx-auto flex flex-col gap-2 bg-background rounded-3xl p-1 shadow-sm border border-border">
                    {attachedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-1 px-3 pt-2">
                        {attachedFiles.map((f, i) => (
                          <div key={i} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-semibold rounded-full border border-primary/20 flex items-center gap-1 group">
                            <Paperclip className="w-3 h-3" />
                            <span className="truncate max-w-[100px]">{f.name}</span>
                            <button onClick={() => handleRemoveFile(i)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-primary/20 rounded-full transition-all ml-0.5">
                              <X className="w-2.5 h-2.5" />
                            </button>
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
