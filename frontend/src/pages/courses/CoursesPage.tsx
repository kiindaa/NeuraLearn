import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Filter, Tag, UserPlus, Users, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar, Badge } from '../../components/ui/Progress';
import { apiService } from '../../services/apiService';
import { useNavigate } from 'react-router-dom';

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['courses', 1],
    queryFn: () => apiService.getCourses(1, 12),
  });

  // Fallback mock data to display nice demo cards when API has no content
  const mockCourses = [
    {
      id: 'mock-ml',
      title: 'Introduction to Machine Learning',
      description: 'Foundations of ML including supervised and unsupervised learning, model evaluation, and workflows.',
      category: 'AI & Machine Learning',
      difficulty: 'beginner',
      instructor: 'Dr. Sarah Chen',
      completedLessons: 13,
      totalLessons: 20,
      duration: 12,
      students: 1243,
      rating: 4.8,
      lastActivity: new Date().toISOString(),
    },
    {
      id: 'mock-web',
      title: 'Web Development Fundamentals',
      description: 'Core web concepts: HTML, CSS, JavaScript, accessibility, and responsive design.',
      category: 'Web Development',
      difficulty: 'beginner',
      instructor: 'Prof. Michael Roberts',
      completedLessons: 8,
      totalLessons: 20,
      duration: 10,
      students: 2156,
      rating: 4.9,
      lastActivity: new Date(Date.now() - 24*3600*1000).toISOString(),
    },
    {
      id: 'mock-dsa',
      title: 'Data Structures & Algorithms',
      description: 'Arrays, linked lists, trees, graphs, sorting, and Big-O.',
      category: 'Computer Science',
      difficulty: 'intermediate',
      instructor: 'Dr. Emily Carter',
      completedLessons: 17,
      totalLessons: 20,
      duration: 14,
      students: 980,
      rating: 4.7,
      lastActivity: new Date(Date.now() - 3*24*3600*1000).toISOString(),
    },
    {
      id: 'mock-react',
      title: 'React Hooks Deep Dive',
      description: 'Modern React with Hooks, state patterns, and performance.',
      category: 'Web Development',
      difficulty: 'intermediate',
      instructor: 'Alex Johnson',
      completedLessons: 5,
      totalLessons: 12,
      duration: 8,
      students: 673,
      rating: 4.6,
      lastActivity: new Date(Date.now() - 2*24*3600*1000).toISOString(),
    },
  ];

  const courses = (data?.items && data.items.length > 0) ? data.items : mockCourses;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-1">Browse available courses and continue learning</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <Filter className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <BookOpen className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No courses available</h3>
            <p className="text-gray-600 mt-1">Check back later or contact your instructor.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((c: any) => (
            <div key={c.id} role="button" onClick={() => navigate(`/courses/${c.id}`)} className="group">
              <Card className={`transition-shadow border-2 ${activeId===c.id ? 'border-primary-300 ring-1 ring-primary-100' : 'hover:shadow-md border-transparent group-hover:border-primary-200'}`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{c.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{c.instructor || '—'}</p>
                        {c.category && (
                          <div className="mt-1">
                            <Badge size="sm" className="bg-gray-100 text-gray-700 border-gray-200 whitespace-nowrap">{c.category}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="success" size="sm" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      {Math.round((c.completedLessons / c.totalLessons) * 100)}%
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{c.completedLessons}/{c.totalLessons} lessons</span>
                    </div>
                    <ProgressBar value={c.completedLessons} max={c.totalLessons} size="lg" />
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                    {/* Duration */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <div className="leading-tight">
                        <div className="text-gray-900">{c.duration || 0}</div>
                        <div className="text-gray-500">weeks</div>
                      </div>
                    </div>

                    {/* Students */}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div className="leading-tight">
                        <div className="text-gray-900">{c.students || 0}</div>
                        <div className="text-gray-500">students</div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <div className="leading-tight">
                        <div className="text-gray-900">{c.rating || 0}</div>
                        <div className="text-gray-500">/5.0</div>
                      </div>
                    </div>

                    {/* Updated */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <div className="leading-tight">
                        {c.lastActivity ? (
                          <>
                            <div className="text-gray-900">2 hours</div>
                            <div className="text-gray-500">ago</div>
                          </>
                        ) : (
                          <>
                            <div className="text-gray-900">—</div>
                            <div className="text-gray-500">updated</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pt-1">
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary-200 hover:bg-primary-50"
                        onMouseDown={(e) => { e.stopPropagation(); setActiveId(c.id); }}
                        onClick={(e) => { e.stopPropagation(); setActiveId(c.id); navigate(`/courses/${c.id}`); }}
                      >
                        View
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        className="hover:bg-primary-600"
                        onMouseDown={(e) => { e.stopPropagation(); setActiveId(c.id); }}
                        onClick={(e) => { e.stopPropagation(); setActiveId(c.id); apiService.enrollInCourse(c.id).then(() => refetch()); }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" /> Enroll
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/courses/${c.id}/analytics`); }}>
                        Analytics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
