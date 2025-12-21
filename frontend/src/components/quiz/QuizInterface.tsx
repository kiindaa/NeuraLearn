import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/Progress';
import { apiService } from '../../services/apiService';
import { Question } from '../../types';

interface QuizInterfaceProps {
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({ 
  topic = 'programming',
  difficulty = 'medium',
  questionCount = 10
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch questions from the backend
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        // Get quiz ID from URL or generate a new quiz
        const quizId = new URLSearchParams(location.search).get('quizId');
        
        let quizData;
        if (quizId) {
          // If we have a quiz ID, fetch that specific quiz
          quizData = await apiService.getQuiz(quizId);
        } else {
          // Generate a new quiz with the given parameters
          // For now, we'll use a default course ID and lesson ID since they're required
          // In a real app, you would want to get these from the current context
          const response = await apiService.generateQuiz({
            courseId: 'default-course-id',
            lessonIds: ['default-lesson-id'],
            difficulty: difficulty as 'easy' | 'medium' | 'hard',
            questionType: 'multiple_choice', // or make this configurable
            numberOfQuestions: questionCount
          });
          quizData = response;
          // Update URL to include the quiz ID for refreshing
          navigate(`?quizId=${quizData.id}`, { replace: true });
        }
        
        setQuestions(quizData.questions || []);
      } catch (error) {
        console.error('Error fetching questions:', error);
        // Fallback to empty array if there's an error
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [topic, difficulty, questionCount, navigate, location.search]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / questions.length) * 100;
  const timeFormatted = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  useEffect(() => {
    // Timer countdown
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleSubmit();
    }
  }, [timeLeft]);

  const handleNext = () => {
    // Save answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: selectedAnswer
    }));

    // Move to next question or submit if last question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(answers[currentQuestionIndex + 1] || '');
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] || '');
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // TODO: Submit answers to API
      console.log('Submitting answers:', answers);
      navigate('/quiz/results');
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quiz: Programming Concepts</h1>
        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
          ⏱️ {timeFormatted} remaining
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{(progress).toFixed(0)}% Complete</span>
        </div>
        <ProgressBar value={progress} className="h-2" />
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          {currentQuestion.text}
        </h2>

        {currentQuestion.type === 'multiple_choice' && (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedAnswer(option)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedAnswer === option
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {currentQuestion.type === 'short_answer' && (
          <textarea
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={4}
            placeholder="Type your answer here..."
          />
        )}
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={handlePrevious}
          variant="outline"
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        {currentQuestionIndex < questions.length - 1 ? (
          <Button 
            onClick={handleNext}
            disabled={!selectedAnswer.trim()}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={!selectedAnswer.trim() || isSubmitting}
            loading={isSubmitting}
          >
            Submit Quiz
          </Button>
        )}
      </div>
    </div>
  );
};
