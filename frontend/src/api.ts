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
  uploadDocument(formData: FormData) {
    return api.post("/faculty/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  generateQuiz(payload: QuizGenerationPayload) {
    return api.post("/faculty/generate-quiz", payload);
  },

  getUploadedDocuments() {
    return api.get("/faculty/documents");
  },

  getGeneratedQuizzes() {
    return api.get("/faculty/quizzes");
  },

  getQuizResults(quizId: string | number) {
    return api.get(`/faculty/quizzes/${quizId}/results`);
  },

  getLearningGaps() {
    return api.get("/faculty/learning-gaps");
  },

  getDashboard() {
    return api.get("/faculty/dashboard");
  },
};

export const studentApi = {
  getAvailableQuizzes() {
    return api.get("/student/quizzes");
  },

  submitQuiz(quizId: string | number, payload: QuizSubmitPayload) {
    return api.post(`/student/quizzes/${quizId}/submit`, payload);
  },

  getQuizHistory() {
    return api.get("/student/quiz-history");
  },

  getRecommendations() {
    return api.get("/student/recommendations");
  },

  getStudyPlans() {
    return api.get("/student/study-plans");
  },

  getWeakTopics() {
    return api.get("/student/weak-topics");
  },

  getDashboard() {
    return api.get("/student/dashboard");
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
