import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge, ProgressBar } from '../../components/ui/Progress';
import { Button } from '../../components/ui/Button';
import { TrendingUp, ArrowLeft, Trophy, BookOpen } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { KpiTile } from '../../components/ui/KpiTile';

export const PerformanceAnalyticsPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['quiz-stats'],
    queryFn: apiService.getQuizStatistics,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Demo fallbacks to mirror screenshots when backend is empty
  const demoStats = {
    overview: { overallAverage: 87, bestPerformance: 91, totalAssessments: 14, improvement: '+7%' },
    performanceByCourse: [
      { course: 'Introduction to Machine Learning', average: 91, quizzes: 5 },
      { course: 'Web Development Fundamentals', average: 88, quizzes: 3 },
      { course: 'Data Structures & Algorithms', average: 90, quizzes: 4 },
      { course: 'Python for Data Science', average: 85, quizzes: 2 },
    ],
    trend: [
      { label: 'Week 1', score: 75 },
      { label: 'Week 2', score: 80 },
      { label: 'Week 3', score: 82 },
      { label: 'Week 4', score: 87 },
    ],
    byType: [
      { label: 'Theory Questions', score: 92 },
      { label: 'Practical Problems', score: 85 },
      { label: 'Code Analysis', score: 88 },
      { label: 'Conceptual Understanding', score: 90 },
    ],
  };

  const overview = data?.overview && (data.overview.overallAverage || data.overview.totalAssessments)
    ? data.overview
    : demoStats.overview;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed insights into your learning performance and progress</p>
        </div>
        <Button variant="outlineNavy" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiTile label="Overall Average" value={`${overview.overallAverage}%`} variant="purple" icon={<Trophy className="h-6 w-6" />} />
        <KpiTile label="Best Performance" value={`${overview.bestPerformance}%`} variant="emerald" icon={<Trophy className="h-6 w-6" />} />
        <KpiTile label="Total Assessments" value={overview.totalAssessments} variant="sky" icon={<BookOpen className="h-6 w-6" />} />
        <KpiTile label="Improvement" value={overview.improvement} variant="orange" icon={<TrendingUp className="h-6 w-6" />} />
      </div>

      {/* Performance by Course + Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data?.performanceByCourse && data.performanceByCourse.length ? data.performanceByCourse : demoStats.performanceByCourse).map((c: any) => (
              <div key={c.course}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{c.course}</span>
                  <Badge size="sm" className="bg-gray-100 text-gray-700 border-gray-200">{c.quizzes} quizzes</Badge>
                </div>
                <ProgressBar value={c.average} max={100} color="primary" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.trend && data.trend.length ? data.trend : demoStats.trend).map((t: any) => (
              <div key={t.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{t.label}</span>
                  <span>{t.score}%</span>
                </div>
                <ProgressBar value={t.score} max={100} color="secondary" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* By Question Type */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Question Type</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(data?.byType && data.byType.length ? data.byType : demoStats.byType).map((b: any) => (
            <div key={b.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>{b.label}</span>
                <span>{b.score}%</span>
              </div>
              <ProgressBar value={b.score} max={100} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default PerformanceAnalyticsPage;
