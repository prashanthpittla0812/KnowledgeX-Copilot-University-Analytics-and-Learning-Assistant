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
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [quizTopic, setQuizTopic] = useState("");
  const [quizType, setQuizType] = useState("MCQ");
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizCount, setQuizCount] = useState(0);

  // Quiz Results State
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizPerformance, setQuizPerformance] = useState(null);
  const [quizDetails, setQuizDetails] = useState(null);
  const [activeQuizTab, setActiveQuizTab] = useState("performance");

  // Analyze Results State
  const [learningGaps, setLearningGaps] = useState(null);
  const [selectedQuizGaps, setSelectedQuizGaps] = useState(null);
  const [analyticsQuiz, setAnalyticsQuiz] = useState("");

  // Recommendations State
  const [dashboardStats, setDashboardStats] = useState(null);



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

  const fetchLearningGaps = async (quizId = "") => {
    try {
      setIsLoading(true);
      const res = await facultyApi.getLearningGaps(quizId || undefined);
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



  useEffect(() => {
    if (activeItem === "Quizzes") {
      fetchQuizzes();
    } else if (activeItem === "Analytics") {
      fetchQuizzes();
      fetchLearningGaps(analyticsQuiz);
      fetchDashboardStats();
    }
  }, [activeItem]);

  const handleUploadDocument = async (file = null) => {
    const fileToUpload = file || uploadFile;
    if (!fileToUpload || !uploadTopic) return alert("Provide file and topic");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", fileToUpload);
      await facultyApi.uploadDocument(formData, uploadTopic);
      setUploadedDocs(prev => [...prev, { name: fileToUpload.name, topic: uploadTopic }]);
      setUploadFile(null);
      setUploadTopic("");
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
        num_questions: quizCount
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

                <div className="mb-10 max-w-4xl mx-auto">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-slate-100 flex gap-4 items-start">
                      <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 shrink-0">
                        <FileText className="w-8 h-8 text-orange-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">Generate Assessments</h2>
                        <p className="text-slate-500 mt-1">Upload your knowledge base and configure assessment details</p>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-10">
                      {/* Step 1 */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-100 text-orange-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">1</div>
                          <h3 className="text-lg font-bold text-slate-900">Upload Knowledge Base</h3>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-sm font-bold text-slate-900 mb-2 block">
                              Topic Name <span className="text-red-500">*</span>
                            </label>
                            <input 
                              value={uploadTopic} 
                              onChange={e => setUploadTopic(e.target.value)} 
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400" 
                              placeholder="e.g., Computer Networks Ch 1" 
                            />
                          </div>
                          <div>
                            <label className="text-sm font-bold text-slate-900 mb-2 block">
                              Lecture PDF <span className="text-red-500">*</span>
                            </label>
                            {isUploading ? (
                              <div className="w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-600 font-semibold flex items-center gap-2">
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
                                <div className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm flex items-center gap-3 focus-within:ring-2 focus-within:ring-orange-500 transition-all">
                                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-semibold whitespace-nowrap">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                    Choose File
                                  </div>
                                  <span className="text-slate-500 truncate">{uploadFile ? uploadFile.name : "No file chosen"}</span>
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-slate-500 mt-2">Upload a PDF file containing the lecture content.</p>
                          </div>
                        </div>

                        {uploadedDocs.length > 0 && (
                          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 animate-in fade-in slide-in-from-top-2">
                            <h5 className="text-xs font-bold text-emerald-800 uppercase mb-3">Successfully Uploaded</h5>
                            <div className="space-y-2">
                              {uploadedDocs.map((doc, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border border-emerald-100 shadow-sm">
                                  <div className="flex items-center gap-2 text-emerald-700">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="font-semibold">{doc.topic}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-emerald-600 truncate max-w-[150px] text-xs" title={doc.name}>{doc.name}</span>
                                    <button onClick={() => setUploadedDocs(prev => prev.filter((_, i) => i !== idx))} className="text-emerald-400 hover:text-red-500 transition-colors p-1" title="Remove">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-center mt-6">
                          <div className="p-6 rounded-2xl border border-slate-200 bg-white w-full max-w-sm shadow-sm">
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
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" 
                            />
                            <p className="text-xs text-slate-500 mt-2">Enter the number of questions to generate.</p>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-slate-100 w-full"></div>

                      {/* Step 2 */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-100 text-orange-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">2</div>
                          <h3 className="text-lg font-bold text-slate-900">Assessment Details</h3>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                          <div>
                            <label className="text-sm font-bold text-slate-900 mb-2 block">
                              Assessment Topic <span className="text-red-500">*</span>
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
                              <option value="MCQ">MCQ</option>
                              <option value="Theory">Theory</option>
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
                                  {opt}
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">Learning gaps and topic performance.</p>
              </div>
              <select
                value={analyticsQuiz}
                onChange={(e) => {
                  setAnalyticsQuiz(e.target.value);
                  fetchLearningGaps(e.target.value);
                }}
                className="rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none max-w-xs"
              >
                <option value="" >All Quizzes</option>
                {quizzes.map(q => (
                  <option key={q.id} value={q.id}>{q.topic_name} - {new Date(q.created_at).toLocaleDateString()}</option>
                ))}
              </select>
            </div>

            {isLoading ? <p className="text-muted-foreground">Loading Analytics...</p> : learningGaps ? (
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
                        <XAxis dataKey="student_name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)', angle: -45, textAnchor: 'end' }} interval={0} height={60} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} domain={[0, 100]} />
                        <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.4 }} contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }} />
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
            ) : (
              <p className="text-muted-foreground mt-8 text-center bg-muted/20 py-8 rounded-xl border border-dashed border-muted">No analytics data available or backend is still loading.</p>
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
