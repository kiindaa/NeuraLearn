import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/contexts/AuthContext';
import LoginPage from '../src/pages/auth/LoginPage';
import StudentDashboard from '../src/pages/dashboard/StudentDashboard';
import QuizGenerationPage from '../src/pages/quiz/QuizGenerationPage';

// Mock API service
jest.mock('../src/services/apiService', () => ({
  apiService: {
    getDashboardMetrics: jest.fn(() => Promise.resolve({
      enrolledCourses: 3,
      lessonsCompleted: 38,
      quizzesTaken: 12,
      averageScore: 87
    })),
    getStudentCourses: jest.fn(() => Promise.resolve([
      {
        id: '1',
        title: 'Introduction to Machine Learning',
        instructor: 'Dr. Sarah Chen',
        completedLessons: 13,
        totalLessons: 20,
        nextLesson: 'Neural Networks Basics',
        color: 'bg-primary-100'
      }
    ])),
    getUpcomingQuizzes: jest.fn(() => Promise.resolve([
      {
        id: '1',
        title: 'Supervised Learning',
        course: 'Introduction to Machine Learning',
        scheduledAt: '2025-10-24T14:00:00Z'
      }
    ]))
  }
}));

// Mock auth service
jest.mock('../src/services/authService', () => ({
  authService: {
    login: jest.fn(() => Promise.resolve({
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token'
    })),
    signup: jest.fn(() => Promise.resolve({
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token'
    }))
  }
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('LoginPage', () => {
  test('renders login form', () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('handles form submission', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });
  });

  test('switches between login and signup tabs', () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );
    
    const signupTab = screen.getByText('Sign Up');
    fireEvent.click(signupTab);
    
    expect(screen.getByText('Sign Up')).toHaveClass('bg-white');
  });
});

describe('StudentDashboard', () => {
  test('renders dashboard metrics', async () => {
    render(
      <TestWrapper>
        <StudentDashboard />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('My Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Enrolled Courses')).toBeInTheDocument();
      expect(screen.getByText('Lessons Completed')).toBeInTheDocument();
      expect(screen.getByText('Quizzes Taken')).toBeInTheDocument();
      expect(screen.getByText('Average Score')).toBeInTheDocument();
    });
  });

  test('renders course cards', async () => {
    render(
      <TestWrapper>
        <StudentDashboard />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Introduction to Machine Learning')).toBeInTheDocument();
      expect(screen.getByText('Dr. Sarah Chen')).toBeInTheDocument();
      expect(screen.getByText('Next: Neural Networks Basics')).toBeInTheDocument();
    });
  });

  test('renders upcoming quizzes', async () => {
    render(
      <TestWrapper>
        <StudentDashboard />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Upcoming Quizzes')).toBeInTheDocument();
      expect(screen.getByText('Supervised Learning')).toBeInTheDocument();
    });
  });
});

describe('QuizGenerationPage', () => {
  test('renders quiz generation interface', () => {
    render(
      <TestWrapper>
        <QuizGenerationPage />
      </TestWrapper>
    );
    
    expect(screen.getByText('AI Quiz Generation')).toBeInTheDocument();
    expect(screen.getByText('Lesson Selection')).toBeInTheDocument();
    expect(screen.getByText('Quiz Configuration')).toBeInTheDocument();
  });

  test('handles lesson selection', () => {
    render(
      <TestWrapper>
        <QuizGenerationPage />
      </TestWrapper>
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
  });

  test('handles difficulty selection', () => {
    render(
      <TestWrapper>
        <QuizGenerationPage />
      </TestWrapper>
    );
    
    const mediumRadio = screen.getByLabelText('Medium');
    expect(mediumRadio).toBeChecked();
    
    const easyRadio = screen.getByLabelText('Easy');
    fireEvent.click(easyRadio);
    expect(easyRadio).toBeChecked();
  });

  test('handles quiz generation', async () => {
    render(
      <TestWrapper>
        <QuizGenerationPage />
      </TestWrapper>
    );
    
    const generateButton = screen.getByRole('button', { name: /generate quiz/i });
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Generating Quiz...')).toBeInTheDocument();
    });
  });
});

describe('UI Components', () => {
  test('Button component renders correctly', () => {
    const { Button } = require('../src/components/ui/Button');
    
    render(<Button>Test Button</Button>);
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  test('Card component renders correctly', () => {
    const { Card, CardHeader, CardTitle, CardContent } = require('../src/components/ui/Card');
    
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>Test Content</CardContent>
      </Card>
    );
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('Input component renders correctly', () => {
    const { Input } = require('../src/components/ui/Input');
    
    render(<Input label="Test Input" placeholder="Enter text" />);
    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  test('ProgressBar component renders correctly', () => {
    const { ProgressBar } = require('../src/components/ui/Progress');
    
    render(<ProgressBar value={50} max={100} showLabel />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});

describe('Authentication Flow', () => {
  test('user can login and access protected routes', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      // After successful login, user should be redirected to dashboard
      expect(screen.getByText('My Dashboard')).toBeInTheDocument();
    });
  });
});

describe('Error Handling', () => {
  test('handles API errors gracefully', async () => {
    const { apiService } = require('../src/services/apiService');
    apiService.getDashboardMetrics.mockRejectedValueOnce(new Error('API Error'));
    
    render(
      <TestWrapper>
        <StudentDashboard />
      </TestWrapper>
    );
    
    await waitFor(() => {
      // Should show error state or fallback content
      expect(screen.getByText('My Dashboard')).toBeInTheDocument();
    });
  });
});
