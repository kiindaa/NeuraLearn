import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge, ProgressBar } from '../../components/ui/Progress';
import { Button } from '../../components/ui/Button';
import { apiService } from '../../services/apiService';

export const CourseAnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['quiz-stats'],
    queryFn: apiService.getQuizStatistics,
  });
  const { data: history } = useQuery({
    queryKey: ['quiz-history'],
    queryFn: apiService.getQuizHistory,
  });

  // Demo fallbacks and filter by courseId if available
  const courseTitle = 'Introduction to Machine Learning';
  const overview = stats?.overview || { overallAverage: 87, bestPerformance: 91, totalAssessments: 14, improvement: '+7%' };
  const byCourse = stats?.performanceByCourse || [
    { course: 'Introduction to Machine Learning', average: 91, quizzes: 5 },
    { course: 'Web Development Fundamentals', average: 88, quizzes: 3 },
  ];

  const filteredCourse = byCourse.find((c: any) => c.course.toLowerCase().includes('machine')) || byCourse[0];
  const fallbackHistory = [
    { id: 'demo-1', title: 'Supervised Learning', score: 91, takenAt: '2025-10-24' },
    { id: 'demo-2', title: 'Neural Networks Basics', score: 88, takenAt: '2025-10-23' },
    { id: 'demo-3', title: 'Data Preprocessing', score: 85, takenAt: '2025-10-21' },
    { id: 'demo-4', title: 'Model Evaluation', score: 90, takenAt: '2025-10-19' },
  ];
  const courseHistory = useMemo(() => (history || []).filter((h: any) => (h.courseTitle || '').toLowerCase().includes('machine')), [history]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{filteredCourse?.course || courseTitle}</h1>
          <p className="text-gray-600 mt-1">Detailed analytics and performance trends</p>
        </div>
        <Button variant="outlineNavy" size="sm" onClick={() => navigate(-1)}>Back</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-xl border-2">
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Average Score</p>
            <p className="text-3xl font-bold text-gray-900">{filteredCourse?.average ?? overview.overallAverage}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-2">
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Quizzes</p>
            <p className="text-3xl font-bold text-gray-900">{filteredCourse?.quizzes ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-2">
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Best Score</p>
            <p className="text-3xl font-bold text-gray-900">{overview.bestPerformance}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-2">
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Improvement</p>
            <p className="text-3xl font-bold text-gray-900">{overview.improvement}</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend and performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.trend || [
              { label: 'Week 1', score: 75 },
              { label: 'Week 2', score: 80 },
              { label: 'Week 3', score: 82 },
              { label: 'Week 4', score: 87 },
            ]).map((t: any) => (
              <div key={t.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{t.label}</span>
                  <span>{t.score}%</span>
                </div>
                <ProgressBar value={t.score} max={100} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200">
              {(courseHistory.length ? courseHistory : ((history && history.length) ? history : fallbackHistory)).slice(0,5).map((q: any) => (
                <div key={q.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{q.title || `Quiz ${q.id}`}</div>
                    <div className="text-xs text-gray-500">{(q.takenAt || '').split('T')[0] || '—'}</div>
                  </div>
                  <Badge variant="primary" size="sm">{q.score ?? 0}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CourseAnalyticsPage;
