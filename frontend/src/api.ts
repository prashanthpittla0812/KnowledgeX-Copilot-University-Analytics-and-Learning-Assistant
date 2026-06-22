/// <reference types="vite/client" />
import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const TOKEN_STORAGE_KEY = "knowledgex_token";
export const USER_STORAGE_KEY = "knowledgex_user";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
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
    const response = await api.post("/auth/send-registration-otp", payload);
    return response.data;
  },

  async verifyRegistrationOtp(payload: { email: string; otp: string }) {
    const response = await api.post("/auth/verify-registration-otp", payload);
    return response.data;
  },

  async register(payload: { name: string; email: string; password: string; role?: string }) {
    const response = await api.post("/api/v1/auth/register", payload);
    return response.data;
  },

  async login(payload: LoginPayload) {
    const response = await api.post("/auth/login", payload);

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
      const meResponse = await api.get("/auth/me");
      user = meResponse.data;
    }

    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem("currentUser", JSON.stringify({ name: user.name, role: user.role, id: user.id }));
    }

    return { ...response.data, user };
  },

  async verifyLoginOtp(payload: { email: string; otp_code: string }) {
    const response = await api.post("/auth/verify-login-otp", payload);

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
      const meResponse = await api.get("/api/v1/auth/me");
      user = meResponse.data;
    }

    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem("currentUser", JSON.stringify({ name: user.name, role: user.role, id: user.id }));
    }

    return { ...response.data, user };
  },

  async forgotPassword(payload: { email: string }) {
    const response = await api.post("/auth/forgot-password", payload);
    return response.data;
  },

  async verifyResetOtp(payload: { email: string; otp_code: string }) {
    const response = await api.post("/auth/verify-reset-otp", payload);
    return response.data;
  },

  async resetPassword(payload: { email: string; otp_code: string; new_password: string }) {
    const response = await api.post("/auth/reset-password", payload);
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
    return api.post("/api/v1/faculty/upload", formData, {
      params: { topic_name: topicName }
    });
  },

  generateQuiz(payload: QuizGenerationPayload) {
    return api.post("/api/v1/faculty/generate-quiz", payload);
  },

  getUploadedDocuments() {
    return api.get("/api/v1/dashboard/teacher/documents");
  },

  getGeneratedQuizzes() {
    return api.get("/api/v1/dashboard/teacher/quizzes");
  },

  getQuizResults(quizId: string | number) {
    return api.get(`/faculty/results/${quizId}`);
  },

  getLearningGaps(quizId?: string | number) {
    return api.get("/dashboard/learning-gaps", quizId ? { params: { quiz_id: quizId } } : undefined);
  },

  getClassInsights(quizId: string | number) {
    return api.get(`/api/v1/assessment/class-insights/${quizId}`);
  },

  getDashboard() {
    return api.get("/faculty/dashboard");
  },

  getRecentQuizRankings() {
    return api.get("/dashboard/teacher/recent-quiz-rankings");
  },

  getAttendance() {
    return api.get("/api/v1/attendance/class");
  },

  getAtRiskStudents() {
    return api.get("/attendance/at-risk");
  },

  getQuiz(quizId: string | number) {
    return api.get(`/faculty/quiz/${quizId}`);
  },

  getAssessmentSubmissions(assessmentId: number | string) {
    return api.get(`/faculty/assessment/${assessmentId}/submissions`);
  },

  downloadSubmission(submissionId: number | string) {
    return api.get(`/faculty/assessment/submission/${submissionId}/download`, { responseType: 'blob' });
  },

  sendRecommendation(studentId: number | string, message: string) {
    return api.post(`/dashboard/teacher/student/${studentId}/recommendation`, { message });
  }
};

