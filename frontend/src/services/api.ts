/// <reference types="vite/client" />
import axios from "axios";

// Clean up base URL to avoid trailing slashes
let rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
if (rawBaseUrl.endsWith("/")) {
  rawBaseUrl = rawBaseUrl.slice(0, -1);
}
// Strip /api/v1 from the end if it was accidentally included in the .env
if (rawBaseUrl.endsWith("/api/v1")) {
  rawBaseUrl = rawBaseUrl.slice(0, -7);
}

export const API_BASE_URL = rawBaseUrl;

export const TOKEN_STORAGE_KEY = "knowledgex_token";
export const USER_STORAGE_KEY = "knowledgex_user";

export const API_ENDPOINTS = {
  // Auth
  SEND_REGISTRATION_OTP: `/api/v1/auth/send-registration-otp`,
  VERIFY_REGISTRATION_OTP: `/api/v1/auth/verify-registration-otp`,
  REGISTER: `/api/v1/auth/register`,
  LOGIN: `/api/v1/auth/login`,
  ME: `/api/v1/auth/me`,
  VERIFY_LOGIN_OTP: `/api/v1/auth/verify-login-otp`,
  FORGOT_PASSWORD: `/api/v1/auth/forgot-password`,
  VERIFY_RESET_OTP: `/api/v1/auth/verify-reset-otp`,
  RESET_PASSWORD: `/api/v1/auth/reset-password`,
  UPDATE_PROFILE: `/api/v1/auth/profile`,
  UPDATE_PROFILE_PHOTO: `/api/v1/auth/profile/photo`,
  CHANGE_PASSWORD: `/api/v1/auth/change-password`,
  
  // Faculty
  FACULTY_UPLOAD: `/api/v1/faculty/upload`,
  FACULTY_GENERATE_QUIZ: `/api/v1/faculty/generate-quiz`,
  FACULTY_DOCUMENTS: `/api/v1/dashboard/teacher/documents`,
  FACULTY_QUIZZES: `/api/v1/dashboard/teacher/quizzes`,
  FACULTY_RESULTS: (id: string | number) => `/api/v1/faculty/results/${id}`,
  FACULTY_LEARNING_GAPS: `/api/v1/dashboard/learning-gaps`,
  FACULTY_CLASS_INSIGHTS: (id: string | number) => `/api/v1/assessment/class-insights/${id}`,
  FACULTY_DASHBOARD: `/api/v1/faculty/dashboard`,
  FACULTY_RECENT_RANKINGS: `/api/v1/dashboard/teacher/recent-quiz-rankings`,
  FACULTY_ATTENDANCE: `/api/v1/attendance/class`,
  FACULTY_AT_RISK: `/api/v1/attendance/at-risk`,
  FACULTY_QUIZ: (id: string | number) => `/api/v1/faculty/quiz/${id}`,
  FACULTY_ASSESSMENT_SUBMISSIONS: (id: string | number) => `/api/v1/faculty/assessment/${id}/submissions`,
  FACULTY_DOWNLOAD_SUBMISSION: (id: string | number) => `/api/v1/faculty/assessment/submission/${id}/download`,
  FACULTY_SEND_RECOMMENDATION: (id: string | number) => `/api/v1/dashboard/teacher/student/${id}/recommendation`,

  // Student
  STUDENT_GENERATE_QUIZ: `/api/v1/quiz/generate`,
  STUDENT_SUBMIT_QUIZ: `/api/v1/quiz/submit`,
  STUDENT_SUBMIT_ASSESSMENT: (id: string | number) => `/api/v1/student/assessment/${id}/submit`,
  STUDENT_ASSESSMENT_STATUS: (id: string | number) => `/api/v1/student/assessment/${id}/status`,
  STUDENT_QUIZ_HISTORY: `/api/v1/quiz/history`,
  STUDENT_ASSIGNED_QUIZZES: `/api/v1/student/assigned-quizzes`,
  STUDENT_ASSIGNED_QUIZ: (id: string | number) => `/api/v1/student/quiz/${id}`,
  STUDENT_SUBMIT_ASSIGNED_QUIZ: `/api/v1/assessment/attempt`,
  STUDENT_GENERATE_STUDY_PLAN: `/api/v1/studyplan/generate`,
  STUDENT_STUDY_PLAN_HISTORY: `/api/v1/studyplan/history`,
  STUDENT_RECOMMENDATIONS: (id: string | number) => `/api/v1/recommendations/${id}`,
  STUDENT_RECOMMENDATION_HISTORY: (id: string | number) => `/api/v1/recommendations/${id}/history`,
  STUDENT_DASHBOARD: `/api/v1/student/dashboard`,
  STUDENT_ATTENDANCE: `/api/v1/attendance/student/me`,

  // Chatbot
  CHAT: `/api/v1/chat/`,
  CHAT_SUMMARIZE: `/api/v1/chat/summarize`,
  CHAT_SUMMARIZE_BATCH: `/api/v1/chat/summarize-batch`,

  // Documents
  DOC_UPLOAD_PDF: `/api/v1/documents/upload`,
  DOC_UPLOAD_MULTIMODAL: `/api/v1/documents/multimodal/upload`,
  DOC_UPLOAD_MULTIMODAL_BATCH: `/api/v1/documents/multimodal/upload-batch`,
  DOC_GET_ALL: `/api/v1/documents`,

  // Admin
  ADMIN_DASHBOARD: `/api/v1/admin/dashboard`,
  ADMIN_STATS: `/api/v1/admin/stats`,
  ADMIN_AUDIT_LOGS: `/api/v1/admin/audit-logs`,

  // Materials
  MAT_FACULTY_UPLOAD: `/api/v1/materials/faculty`,
  MAT_FACULTY_GET: `/api/v1/materials/faculty`,
  MAT_FACULTY_DELETE: (id: string | number) => `/api/v1/materials/faculty/${id}`,
  MAT_FACULTY_ANALYTICS: `/api/v1/materials/faculty/analytics`,
  MAT_STUDENT_GET: `/api/v1/materials/student`,
  MAT_STUDENT_RECENT: `/api/v1/materials/student/recent`,
  MAT_STUDENT_ACTION: (id: string | number) => `/api/v1/materials/student/${id}/action`,
  MAT_STUDENT_BOOKMARK: (id: string | number) => `/api/v1/materials/student/${id}/bookmark`,
  
  // Notifications
  NOTIFICATIONS_GET: `/api/v1/materials/notifications`,
  NOTIFICATIONS_MARK_READ: `/api/v1/materials/notifications/read`,
  NOTIFICATIONS_DELETE: (id: string | number) => `/api/v1/materials/notifications/${id}`,
};

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  // Runtime debugging as requested
  console.log("API Base URL:", API_BASE_URL);
  console.log("Request URL:", config.url);

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      error.config &&
      !error.config.url?.includes("/auth/login")
    ) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem("currentUser");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export type LoginPayload = {
  email: string;
  password: string;
};

