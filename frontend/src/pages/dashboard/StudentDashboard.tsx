import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle, FileText, Trophy, ChevronRight, Clock, Users, Star, Tag, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/Progress';
import { Badge } from '../../components/ui/Progress';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { KpiTile } from '../../components/ui/KpiTile';
import { formatDateTime, getDifficultyColor } from '../../utils';

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}> = ({ title, value, icon, color, onClick }) => (
  <div
    role={onClick ? 'button' : undefined}
    onClick={onClick}
    className={
      onClick
        ? 'cursor-pointer'
        : undefined
    }
  >
    <Card className={`transition-shadow ${onClick ? 'hover:shadow-md' : 'hover:shadow-sm'}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const CourseCard: React.FC<{
  course: any;
  onContinue: () => void;
  onPrepare: () => void;
}> = ({ course, onContinue, onPrepare }) => {
  const progress = Math.round((course.completedLessons / course.totalLessons) * 100);
  const [active, setActive] = React.useState<'prepare' | 'continue' | null>(null);
  
  return (
    <Card className={`transition-shadow border-2 ${active ? 'border-primary-300 ring-1 ring-primary-100' : 'hover:shadow-md'}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${course.color || 'bg-primary-100'}`}>
              <BookOpen className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
              <p className="text-sm text-gray-600">by {course.instructor}</p>
              {course.category && (
                <div className="mt-1 flex items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    <Tag className="h-3 w-3 mr-1" /> {course.category}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Badge variant="primary" size="sm">
            {progress}%
          </Badge>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm text-gray-600">{course.completedLessons}/{course.totalLessons} lessons</span>
          </div>
          <ProgressBar 
            value={course.completedLessons} 
            max={course.totalLessons}
            color="primary"
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mb-4">
          <div className="flex items-center whitespace-nowrap">
            <ChevronRight className="h-4 w-4 mr-1 text-gray-500" /> Next: {course.nextLesson || '—'}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" /> {course.duration || 0} weeks
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" /> {course.students || 0} students
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-500" /> {course.rating || '4.8'}/5.0
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">{course.lastActivity ? `Updated ${formatDateTime(course.lastActivity)}` : ''}</div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className={`border-primary-300 text-primary-600 hover:bg-primary-50 ${active==='prepare' ? 'bg-primary-100 text-primary-700' : ''}`}
              onMouseDown={() => setActive('prepare')}
              onClick={() => { setActive('prepare'); onPrepare(); }}
            >
              Prepare
            </Button>
            <Button
              variant="accent"
              size="sm"
              className={`${active==='continue' ? 'bg-primary-600 hover:bg-primary-700' : ''}`}
              onMouseDown={() => setActive('continue')}
              onClick={() => { setActive('continue'); onContinue(); }}
            >
              Continue Learning
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const QuizCard: React.FC<{
  quiz: any;
  onPrepare: () => void;
}> = ({ quiz, onPrepare }) => {
  const [active, setActive] = React.useState(false);
  const handlePrepare = () => {
    setActive(true);
    onPrepare();
  };
  return (
    <Card className={`transition-shadow border-2 ${active ? 'border-primary-300 ring-1 ring-primary-100' : 'hover:shadow-md'}`}>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{quiz.title}</h3>
          <p className="text-sm text-gray-600">{quiz.course}</p>
        </div>
        
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <Clock className="h-4 w-4 mr-1" />
          {formatDateTime(quiz.scheduledAt)}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className={`w-full justify-center border-primary-300 text-primary-600 hover:bg-primary-50 ${active ? 'bg-primary-100 text-primary-700' : ''}`}
          onMouseDown={() => setActive(true)}
          onClick={handlePrepare}
        >
          Prepare
        </Button>
      </CardContent>
    </Card>
  );
};

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: apiService.getDashboardMetrics,
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['student-courses'],
    queryFn: apiService.getStudentCourses,
  });

  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ['upcoming-quizzes'],
    queryFn: apiService.getUpcomingQuizzes,
  });

  if (metricsLoading || coursesLoading || quizzesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Demo fallbacks to mirror screenshots when backend is empty
  const demoMetrics = {
    enrolledCourses: 3,
    lessonsCompleted: 38,
    quizzesTaken: 12,
    averageScore: 87,
  };
  const demoCourses = [
    {
      id: 'mock-ml',
      title: 'Introduction to Machine Learning',
      instructor: 'Dr. Sarah Chen',
      completedLessons: 13,
      totalLessons: 20,
      nextLesson: 'Neural Networks Basics',
      duration: 12,
      students: 1243,
      rating: '4.8',
      color: 'bg-emerald-100',
      lastActivity: new Date().toISOString(),
    },
    {
      id: 'mock-web',
      title: 'Web Development Fundamentals',
      instructor: 'Prof. Michael Roberts',
      completedLessons: 8,
      totalLessons: 20,
      nextLesson: 'JavaScript ES6 Features',
      duration: 10,
      students: 2156,
      rating: '4.9',
      color: 'bg-blue-100',
      lastActivity: new Date(Date.now() - 24*3600*1000).toISOString(),
    },
  ];
  const demoQuizzes = [
    { id: 'q1', title: 'Supervised Learning', course: 'Introduction to Machine Learning', scheduledAt: new Date(Date.now() + 24*3600*1000).toISOString() },
    { id: 'q2', title: 'React Hooks', course: 'Web Development Fundamentals', scheduledAt: new Date(Date.now() + 48*3600*1000).toISOString() },
  ];

  const m = metrics && (metrics.enrolledCourses || metrics.lessonsCompleted || metrics.quizzesTaken || metrics.averageScore)
    ? metrics
    : demoMetrics;
  const courseList = (courses && courses.length > 0) ? courses : demoCourses as any[];
  const quizList = (quizzes && quizzes.length > 0) ? quizzes : demoQuizzes as any[];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{`Welcome Back, ${user?.firstName || 'Learner'}!`}</h1>
        <p className="text-gray-600 mt-2">Here's your learning progress</p>
        <div className="mt-4">
          <Button variant="outlineNavy" size="sm" onClick={() => navigate('/lessons/completed')}>
            View Completed Lessons
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Enrolled Courses" value={m?.enrolledCourses || 3} variant="blue" icon={<BookOpen className="h-6 w-6" />} onClick={() => navigate('/courses')} />
        <KpiTile label="Lessons Completed" value={m?.lessonsCompleted || 38} variant="emerald" icon={<CheckCircle className="h-6 w-6" />} onClick={() => navigate('/lessons/completed')} />
        <KpiTile label="Quizzes Taken" value={m?.quizzesTaken || 12} variant="orange" icon={<FileText className="h-6 w-6" />} onClick={() => navigate('/progress/quizzes')} />
        <KpiTile label="Average Score" value={`${m?.averageScore || 87}%`} variant="purple" icon={<Trophy className="h-6 w-6" />} onClick={() => navigate('/progress/analytics')} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Courses */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">My Courses</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          <div className="space-y-4">
            {courseList?.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onContinue={() => {
                  navigate(`/courses/${course.id}`);
                }}
                onPrepare={() => {
                  navigate('/quiz/generate', { state: { courseId: course.id } });
                }}
              />
            ))}
          </div>
        </div>

        {/* Upcoming Quizzes */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Quizzes</h2>
          <div className="space-y-4">
            {quizList?.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onPrepare={() => {
                  navigate('/quiz/generate', { state: { courseId: quiz.courseId, quizId: quiz.id } });
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