export const studentApi = {
  generateQuiz(payload: { topic: string; difficulty: string; number_of_questions: number }) {
    return api.post("/api/v1/quiz/generate", payload);
  },

  submitQuiz(data: any) {
    return api.post("/quiz/submit", data);
  },

  submitAssessment(assessmentId: number | string, formData: FormData) {
    return api.post(`/student/assessment/${assessmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getAssessmentStatus(assessmentId: number | string) {
    return api.get(`/student/assessment/${assessmentId}/status`);
  },

  getQuizHistory() {
    return api.get("/api/v1/quiz/history");
  },

  getAssignedQuizzes() {
    return api.get("/api/v1/student/assigned-quizzes");
  },

  getAssignedQuiz(quizId: number | string) {
    return api.get(`/api/v1/student/quiz/${quizId}`);
  },

  submitAssignedQuiz(payload: { quiz_id: number; answers: { question_id: number; selected_answer: string }[] }) {
    return api.post("/api/v1/assessment/attempt", payload);
  },

  generateStudyPlan(payload: { subjects: string[]; exam_date: string; daily_hours: number; syllabus?: string }) {
    return api.post("/studyplan/generate", payload);
  },

  getStudyPlanHistory() {
    return api.get("/api/v1/studyplan/history");
  },

  getRecommendations(studentId: number) {
    return api.get(`/api/v1/recommendations/${studentId}`);
  },

  getRecommendationHistory(studentId: number) {
    return api.get(`/api/v1/recommendations/${studentId}/history`);
  },

  getDashboard(refreshKey?: number) {
    return api.get("/api/v1/student/dashboard", {
      params: refreshKey ? { refresh: refreshKey } : undefined,
    });
  },

  getAttendance() {
    return api.get("/api/v1/attendance/student/me");
  }
};

export const chatbotApi = {
  async askQuestion(question: string, content_ids: number[] = [], input_type: string = "TEXT") {
    const response = await api.post("/chat/", { question, content_ids, input_type });
    return response.data;
  },
  async summarize(content_id: number, summary_type: string = "Short Summary") {
    const response = await api.post("/api/v1/chat/summarize", { content_id, summary_type });
    return response.data;
  },
  async summarizeBatch(content_ids: number[], summary_type: string = "Short Summary") {
    const response = await api.post("/api/v1/chat/summarize-batch", { content_ids, summary_type });
    return response.data;
  }
};

export const documentApi = {
  async uploadPdf(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/api/v1/documents/upload", formData);
    return response.data;
  },

  async uploadMultimodal(formData: FormData) {
    const response = await api.post("/api/v1/documents/multimodal/upload", formData);
    return response.data;
  },

  async uploadMultimodalBatch(formData: FormData) {
    const response = await api.post("/api/v1/documents/multimodal/upload-batch", formData);
    return response.data;
  },

  getDocuments() {
    return api.get("/api/v1/documents");
  },
};

export const adminApi = {
  getDashboard() {
    return api.get("/api/v1/admin/dashboard");
  },

  getSystemStats() {
    return api.get("/api/v1/admin/stats");
  },
};

export const materialApi = {
  // Faculty
  async uploadMaterial(formData: FormData) {
    const response = await api.post("/api/v1/materials/faculty", formData);
    return response.data;
  },
  getFacultyMaterials() {
    return api.get("/api/v1/materials/faculty");
  },
  deleteMaterial(id: number) {
    return api.delete(`/api/v1/materials/faculty/${id}`);
  },
  getFacultyAnalytics() {
    return api.get("/api/v1/materials/faculty/analytics");
  },

  // Student
  getStudentMaterials(params?: any) {
    return api.get("/api/v1/materials/student", { params });
  },
  getRecentMaterials() {
    return api.get("/api/v1/materials/student/recent");
  },
  trackAction(id: number, action_type: "VIEW" | "DOWNLOAD") {
    return api.post(`/api/v1/materials/student/${id}/action`, { action_type });
  },
  toggleBookmark(id: number) {
    return api.post(`/api/v1/materials/student/${id}/bookmark`);
  },

  // Notifications
  getNotifications() {
    return api.get("/api/v1/materials/notifications");
  },
  markNotificationsRead() {
    return api.post("/materials/notifications/read");
  },
  deleteNotification(id: number) {
    return api.delete(`/materials/notifications/${id}`);
  }
};

export default api;

