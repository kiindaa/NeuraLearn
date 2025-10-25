export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: User;
  instructorId: string;
  thumbnail?: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  lessons: Lesson[];
  enrolledStudents: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration: number; // in minutes
  order: number;
  courseId: string;
  course?: Course;
  isCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  course?: Course;
  questions: Question[];
  scheduledAt?: string;
  duration: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  quizId: string;
  quiz?: Quiz;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  user?: User;
  quizId: string;
  quiz?: Quiz;
  answers: QuizAnswer[];
  score: number;
  totalPoints: number;
  completedAt: string;
  createdAt: string;
}

export interface QuizAnswer {
  id: string;
  questionId: string;
  question?: Question;
  answer: string;
  isCorrect: boolean;
  points: number;
  attemptId: string;
  attempt?: QuizAttempt;
}

export interface Progress {
  id: string;
  userId: string;
  user?: User;
  courseId: string;
  course?: Course;
  completedLessons: number;
  totalLessons: number;
  completedQuizzes: number;
  totalQuizzes: number;
  averageScore: number;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  enrolledCourses: number;
  lessonsCompleted: number;
  quizzesTaken: number;
  averageScore: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: 'student' | 'instructor';
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor';
}

export interface QuizGenerationRequest {
  courseId: string;
  lessonIds: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple_choice' | 'short_answer' | 'mixed';
  numberOfQuestions: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
