import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge, ProgressBar } from '../../components/ui/Progress';
import { Search, FileText, Award, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { apiService } from '../../services/apiService';
import { formatDateTime } from '../../utils';
import { KpiTile } from '../../components/ui/KpiTile';
import { useNavigate } from 'react-router-dom';

export const QuizHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['quiz-history'],
    queryFn: apiService.getQuizHistory,
  });

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'excellent' | 'good' | 'need'>('all');

  // Demo fallbacks to mirror screenshots
  const demo = [
    { id: 'qh1', title: 'Supervised Learning Quiz', courseTitle: 'Introduction to Machine Learning', score: 92, total: 10, correct: 9, takenAt: new Date(Date.now()-5*24*3600*1000).toISOString(), timeSpentMinutes: 12, level: 'excellent' },
    { id: 'qh2', title: 'Machine Learning Types Assessment', courseTitle: 'Introduction to Machine Learning', score: 88, total: 10, correct: 8, takenAt: new Date(Date.now()-7*24*3600*1000).toISOString(), timeSpentMinutes: 10, level: 'good' },
    { id: 'qh3', title: 'Neural Networks Basics Quiz', courseTitle: 'Introduction to Machine Learning', score: 95, total: 12, correct: 11, takenAt: new Date(Date.now()-9*24*3600*1000).toISOString(), timeSpentMinutes: 15, level: 'excellent' },
  ] as any[];
  const list = (data && data.length) ? data : demo;

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    const base = list.filter((i: any) => [i.title, i.courseTitle].join(' ').toLowerCase().includes(query));
    if (filter === 'all') return base;
    if (filter === 'excellent') return base.filter((i: any) => (i.score || 0) >= 90);
    if (filter === 'good') return base.filter((i: any) => (i.score || 0) >= 75 && (i.score || 0) < 90);
    return base.filter((i: any) => (i.score || 0) < 75);
  }, [list, q, filter]);

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
          <h1 className="text-3xl font-bold text-gray-900">Quiz History</h1>
          <p className="text-gray-600 mt-1">Review your quiz performance and track your progress</p>
        </div>
        <Button variant="outlineNavy" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiTile label="Total Quizzes" value={list.length} variant="sky" icon={<FileText className="h-6 w-6" />} />
        <KpiTile label="Average Score" value={`${Math.round(list.reduce((a:number,b:any)=>a+(b.score||0),0) / (list.length||1))}%`} variant="purple" icon={<Award className="h-6 w-6" />} />
        <KpiTile label="Perfect Scores" value={list.filter((d:any)=> (d.score||0)===100).length} variant="emerald" icon={<Award className="h-6 w-6" />} />
        <KpiTile label="Total Time" value={`${list.reduce((acc:number,d:any)=>acc+(d.timeSpentMinutes||0),0)} min`} variant="orange" icon={<Clock className="h-6 w-6" />} />
      </div>

      {/* Search */}
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search quizzes..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <Search className="h-4 w-4 text-gray-400 absolute right-3 top-3" />
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quiz Performance</CardTitle>
              <p className="text-xs text-gray-500">Filter by performance level</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Pill filters */}
          <div className="mb-4 grid grid-cols-4 gap-3">
            {([
              { key: 'all', label: `All (${list.length})` },
              { key: 'excellent', label: `Excellent (${list.filter((i:any)=> (i.score||0)>=90).length})` },
              { key: 'good', label: `Good (${list.filter((i:any)=> (i.score||0)>=75 && (i.score||0)<90).length})` },
              { key: 'need', label: `Need Review (${list.filter((i:any)=> (i.score||0)<75).length})` },
            ] as any[]).map(tab => (
              <button
                key={tab.key}
                className={`px-3 py-2 rounded-full text-sm border ${filter===tab.key ? 'bg-white shadow-sm border-primary-300 text-gray-900' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {(filtered || []).map((qz: any) => (
              <div key={qz.id} className="p-5 rounded-2xl border-2 bg-white shadow-sm flex items-center justify-between relative overflow-hidden">
                <span className="absolute left-0 top-0 h-full w-1.5 bg-sky-400" />
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-100"><FileText className="h-5 w-5 text-blue-600" /></div>
                  <div>
                    <div className="font-medium text-gray-900">{qz.title}</div>
                    <div className="text-sm text-gray-600">{qz.courseTitle}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>{formatDateTime(qz.takenAt || qz.createdAt)}</span>
                      <span className="inline-flex items-center"><Clock className="h-3 w-3 mr-1" /> {qz.timeSpentMinutes || 0} min</span>
                      <span className="text-gray-400">{qz.correct || 0}/{qz.total || qz.questions?.length || 0} correct</span>
                    </div>
                    <div className="mt-3">
                      <Button variant="outlineNavy" size="sm" onClick={() => navigate(`/quiz/${qz.id}/review`, { state: qz })}>Review Answers</Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm">{qz.score ?? 0}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuizHistoryPage;
