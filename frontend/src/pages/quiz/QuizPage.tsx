import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, Brain, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Progress';
import { apiService } from '../../services/apiService';

export const QuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [submitResult, setSubmitResult] = React.useState<any | null>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => apiService.getQuiz(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz not found</h2>
        <p className="text-gray-600">The quiz you're looking for doesn't exist.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!id) return;
    const payload = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
    const result = await apiService.submitQuizAttempt(id, payload);
    setSubmitResult(result);
  };

  return (
    <div className="space-y-8">
      {/* Quiz Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <Brain className="h-6 w-6 text-secondary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-gray-600">{quiz.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" size="sm">
              {quiz.difficulty}
            </Badge>
            <Badge variant="accent" size="sm">
              {quiz.questions?.length || 0} Questions
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {quiz.duration} minutes
          </div>
          <div className="flex items-center">
            <Zap className="h-4 w-4 mr-1" />
            AI Generated
          </div>
        </div>
      </div>

      {/* Quiz Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {quiz.questions?.map((question: any, index: number) => (
            <div key={question.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="primary" size="sm">
                  Q{index + 1}
                </Badge>
                <div className="flex space-x-2">
                  <Badge variant="secondary" size="sm">
                    {question.type}
                  </Badge>
                  <Badge variant="accent" size="sm">
                    {question.difficulty}
                  </Badge>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {question.text}
              </h3>
              
              {question.type === 'multiple_choice' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option: string, optionIndex: number) => (
                    <label key={optionIndex} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-3 text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {question.type === 'short_answer' && (
                <div>
                  <textarea
                    placeholder="Type your answer here..."
                    value={answers[question.id] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex flex-col items-center space-y-3">
        <Button variant="primary" size="lg" onClick={handleSubmit}>
          <CheckCircle className="h-5 w-5 mr-2" />
          Submit Quiz
        </Button>
        {submitResult && (
          <div className="text-sm text-gray-700">
            Score: <span className="font-semibold">{submitResult.score}/{submitResult.totalPoints}</span>
          </div>
        )}
      </div>
    </div>
  );
};
