import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Lightbulb, 
  Zap, 
  CheckCircle, 
  Clock, 
  Play,
  Settings,
  Eye,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Progress';
import { apiService } from '../../services/apiService';
import { QuizGenerationRequest } from '../../types';

const LessonCard: React.FC<{
  lesson: any;
  isSelected: boolean;
  onToggle: () => void;
  isCurrent?: boolean;
}> = ({ lesson, isSelected, onToggle, isCurrent = false }) => (
  <div className={`p-4 rounded-lg border-2 transition-colors ${
    isCurrent 
      ? 'border-accent-300 bg-accent-50' 
      : isSelected 
        ? 'border-primary-300 bg-primary-50' 
        : 'border-gray-200 bg-white hover:border-gray-300'
  }`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {isCurrent ? (
          <div className="p-2 bg-accent-100 rounded-lg">
            <Play className="h-4 w-4 text-accent-600" />
          </div>
        ) : (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
        )}
        <div>
          <h4 className="font-medium text-gray-900">{lesson.title}</h4>
          {isCurrent && (
            <p className="text-sm text-gray-600">Current Lesson</p>
          )}
        </div>
      </div>
      <CheckCircle className="h-5 w-5 text-green-500" />
    </div>
  </div>
);

const QuestionCard: React.FC<{
  question: any;
  selected: string;
  onSelect: (value: string) => void;
  feedback?: { isCorrect?: boolean; correctAnswer?: string; explanation?: string };
  onCheckAnswer: () => void;
  onRevealAnswer: () => void;
}> = ({ question, selected, onSelect, feedback, onCheckAnswer, onRevealAnswer }) => (
  <Card className="mb-6">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="primary" size="sm">
          {question.id}
        </Badge>
        <div className="flex space-x-2">
          <Badge variant="secondary" size="sm">
            {(question.type || '').replace(/_/g, ' ')}
          </Badge>
          <Badge variant="accent" size="sm">
            {(question.difficulty || '').replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {question.text}
      </h3>
      
      {question.type === 'multiple_choice' && question.options && (
        <div className="space-y-2 mb-6">
          {question.options.map((option: string, index: number) => (
            <label key={index} className={`flex items-center p-3 border rounded-lg cursor-pointer ${selected===option? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input
                type="radio"
                name={`q-${question.id}`}
                value={option}
                checked={selected === option}
                onChange={() => onSelect(option)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-3 text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}
      
      {question.type === 'short_answer' && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Type your answer here..."
            value={selected}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      )}
      
      <div className="flex space-x-3">
        <Button variant="accent" size="sm" onClick={onCheckAnswer}>
          <Check className="h-4 w-4 mr-2" />
          Check Answer
        </Button>
        <Button variant="outline" size="sm" onClick={onRevealAnswer}>
          <Eye className="h-4 w-4 mr-2" />
          Reveal Answer
        </Button>
      </div>

      {feedback && (
        <div className="mt-4 p-3 rounded-lg border text-sm">
          {feedback.isCorrect !== undefined && (
            <p className={feedback.isCorrect ? 'text-green-700' : 'text-red-700'}>
              {feedback.isCorrect ? 'Correct!' : 'Incorrect.'}
            </p>
          )}
          {feedback.correctAnswer && (
            <p className="text-gray-700 mt-1">Correct answer: <span className="font-medium">{feedback.correctAnswer}</span></p>
          )}
          {feedback.explanation && (
            <p className="text-gray-600 mt-1">{feedback.explanation}</p>
          )}
        </div>
      )}
    </CardContent>
  </Card>
);

export const QuizGenerationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navState = (location.state || {}) as { courseId?: string; quizId?: string };
  const courseId = navState.courseId;
  const quizId = navState.quizId;
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'short_answer' | 'mixed'>('mixed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuizId, setGeneratedQuizId] = useState<string | null>(null);
  const [numberOfQuestions] = useState<number>(6);
  const [timeLimit, setTimeLimit] = useState<number | null>(null); // minutes, null = no limit
  const [startAt, setStartAt] = useState<number | null>(null);

  // Fetch course if navigated with courseId
  const { data: course } = useQuery({
    queryKey: ['quiz-gen-course', courseId],
    queryFn: () => apiService.getCourse(courseId!),
    enabled: !!courseId,
  });

  // recent quizzes (mini)
  const { data: historyMini } = useQuery({
    queryKey: ['quiz-history-mini'],
    queryFn: apiService.getQuizHistory,
  });

  // Build lessons from course if available; fallback to mock
  const lessons = useMemo(() => {
    if (course?.lessons && course.lessons.length > 0) {
      const built = course.lessons.map((l: any, idx: number) => ({
        id: l.id?.toString?.() || String(idx + 1),
        title: l.title || `Lesson ${idx + 1}`,
        isCurrent: false,
      }));
      // Mark first incomplete as current; otherwise first
      if (built.length > 0) built[0].isCurrent = true;
      return built;
    }
    return [
      { id: '1', title: 'Backpropagation', isCurrent: true },
      { id: '2', title: 'Introduction to Machine Learning', isCurrent: false },
      { id: '3', title: 'Types of Machine Learning', isCurrent: false },
      { id: '4', title: 'Supervised Learning Basics', isCurrent: false },
      { id: '5', title: 'Neural Networks Basics', isCurrent: false },
    ];
  }, [course]);

  // Mock generated questions
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { isCorrect?: boolean; correctAnswer?: string; explanation?: string }>>({});
  const [engaged, setEngaged] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState(false);
  // removed per-question corner sparkles for a cleaner look

  // celebration utilities (lightweight, no deps)
  const triggerConfetti = React.useCallback(() => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    const colors = ['#7c3aed', '#a855f7', '#22c55e', '#06b6d4', '#f59e0b', '#ef4444'];
    const pieces = 36;
    for (let i = 0; i < pieces; i++) {
      const el = document.createElement('span');
      el.textContent = '✦';
      el.style.position = 'absolute';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.top = (50 + Math.random() * 10) + 'vh';
      el.style.fontSize = 10 + Math.random() * 16 + 'px';
      el.style.color = colors[Math.floor(Math.random() * colors.length)];
      el.style.transform = `translate(-50%, -50%) rotate(${Math.random()*360}deg)`;
      el.style.opacity = '0';
      el.style.animation = `confetti-fall 1200ms ease-out forwards`;
      el.style.animationDelay = (Math.random() * 150) + 'ms';
      container.appendChild(el);
    }

    setTimeout(() => {
      container.remove();
    }, 1500);
  }, []);

  // bigger per-event confetti for correct answers
  const triggerConfettiBig = React.useCallback(() => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    const colors = ['#7c3aed', '#8b5cf6', '#a855f7', '#c084fc', '#d946ef'];
    const shapes = ['●','●','●','✦'];
    const pieces = 140;
    for (let i = 0; i < pieces; i++) {
      const el = document.createElement('span');
      el.textContent = shapes[Math.floor(Math.random()*shapes.length)];
      el.style.position = 'absolute';
      // spawn near bottom center (30vw..70vw, 85vh..95vh)
      el.style.left = (30 + Math.random() * 40) + 'vw';
      el.style.top = (85 + Math.random() * 10) + 'vh';
      el.style.fontSize = 10 + Math.random() * 18 + 'px';
      el.style.color = colors[Math.floor(Math.random() * colors.length)];
      el.style.textShadow = '0 0 10px rgba(168,85,247,0.35)';
      el.style.transform = `translate(-50%, -50%) rotate(${Math.random()*360}deg)`;
      el.style.opacity = '0';
      el.style.animation = `confetti-rise 1700ms ease-out forwards`;
      el.style.animationDelay = (Math.random() * 200) + 'ms';
      container.appendChild(el);
    }
    setTimeout(() => container.remove(), 2200);
  }, []);

  const playCelebrate = React.useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        o.connect(g);
        g.connect(ctx.destination);
        const t0 = now + i * 0.03;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.2, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
        o.start(t0);
        o.stop(t0 + 0.26);
      });
    } catch {}
  }, []);

  const handleLessonToggle = (lessonId: string) => {
    setEngaged(true);
    setSelectedLessons(prev => 
      prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  // Auto-hide toast after 3s
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const generateQuiz = async () => {
    setEngaged(true);
    setIsGenerating(true);
    setStartAt(Date.now());
    try {
      if (!courseId) {
        throw new Error('Missing courseId');
      }
      const payload: QuizGenerationRequest = {
        courseId,
        lessonIds: selectedLessons.length ? selectedLessons : [lessons[0]?.id].filter(Boolean) as string[],
        difficulty,
        questionType,
        numberOfQuestions,
      };
      const quiz = await apiService.generateQuiz(payload);
      setGeneratedQuizId(quiz.id);
      setGeneratedQuestions(quiz.questions || []);
    } catch (e) {
      const mockQuestions = [
        {
          id: 'Q1',
          text: 'What is the primary purpose of the backpropagation algorithm in neural networks?',
          type: 'multiple_choice',
          difficulty: 'hard',
          options: [
            'To feed data forward through the network',
            'To calculate gradients and update weights',
            'To initialize weights randomly',
            'To evaluate the final output'
          ],
          correctAnswer: 'To calculate gradients and update weights'
        },
        {
          id: 'Q2',
          text: 'What mathematical concept is fundamental to backpropagation?',
          type: 'short_answer',
          difficulty: 'hard',
          correctAnswer: 'Chain rule of calculus'
        },
        {
          id: 'Q3',
          text: 'In which direction does backpropagation propagate errors?',
          type: 'multiple_choice',
          difficulty: 'hard',
          options: [
            'From input to output',
            'From output to input',
            'In random directions',
            'Only within hidden layers'
          ],
          correctAnswer: 'From output to input'
        }
      ];
      // Use a mock quiz id to enable local check/reveal actions
      setGeneratedQuizId('mock');
      setGeneratedQuestions(mockQuestions);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCheckAnswer = async (questionId: string) => {
    try {
      const answer = (answers[questionId] || '').trim();

      const maybeCelebrate = (snapshot: Record<string, any>) => {
        if (celebrated || !generatedQuestions.length) return;
        const answered = generatedQuestions.filter((q: any) => snapshot[q.id]?.isCorrect !== undefined).length;
        if (answered === generatedQuestions.length) {
          const correct = generatedQuestions.filter((q: any) => snapshot[q.id]?.isCorrect === true).length;
          const pct = Math.round((correct / generatedQuestions.length) * 100);
          const elapsedMs = startAt ? Date.now() - startAt : null;
          const formatTime = (ms: number) => {
            const s = Math.max(0, Math.round(ms / 1000));
            const m = Math.floor(s / 60);
            const sec = s % 60;
            return `${m}m ${sec}s`;
          };
          const timeMsg = elapsedMs ? ` • Time: ${formatTime(elapsedMs)}` : '';
          if (pct >= 80) {
            triggerConfetti();
            playCelebrate();
            setToast(`Amazing! You scored 80%+ 🎉${timeMsg}`);
          } else if (pct >= 66) {
            triggerConfetti();
            setToast(`Nice! Score: ${pct}%${timeMsg}`);
          } else {
            setToast(`Score: ${pct}%${timeMsg}`);
          }
          setCelebrated(true);
        }
      };

      // Local evaluation for mock quizzes
      if (generatedQuizId === 'mock') {
        const q = generatedQuestions.find((qq) => qq.id === questionId);
        if (!q) return;
        let isCorrect = false;
        if (q.type === 'multiple_choice') {
          isCorrect = answer === q.correctAnswer;
        } else {
          const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
          isCorrect = norm(answer).includes(norm(q.correctAnswer || '')) || norm(q.correctAnswer || '').includes(norm(answer));
        }
        setFeedback((prev) => {
          const next = { ...prev, [questionId]: { isCorrect, explanation: isCorrect ? 'Great job!' : 'Review the concept and try again.' } } as any;
          maybeCelebrate(next);
          return next;
        });
        if (isCorrect) {
          // soft, purple confetti on correct check
          triggerConfettiBig();
        }
        return;
      }
      if (!generatedQuizId) return;
      const res = await apiService.checkQuestionAnswer(generatedQuizId, questionId, { answer });
      setFeedback((prev) => {
        const next = { ...prev, [questionId]: { ...prev[questionId], isCorrect: !!res.isCorrect } } as any;
        maybeCelebrate(next);
        return next;
      });
      if (res?.isCorrect) {
        // soft, purple confetti on correct check
        triggerConfettiBig();
      }
    } catch {}
  };

  const handleRevealAnswer = async (questionId: string) => {
    try {
      // Local reveal for mock quizzes
      if (generatedQuizId === 'mock') {
        const q = generatedQuestions.find((qq) => qq.id === questionId);
        if (!q) return;
        setFeedback((prev) => ({ ...prev, [questionId]: { ...prev[questionId], correctAnswer: q.correctAnswer, explanation: prev[questionId]?.explanation || 'Study this solution and try related questions.' } }));
        return;
      }
      if (!generatedQuizId) return;
      const res = await apiService.revealQuestionAnswer(generatedQuizId, questionId);
      setFeedback((prev) => ({ ...prev, [questionId]: { ...prev[questionId], correctAnswer: res.correctAnswer, explanation: res.explanation } }));
    } catch {}
  };

  return (
    <div className="space-y-8">
      {/* Inline keyframes for confetti */}
      <style>{`
        @keyframes confetti-fall{0%{transform:translate(-50%,-50%) translateY(0) rotate(0);opacity:0}10%{opacity:1}100%{transform:translate(-50%,-50%) translateY(40vh) rotate(360deg);opacity:0}}
        @keyframes confetti-rise{0%{transform:translate(-50%,-50%) translateY(0) rotate(0);opacity:0}10%{opacity:1}100%{transform:translate(-50%,-50%) translateY(-60vh) rotate(360deg);opacity:0}}
      `}</style>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li className="hover:text-gray-700">Dashboard</li>
          <li>›</li>
          <li className="hover:text-gray-700">Course</li>
          <li>›</li>
          <li className="hover:text-gray-700">Lesson</li>
          <li>›</li>
          <li className="text-gray-800 font-medium">Prepare Quiz</li>
        </ol>
      </nav>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="h-10 w-10 text-secondary-600 -mt-1" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Quiz Generation</h1>
          <p className="text-gray-600 mt-1">
            {course?.title ? (
              <>
                Preparing for <span className="font-medium text-gray-800">{course.title}</span>
              </>
            ) : (
              'Generate personalized practice questions powered by AI to test your understanding'
            )}
          </p>
        </div>
      </div>

      {generatedQuestions.length === 0 ? (
        <>
          {/* Top two-column row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {toast && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]">
                <div className="rounded-full bg-purple-600 text-white px-4 py-2 shadow-lg">{toast}</div>
              </div>
            )}
            {/* Lesson Selection (move to right on large screens) */}
            <div className="flex flex-col lg:order-2">
              <Card className="rounded-xl border-2 border-accent-200 h-full">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-orange-500" />
                    <CardTitle>Lesson Selection</CardTitle>
                  </div>
                  <p className="text-sm text-gray-600">Choose lessons for quiz generation</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Current Lesson</h3>
                    <LessonCard lesson={lessons[0]} isSelected={false} onToggle={() => {}} isCurrent={true} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Include Additional Lessons (Optional)</h3>
                    <div className="space-y-2">
                      {lessons.slice(1).map((lesson) => (
                        <LessonCard key={lesson.id} lesson={lesson} isSelected={selectedLessons.includes(lesson.id)} onToggle={() => handleLessonToggle(lesson.id)} />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Practice Questions (empty state) — moved to left on large screens */}
            <div className="flex flex-col lg:order-1">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Zap className={`h-5 w-5 ${engaged ? 'text-purple-600 animate-pulse' : 'text-accent-500'}`} />
                    <CardTitle className={`${engaged ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600' : ''}`}>AI-Generated Practice Questions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative mb-4">
                      {engaged && <span className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-purple-400/30 animate-ping" />}
                      <div className={`relative p-4 rounded-xl ${engaged ? 'bg-purple-100' : 'bg-gray-100'}`}>
                        <Brain className={`h-8 w-8 ${engaged ? 'text-purple-600 animate-pulse' : 'text-gray-400'}`} />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Generated Yet</h3>
                    <p className="text-gray-600 text-center mb-6">Configure your quiz settings and click "Generate Quiz" to start practicing.</p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-base">
                        <Lightbulb className={`h-5 w-5 ${engaged ? 'text-purple-600' : 'text-gray-500'}`} />
                        <span className={`${engaged ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600' : 'text-gray-600'} font-medium`}>Select lessons</span>
                      </div>
                      <div className="flex items-center space-x-3 text-base">
                        <Zap className={`h-5 w-5 ${engaged ? 'text-purple-600' : 'text-gray-500'}`} />
                        <span className={`${engaged ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600' : 'text-gray-600'} font-medium`}>Choose difficulty</span>
                      </div>
                      <div className="flex items-center space-x-3 text-base">
                        <Zap className={`h-5 w-5 ${engaged ? 'text-purple-600' : 'text-gray-500'}`} />
                        <span className={`${engaged ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600' : 'text-gray-600'} font-medium`}>Generate & practice</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Selection summary + Quick actions */}
          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <Badge size="sm" className="bg-purple-100 text-purple-800 border-purple-200">{selectedLessons.length + 1} lessons selected</Badge>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">Estimated ~{Math.max(5, (selectedLessons.length + 1) * 3)} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedLessons(lessons.map(l=>l.id))}>Select all</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLessons([])}>Clear</Button>
            </div>
          </div>

          {/* Quiz Configuration full-width */}
          <div className="mt-4">
            <Card className="rounded-xl border-2 border-secondary-300">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-secondary-600" />
                  <CardTitle>Quiz Configuration</CardTitle>
                  <Zap className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-sm text-gray-600">Customize your AI-generated quiz</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Question Type</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'multiple_choice', label: 'Multiple Choice' },
                      { value: 'short_answer', label: 'Short Answer' },
                      { value: 'mixed', label: 'Mixed' }
                    ].map((type) => (
                      <label key={type.value} className="flex items-center">
                        <input type="radio" value={type.value} checked={questionType === type.value} onChange={(e) => { setQuestionType(e.target.value as any); setEngaged(true); }} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300" />
                        <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Difficulty Level</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'easy', label: 'Easy', badge: 'Beginner', color: 'bg-green-100 text-green-800' },
                      { value: 'medium', label: 'Medium', badge: 'Intermediate', color: 'bg-blue-100 text-blue-800' },
                      { value: 'hard', label: 'Hard', badge: 'Advanced', color: 'bg-orange-100 text-orange-800' }
                    ].map((level) => (
                      <label key={level.value} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center">
                          <input type="radio" value={level.value} checked={difficulty === level.value} onChange={(e) => { setDifficulty(e.target.value as any); setEngaged(true); }} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300" />
                          <span className="ml-2 text-sm text-gray-700">{level.label}</span>
                        </div>
                        <Badge className={level.color} size="sm">{level.badge}</Badge>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Button variant="secondary" size="lg" onClick={generateQuiz} loading={isGenerating} className="w-full">
                    <Brain className="h-5 w-5 mr-2" />
                    Generate Quiz
                  </Button>
                  <p className="text-sm text-gray-500 text-center mt-2">{selectedLessons.length + 1} lessons selected</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary row: Recent Quizzes and Suggested Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                {((historyMini && historyMini.length) ? historyMini : [
                  { id: 'r1', title: 'Supervised Learning', score: 85, takenAt: new Date().toISOString(), timeSpentMinutes: 12 },
                  { id: 'r2', title: 'Neural Networks Basics', score: 92, takenAt: new Date(Date.now()-86400000).toISOString(), timeSpentMinutes: 18 },
                  { id: 'r3', title: 'Data Preprocessing', score: 78, takenAt: new Date(Date.now()-2*86400000).toISOString(), timeSpentMinutes: 10 },
                ]).slice(0,3).map((q:any)=> (
                  <div key={q.id} className="py-3 flex items-center justify-between border-b last:border-b-0">
                    <div>
                      <div className="font-medium text-gray-900">{q.title || `Quiz ${q.id}`}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-3">
                        <span>{new Date(q.takenAt || Date.now()).toLocaleDateString()}</span>
                        <span className="inline-flex items-center"><Clock className="h-3 w-3 mr-1" />{q.timeSpentMinutes || 0} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">{q.score ?? 0}%</Badge>
                      <Button variant="ghost" size="sm" onClick={() => setGeneratedQuestions([])}>
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(lessons || []).slice(0,6).map((l:any, idx:number) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => { setSelectedLessons([l.id]); setEngaged(true); }}
                      className={`px-3 py-1.5 rounded-full border text-sm ${selectedLessons.includes(l.id) ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                    >
                      {l.title || `Lesson ${idx+1}`}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={generateQuiz}><Brain className="h-4 w-4 mr-2" />Generate from selection</Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLessons([])}>Clear</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm text-gray-600">{generatedQuestions.length} questions generated</div>
            <Button variant="ghost" size="sm" onClick={() => { setGeneratedQuestions([]); setAnswers({}); setFeedback({}); setCelebrated(false); }}>Back to setup</Button>
          </div>
          <div className="mt-3">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-accent-500" />
                  <CardTitle>AI-Generated Practice Questions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generatedQuestions.map((question) => (
                    <QuestionCard key={question.id} question={question} selected={answers[question.id] || ''} onSelect={(val) => setAnswers((prev) => ({ ...prev, [question.id]: val }))} feedback={feedback[question.id]} onCheckAnswer={() => handleCheckAnswer(question.id)} onRevealAnswer={() => handleRevealAnswer(question.id)} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary row still visible after generation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                {((historyMini && historyMini.length) ? historyMini : [
                  { id: 'r1', title: 'Supervised Learning', score: 85, takenAt: new Date().toISOString(), timeSpentMinutes: 12 },
                  { id: 'r2', title: 'Neural Networks Basics', score: 92, takenAt: new Date(Date.now()-86400000).toISOString(), timeSpentMinutes: 18 },
                  { id: 'r3', title: 'Data Preprocessing', score: 78, takenAt: new Date(Date.now()-2*86400000).toISOString(), timeSpentMinutes: 10 },
                ]).slice(0,3).map((q:any)=> (
                  <div key={q.id} className="py-3 flex items-center justify-between border-b last:border-b-0">
                    <div>
                      <div className="font-medium text-gray-900">{q.title || `Quiz ${q.id}`}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-3">
                        <span>{new Date(q.takenAt || Date.now()).toLocaleDateString()}</span>
                        <span className="inline-flex items-center"><Clock className="h-3 w-3 mr-1" />{q.timeSpentMinutes || 0} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">{q.score ?? 0}%</Badge>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/quiz/${q.id}/review`, { state: q })}>Review</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(lessons || []).slice(0,6).map((l:any, idx:number) => (
                    <button key={l.id} type="button" onClick={() => { setSelectedLessons([l.id]); setEngaged(true); }} className={`px-3 py-1.5 rounded-full border text-sm ${selectedLessons.includes(l.id) ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                      {l.title || `Lesson ${idx+1}`}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={generateQuiz}><Brain className="h-4 w-4 mr-2" />Generate from selection</Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLessons([])}>Clear</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      {/* Celebration toast is handled by `toast` state */}
    </div>
  );
};