export type QuizGenerationPayload = {
  faculty_name?: string;
  topic_name: string;
  document_topic?: string;
  question_type?: string;
  difficulty: "easy" | "medium" | "hard" | string;
  num_questions: number;
  semester?: string;
};

export type QuizSubmitPayload = {
  answers: Record<string, string | number>;
};

export const authApi = {
  async sendRegistrationOtp(payload: { email: string }) {
    const response = await api.post(API_ENDPOINTS.SEND_REGISTRATION_OTP, payload);
    return response.data;
  },

  async verifyRegistrationOtp(payload: { email: string; otp: string }) {
    const response = await api.post(API_ENDPOINTS.VERIFY_REGISTRATION_OTP, payload);
    return response.data;
  },

  async register(payload: { name: string; email: string; password: string; role?: string }) {
    const response = await api.post(API_ENDPOINTS.REGISTER, payload);
    return response.data;
  },

  async login(payload: LoginPayload) {
    const response = await api.post(API_ENDPOINTS.LOGIN, payload);

    const token =
      response.data?.access_token ||
      response.data?.token ||
      response.data?.jwt ||
      response.data?.data?.access_token;

    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }

    let user = response.data?.user;
    if (!user && token) {
      const meResponse = await api.get(API_ENDPOINTS.ME);
      user = meResponse.data;
    }

    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem("currentUser", JSON.stringify({ name: user.name, role: user.role, id: user.id }));
    }

    return { ...response.data, user };
  },

  async verifyLoginOtp(payload: { email: string; otp_code: string }) {
    const response = await api.post(API_ENDPOINTS.VERIFY_LOGIN_OTP, payload);

    const token =
      response.data?.access_token ||
      response.data?.token ||
      response.data?.jwt ||
      response.data?.data?.access_token;

    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }

    let user = response.data?.user;
    if (!user && token) {
      const meResponse = await api.get(API_ENDPOINTS.ME);
      user = meResponse.data;
    }

    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem("currentUser", JSON.stringify({ name: user.name, role: user.role, id: user.id }));
    }

    return { ...response.data, user };
  },

  async forgotPassword(payload: { email: string }) {
    const response = await api.post(API_ENDPOINTS.FORGOT_PASSWORD, payload);
    return response.data;
  },

  async verifyResetOtp(payload: { email: string; otp_code: string }) {
    const response = await api.post(API_ENDPOINTS.VERIFY_RESET_OTP, payload);
    return response.data;
  },

  async resetPassword(payload: { email: string; otp_code: string; new_password: string }) {
    const response = await api.post(API_ENDPOINTS.RESET_PASSWORD, payload);
    return response.data;
  },

  logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem("currentUser");
  },

  getToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  getStoredUser() {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  },
};

