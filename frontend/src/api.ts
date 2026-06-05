import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const TOKEN_STORAGE_KEY = "knowledgex_token";
export const USER_STORAGE_KEY = "knowledgex_user";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
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
    const response = await api.post("/auth/register", payload);
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
    return api.post("/faculty/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      params: { topic_name: topicName }
    });
  },

  generateQuiz(payload: QuizGenerationPayload) {
    return api.post("/faculty/generate-quiz", payload);
  },

  getUploadedDocuments() {
    return api.get("/dashboard/teacher/documents");
  },

  getGeneratedQuizzes() {
    return api.get("/dashboard/teacher/quizzes");
  },

  getQuizResults(quizId: string | number) {
    return api.get(`/assessment/class-performance/${quizId}`);
  },

  getLearningGaps(quizId?: string | number) {
    if (quizId) return api.get(`/assessment/learning-gaps/${quizId}`);
    return api.get("/dashboard/learning-gaps");
  },

  getClassInsights(quizId: string | number) {
    return api.get(`/assessment/class-insights/${quizId}`);
  },

  getDashboard() {
    return api.get("/faculty/dashboard");
  },
  
  getAttendance() {
    return api.get("/attendance/class");
  },

  getAtRiskStudents() {
    return api.get("/attendance/at-risk");
  }
};

export const studentApi = {
  generateQuiz(payload: { topic: string; difficulty: string; number_of_questions: number }) {
    return api.post("/quiz/generate", payload);
  },

  submitQuiz(payload: { quiz_id: number; answers: string[] }) {
    return api.post("/quiz/submit", payload);
  },

  getQuizHistory() {
    return api.get("/quiz/history");
  },

  getAssignedQuizzes() {
    return api.get("/student/assigned-quizzes");
  },

  getAssignedQuiz(quizId: number | string) {
    return api.get(`/student/quiz/${quizId}`);
  },

  submitAssignedQuiz(payload: { quiz_id: number; answers: { question_id: number; selected_answer: string }[] }) {
    return api.post("/assessment/attempt", payload);
  },

  generateStudyPlan(payload: { subjects: string[]; exam_date: string; daily_hours: number }) {
    return api.post("/studyplan/generate", payload);
  },

  getStudyPlanHistory() {
    return api.get("/studyplan/history");
  },

  getRecommendations(studentId: number) {
    return api.get(`/recommendations/${studentId}`);
  },

  getRecommendationHistory(studentId: number) {
    return api.get(`/recommendations/${studentId}/history`);
  },

  getDashboard(refreshKey?: number) {
    return api.get("/student/dashboard", {
      params: refreshKey ? { refresh: refreshKey } : undefined,
    });
  },

  getAttendance() {
    return api.get("/attendance/student/me");
  }
};

export const chatbotApi = {
  async askQuestion(question: string) {
    const response = await api.post("/chat/", { question });
    return response.data;
  },
};

export const documentApi = {
  async uploadPdf(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getDocuments() {
    return api.get("/documents");
  },
};

export const adminApi = {
  getDashboard() {
    return api.get("/admin/dashboard");
  },

  getSystemStats() {
    return api.get("/admin/stats");
  },
};

export default api;
