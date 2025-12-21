import { useState } from 'react';
import { Card } from '../ui/Card';
import { KpiTile } from '../ui/KpiTile';
import { Button } from '../ui/Button';

type TimeRange = '7d' | '30d' | '90d' | 'all';

const performanceData = {
  accuracy: 87,
  averageScore: 82,
  quizzesCompleted: 12,
  timeSpent: '15h 23m',
};

const recentQuizzes = [
  { id: 1, name: 'JavaScript Fundamentals', score: 85, date: '2023-05-15' },
  { id: 2, name: 'React Hooks', score: 92, date: '2023-05-10' },
  { id: 3, name: 'CSS Grid', score: 78, date: '2023-05-05' },
];

const topics = [
  { name: 'JavaScript', progress: 75, color: 'bg-blue-500' },
  { name: 'React', progress: 60, color: 'bg-cyan-500' },
  { name: 'CSS', progress: 45, color: 'bg-purple-500' },
  { name: 'Node.js', progress: 30, color: 'bg-green-500' },
];

export const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-full ${
                timeRange === range
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile 
          label="Average Score" 
          value={`${performanceData.averageScore}%`}
          variant="blue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        
        <KpiTile 
          label="Quizzes Completed" 
          value={performanceData.quizzesCompleted.toString()}
          variant="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        
        <KpiTile 
          label="Accuracy" 
          value={`${performanceData.accuracy}%`}
          variant="orange"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        
        <KpiTile 
          label="Time Spent" 
          value={performanceData.timeSpent}
          variant="purple"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Quizzes */}
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Quizzes</h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="space-y-4">
            {recentQuizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div>
                  <h3 className="font-medium text-gray-900">{quiz.name}</h3>
                  <p className="text-sm text-gray-500">{quiz.date}</p>
                </div>
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${
                    quiz.score >= 80 ? 'text-green-600' : 
                    quiz.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {quiz.score}%
                  </span>
                  <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Topics Progress */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Topics Progress</h2>
          <div className="space-y-4">
            {topics.map((topic) => (
              <div key={topic.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{topic.name}</span>
                  <span className="font-medium">{topic.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-full rounded-full ${topic.color}`}
                    style={{ width: `${topic.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button className="w-full" variant="outline">
              View Detailed Progress
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary-50 border-primary-100">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg mr-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">New Quiz</h3>
              <p className="text-sm text-gray-500">Start a new practice session</p>
            </div>
          </div>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Review Mistakes</h3>
              <p className="text-sm text-gray-500">Practice questions you got wrong</p>
            </div>
          </div>
        </Card>

        <Card className="bg-purple-50 border-purple-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Performance Trends</h3>
              <p className="text-sm text-gray-500">View your progress over time</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
