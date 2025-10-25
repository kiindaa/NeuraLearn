import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Progress';
import { ArrowLeft, Clock } from 'lucide-react';

export const QuizReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const quiz = (location.state as any) || {};

  const items = (quiz.questions || quiz.items || []).length ? (quiz.questions || quiz.items) : [
    { id: 'Q1', text: 'What is supervised learning?', correctAnswer: 'Training with labeled data', userAnswer: 'Training with labeled data', type: 'short answer' },
    { id: 'Q2', text: 'Pick the correct statement about backpropagation.', correctAnswer: 'Propagates error from output to input', userAnswer: 'Forward to backward', type: 'multiple choice' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz Review</h1>
          <p className="text-gray-600 mt-1">{quiz.title || `Quiz ${id}`}</p>
        </div>
        <Button variant="outlineNavy" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Summary</CardTitle>
            <div className="flex items-center gap-2">
              <Badge size="sm" className="bg-purple-100 text-purple-800 border-purple-200">{quiz.correct || 0}/{quiz.total || items.length} correct</Badge>
              <Badge variant="primary" size="sm">{quiz.score ?? 0}%</Badge>
              <span className="inline-flex items-center text-xs text-gray-500"><Clock className="h-3 w-3 mr-1" /> {quiz.timeSpentMinutes || 0} min</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((q: any) => {
              const correct = (q.userAnswer || '').toString().trim().toLowerCase() === (q.correctAnswer || '').toString().trim().toLowerCase();
              return (
                <div key={q.id} className="p-4 rounded-2xl border-2 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" size="sm">{(q.type || '').replace(/_/g, ' ')}</Badge>
                      <Badge variant={correct ? 'primary' : 'accent'} size="sm">{correct ? 'Correct' : 'Review'}</Badge>
                    </div>
                    <Badge size="sm" className="bg-gray-100 text-gray-700 border-gray-200">{q.id}</Badge>
                  </div>
                  <div className="font-medium text-gray-900 mb-2">{q.text}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="text-gray-500">Your answer</div>
                      <div className="text-gray-900">{q.userAnswer || '—'}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="text-gray-500">Correct answer</div>
                      <div className="text-gray-900">{q.correctAnswer || '—'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizReviewPage;
