import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils';
import { 
  Home, 
  BookOpen, 
  Brain, 
  BarChart3, 
  User, 
  Settings,
  GraduationCap,
  Users,
  FileText
} from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Courses', href: '/courses', icon: BookOpen },
  { name: 'AI Quiz', href: '/quiz/generate', icon: Brain },
  { name: 'Progress', href: '/progress', icon: BarChart3 },
  { name: 'Profile', href: '/profile', icon: User },
];

const instructorNavigation = [
  { name: 'Dashboard', href: '/instructor', icon: Home },
  { name: 'My Courses', href: '/instructor/courses', icon: BookOpen },
  { name: 'Students', href: '/instructor/students', icon: Users },
  { name: 'Analytics', href: '/instructor/analytics', icon: BarChart3 },
  { name: 'Profile', href: '/profile', icon: User },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Determine which navigation to show based on user role
  const navItems = currentPath.startsWith('/instructor') ? instructorNavigation : navigation;

  return (
    <div className={cn(
      'bg-white shadow-sm border-r border-gray-200 min-h-screen relative transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Toggle button */}
      <button
        type="button"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={onToggle}
        className="absolute -right-3 top-20 z-10 bg-white border border-gray-200 rounded-full p-1 shadow hover:bg-gray-50"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
      <div className={cn('p-6', collapsed && 'px-2') }>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = currentPath === item.href || 
              (item.href !== '/dashboard' && currentPath.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors',
                  collapsed ? 'justify-center p-2' : 'px-3 py-2',
                  isActive
                    ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className={cn('h-5 w-5', collapsed ? '' : 'mr-3')} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
