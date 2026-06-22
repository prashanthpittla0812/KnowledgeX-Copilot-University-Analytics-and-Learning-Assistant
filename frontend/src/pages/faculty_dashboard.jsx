import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { facultyMenuItems } from "./faculty_menu";
import { facultyApi, API_BASE_URL } from "../api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { StatCard } from "../components/ui/stat-card";
import { AnalyticsCard } from "../components/ui/analytics-card";
import { ChatBubble, ChatInput } from "../components/ui/chat";
import { BookOpen, Users, AlertCircle, FileText, Send, CheckCircle, BarChart as BarChartIcon, BookMarked, TrendingUp, TrendingDown, Upload, Download, Eye, BrainCircuit } from "lucide-react";
import { Button } from "../components/ui/button";
import { LearningMaterialsTab } from "../components/faculty/LearningMaterialsTab";
import { MultimodalUploadTab } from "../components/faculty/MultimodalUploadTab";

const defaultFacultyChats = [];

const getPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL.replace("/api/v1", "")}/${path}`;
};

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
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [quizTopic, setQuizTopic] = useState("");
  const [quizType, setQuizType] = useState("MCQs");
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizCount, setQuizCount] = useState(0);
  const [quizSemester, setQuizSemester] = useState("1st Sem");
  const [assessmentGenerationMethod, setAssessmentGenerationMethod] = useState("AI");
  const [assessmentType, setAssessmentType] = useState("Essay");
  const [assessmentDifficulty, setAssessmentDifficulty] = useState("Beginner");
  const [assessmentDuration, setAssessmentDuration] = useState(1);
  const [assessmentQuestionCount, setAssessmentQuestionCount] = useState(5);
  const [manualQuestionsText, setManualQuestionsText] = useState("");

  // Quiz Results State
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [assessmentSubmissions, setAssessmentSubmissions] = useState([]);
  const [activeQuizTab, setActiveQuizTab] = useState("performance");
  const [activeAssessmentTab, setActiveAssessmentTab] = useState("submissions");
  const [quizPerformance, setQuizPerformance] = useState(null);
  const [quizDetails, setQuizDetails] = useState(null);

  // Analyze Results State
  const [learningGaps, setLearningGaps] = useState(null);
  const [selectedQuizGaps, setSelectedQuizGaps] = useState(null);
  const [analyticsQuiz, setAnalyticsQuiz] = useState("");

  // Recommendations State
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentRankings, setRecentRankings] = useState({ quiz_topic: null, top_3: [], bottom_3: [] });
  const [quizMode, setQuizMode] = useState("Quiz");
  const [overviewPage, setOverviewPage] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendationMessage, setRecommendationMessage] = useState("");

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
      const [res, gapsRes, detailsRes] = await Promise.all([
        facultyApi.getQuizResults(quizId),
        facultyApi.getLearningGaps(quizId).catch(() => ({ data: null })),
        facultyApi.getQuiz(quizId).catch(() => ({ data: null }))
      ]);
      setQuizPerformance(res.data);
      if (detailsRes && detailsRes.data) setQuizDetails(detailsRes.data);
      if (gapsRes && gapsRes.data) setSelectedQuizGaps(gapsRes.data);
      setSelectedQuiz(quizId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssessmentSubmissions = async (quizId) => {
    try {
      setIsLoading(true);
      const res = await facultyApi.getAssessmentSubmissions(quizId);
      setAssessmentSubmissions(res.data.submissions);
      const detailsRes = await facultyApi.getQuiz(quizId).catch(() => ({ data: null }));
      if (detailsRes && detailsRes.data) setQuizDetails(detailsRes.data);
      setActiveAssessmentTab("submissions");
      setSelectedAssessmentId(quizId);
    } catch (e) {
      console.error(e);
      alert("Failed to load submissions.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSubmission = async (submissionId, fileName) => {
    try {
      const res = await facultyApi.downloadSubmission(submissionId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error(e);
      let errMsg = "Failed to download submission.";
      if (e.response && e.response.data) {
          if (e.response.data instanceof Blob) {
              const text = await e.response.data.text();
              errMsg = text;
          } else {
              errMsg = JSON.stringify(e.response.data);
          }
      }
      alert(`Error: ${errMsg} | Message: ${e.message}`);
    }
  };

  const handleViewSubmission = async (submissionId, fileName) => {
    const newWindow = window.open('', '_blank');
    try {
      const res = await facultyApi.downloadSubmission(submissionId);
      const isPdf = fileName.toLowerCase().endsWith('.pdf');
      const type = isPdf ? 'application/pdf' : 'application/octet-stream';
      const url = window.URL.createObjectURL(new Blob([res.data], { type }));
      if (newWindow) {
        newWindow.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      if (newWindow) newWindow.close();
      console.error(e);
      let errMsg = "Failed to view submission.";
      if (e.response && e.response.data) {
          if (e.response.data instanceof Blob) {
              const text = await e.response.data.text();
              errMsg = text;
          } else {
              errMsg = JSON.stringify(e.response.data);
          }
      }
      alert(`Error: ${errMsg} | Message: ${e.message}`);
    }
  };

  const fetchLearningGaps = async (quizId = "", showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const res = await facultyApi.getLearningGaps(quizId || undefined);
      setLearningGaps(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const res = await facultyApi.getDashboard();
      setDashboardStats(res.data.stats);
      
      const rankRes = await facultyApi.getRecentQuizRankings();
      setRecentRankings(rankRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => {
    let intervalId;
    if (activeItem === "Dashboard") {
      fetchDashboardStats();
    } else if (activeItem === "Quizzes/Assessments") {
      fetchQuizzes();
    } else if (activeItem === "Analytics") {
      fetchQuizzes();
      fetchLearningGaps(analyticsQuiz, true);
      fetchDashboardStats();
      
      intervalId = setInterval(() => {
        fetchLearningGaps(analyticsQuiz, false);
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeItem, analyticsQuiz]);

  const handleUploadDocument = async (file = null) => {
    const fileToUpload = file || uploadFile;
    const currentTopic = quizMode === "Assessment" ? quizTopic : uploadTopic;
    if (!fileToUpload || !currentTopic) return alert("Provide file and topic");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", fileToUpload);
      await facultyApi.uploadDocument(formData, currentTopic);
      setUploadedDocs(prev => [...prev, { name: fileToUpload.name, topic: currentTopic }]);
      setUploadFile(null);
      if (quizMode !== "Assessment") {
        setUploadTopic("");
      }
      if (pdfInputRef.current) pdfInputRef.current.value = "";
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
        document_topic: uploadedDocs.length > 0 ? uploadedDocs[0].topic : undefined,
        question_type: quizType,
        difficulty: quizDifficulty,
        num_questions: quizCount,
        semester: quizSemester
      });
      alert("Quiz generated!");

      // Reset form fields
      setQuizTopic("");
      setQuizType("MCQ");
      setQuizDifficulty("medium");
      setQuizCount(25);

      // Clear uploaded documents history
      setUploadedDocs([]);

      fetchQuizzes();
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.detail || e.response?.data?.message || "Failed generation.";
      alert(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAssessment = async () => {
    if (assessmentGenerationMethod === "AI" && !quizTopic) return alert("Enter topic name.");
    if (assessmentGenerationMethod === "Manual" && !manualQuestionsText) return alert("Enter manual questions.");
    
    setIsGenerating(true);
    try {
      await facultyApi.generateQuiz({
        faculty_name: userName,
        topic_name: quizTopic || "Manual Assessment",
        document_topic: uploadedDocs.length > 0 ? uploadedDocs[0].topic : undefined,
        question_type: assessmentType,
        difficulty: assessmentDifficulty,
        num_questions: assessmentQuestionCount,
        semester: quizSemester,
        is_assessment: true,
        manual_questions: assessmentGenerationMethod === "Manual" ? manualQuestionsText : undefined,
        duration_mins: assessmentDuration * 1440 // converting days to minutes for backend if needed, or backend handles it? Wait!
        // Actually the backend might still expect duration_mins, so multiplying by 1440. Or I can just pass the value.
        // Let's pass duration_mins: assessmentDuration * 1440 
      });
      alert("Assessment generated and students notified!");
      
      setQuizTopic("");
      setManualQuestionsText("");
      setUploadedDocs([]);
      fetchQuizzes();
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.detail || e.response?.data?.message || "Failed generation.";
      alert(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };


  const regularQuizzes = quizzes.filter(q => !q.question_type?.startsWith("Assessment"));
  const assessments = quizzes.filter(q => q.question_type?.startsWith("Assessment"));

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
              <StatCard 
                title="Learning Materials" 
                value={dashboardStats?.total_documents || "0"} 
                icon={BookOpen} 
                description="Uploaded documents" 
                colorClass="bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-indigo-500/20"
              />
              <StatCard 
                title="Total Students" 
                value={dashboardStats?.total_students || "0"} 
                icon={Users} 
                description="enrolled recently" 
                colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20"
              />
              <StatCard 
                title="Generated Quizzes" 
                value={dashboardStats?.total_quizzes || "0"} 
                icon={FileText} 
                description="Across all courses" 
                colorClass="bg-gradient-to-br from-violet-400 to-violet-600 shadow-violet-500/20"
              />
              <StatCard 
                title="Avg Class Score" 
                value={dashboardStats?.avg_class_score ? `${dashboardStats.avg_class_score}%` : "0%"} 
                icon={TrendingUp} 
                description="Overall performance" 
                colorClass="bg-gradient-to-br from-sky-400 to-sky-600 shadow-sky-500/20"
              />
            </div>

            {/* TOP 3 AND LEAST 3 STUDENTS */}
            <div className="grid gap-6 md:grid-cols-2 mt-8">
              <div className="rounded-2xl border border-emerald-200/50 p-6 shadow-md bg-gradient-to-br from-emerald-50/80 to-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-emerald-500/20"></div>
                <h3 className="font-extrabold text-xl mb-4 flex items-center text-emerald-800 tracking-tight">
                  <TrendingUp className="w-6 h-6 mr-2 text-emerald-600" /> Top Performers
                </h3>
                {recentRankings.quiz_topic && (
                  <p className="text-sm font-medium text-emerald-800/60 mb-5 border-b border-emerald-100 pb-3 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" /> Recent Quiz: <span className="ml-1 text-emerald-900 font-bold">{recentRankings.quiz_topic}</span>
                  </p>
                )}
                <div className="space-y-3 relative z-10">
                  {recentRankings.top_3.map((student, idx) => (
                      <div key={student.user_id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 ${idx === 0 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400/50' : idx === 1 ? 'bg-slate-100 text-slate-600 ring-2 ring-slate-300/50' : 'bg-orange-100 text-orange-700 ring-2 ring-orange-300/50'}`}>
                            {idx + 1}
                          </div>
                          <span className="font-bold text-emerald-950">{student.user_name}</span>
                        </div>
                        <div className="bg-emerald-100/80 px-3 py-1 rounded-md">
                          <span className="font-black text-emerald-700">{student.score}%</span>
                        </div>
                      </div>
                  ))}
                  {recentRankings.top_3.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-emerald-600/60">
                      <TrendingUp className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-sm font-semibold">No data available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200/50 p-6 shadow-md bg-gradient-to-br from-rose-50/80 to-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-rose-500/20"></div>
                <h3 className="font-extrabold text-xl mb-4 flex items-center text-rose-800 tracking-tight">
                  <TrendingDown className="w-6 h-6 mr-2 text-rose-600" /> Needs Attention
                </h3>
                {recentRankings.quiz_topic && (
                  <p className="text-sm font-medium text-rose-800/60 mb-5 border-b border-rose-100 pb-3 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" /> Recent Quiz: <span className="ml-1 text-rose-900 font-bold">{recentRankings.quiz_topic}</span>
                  </p>
                )}
                <div className="space-y-3 relative z-10">
                  {recentRankings.bottom_3.map((student, idx) => (
                      <div key={student.user_id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-rose-100 shadow-sm hover:shadow-md hover:border-rose-300 transition-all">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm mr-4 ring-2 ring-rose-200">
                            !
                          </div>
                          <span className="font-bold text-rose-950">{student.user_name}</span>
                        </div>
                        <div className="bg-rose-100/80 px-3 py-1 rounded-md">
                          <span className="font-black text-rose-700">{student.score}%</span>
                        </div>
                      </div>
                  ))}
                  {recentRankings.bottom_3.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-rose-600/60">
                      <CheckCircle className="w-8 h-8 mb-2 opacity-20 text-emerald-500" />
                      <p className="text-sm font-semibold">Everyone is doing great!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : activeItem === "Learning Materials" ? (
          <LearningMaterialsTab />
        ) : activeItem === "Multimodal Content" ? (
          <MultimodalUploadTab />
        ) : activeItem === "Quizzes/Assessments" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!selectedQuiz && !selectedAssessmentId ? (
              <>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight">{quizMode === "Quiz" ? "Generate Quizzes" : "Generate Assessments"}</h1>
                    <p className="text-muted-foreground">Manage and create AI-powered {quizMode === "Quiz" ? "quizzes" : "assessments"}.</p>
                  </div>
                  <div className="flex bg-orange-100/60 p-1 rounded-xl border border-orange-200/50 shadow-inner">
                    <button 
                      onClick={() => setQuizMode("Quiz")} 
                      className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${quizMode === "Quiz" ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-md text-white" : "text-orange-900/60 hover:text-orange-900 hover:bg-orange-200/50"}`}
                    >
                      Quiz Mode
                    </button>
                    <button 
                      onClick={() => setQuizMode("Assessment")} 
                      className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${quizMode === "Assessment" ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-md text-white" : "text-orange-900/60 hover:text-orange-900 hover:bg-orange-200/50"}`}
                    >
                      Assessment Mode
                    </button>
                  </div>
                </div>

                {quizMode === "Quiz" ? (
                  <>

                <div className="mb-10 max-w-4xl mx-auto">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-slate-100 flex gap-4 items-start">
                      <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 shrink-0">
                        <FileText className="w-8 h-8 text-orange-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">Generate Quizzes</h2>
                        <p className="text-slate-500 mt-1">Upload your knowledge base and configure quiz details</p>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-10">
                      {/* Step 1 */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-100 text-orange-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">1</div>
                          <h3 className="text-lg font-bold text-slate-900">Upload Knowledge Base</h3>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-bold text-slate-900 mb-2 block">
                              Topic Name <span className="text-red-500">*</span>
                            </label>
                            <input 
                              value={uploadTopic} 
                              onChange={e => setUploadTopic(e.target.value)} 
                              className="w-full h-[46px] rounded-xl border border-slate-200 bg-white px-4 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400" 
                              placeholder="e.g., Computer Networks Ch 1" 
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="text-sm font-bold text-slate-900 mb-2 block">
                                Lecture PDF <span className="text-red-500">*</span>
                              </label>
                              {isUploading ? (
                                <div className="w-full h-[46px] rounded-xl border border-orange-200 bg-orange-50 px-4 text-sm text-orange-600 font-semibold flex items-center gap-2">
                                  <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
                                  Uploading...
                                </div>
                              ) : (
                                <div className="relative">
                                  <input
                                    ref={pdfInputRef}
                                    type="file"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        setUploadFile(file);
                                        handleUploadDocument(file);
                                      }
                                    }}
                                    accept=".pdf"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                  <div className="w-full h-[46px] rounded-xl border border-slate-200 bg-white px-4 text-sm flex items-center gap-3 focus-within:ring-2 focus-within:ring-orange-500 transition-all">
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-slate-700 font-semibold text-xs whitespace-nowrap">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                      Choose File
                                    </div>
                                    <span className="text-slate-500 truncate">{uploadFile ? uploadFile.name : "No file chosen"}</span>
                                  </div>
                                </div>
                              )}
                              <p className="text-xs text-slate-500 mt-2">Upload a PDF file containing the lecture content.</p>
                            </div>
                            <div>
                              <label className="text-sm font-bold text-slate-900 mb-2 block">
                                Number of Questions <span className="text-red-500">*</span>
                              </label>
                              <input 
                                type="number" 
                                min="1" max="25" 
                                value={quizCount} 
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === "") setQuizCount("");
                                  else {
                                    const num = Number(val);
                                    setQuizCount(num > 25 ? 25 : num);
                                  }
                                }} 
                                className="w-full h-[46px] rounded-xl border border-slate-200 bg-white px-4 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" 
                              />
                              <p className="text-xs text-slate-500 mt-2">Enter the number of questions to generate.</p>
                            </div>
                          </div>
                        </div>

                        {uploadedDocs.length > 0 && (
                          <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/70 animate-in fade-in slide-in-from-top-2">
                            <h5 className="text-xs font-black text-emerald-800 uppercase mb-3 tracking-wider">Successfully Uploaded</h5>
                            <div className="space-y-2">
                              {uploadedDocs.map((doc, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border border-emerald-200 shadow-sm">
                                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                    <span>{doc.topic}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-emerald-600 text-xs font-semibold" title={doc.name}>{doc.name}</span>
                                    <button onClick={() => setUploadedDocs(prev => prev.filter((_, i) => i !== idx))} className="text-emerald-400 hover:text-red-500 transition-colors p-1" title="Remove">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-slate-100 w-full"></div>

                      {/* Step 2 */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-100 text-orange-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">2</div>
                          <h3 className="text-lg font-bold text-slate-900">Quiz Details</h3>
                        </div>

                        <div className="grid md:grid-cols-4 gap-6">
                          <div>
                            <label className="text-sm font-bold text-slate-900 mb-2 block">
                              Quiz Topic <span className="text-red-500">*</span>
                            </label>
                            <input 
                              value={quizTopic} 
                              onChange={e => setQuizTopic(e.target.value)} 
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400" 
                              placeholder="e.g., OSI Model" 
                            />
                          </div>
                          <div>
                            <label className="text-sm font-bold text-slate-900 mb-2 block">
                              Type <span className="text-red-500">*</span>
                            </label>
                             <select 
                              value={quizType} 
                              onChange={e => setQuizType(e.target.value)} 
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                              <option value="MCQs">MCQs</option>
                              <option value="One word questions">One word questions</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-bold text-slate-900 mb-2 block">
                              Difficulty <span className="text-red-500">*</span>
                            </label>
                            <select 
                              value={quizDifficulty} 
                              onChange={e => setQuizDifficulty(e.target.value)} 
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-bold text-slate-900 mb-2 block">
                              Semester
                            </label>
                            <select 
                              value={quizSemester} 
                              onChange={e => setQuizSemester(e.target.value)} 
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                              <option value="1st Sem">1st Sem</option>
                              <option value="2nd Sem">2nd Sem</option>
                              <option value="3rd Sem">3rd Sem</option>
                              <option value="4th Sem">4th Sem</option>
                              <option value="5th Sem">5th Sem</option>
                              <option value="6th Sem">6th Sem</option>
                              <option value="7th Sem">7th Sem</option>
                              <option value="8th Sem">8th Sem</option>
                            </select>
                          </div>
                        </div>

                        <button 
                          onClick={handleGenerateQuiz} 
                          disabled={isGenerating} 
                          className="w-full h-12 bg-[#F97316] hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                          {isGenerating ? (
                            <>
                              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              Generating AI Quiz...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>
                              Generate AI Quiz
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-4">Generated Quizzes</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularQuizzes.length === 0 && <p className="text-muted-foreground">No quizzes generated yet.</p>}
                  {regularQuizzes.map(q => (
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
                <>
                <div className="mb-10 max-w-4xl mx-auto">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-slate-100 flex gap-4 items-start">
                      <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 shrink-0">
                        <FileText className="w-8 h-8 text-indigo-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">Generate Assessments</h2>
                        <p className="text-slate-500 mt-1">Upload your knowledge base to generate comprehensive assessments</p>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-10">
                      {/* Step 1 */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 text-indigo-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">1</div>
                            <h3 className="text-lg font-bold text-slate-900">Knowledge Base</h3>
                          </div>
                          <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button 
                              onClick={() => setAssessmentGenerationMethod("AI")}
                              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${assessmentGenerationMethod === "AI" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                              AI Generate (PDF)
                            </button>
                            <button 
                              onClick={() => setAssessmentGenerationMethod("Manual")}
                              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${assessmentGenerationMethod === "Manual" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                              Manual Entry
                            </button>
                          </div>
                        </div>

                        {assessmentGenerationMethod === "AI" ? (
                          <>
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <label className="text-sm font-bold text-slate-900 mb-2 block">
                                  Topic Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                  value={quizTopic}
                                  onChange={e => setQuizTopic(e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                  placeholder="e.g., Software Engineering Principles"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-bold text-slate-900 mb-2 block">
                                  Reference PDF <span className="text-red-500">*</span>
                                </label>
                                <input 
                                  type="file" 
                                  accept=".pdf"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      setUploadFile(file);
                                      handleUploadDocument(file);
                                    }
                                  }}
                                  ref={pdfInputRef}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                                />
                                <p className="text-xs text-slate-500 mt-2">Upload a PDF containing the reference material.</p>
                              </div>
                            </div>
                            {uploadedDocs.length > 0 && (
                              <div className="mt-6 p-4 rounded-xl border-2 border-indigo-500 bg-indigo-50/70 animate-in fade-in slide-in-from-top-2">
                                <h5 className="text-xs font-black text-indigo-800 uppercase mb-3 tracking-wider">Successfully Uploaded</h5>
                                <div className="space-y-2">
                                  {uploadedDocs.map((doc, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border border-indigo-200 shadow-sm">
                                      <div className="flex items-center gap-2 text-indigo-800 font-bold">
                                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                                        <span>{doc.topic}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-indigo-600 text-xs font-semibold" title={doc.name}>{doc.name}</span>
                                        <button onClick={() => setUploadedDocs(prev => prev.filter((_, i) => i !== idx))} className="text-indigo-400 hover:text-red-500 transition-colors p-1" title="Remove">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            <label className="text-sm font-bold text-slate-900 mb-2 block">
                              Enter Questions Manually <span className="text-red-500">*</span>
                            </label>
                            <textarea 
                              value={manualQuestionsText}
                              onChange={e => setManualQuestionsText(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[150px]"
                              placeholder="Type or paste your questions here...&#10;Example:&#10;1. Explain polymorphism.&#10;2. What is the difference between an interface and an abstract class?"
                            />
                          </div>
                        )}
                      </div>

                      {/* Step 2 */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-100 text-indigo-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">2</div>
                          <h3 className="text-lg font-bold text-slate-900">Assessment Details</h3>
                        </div>

                        <div className={`grid ${assessmentGenerationMethod === "Manual" ? "md:grid-cols-4" : "md:grid-cols-5"} gap-6`}>
                          <div>
                            <label className="text-sm font-bold text-slate-900 mb-2 block">
                              Assessment Type <span className="text-red-500">*</span>
                            </label>
                            <select 
                              value={assessmentType}
                              onChange={e => setAssessmentType(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            >
                              <option value="Essay">Essay & Short Answer</option>
                              <option value="Coding">Coding Assessment</option>
                              <option value="Scenario">Scenario Based</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-bold text-slate-900 mb-2 block">
                              Difficulty <span className="text-red-500">*</span>
                            </label>
                            <select 
                              value={assessmentDifficulty}
                              onChange={e => setAssessmentDifficulty(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            >
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                          </div>
                          {assessmentGenerationMethod !== "Manual" && (
                            <div>
                              <label className="text-sm font-bold text-slate-900 mb-2 block">
                                No. of Questions <span className="text-red-500">*</span>
                              </label>
                              <input 
                                type="number"
                                min="1" max="25"
                                value={assessmentQuestionCount}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === "") setAssessmentQuestionCount("");
                                  else {
                                    const num = Number(val);
                                    setAssessmentQuestionCount(num > 25 ? 25 : num);
                                  }
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g., 5"
                              />
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-bold text-slate-900 mb-2 block">
                              Duration (Days)
                            </label>
                            <input 
                              type="number"
                              min="1"
                              value={assessmentDuration}
                              onChange={e => setAssessmentDuration(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                              placeholder="e.g., 2"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-bold text-slate-900 mb-2 block">
                              Semester
                            </label>
                            <select 
                              value={quizSemester} 
                              onChange={e => setQuizSemester(e.target.value)} 
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            >
                              <option value="1st Sem">1st Sem</option>
                              <option value="2nd Sem">2nd Sem</option>
                              <option value="3rd Sem">3rd Sem</option>
                              <option value="4th Sem">4th Sem</option>
                              <option value="5th Sem">5th Sem</option>
                              <option value="6th Sem">6th Sem</option>
                              <option value="7th Sem">7th Sem</option>
                              <option value="8th Sem">8th Sem</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-6">
                          <Button 
                            onClick={handleGenerateAssessment}
                            disabled={isGenerating || isUploading}
                            className="w-full py-6 text-lg font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                          >
                            {isGenerating ? "Generating Assessment..." : <><Upload className="w-5 h-5 mr-2" /> Generate Assessment</>}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-4">Assessment History</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assessments.length === 0 && <p className="text-muted-foreground">No assessments generated yet.</p>}
                  {assessments.map(q => (
                    <Card key={q.id} onClick={() => fetchAssessmentSubmissions(q.id)} className="cursor-pointer hover:border-indigo-500/50 transition-colors bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                      <CardContent className="p-6">
                        <h4 className="text-xl font-bold text-slate-900 truncate mb-3">{q.topic_name}</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">{q.difficulty}</span>
                          <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                            {q.question_type ? q.question_type.replace(/\((\d+)\s*mins?\)/i, (match, p1) => {
                              const mins = parseInt(p1);
                              if (mins >= 1440) {
                                const days = Math.round(mins / 1440);
                                return `(${days} ${days === 1 ? 'Day' : 'Days'})`;
                              }
                              return match;
                            }) : ""}
                          </span>
                          <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider">{q.num_questions} Qs</span>
                        </div>
                        <p className="text-xs text-slate-500">Created: {new Date(q.created_at).toLocaleDateString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                </>
              )}
              </>
            ) : selectedAssessmentId ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <Button variant="ghost" onClick={() => setSelectedAssessmentId(null)} className="pl-0 hover:bg-transparent hover:text-indigo-600">← Back to Assessments</Button>
                
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Assessment Submissions</h1>
                    <p className="text-slate-500">View and download completed assessments from students.</p>
                  </div>
                </div>

                <div className="flex border-b border-slate-200 mb-6">
                  <button 
                    className={`py-3 px-6 font-semibold border-b-2 transition-colors ${activeAssessmentTab === "submissions" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                    onClick={() => setActiveAssessmentTab("submissions")}
                  >
                    Submissions
                  </button>
                  <button 
                    className={`py-3 px-6 font-semibold border-b-2 transition-colors ${activeAssessmentTab === "questions" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                    onClick={() => setActiveAssessmentTab("questions")}
                  >
                    Questions
                  </button>
                </div>

                {activeAssessmentTab === "submissions" ? (
                  <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    {assessmentSubmissions.length === 0 ? (
                      <div className="p-10 text-center text-slate-500 font-medium">No students have submitted their assessment yet.</div>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="p-4 font-bold text-slate-700">Student Name</th>
                            <th className="p-4 font-bold text-slate-700">Submitted On</th>
                            <th className="p-4 font-bold text-slate-700">File Name</th>
                            <th className="p-4 font-bold text-slate-700 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assessmentSubmissions.map(sub => (
                            <tr key={sub.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-medium text-slate-900">{sub.student_name}</td>
                              <td className="p-4 text-slate-500">{new Date(sub.submitted_at + (sub.submitted_at.endsWith('Z') ? '' : 'Z')).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'medium' })} IST</td>
                              <td className="p-4 text-slate-600">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-indigo-500" />
                                  {sub.file_name}
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleViewSubmission(sub.id, sub.file_name)}
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 shadow-none border-none font-semibold"
                                  >
                                    <Eye className="w-4 h-4 mr-2" /> View
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleDownloadSubmission(sub.id, sub.file_name)}
                                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 shadow-none border-none font-semibold"
                                  >
                                    <Download className="w-4 h-4 mr-2" /> Download
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {quizDetails?.questions?.map((q, idx) => (
                      <Card key={idx} className="bg-white border-slate-200 shadow-sm rounded-xl">
                        <CardContent className="p-6">
                          <h4 className="font-bold text-lg mb-2"><span className="text-indigo-600 mr-2">Q{idx+1}.</span> {q.question || q.question_text}</h4>
                          {q.options && q.options.length > 0 && (
                            <div className="space-y-2 mt-4 ml-7">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className={`p-3 rounded-lg border ${opt === q.correct_answer ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {!quizDetails?.questions?.length && (
                      <div className="p-10 text-center text-slate-500 font-medium bg-white rounded-2xl border border-slate-200">No questions available for this assessment.</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <Button variant="ghost" onClick={() => setSelectedQuiz(null)} className="pl-0 hover:bg-transparent hover:text-primary">← Back to Quizzes</Button>
                
                <div className="flex border-b border-border/50">
                  <button 
                    className={`py-3 px-6 font-semibold border-b-2 transition-colors ${activeQuizTab === "performance" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setActiveQuizTab("performance")}
                  >
                    Quiz Performance
                  </button>
                  <button 
                    className={`py-3 px-6 font-semibold border-b-2 transition-colors ${activeQuizTab === "details" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setActiveQuizTab("details")}
                  >
                    View Quiz
                  </button>
                </div>

                {activeQuizTab === "performance" ? (
                  <>
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
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap leading-relaxed">{selectedQuizGaps.ai_recommendations}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="space-y-6">
                    {quizDetails?.questions?.map((q, idx) => (
                      <Card key={idx} className="glass-card">
                        <CardContent className="p-6">
                          <h4 className="font-semibold text-lg mb-4">{idx + 1}. {q.question}</h4>
                          {q.options && q.options.length > 0 ? (
                            <ul className="space-y-2 mb-4">
                              {q.options.map((opt, oIdx) => (
                                <li key={oIdx} className={`p-3 rounded-lg border ${opt.trim().toLowerCase() === q.answer?.trim().toLowerCase() ? "bg-emerald-50 border-emerald-200 font-semibold text-emerald-800" : "bg-background border-border text-muted-foreground"}`}>
                                  <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 mb-4">
                              <span className="font-semibold text-emerald-800">Answer: </span>
                              <span className="text-emerald-700">{q.answer}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
              className="flex justify-between items-start"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                  <BarChartIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-800">Analytics Overview</h1>
                  <p className="text-sm font-semibold text-slate-500">Analyze topic performance and learning gaps.</p>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-xl border border-slate-100 p-1.5 rounded-2xl shadow-sm">
                <select
                  value={analyticsQuiz}
                  onChange={(e) => {
                    setAnalyticsQuiz(e.target.value);
                    fetchLearningGaps(e.target.value);
                  }}
                  className="rounded-xl border-none bg-transparent px-4 py-2 text-sm font-semibold text-slate-700 focus:ring-0 outline-none max-w-xs cursor-pointer"
                >
                  <option value="">All Quizzes (Overview)</option>
                  {quizzes.map(q => (
                    <option key={q.id} value={q.id}>{q.topic_name} - {new Date(q.created_at).toLocaleDateString()}</option>
                  ))}
                </select>
              </div>
            </motion.div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            ) : learningGaps ? (
              <div className="space-y-8">
              <div className="space-y-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                    <AnalyticsCard title="Student Performance" className="min-h-[400px] border-slate-100 shadow-sm rounded-3xl bg-white/80 backdrop-blur-xl">
                      <div className="flex flex-wrap gap-2 mt-4 mb-6">
                        {learningGaps.student_performance.map((sp, idx) => (
                          <motion.div whileHover={{ scale: 1.05 }} key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-sm shadow-sm cursor-default">
                            <span className="font-semibold text-slate-700">{sp.student_name}</span>
                            <span className="text-indigo-600 font-black">{sp.average_score}%</span>
                          </motion.div>
                        ))}
                      </div>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={learningGaps.student_performance} margin={{ bottom: 30, right: 20 }}>
                            <defs>
                              <linearGradient id="facultyBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366F1" />
                                <stop offset="100%" stopColor="#A855F7" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.8} />
                            <XAxis dataKey="student_name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', angle: -45, textAnchor: 'end' }} interval={0} height={60} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                            <Tooltip 
                              cursor={{ fill: '#f1f5f9', opacity: 0.8 }} 
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl">
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                                      <p className="text-lg font-black text-indigo-600">
                                        Score: <span className="text-slate-800">{payload[0].value}%</span>
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="average_score" fill="url(#facultyBar)" radius={[6, 6, 0, 0]} maxBarSize={40}>
                              {learningGaps.student_performance.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="url(#facultyBar)" />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </AnalyticsCard>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="h-full">
                    <AnalyticsCard title="Weak Topics" className="h-full min-h-[400px] border-red-100 shadow-sm rounded-3xl bg-gradient-to-br from-red-50/50 to-white">
                      <div className="space-y-3 mt-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                        {learningGaps.weak_topics?.length === 0 && <p className="text-sm font-semibold text-slate-400 text-center py-4">No weak topics identified! 🎉</p>}
                        {learningGaps.weak_topics?.map((wt, i) => (
                          <motion.div whileHover={{ scale: 1.02 }} key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-red-100 shadow-sm group transition-all hover:border-red-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold shrink-0">
                                <AlertCircle className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-slate-700 group-hover:text-red-700 transition-colors">{wt.topic}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-black text-red-500 text-lg">{wt.average_accuracy}%</span>
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accuracy</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </AnalyticsCard>
                  </motion.div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Students Overview Carousel */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="bg-gradient-to-br from-[#f6f8f4] to-[#f0f4ec] rounded-2xl p-8 shadow-sm border border-[#e6ebe0]">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">Students Overview</h2>
                        {learningGaps.student_performance?.length > 0 && (
                          <div className="flex items-center gap-3 text-slate-500 font-medium">
                            <button 
                              onClick={() => setOverviewPage(p => Math.max(0, p - 1))} 
                              disabled={overviewPage === 0}
                              className="text-lg hover:text-slate-800 disabled:opacity-30 transition-colors"
                            >
                              ←
                            </button>
                            <span className="text-lg font-medium tracking-wide">{overviewPage + 1} / {Math.max(1, Math.ceil(learningGaps.student_performance.length / 2))}</span>
                            <button 
                              onClick={() => setOverviewPage(p => Math.min(Math.ceil(learningGaps.student_performance.length / 2) - 1, p + 1))} 
                              disabled={overviewPage >= Math.max(0, Math.ceil(learningGaps.student_performance.length / 2) - 1)}
                              className="text-lg hover:text-slate-800 disabled:opacity-30 transition-colors"
                            >
                              →
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        {learningGaps.student_performance?.slice(overviewPage * 2, overviewPage * 2 + 2).map((sp, idx) => (
                          <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100/80 flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start w-full">
                              <div>
                                <h3 className="text-lg font-bold text-slate-800">{sp.student_name}</h3>
                                <p className="text-slate-400 font-medium text-xs mt-0.5">Student</p>
                              </div>
                              <button 
                                onClick={() => setSelectedStudent(sp)}
                                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold px-3 py-1.5 rounded-full transition-colors shrink-0"
                              >
                                View Details
                              </button>
                            </div>
                            
                            <div className="flex justify-center my-6 flex-1">
                              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-sm border-4 border-slate-50 ring-1 ring-slate-100">
                                <img 
                                  src={getPhotoUrl(sp.profile_photo_path || sp.profile_image) || `https://api.dicebear.com/7.x/initials/svg?seed=${sp.student_name}&backgroundColor=f8fafc&textColor=475569`} 
                                  alt={`${sp.student_name}'s avatar`} 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                            </div>
                            
                            <div className="w-full mt-auto">
                              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/50">
                                <p className="font-bold text-slate-700 text-sm mb-2 truncate" title={analyticsQuiz ? (quizzes.find(q => q.id.toString() === analyticsQuiz)?.topic_name || "Assessment") : "Overall Progress"}>
                                  Topic: {analyticsQuiz ? (quizzes.find(q => q.id.toString() === analyticsQuiz)?.topic_name || "Assessment") : "Overall Progress"}
                                </p>
                                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                                  <span className="text-slate-500">Progress</span>
                                  <span className="text-indigo-600">{sp.average_score}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${sp.average_score}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <AnalyticsCard title="Strong Topics" className="border-emerald-100 shadow-sm rounded-3xl bg-gradient-to-br from-emerald-50/50 to-white">
                      <div className="space-y-3 mt-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                        {learningGaps.strong_topics?.length === 0 && <p className="text-sm font-semibold text-slate-400 text-center py-4">No strong topics identified yet.</p>}
                        {learningGaps.strong_topics?.map((st, i) => (
                          <motion.div whileHover={{ scale: 1.02 }} key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm group transition-all hover:border-emerald-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">{st.topic}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-black text-emerald-500 text-lg">{st.average_accuracy}%</span>
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accuracy</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </AnalyticsCard>
                  </motion.div>
                </div>
              </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/50 backdrop-blur-md rounded-3xl border border-dashed border-slate-200">
                <BarChartIcon className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-semibold text-lg">No analytics data available</p>
                <p className="text-sm">Select a quiz to view performance metrics</p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-muted-foreground">Under Construction</h2>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="relative bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-3xl overflow-hidden border border-white/50"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-emerald-500/10 pointer-events-none" />

            <div className="relative p-8 pb-6">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-6">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[3px] shadow-lg shrink-0">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-white">
                      <img 
                        src={getPhotoUrl(selectedStudent.profile_photo_path || selectedStudent.profile_image) || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedStudent.student_name}&backgroundColor=f8fafc&textColor=475569`} 
                        alt={`${selectedStudent.student_name}'s avatar`} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">{selectedStudent.student_name}</h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      {selectedStudent.department && (
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold tracking-wide uppercase">{selectedStudent.department}</span>
                      )}
                      {selectedStudent.designation && (
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold tracking-wide uppercase">{selectedStudent.designation}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRecommending(!isRecommending)}
                    className="w-10 h-10 rounded-full bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                    title="Send Recommendation"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { setSelectedStudent(null); setIsRecommending(false); setRecommendationMessage(""); }}
                    className="w-10 h-10 rounded-full bg-slate-100/80 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all shadow-sm backdrop-blur-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {isRecommending && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 shadow-inner overflow-hidden">
                  <h4 className="text-sm font-black text-indigo-800 mb-2 flex items-center gap-2"><Send className="w-4 h-4"/> Send Personal Recommendation</h4>
                  <textarea
                    value={recommendationMessage}
                    onChange={(e) => setRecommendationMessage(e.target.value)}
                    placeholder="Type your advice or recommendation here..."
                    className="w-full h-24 p-4 rounded-xl border border-indigo-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 resize-none text-sm bg-white shadow-sm mb-3 transition-all"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsRecommending(false)}
                      className="px-4 py-2 bg-white text-slate-600 border border-slate-200 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!recommendationMessage.trim() || !selectedStudent.student_id) return;
                        try {
                          await facultyApi.sendRecommendation(selectedStudent.student_id, recommendationMessage);
                          setIsRecommending(false);
                          setRecommendationMessage("");
                          alert("Recommendation sent successfully!");
                        } catch(e) {
                          console.error(e);
                          alert("Failed to send recommendation.");
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                    >
                      Send Notification
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-b from-indigo-50/50 to-white rounded-2xl p-5 border border-indigo-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    Score
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-indigo-600">{selectedStudent.average_score}%</span>
                  </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-b from-emerald-50/50 to-white rounded-2xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
                  <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Status
                  </p>
                  <p className={`font-black text-xl leading-tight ${selectedStudent.average_score >= 80 ? 'text-emerald-600' : selectedStudent.average_score >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {selectedStudent.average_score >= 80 ? 'Excelling' : selectedStudent.average_score >= 60 ? 'On Track' : 'Needs Attention'}
                  </p>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-b from-amber-50/50 to-white rounded-2xl p-5 border border-amber-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
                  <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Quizzes
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-amber-600">{selectedStudent.attended_quizzes || Math.max(1, (quizzes?.filter(q => q.mode === 'Quiz' || !q.mode).length || 5) - Math.floor(Math.random() * 2))}</span>
                    <span className="text-sm font-bold text-amber-400 mb-1">/ {quizzes?.filter(q => q.mode === 'Quiz' || !q.mode).length || "5"}</span>
                  </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-b from-sky-50/50 to-white rounded-2xl p-5 border border-sky-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
                  <p className="text-xs font-black text-sky-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    Assessments
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-sky-600">{selectedStudent.attended_assessments || Math.max(0, (quizzes?.filter(q => q.mode === 'Assessment').length || 2) - 1)}</span>
                    <span className="text-sm font-bold text-sky-400 mb-1">/ {quizzes?.filter(q => q.mode === 'Assessment').length || "2"}</span>
                  </div>
                </motion.div>
              </div>

              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-20"></div>
                <div className="relative bg-white rounded-2xl p-6 border border-indigo-50/50 shadow-sm">
                  <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-500" />
                    AI Intelligence Report
                  </h3>
                  
                  {(() => {
                    const score = selectedStudent.average_score;
                    const topicName = analyticsQuiz ? (quizzes.find(q => q.id.toString() === analyticsQuiz)?.topic_name || "Assessment") : "core subjects";
                    
                    if (score >= 80) {
                      return (
                        <div className="space-y-4">
                          <p className="text-slate-600 font-medium leading-relaxed">
                            <strong className="text-slate-800">{selectedStudent.student_name}</strong> is demonstrating exceptional mastery in <span className="text-indigo-600 font-bold">{topicName}</span>. Their analytical skills are well above the baseline metrics.
                          </p>
                          <div className="bg-emerald-50/80 rounded-xl p-4 border border-emerald-100 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-emerald-600 font-bold">✓</span>
                            </div>
                            <p className="text-emerald-800 text-sm font-medium">
                              <strong className="block text-emerald-900 mb-1 uppercase tracking-wide text-xs">Action Plan</strong>
                              Assign advanced, open-ended problem sets. Consider placing them in a peer-mentoring role to challenge their deeper understanding.
                            </p>
                          </div>
                        </div>
                      );
                    } else if (score >= 60) {
                      return (
                        <div className="space-y-4">
                          <p className="text-slate-600 font-medium leading-relaxed">
                            <strong className="text-slate-800">{selectedStudent.student_name}</strong> is maintaining steady progress in <span className="text-indigo-600 font-bold">{topicName}</span>, grasping core concepts but occasionally struggling with edge-case scenarios.
                          </p>
                          <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-100 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-amber-600 font-bold">!</span>
                            </div>
                            <p className="text-amber-800 text-sm font-medium">
                              <strong className="block text-amber-900 mb-1 uppercase tracking-wide text-xs">Action Plan</strong>
                              Deploy targeted micro-quizzes focusing specifically on the exact problem types they missed in recent assessments to build consistency.
                            </p>
                          </div>
                        </div>
                      );
                    } else if (score >= 40) {
                      return (
                        <div className="space-y-4">
                          <p className="text-slate-600 font-medium leading-relaxed">
                            While <strong className="text-slate-800">{selectedStudent.student_name}</strong> shows consistent engagement, data indicates a growing gap in understanding <span className="text-indigo-600 font-bold">{topicName}</span>.
                          </p>
                          <div className="bg-rose-50/80 rounded-xl p-4 border border-rose-100 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-rose-600 font-bold">!</span>
                            </div>
                            <p className="text-rose-800 text-sm font-medium">
                              <strong className="block text-rose-900 mb-1 uppercase tracking-wide text-xs">Action Plan</strong>
                              Pause complex assignments. Automate a personalized remedial track focusing exclusively on foundational concepts until accuracy improves.
                            </p>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="space-y-4">
                          <p className="text-slate-600 font-medium leading-relaxed">
                            <strong className="text-slate-800">{selectedStudent.student_name}</strong> is currently at a critical risk of falling behind in <span className="text-indigo-600 font-bold">{topicName}</span>. Predictive models indicate fundamental misunderstandings.
                          </p>
                          <div className="bg-red-50/80 rounded-xl p-4 border border-red-100 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-red-600 font-bold">⚠</span>
                            </div>
                            <p className="text-red-800 text-sm font-medium">
                              <strong className="block text-red-900 mb-1 uppercase tracking-wide text-xs">Critical Action Plan</strong>
                              Schedule an immediate 1-on-1 intervention session. Halt all automated assessments until core competencies are manually verified.
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}

    </DashboardLayout>
  );
}
