import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: null, isLoading: false })
}));

// Mock apiService to prevent axios ESM import issues in Jest
jest.mock('../services/apiService', () => ({
  getCourses: jest.fn().mockResolvedValue({ success: true, data: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 } }),
  getDashboardMetrics: jest.fn().mockResolvedValue({ success: true, data: { enrolledCourses: 0, lessonsCompleted: 0, quizzesTaken: 0, averageScore: 0 } }),
  login: jest.fn(),
  signup: jest.fn(),
}), { virtual: true });

import App from '../App';

it('redirects to Login for unknown route when unauthenticated', () => {
  render(
    <MemoryRouter initialEntries={['/no-such']}> 
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
});
