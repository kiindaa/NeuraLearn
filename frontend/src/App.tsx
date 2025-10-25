import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { StudentDashboard } from './pages/dashboard/StudentDashboard';
import { InstructorDashboard } from './pages/dashboard/InstructorDashboard';
import { CourseDetailPage } from './pages/courses/CourseDetailPage';
import { CourseAnalyticsPage } from './pages/courses/CourseAnalyticsPage';
import { CoursesPage } from './pages/courses/CoursesPage';
import { ProgressPage } from './pages/progress/ProgressPage';
import { QuizHistoryPage } from './pages/progress/QuizHistoryPage';
import { PerformanceAnalyticsPage } from './pages/progress/PerformanceAnalyticsPage';
import { QuizGenerationPage } from './pages/quiz/QuizGenerationPage';
import { QuizPage } from './pages/quiz/QuizPage';
import { QuizReviewPage } from './pages/quiz/QuizReviewPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CompletedLessonsPage } from './pages/lessons/CompletedLessonsPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="instructor" element={<InstructorDashboard />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="courses/:id/analytics" element={<CourseAnalyticsPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="progress/quizzes" element={<QuizHistoryPage />} />
          <Route path="progress/analytics" element={<PerformanceAnalyticsPage />} />
          <Route path="quiz/generate" element={<QuizGenerationPage />} />
          <Route path="quiz/:id" element={<QuizPage />} />
          <Route path="quiz/:id/review" element={<QuizReviewPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="lessons/completed" element={<CompletedLessonsPage />} />
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