export const facultyApi = {
  uploadDocument(formData: FormData, topicName: string) {
    return api.post(API_ENDPOINTS.FACULTY_UPLOAD, formData, {
      params: { topic_name: topicName }
    });
  },

  generateQuiz(payload: QuizGenerationPayload) {
    return api.post(API_ENDPOINTS.FACULTY_GENERATE_QUIZ, payload);
  },

  getUploadedDocuments() {
    return api.get(API_ENDPOINTS.FACULTY_DOCUMENTS);
  },

  getGeneratedQuizzes() {
    return api.get(API_ENDPOINTS.FACULTY_QUIZZES);
  },

  getQuizResults(quizId: string | number) {
    return api.get(API_ENDPOINTS.FACULTY_RESULTS(quizId));
  },

  getLearningGaps(quizId?: string | number) {
    return api.get(API_ENDPOINTS.FACULTY_LEARNING_GAPS, quizId ? { params: { quiz_id: quizId } } : undefined);
  },

  getClassInsights(quizId: string | number) {
    return api.get(API_ENDPOINTS.FACULTY_CLASS_INSIGHTS(quizId));
  },

  getDashboard() {
    return api.get(API_ENDPOINTS.FACULTY_DASHBOARD);
  },

  getRecentQuizRankings() {
    return api.get(API_ENDPOINTS.FACULTY_RECENT_RANKINGS);
  },

  getAttendance() {
    return api.get(API_ENDPOINTS.FACULTY_ATTENDANCE);
  },

  getAtRiskStudents() {
    return api.get(API_ENDPOINTS.FACULTY_AT_RISK);
  },

  getQuiz(quizId: string | number) {
    return api.get(API_ENDPOINTS.FACULTY_QUIZ(quizId));
  },

  getAssessmentSubmissions(assessmentId: number | string) {
    return api.get(API_ENDPOINTS.FACULTY_ASSESSMENT_SUBMISSIONS(assessmentId));
  },

  downloadSubmission(submissionId: number | string) {
    return api.get(API_ENDPOINTS.FACULTY_DOWNLOAD_SUBMISSION(submissionId), { responseType: 'blob' });
  },

  sendRecommendation(studentId: number | string, message: string) {
    return api.post(API_ENDPOINTS.FACULTY_SEND_RECOMMENDATION(studentId), { message });
  }
};

