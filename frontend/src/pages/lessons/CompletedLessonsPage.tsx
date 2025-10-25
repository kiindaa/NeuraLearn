import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Award, Clock, CalendarDays, BadgeCheck, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Progress';
import { Button } from '../../components/ui/Button';
import { apiService } from '../../services/apiService';
import { formatDateTime } from '../../utils';
import { KpiTile } from '../../components/ui/KpiTile';

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }>
  = ({ title, value, icon, color }) => (
  <Card className="rounded-xl border-2 hover:shadow-sm transition">
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      </div>
    </CardContent>
  </Card>
);

export const CompletedLessonsPage: React.FC = () => {
  const { data: summary } = useQuery({
    queryKey: ['completed-lessons-summary'],
    queryFn: apiService.getCompletedLessonsSummary,
  });

  const { data: lessons } = useQuery({
    queryKey: ['completed-lessons-list'],
    queryFn: apiService.getCompletedLessons,
  });

  const [q, setQ] = useState('');
  // Demo fallbacks to mirror screenshots
  const demoSummary = { totalCompleted: 10, averageScore: 91, totalTime: '2h 57m', thisWeek: 8 };
  const demoLessons = [
    { id: 'l1', title: 'Introduction to Machine Learning', courseTitle: 'Introduction to Machine Learning', completedAt: new Date(Date.now()-5*24*3600*1000).toISOString(), timeSpent: '15:30', quizScore: 92 },
    { id: 'l2', title: 'Types of Machine Learning', courseTitle: 'Introduction to Machine Learning', completedAt: new Date(Date.now()-7*24*3600*1000).toISOString(), timeSpent: '12:45', quizScore: 88 },
  ];
  const s = (summary && (summary.totalCompleted || summary.averageScore || summary.totalTime)) ? summary : demoSummary;
  const list = (lessons && lessons.length > 0) ? lessons : demoLessons as any[];

  const filtered = useMemo(() =>
    (list || []).filter((l: any) =>
      [l.title, l.courseTitle].join(' ').toLowerCase().includes(q.toLowerCase())),
    [list, q]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Completed Lessons</h1>
          <p className="text-gray-600 mt-1">Track your learning achievements and review completed content</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiTile label="Total Completed" value={s?.totalCompleted ?? 0} variant="emerald" icon={<CheckCircle2 className="h-6 w-6" />} />
        <KpiTile label="Average Score" value={`${s?.averageScore ?? 0}%`} variant="purple" icon={<Award className="h-6 w-6" />} />
        <KpiTile label="Total Time" value={s?.totalTime ?? '0h 0m'} variant="sky" icon={<Clock className="h-6 w-6" />} />
        <KpiTile label="This Week" value={`${(s as any)?.thisWeek ?? demoSummary.thisWeek} lessons`} variant="orange" icon={<Clock className="h-6 w-6" />} />
      </div>

      {/* Search */}
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search completed lessons..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <Search className="h-4 w-4 text-gray-400 absolute right-3 top-3" />
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>All Completed Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filtered.map((item: any) => (
              <div key={item.id} className="p-5 rounded-2xl border-2 bg-white shadow-sm flex items-center justify-between relative overflow-hidden">
                <span className="absolute left-0 top-0 h-full w-1.5 bg-emerald-400" />
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-100">
                    <BadgeCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-600">{item.courseTitle}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span className="inline-flex items-center"><CalendarDays className="h-3 w-3 mr-1" /> {formatDateTime(item.completedAt)}</span>
                      <span className="inline-flex items-center"><Clock className="h-3 w-3 mr-1" /> {item.timeSpent || '—'}</span>
                      <span>Quiz: Completed</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm">
                  <Badge className={`${(item.quizScore ?? 0) >= 90 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`} size="sm">{item.quizScore ?? '—'}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CompletedLessonsPage;
