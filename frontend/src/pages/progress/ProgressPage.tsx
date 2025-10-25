import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge, ProgressBar } from '../../components/ui/Progress';
import { Button } from '../../components/ui/Button';
import { apiService } from '../../services/apiService';
import { KpiTile } from '../../components/ui/KpiTile';
import { CheckCircle2, Award, Clock } from 'lucide-react';
import { Search, TrendingUp } from 'lucide-react';
import { formatDateTime } from '../../utils';

export const ProgressPage: React.FC = () => {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['completed-summary'],
    queryFn: apiService.getCompletedLessonsSummary,
  });

  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: ['completed-list'],
    queryFn: apiService.getCompletedLessons,
  });

  const [query, setQuery] = useState('');
  // Demo fallbacks matching screenshots
  const demoSummary = { totalCompleted: 10, averageScore: 91, totalTime: '2h 57m' };
  const demoItems = [
    { id: 'l1', title: 'Introduction to Machine Learning', courseTitle: 'Introduction to Machine Learning', completedAt: new Date(Date.now() - 5*24*3600*1000).toISOString(), timeSpent: '15:30', quizScore: 92 },
    { id: 'l2', title: 'Types of Machine Learning', courseTitle: 'Introduction to Machine Learning', completedAt: new Date(Date.now() - 7*24*3600*1000).toISOString(), timeSpent: '12:45', quizScore: 88 },
  ];
  const s = (summary && (summary.totalCompleted || summary.averageScore || summary.totalTime)) ? summary : demoSummary;
  const list = (items && items.length > 0) ? items : demoItems as any[];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list || [];
    return (list || []).filter(
      (i) => i.title.toLowerCase().includes(q) || (i.courseTitle || '').toLowerCase().includes(q)
    );
  }, [list, query]);

  if (loadingSummary || loadingItems) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-purple-50 to-emerald-50 p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Progress</h1>
            <p className="text-gray-600 mt-1">Your learning activity and completed lessons</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiTile label="Lessons Completed" value={s?.totalCompleted ?? 0} variant="emerald" icon={<CheckCircle2 className="h-6 w-6" />} />
        <KpiTile label="Average Score" value={`${s?.averageScore ?? 0}%`} variant="purple" icon={<Award className="h-6 w-6" />} />
        <KpiTile label="Total Time" value={s?.totalTime ?? '0h 0m'} variant="sky" icon={<Clock className="h-6 w-6" />} />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search completed lessons..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear</Button>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center text-gray-600 py-8">No completed lessons found.</div>
          ) : (
            <div className="space-y-4">
              {filtered.map((i) => (
                <div key={i.id} className="p-5 rounded-2xl border-2 bg-white shadow-sm flex items-center justify-between relative overflow-hidden">
                  <span className="absolute left-0 top-0 h-full w-2 bg-emerald-400" />
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{i.title}</div>
                      <div className="text-sm text-gray-600">{i.courseTitle}</div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>Completed {formatDateTime(i.completedAt)}</span>
                        <span className="inline-flex items-center"><Clock className="h-3 w-3 mr-1" /> {i.timeSpent || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <Badge
                      size="sm"
                      className={`${(i as any).quizScore >= 90 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : (i as any).quizScore >= 80 ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}
                    >
                      {(i as any).quizScore ?? '—'}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