export const studentApi = {
  generateQuiz(payload: { topic: string; difficulty: string; number_of_questions: number }) {
    return api.post(API_ENDPOINTS.STUDENT_GENERATE_QUIZ, payload);
  },

  submitQuiz(data: any) {
    return api.post(API_ENDPOINTS.STUDENT_SUBMIT_QUIZ, data);
  },

  submitAssessment(assessmentId: number | string, formData: FormData) {
    return api.post(API_ENDPOINTS.STUDENT_SUBMIT_ASSESSMENT(assessmentId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getAssessmentStatus(assessmentId: number | string) {
    return api.get(API_ENDPOINTS.STUDENT_ASSESSMENT_STATUS(assessmentId));
  },

  getQuizHistory() {
    return api.get(API_ENDPOINTS.STUDENT_QUIZ_HISTORY);
  },

  getAssignedQuizzes() {
    return api.get(API_ENDPOINTS.STUDENT_ASSIGNED_QUIZZES);
  },

  getAssignedQuiz(quizId: number | string) {
    return api.get(API_ENDPOINTS.STUDENT_ASSIGNED_QUIZ(quizId));
  },

  submitAssignedQuiz(payload: { quiz_id: number; answers: { question_id: number; selected_answer: string }[] }) {
    return api.post(API_ENDPOINTS.STUDENT_SUBMIT_ASSIGNED_QUIZ, payload);
  },

  generateStudyPlan(payload: { subjects: string[]; exam_date: string; daily_hours: number; syllabus?: string }) {
    return api.post(API_ENDPOINTS.STUDENT_GENERATE_STUDY_PLAN, payload);
  },

  getStudyPlanHistory() {
    return api.get(API_ENDPOINTS.STUDENT_STUDY_PLAN_HISTORY);
  },

  getRecommendations(studentId: number) {
    return api.get(API_ENDPOINTS.STUDENT_RECOMMENDATIONS(studentId));
  },

  getRecommendationHistory(studentId: number) {
    return api.get(API_ENDPOINTS.STUDENT_RECOMMENDATION_HISTORY(studentId));
  },

  getDashboard(refreshKey?: number) {
    return api.get(API_ENDPOINTS.STUDENT_DASHBOARD, {
      params: refreshKey ? { refresh: refreshKey } : undefined,
    });
  },

  getAttendance() {
    return api.get(API_ENDPOINTS.STUDENT_ATTENDANCE);
  }
};

export const chatbotApi = {
  async askQuestion(question: string, content_ids: number[] = [], input_type: string = "TEXT") {
    const response = await api.post(API_ENDPOINTS.CHAT, { question, content_ids, input_type });
    return response.data;
  },
  async summarize(content_id: number, summary_type: string = "Short Summary") {
    const response = await api.post(API_ENDPOINTS.CHAT_SUMMARIZE, { content_id, summary_type });
    return response.data;
  },
  async summarizeBatch(content_ids: number[], summary_type: string = "Short Summary") {
    const response = await api.post(API_ENDPOINTS.CHAT_SUMMARIZE_BATCH, { content_ids, summary_type });
    return response.data;
  }
};

export const documentApi = {
  async uploadPdf(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(API_ENDPOINTS.DOC_UPLOAD_PDF, formData);
    return response.data;
  },

  async uploadMultimodal(formData: FormData) {
    const response = await api.post(API_ENDPOINTS.DOC_UPLOAD_MULTIMODAL, formData);
    return response.data;
  },

  async uploadMultimodalBatch(formData: FormData) {
    const response = await api.post(API_ENDPOINTS.DOC_UPLOAD_MULTIMODAL_BATCH, formData);
    return response.data;
  },

  getDocuments() {
    return api.get(API_ENDPOINTS.DOC_GET_ALL);
  },
};

export const adminApi = {
  getDashboard() {
    return api.get(API_ENDPOINTS.ADMIN_DASHBOARD);
  },

  getSystemStats() {
    return api.get(API_ENDPOINTS.ADMIN_STATS);
  },
  
  getAuditLogs(timeRange?: string, department?: string) {
    const queryParams = new URLSearchParams();
    if (timeRange && timeRange !== "All Time") queryParams.append("time_range", timeRange);
    if (department && department !== "All Departments") queryParams.append("department", department);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return api.get(`${API_ENDPOINTS.ADMIN_AUDIT_LOGS}${queryString}`);
  }
};

export const materialApi = {
  // Faculty
  async uploadMaterial(formData: FormData) {
    const response = await api.post(API_ENDPOINTS.MAT_FACULTY_UPLOAD, formData);
    return response.data;
  },
  getFacultyMaterials() {
    return api.get(API_ENDPOINTS.MAT_FACULTY_GET);
  },
  deleteMaterial(id: number) {
    return api.delete(API_ENDPOINTS.MAT_FACULTY_DELETE(id));
  },
  getFacultyAnalytics() {
    return api.get(API_ENDPOINTS.MAT_FACULTY_ANALYTICS);
  },

  // Student
  getStudentMaterials(params?: any) {
    return api.get(API_ENDPOINTS.MAT_STUDENT_GET, { params });
  },
  getRecentMaterials() {
    return api.get(API_ENDPOINTS.MAT_STUDENT_RECENT);
  },
  trackAction(id: number, action_type: "VIEW" | "DOWNLOAD") {
    return api.post(API_ENDPOINTS.MAT_STUDENT_ACTION(id), { action_type });
  },
  toggleBookmark(id: number) {
    return api.post(API_ENDPOINTS.MAT_STUDENT_BOOKMARK(id));
  },

  // Notifications
  getNotifications() {
    return api.get(API_ENDPOINTS.NOTIFICATIONS_GET);
  },
  markNotificationsRead() {
    return api.post(API_ENDPOINTS.NOTIFICATIONS_MARK_READ);
  },
  deleteNotification(id: number) {
    return api.delete(API_ENDPOINTS.NOTIFICATIONS_DELETE(id));
  }
};

export default api;
