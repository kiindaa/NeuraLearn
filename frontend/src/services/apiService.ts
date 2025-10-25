import axios, { AxiosInstance } from 'axios';
import { Course, Lesson, Quiz, DashboardMetrics, QuizGenerationRequest, ApiResponse, PaginatedResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Dashboard endpoints
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await this.api.get<ApiResponse<DashboardMetrics>>('/dashboard/metrics');
    return response.data.data;
  }

  async getStudentCourses(): Promise<Course[]> {
    const response = await this.api.get<ApiResponse<Course[]>>('/dashboard/courses');
    return response.data.data;
  }

  async getUpcomingQuizzes(): Promise<Quiz[]> {
    const response = await this.api.get<ApiResponse<Quiz[]>>('/dashboard/quizzes');
    return response.data.data;
  }

  // Course endpoints
  async getCourses(page = 1, limit = 10): Promise<PaginatedResponse<Course>> {
    const response = await this.api.get<ApiResponse<PaginatedResponse<Course>>>('/courses', {
      params: { page, limit },
    });
    return response.data.data;
  }

  async getCourse(id: string): Promise<Course> {
    const response = await this.api.get<ApiResponse<Course>>(`/courses/${id}`);
    return response.data.data;
  }

  async enrollInCourse(courseId: string): Promise<void> {
    await this.api.post(`/courses/${courseId}/enroll`);
  }

  async getCourseProgress(courseId: string): Promise<any> {
    const response = await this.api.get<ApiResponse<any>>(`/courses/${courseId}/progress`);
    return response.data.data;
  }

  // Lesson endpoints
  async getLesson(id: string): Promise<Lesson> {
    const response = await this.api.get<ApiResponse<Lesson>>(`/lessons/${id}`);
    return response.data.data;
  }

  async markLessonComplete(lessonId: string): Promise<void> {
    await this.api.post(`/lessons/${lessonId}/complete`);
  }

  // Quiz endpoints
  async generateQuiz(request: QuizGenerationRequest): Promise<Quiz> {
    const response = await this.api.post<ApiResponse<Quiz>>('/quiz/generate', request);
    return response.data.data;
  }

  async getQuiz(id: string): Promise<Quiz> {
    const response = await this.api.get<ApiResponse<Quiz>>(`/quiz/${id}`);
    return response.data.data;
  }

  async submitQuizAttempt(quizId: string, answers: any[]): Promise<any> {
    const response = await this.api.post<ApiResponse<any>>(`/quiz/${quizId}/submit`, { answers });
    return response.data.data;
  }

  async getQuizAttempts(quizId: string): Promise<any[]> {
    const response = await this.api.get<ApiResponse<any[]>>(`/quiz/${quizId}/attempts`);
    return response.data.data;
  }

  async checkQuestionAnswer(quizId: string, questionId: string, payload: { answer: string }): Promise<{ isCorrect: boolean; explanation?: string }>{
    const response = await this.api.post<ApiResponse<{ isCorrect: boolean; explanation?: string }>>(
      `/quiz/${quizId}/questions/${questionId}/answer`,
      payload
    );
    return response.data.data;
  }

  async revealQuestionAnswer(quizId: string, questionId: string): Promise<{ correctAnswer: string; explanation?: string }> {
    const response = await this.api.get<ApiResponse<{ correctAnswer: string; explanation?: string }>>(
      `/quiz/${quizId}/questions/${questionId}/reveal`
    );
    return response.data.data;
  }

  // Quiz analytics
  async getQuizHistory(): Promise<Array<{ id: string; title: string; courseTitle: string; score: number; total: number; correct: number; takenAt: string; timeSpentMinutes?: number }>> {
    const response = await this.api.get<ApiResponse<any[]>>('/quiz/history');
    return response.data.data;
  }

  async getQuizStatistics(): Promise<{ overview: any; performanceByCourse: Array<{ course: string; average: number; quizzes: number }>; trend: Array<{ label: string; score: number }>; byType: Array<{ label: string; score: number }>; totalTimeMinutes: number }>{
    const response = await this.api.get<ApiResponse<any>>('/quiz/statistics');
    return response.data.data;
  }

  // Completed lessons endpoints
  async getCompletedLessonsSummary(): Promise<{ totalCompleted: number; averageScore: number; totalTime: string }> {
    const response = await this.api.get<ApiResponse<{ totalCompleted: number; averageScore: number; totalTime: string }>>(
      '/lessons/completed/summary'
    );
    return response.data.data;
  }

  async getCompletedLessons(): Promise<Array<{ id: string; title: string; courseTitle: string; completedAt: string; timeSpent?: string; quizScore?: number }>> {
    const response = await this.api.get<ApiResponse<Array<{ id: string; title: string; courseTitle: string; completedAt: string; timeSpent?: string; quizScore?: number }>>>(
      '/lessons/completed'
    );
    return response.data.data;
  }

  // User endpoints
  async updateProfile(data: any): Promise<any> {
    const response = await this.api.put<ApiResponse<any>>('/user/profile', data);
    return response.data.data;
  }

  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await this.api.post<ApiResponse<{ url: string }>>('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.url;
  }
}

export const apiService = new ApiService();
