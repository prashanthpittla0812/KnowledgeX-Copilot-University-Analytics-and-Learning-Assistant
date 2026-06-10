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
    if (error.response && error.response.status === 401) {
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
  question_type?: string;
  difficulty: "easy" | "medium" | "hard" | string;
  num_questions: number;
};

export type QuizSubmitPayload = {
  answers: Record<string, string | number>;
};

export const authApi = {
  async register(payload: { name: string; email: string; password: string; role?: string }) {
    const response = await api.post("/api/v1/auth/register", payload);
    return response.data;
  },

  async login(payload: LoginPayload) {
    const response = await api.post("/api/v1/auth/login", payload);
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
    return api.get(`/api/v1/assessment/class-performance/${quizId}`);
  },

  getLearningGaps(quizId?: string | number) {
    if (quizId) return api.get(`/api/v1/assessment/learning-gaps/${quizId}`);
    return api.get("/api/v1/dashboard/learning-gaps");
  },

  getClassInsights(quizId: string | number) {
    return api.get(`/api/v1/assessment/class-insights/${quizId}`);
  },

  getDashboard() {
    return api.get("/api/v1/faculty/dashboard");
  },
  
  getAttendance() {
    return api.get("/api/v1/attendance/class");
  },

  getAtRiskStudents() {
    return api.get("/api/v1/attendance/at-risk");
  }
};

export const studentApi = {
  generateQuiz(payload: { topic: string; difficulty: string; number_of_questions: number }) {
    return api.post("/api/v1/quiz/generate", payload);
  },

  submitQuiz(payload: { quiz_id: number; answers: string[] }) {
    return api.post("/api/v1/quiz/submit", payload);
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

  generateStudyPlan(payload: { subjects: string[]; exam_date: string; daily_hours: number }) {
    return api.post("/api/v1/studyplan/generate", payload);
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
  async askQuestion(question: string, content_ids: number[] = []) {
    const response = await api.post("/api/v1/chat/", { question, content_ids });
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
    return api.post("/api/v1/materials/notifications/read");
  }
};

export default api;

