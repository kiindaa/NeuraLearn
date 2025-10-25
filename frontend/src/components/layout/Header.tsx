import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { LogOut, Settings, Bell } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Tagline */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <Logo size="md" />
              <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-sky-700 bg-sky-50 border border-sky-100">
                Empowering education with AI
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {[
              { to: '/dashboard', label: 'Dashboard' },
              { to: '/courses', label: 'Courses' },
              { to: '/quiz/generate', label: 'AI Quiz' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-gray-700 hover:text-primary-600'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-1">
            {user && (
              <>
                <Button
                  title="Notifications"
                  aria-label="Notifications"
                  variant="ghost"
                  size="sm"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                <Button
                  title="Profile"
                  aria-label="Profile"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/profile')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  title="Sign out"
                  aria-label="Sign out"
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </header>
  );
}
