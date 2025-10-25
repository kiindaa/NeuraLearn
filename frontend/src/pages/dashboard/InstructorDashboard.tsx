import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BookOpen, Users, BarChart3, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Total Courses',
      value: '12',
      icon: BookOpen,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Students',
      value: '1,234',
      icon: Users,
      color: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Average Rating',
      value: '4.8',
      icon: BarChart3,
      color: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  const recentCourses = [
    {
      id: '1',
      title: 'Introduction to Machine Learning',
      students: 156,
      rating: 4.9,
      status: 'active',
    },
    {
      id: '2',
      title: 'Advanced Python Programming',
      students: 89,
      rating: 4.7,
      status: 'active',
    },
    {
      id: '3',
      title: 'Data Science Fundamentals',
      students: 203,
      rating: 4.8,
      status: 'draft',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.firstName}! Manage your courses and students.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/instructor/courses/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCourses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{course.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{course.students} students</span>
                      <span>⭐ {course.rating}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        course.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {course.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="primary" size="sm">View</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
