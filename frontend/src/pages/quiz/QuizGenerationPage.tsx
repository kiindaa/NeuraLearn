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
  const navState = (location.state || {}) as { courseId?: string; quizId?: string; courseTitle?: string; lessonTitle?: string };
  const courseId = navState.courseId;
  const quizId = navState.quizId;
  const passedCourseTitle = navState.courseTitle;
  const passedLessonTitle = navState.lessonTitle;
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'short_answer' | 'mixed'>('mixed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuizId, setGeneratedQuizId] = useState<string | null>(null);
  const questionsPerTopic = 4; // 4 questions per selected topic
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

  // Course-specific fallback lessons based on course name/title
  const getCourseLessons = (courseName: string | undefined) => {
    const name = (courseName || '').toLowerCase();
    
    // Web Development courses
    if (name.includes('web') || name.includes('frontend') || name.includes('html') || name.includes('css') || name.includes('javascript')) {
      return [
        { id: '1', title: 'HTML Fundamentals', isCurrent: true },
        { id: '2', title: 'CSS Styling and Layout', isCurrent: false },
        { id: '3', title: 'JavaScript Basics', isCurrent: false },
        { id: '4', title: 'DOM Manipulation', isCurrent: false },
        { id: '5', title: 'Responsive Web Design', isCurrent: false },
      ];
    }
    
    // React courses
    if (name.includes('react')) {
      return [
        { id: '1', title: 'React Components', isCurrent: true },
        { id: '2', title: 'React Hooks', isCurrent: false },
        { id: '3', title: 'State Management', isCurrent: false },
        { id: '4', title: 'React Router', isCurrent: false },
        { id: '5', title: 'React Performance', isCurrent: false },
      ];
    }
    
    // Python courses
    if (name.includes('python')) {
      return [
        { id: '1', title: 'Python Basics', isCurrent: true },
        { id: '2', title: 'Data Structures in Python', isCurrent: false },
        { id: '3', title: 'Functions and Modules', isCurrent: false },
        { id: '4', title: 'Object-Oriented Python', isCurrent: false },
        { id: '5', title: 'File Handling', isCurrent: false },
      ];
    }
    
    // Data Science courses
    if (name.includes('data science') || name.includes('analytics')) {
      return [
        { id: '1', title: 'Data Analysis Fundamentals', isCurrent: true },
        { id: '2', title: 'Pandas and NumPy', isCurrent: false },
        { id: '3', title: 'Data Visualization', isCurrent: false },
        { id: '4', title: 'Statistical Analysis', isCurrent: false },
        { id: '5', title: 'Data Cleaning', isCurrent: false },
      ];
    }
    
    // Default: Machine Learning
    return [
      { id: '1', title: 'Backpropagation', isCurrent: true },
      { id: '2', title: 'Introduction to Machine Learning', isCurrent: false },
      { id: '3', title: 'Types of Machine Learning', isCurrent: false },
      { id: '4', title: 'Supervised Learning Basics', isCurrent: false },
      { id: '5', title: 'Neural Networks Basics', isCurrent: false },
    ];
  };

  // Build lessons from course if available; fallback to course-specific mock
  const lessons = useMemo(() => {
    // SIMPLE FIX: Check courseId directly - mock-web = web course, mock-ml = ML course
    // This bypasses all the complex title detection
    if (courseId === 'mock-web') {
      return [
        { id: '1', title: 'HTML Fundamentals', isCurrent: true },
        { id: '2', title: 'CSS Styling and Layout', isCurrent: false },
        { id: '3', title: 'JavaScript Basics', isCurrent: false },
        { id: '4', title: 'DOM Manipulation', isCurrent: false },
        { id: '5', title: 'Responsive Web Design', isCurrent: false },
      ];
    }
    
    if (courseId === 'mock-ml') {
      return [
        { id: '1', title: 'Introduction to Machine Learning', isCurrent: true },
        { id: '2', title: 'Types of Machine Learning', isCurrent: false },
        { id: '3', title: 'Supervised Learning Basics', isCurrent: false },
        { id: '4', title: 'Neural Networks Basics', isCurrent: false },
        { id: '5', title: 'Backpropagation', isCurrent: false },
      ];
    }

    // For other courses, use passed title or fetched title
    const courseTitle = (passedCourseTitle || course?.title || '').toLowerCase();
    
    // Check for web-related keywords in title
    if (courseTitle.includes('web') || courseTitle.includes('frontend') || courseTitle.includes('javascript') || courseTitle.includes('html') || courseTitle.includes('css') || courseTitle.includes('react')) {
      return [
        { id: '1', title: 'HTML Fundamentals', isCurrent: true },
        { id: '2', title: 'CSS Styling and Layout', isCurrent: false },
        { id: '3', title: 'JavaScript Basics', isCurrent: false },
        { id: '4', title: 'DOM Manipulation', isCurrent: false },
        { id: '5', title: 'Responsive Web Design', isCurrent: false },
      ];
    }
    
    // Check for ML-related keywords
    if (courseTitle.includes('machine') || courseTitle.includes('learning') || courseTitle.includes('neural') || courseTitle.includes('ai') || courseTitle.includes('data science')) {
      return [
        { id: '1', title: 'Introduction to Machine Learning', isCurrent: true },
        { id: '2', title: 'Types of Machine Learning', isCurrent: false },
        { id: '3', title: 'Supervised Learning Basics', isCurrent: false },
        { id: '4', title: 'Neural Networks Basics', isCurrent: false },
        { id: '5', title: 'Backpropagation', isCurrent: false },
      ];
    }
    
    // Default fallback - use ML lessons
    return [
      { id: '1', title: 'Introduction to Machine Learning', isCurrent: true },
      { id: '2', title: 'Types of Machine Learning', isCurrent: false },
      { id: '3', title: 'Supervised Learning Basics', isCurrent: false },
      { id: '4', title: 'Neural Networks Basics', isCurrent: false },
      { id: '5', title: 'Backpropagation', isCurrent: false },
    ];
  }, [courseId, course, passedCourseTitle]);

  // Calculate total questions based on selected lessons (4 per topic)
  // Current lesson (lessons[0]) is always included + any additional selected lessons
  const effectiveSelectedLessons = lessons.length > 0 
    ? [lessons[0].id, ...selectedLessons.filter(id => id !== lessons[0]?.id)]
    : [];
  const numberOfQuestions = effectiveSelectedLessons.length * questionsPerTopic;

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
      // Generate dynamic mock questions based on selected settings
      // Include current lesson (lessons[0]) + any additional selected lessons
      // Pass course title for context-aware question generation
      const mockQuestions = generateMockQuestions(difficulty, questionType, numberOfQuestions, lessons, effectiveSelectedLessons, course?.title);
      // Use a mock quiz id to enable local check/reveal actions
      setGeneratedQuizId('mock');
      setGeneratedQuestions(mockQuestions);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to generate mock questions based on settings
  // Generates 4 questions per selected topic with TOPIC-SPECIFIC questions
  const generateMockQuestions = (
    diff: 'easy' | 'medium' | 'hard',
    qType: 'multiple_choice' | 'short_answer' | 'mixed',
    _count: number,
    allLessons: typeof lessons,
    selected: string[],
    courseTitle?: string
  ) => {
    // Detect course type from course title
    const lowerCourseTitle = (courseTitle || '').toLowerCase();
    const isWebCourse = ['web', 'frontend', 'html', 'css', 'javascript', 'react', 'vue', 'angular', 'node', 'express'].some(kw => lowerCourseTitle.includes(kw));
    const isMLCourse = ['machine learning', 'ml', 'neural', 'deep learning', 'ai', 'artificial intelligence', 'data science'].some(kw => lowerCourseTitle.includes(kw));
    
    // Get selected lesson titles, but override with course-appropriate topics if needed
    let selectedLessonTitles = selected.length > 0
      ? allLessons.filter(l => selected.includes(l.id)).map(l => l.title)
      : allLessons.map(l => l.title);
    
    // If course is web dev but lessons are ML (data mismatch), use web topics instead
    if (isWebCourse) {
      const webTopics = ['HTML Fundamentals', 'CSS Styling and Layout', 'JavaScript Basics', 'DOM Manipulation', 'Responsive Web Design'];
      // Replace ML-looking topics with web topics
      selectedLessonTitles = selectedLessonTitles.map((title, idx) => {
        const lowerTitle = title.toLowerCase();
        const isMLTopic = ['machine', 'learning', 'neural', 'backprop', 'supervised', 'unsupervised'].some(kw => lowerTitle.includes(kw));
        if (isMLTopic) {
          return webTopics[idx % webTopics.length];
        }
        return title;
      });
    }
    
    const QUESTIONS_PER_TOPIC = 4;
    
    // Topic-specific question banks with actual relevant questions
    const topicQuestionBanks: Record<string, { easy: any[], medium: any[], hard: any[] }> = {
      // React Hooks questions
      'React Hooks': {
        easy: [
          { mc: { text: 'What is the purpose of useState in React?', options: ['To manage component state', 'To fetch data from APIs', 'To style components', 'To create routes'], correctAnswer: 'To manage component state' }, sa: { text: 'What does the useState hook return?', correctAnswer: 'An array with the current state value and a setter function' } },
          { mc: { text: 'Which hook is used for side effects in React?', options: ['useEffect', 'useState', 'useRef', 'useMemo'], correctAnswer: 'useEffect' }, sa: { text: 'Name the hook used for side effects in functional components.', correctAnswer: 'useEffect' } },
          { mc: { text: 'What is a React Hook?', options: ['A function that lets you use state in functional components', 'A class method', 'A styling technique', 'A routing library'], correctAnswer: 'A function that lets you use state in functional components' }, sa: { text: 'Define what a React Hook is.', correctAnswer: 'A function that lets you hook into React state and lifecycle features from function components' } },
          { mc: { text: 'Can you use hooks in class components?', options: ['No, only in functional components', 'Yes, in any component', 'Only with special syntax', 'Only in React 18+'], correctAnswer: 'No, only in functional components' }, sa: { text: 'In which type of React components can you use hooks?', correctAnswer: 'Functional components only' } },
        ],
        medium: [
          { mc: { text: 'What is the dependency array in useEffect?', options: ['An array that controls when the effect runs', 'A list of all component props', 'Required parameters for the effect', 'Error handling configuration'], correctAnswer: 'An array that controls when the effect runs' }, sa: { text: 'Explain the purpose of the dependency array in useEffect.', correctAnswer: 'It specifies which values trigger the effect to re-run when they change' } },
          { mc: { text: 'What does useCallback do?', options: ['Memoizes a callback function', 'Creates a new callback every render', 'Handles form submissions', 'Manages routing'], correctAnswer: 'Memoizes a callback function' }, sa: { text: 'What is the difference between useCallback and useMemo?', correctAnswer: 'useCallback memoizes functions while useMemo memoizes values' } },
          { mc: { text: 'When should you use useRef?', options: ['To persist values without causing re-renders', 'To manage component state', 'To fetch data', 'To handle routing'], correctAnswer: 'To persist values without causing re-renders' }, sa: { text: 'Give an example use case for useRef.', correctAnswer: 'Accessing DOM elements directly or storing mutable values that persist across renders' } },
          { mc: { text: 'What happens if useEffect has an empty dependency array?', options: ['It runs only once on mount', 'It runs on every render', 'It never runs', 'It causes an error'], correctAnswer: 'It runs only once on mount' }, sa: { text: 'How do you make useEffect run only once?', correctAnswer: 'Pass an empty dependency array []' } },
        ],
        hard: [
          { mc: { text: 'What is the rules of hooks?', options: ['Only call hooks at the top level and only from React functions', 'Hooks can be called anywhere', 'Hooks must be in useEffect', 'No specific rules'], correctAnswer: 'Only call hooks at the top level and only from React functions' }, sa: { text: 'List the two main rules of hooks.', correctAnswer: 'Only call hooks at the top level (not inside loops/conditions) and only call hooks from React function components or custom hooks' } },
          { mc: { text: 'How do you create a custom hook?', options: ['Create a function starting with "use" that calls other hooks', 'Extend the Hook class', 'Use createHook() factory', 'Modify React internals'], correctAnswer: 'Create a function starting with "use" that calls other hooks' }, sa: { text: 'What naming convention must custom hooks follow?', correctAnswer: 'They must start with "use" prefix' } },
          { mc: { text: 'What is the purpose of useReducer?', options: ['To manage complex state logic with actions', 'To reduce bundle size', 'To optimize rendering', 'To handle CSS'], correctAnswer: 'To manage complex state logic with actions' }, sa: { text: 'When would you choose useReducer over useState?', correctAnswer: 'When state logic is complex, involves multiple sub-values, or when next state depends on previous state' } },
          { mc: { text: 'How does useContext work with hooks?', options: ['It subscribes to context and re-renders on context changes', 'It creates new context', 'It replaces Redux entirely', 'It only works with class components'], correctAnswer: 'It subscribes to context and re-renders on context changes' }, sa: { text: 'Explain how useContext helps avoid prop drilling.', correctAnswer: 'useContext allows components to consume context values directly without passing props through intermediate components' } },
        ]
      },
      // JavaScript ES6 Features
      'JavaScript ES6 Features': {
        easy: [
          { mc: { text: 'What is the difference between let and var?', options: ['let is block-scoped, var is function-scoped', 'They are identical', 'var is newer', 'let cannot be reassigned'], correctAnswer: 'let is block-scoped, var is function-scoped' }, sa: { text: 'What keyword should you use for block-scoped variables?', correctAnswer: 'let or const' } },
          { mc: { text: 'What is an arrow function?', options: ['A shorter syntax for writing functions', 'A function that points to elements', 'A deprecated feature', 'A type of loop'], correctAnswer: 'A shorter syntax for writing functions' }, sa: { text: 'Write the arrow function syntax for a function that adds two numbers.', correctAnswer: '(a, b) => a + b' } },
          { mc: { text: 'What does const mean in JavaScript?', options: ['The variable cannot be reassigned', 'The value is frozen', 'It creates a constant class', 'It is the same as let'], correctAnswer: 'The variable cannot be reassigned' }, sa: { text: 'Can you modify properties of an object declared with const?', correctAnswer: 'Yes, const prevents reassignment but not mutation of object properties' } },
          { mc: { text: 'What is template literal syntax?', options: ['Backticks with ${} for interpolation', 'Single quotes only', 'Double quotes with + concatenation', 'Triple quotes'], correctAnswer: 'Backticks with ${} for interpolation' }, sa: { text: 'How do you embed variables in a template literal?', correctAnswer: 'Using ${variableName} syntax inside backticks' } },
        ],
        medium: [
          { mc: { text: 'What is destructuring in ES6?', options: ['Extracting values from arrays/objects into variables', 'Deleting object properties', 'Breaking code into modules', 'Memory management'], correctAnswer: 'Extracting values from arrays/objects into variables' }, sa: { text: 'Show how to destructure name and age from a person object.', correctAnswer: 'const { name, age } = person;' } },
          { mc: { text: 'What is the spread operator?', options: ['... syntax to expand iterables', 'A multiplication operator', 'A way to spread errors', 'A CSS feature'], correctAnswer: '... syntax to expand iterables' }, sa: { text: 'How do you merge two arrays using the spread operator?', correctAnswer: '[...array1, ...array2]' } },
          { mc: { text: 'What are default parameters?', options: ['Parameters with preset values if not provided', 'Required parameters', 'Global variables', 'System settings'], correctAnswer: 'Parameters with preset values if not provided' }, sa: { text: 'Write a function with a default parameter.', correctAnswer: 'function greet(name = "World") { return `Hello ${name}`; }' } },
          { mc: { text: 'What is a Promise in JavaScript?', options: ['An object representing eventual completion of async operation', 'A guaranteed return value', 'A type of loop', 'A synchronous pattern'], correctAnswer: 'An object representing eventual completion of async operation' }, sa: { text: 'Name the three states of a Promise.', correctAnswer: 'Pending, Fulfilled, and Rejected' } },
        ],
        hard: [
          { mc: { text: 'What is the difference between Promise.all and Promise.race?', options: ['all waits for all, race returns first settled', 'They are identical', 'race is deprecated', 'all returns first only'], correctAnswer: 'all waits for all, race returns first settled' }, sa: { text: 'When would you use Promise.allSettled?', correctAnswer: 'When you want to wait for all promises regardless of whether they fulfill or reject' } },
          { mc: { text: 'What is a generator function?', options: ['A function that can pause and resume with yield', 'A function that generates random numbers', 'An async function', 'A factory pattern'], correctAnswer: 'A function that can pause and resume with yield' }, sa: { text: 'What keyword is used to pause a generator function?', correctAnswer: 'yield' } },
          { mc: { text: 'What is the Symbol primitive type used for?', options: ['Creating unique identifiers', 'Math operations', 'String manipulation', 'DOM selection'], correctAnswer: 'Creating unique identifiers' }, sa: { text: 'How do you create a Symbol?', correctAnswer: 'const sym = Symbol("description")' } },
          { mc: { text: 'What is a Proxy in ES6?', options: ['An object that intercepts operations on another object', 'A network proxy', 'A design pattern only', 'A deprecated feature'], correctAnswer: 'An object that intercepts operations on another object' }, sa: { text: 'Name two trap methods available in Proxy handlers.', correctAnswer: 'get, set, has, deleteProperty, apply, construct, etc.' } },
        ]
      },
      // Web Development topics
      'HTML Basics': {
        easy: [
          { mc: { text: 'What does HTML stand for?', options: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Management Language'], correctAnswer: 'HyperText Markup Language' }, sa: { text: 'What does HTML stand for?', correctAnswer: 'HyperText Markup Language' } },
          { mc: { text: 'Which tag is used for the largest heading?', options: ['<h1>', '<heading>', '<h6>', '<head>'], correctAnswer: '<h1>' }, sa: { text: 'What is the tag for the largest heading in HTML?', correctAnswer: '<h1>' } },
          { mc: { text: 'What is the correct HTML element for inserting a line break?', options: ['<br>', '<break>', '<lb>', '<newline>'], correctAnswer: '<br>' }, sa: { text: 'Which HTML tag creates a line break?', correctAnswer: '<br>' } },
          { mc: { text: 'Which HTML attribute specifies an alternate text for an image?', options: ['alt', 'title', 'src', 'href'], correctAnswer: 'alt' }, sa: { text: 'What attribute provides alternative text for images?', correctAnswer: 'alt' } },
        ],
        medium: [
          { mc: { text: 'What is semantic HTML?', options: ['HTML that clearly describes its meaning', 'HTML with no CSS', 'Encrypted HTML', 'Server-side HTML'], correctAnswer: 'HTML that clearly describes its meaning' }, sa: { text: 'Give two examples of semantic HTML5 elements.', correctAnswer: '<header>, <nav>, <main>, <article>, <section>, <footer>' } },
          { mc: { text: 'What is the purpose of the <meta> tag?', options: ['To provide metadata about the document', 'To create menus', 'To add images', 'To create links'], correctAnswer: 'To provide metadata about the document' }, sa: { text: 'Where should <meta> tags be placed?', correctAnswer: 'Inside the <head> element' } },
          { mc: { text: 'What does the DOCTYPE declaration do?', options: ['Tells the browser which HTML version to use', 'Adds documentation', 'Creates a document', 'Imports styles'], correctAnswer: 'Tells the browser which HTML version to use' }, sa: { text: 'What is the DOCTYPE for HTML5?', correctAnswer: '<!DOCTYPE html>' } },
          { mc: { text: 'Which attribute makes a form field required?', options: ['required', 'mandatory', 'validate', 'must'], correctAnswer: 'required' }, sa: { text: 'How do you make an input field required in HTML5?', correctAnswer: 'Add the required attribute to the input element' } },
        ],
        hard: [
          { mc: { text: 'What is the purpose of ARIA attributes?', options: ['To improve accessibility for assistive technologies', 'To add animations', 'To improve SEO', 'To validate forms'], correctAnswer: 'To improve accessibility for assistive technologies' }, sa: { text: 'What does ARIA stand for?', correctAnswer: 'Accessible Rich Internet Applications' } },
          { mc: { text: 'What is the Shadow DOM?', options: ['Encapsulated DOM tree attached to an element', 'Hidden HTML content', 'Server-side DOM', 'A JavaScript framework'], correctAnswer: 'Encapsulated DOM tree attached to an element' }, sa: { text: 'How does Shadow DOM help with component encapsulation?', correctAnswer: 'It isolates styles and markup from the main document' } },
          { mc: { text: 'What is the difference between async and defer in script tags?', options: ['async loads/executes immediately, defer waits for parsing', 'They are identical', 'defer is deprecated', 'async only works with modules'], correctAnswer: 'async loads/executes immediately, defer waits for parsing' }, sa: { text: 'When would you use the defer attribute on a script tag?', correctAnswer: 'When the script depends on the DOM being fully parsed' } },
          { mc: { text: 'What is a Web Component?', options: ['Reusable custom HTML elements with encapsulated functionality', 'A CSS framework', 'A JavaScript library', 'A server technology'], correctAnswer: 'Reusable custom HTML elements with encapsulated functionality' }, sa: { text: 'Name the three main technologies that make up Web Components.', correctAnswer: 'Custom Elements, Shadow DOM, and HTML Templates' } },
        ]
      },
      'CSS Fundamentals': {
        easy: [
          { mc: { text: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style System', 'Colorful Style Sheets'], correctAnswer: 'Cascading Style Sheets' }, sa: { text: 'What does CSS stand for?', correctAnswer: 'Cascading Style Sheets' } },
          { mc: { text: 'Which property changes text color?', options: ['color', 'text-color', 'font-color', 'foreground'], correctAnswer: 'color' }, sa: { text: 'What CSS property sets the text color?', correctAnswer: 'color' } },
          { mc: { text: 'How do you select an element with id="main"?', options: ['#main', '.main', 'main', '*main'], correctAnswer: '#main' }, sa: { text: 'What CSS selector targets an element by ID?', correctAnswer: '# followed by the ID name' } },
          { mc: { text: 'Which property adds space inside an element?', options: ['padding', 'margin', 'border', 'spacing'], correctAnswer: 'padding' }, sa: { text: 'What is the difference between padding and margin?', correctAnswer: 'Padding is space inside the element, margin is space outside' } },
        ],
        medium: [
          { mc: { text: 'What is the CSS Box Model?', options: ['Content, padding, border, and margin', 'A layout framework', 'A 3D modeling system', 'A responsive design pattern'], correctAnswer: 'Content, padding, border, and margin' }, sa: { text: 'List the four parts of the CSS Box Model.', correctAnswer: 'Content, padding, border, margin' } },
          { mc: { text: 'What does display: flex do?', options: ['Creates a flex container for flexible layouts', 'Makes element invisible', 'Creates a grid', 'Fixes element position'], correctAnswer: 'Creates a flex container for flexible layouts' }, sa: { text: 'How do you center items horizontally in a flex container?', correctAnswer: 'justify-content: center' } },
          { mc: { text: 'What is CSS specificity?', options: ['Rules determining which styles apply when conflicts occur', 'Code optimization', 'File compression', 'Browser compatibility'], correctAnswer: 'Rules determining which styles apply when conflicts occur' }, sa: { text: 'Order these by specificity: class, id, element, inline style.', correctAnswer: 'element < class < id < inline style' } },
          { mc: { text: 'What is a CSS media query used for?', options: ['Applying styles based on device characteristics', 'Querying databases', 'Fetching media files', 'Creating animations'], correctAnswer: 'Applying styles based on device characteristics' }, sa: { text: 'Write a media query for screens smaller than 768px.', correctAnswer: '@media (max-width: 768px) { }' } },
        ],
        hard: [
          { mc: { text: 'What is CSS Grid?', options: ['A two-dimensional layout system', 'A JavaScript grid library', 'A table replacement', 'A float-based system'], correctAnswer: 'A two-dimensional layout system' }, sa: { text: 'What is the difference between CSS Grid and Flexbox?', correctAnswer: 'Grid is 2D (rows and columns), Flexbox is 1D (row or column)' } },
          { mc: { text: 'What are CSS Custom Properties?', options: ['Variables defined with -- prefix', 'Browser-specific properties', 'Deprecated features', 'Animation keyframes'], correctAnswer: 'Variables defined with -- prefix' }, sa: { text: 'How do you define and use a CSS variable?', correctAnswer: '--variable-name: value; and var(--variable-name)' } },
          { mc: { text: 'What is the purpose of will-change?', options: ['Hints browser about upcoming changes for optimization', 'Forces element changes', 'Prevents changes', 'Validates changes'], correctAnswer: 'Hints browser about upcoming changes for optimization' }, sa: { text: 'Why should will-change be used sparingly?', correctAnswer: 'It consumes resources and can hurt performance if overused' } },
          { mc: { text: 'What is a CSS pseudo-element?', options: ['A keyword to style specific parts of an element', 'A fake element', 'A JavaScript concept', 'An HTML tag'], correctAnswer: 'A keyword to style specific parts of an element' }, sa: { text: 'Give two examples of CSS pseudo-elements.', correctAnswer: '::before, ::after, ::first-line, ::first-letter, ::selection' } },
        ]
      },
      // Machine Learning topics
      'Backpropagation': {
        easy: [
          { mc: { text: 'What is backpropagation?', options: ['An algorithm to train neural networks by propagating errors backward', 'A data backup method', 'A forward pass algorithm', 'A sorting algorithm'], correctAnswer: 'An algorithm to train neural networks by propagating errors backward' }, sa: { text: 'What is the purpose of backpropagation?', correctAnswer: 'To calculate gradients and update weights to minimize error' } },
          { mc: { text: 'Which direction does error flow in backpropagation?', options: ['From output layer to input layer', 'From input to output', 'Randomly', 'Only in hidden layers'], correctAnswer: 'From output layer to input layer' }, sa: { text: 'In which direction do gradients flow during backpropagation?', correctAnswer: 'Backward, from output to input layers' } },
          { mc: { text: 'What mathematical operation is central to backpropagation?', options: ['Chain rule of calculus', 'Matrix multiplication', 'Division', 'Logarithms'], correctAnswer: 'Chain rule of calculus' }, sa: { text: 'What calculus rule is fundamental to backpropagation?', correctAnswer: 'The chain rule' } },
          { mc: { text: 'What does backpropagation calculate?', options: ['Gradients of the loss with respect to weights', 'The forward pass', 'Input data', 'Network architecture'], correctAnswer: 'Gradients of the loss with respect to weights' }, sa: { text: 'What does backpropagation compute?', correctAnswer: 'Gradients/derivatives of the loss function with respect to weights' } },
        ],
        medium: [
          { mc: { text: 'What is the vanishing gradient problem?', options: ['Gradients become very small in deep networks', 'Gradients disappear from memory', 'Network stops training', 'Data gets lost'], correctAnswer: 'Gradients become very small in deep networks' }, sa: { text: 'How does ReLU help with the vanishing gradient problem?', correctAnswer: 'ReLU has a gradient of 1 for positive values, preventing gradient decay' } },
          { mc: { text: 'What is the role of the learning rate in backpropagation?', options: ['Controls how much weights are updated', 'Sets the network depth', 'Determines batch size', 'Chooses activation function'], correctAnswer: 'Controls how much weights are updated' }, sa: { text: 'What happens if the learning rate is too high?', correctAnswer: 'Training becomes unstable and may diverge/overshoot minima' } },
          { mc: { text: 'What is computed during the forward pass before backprop?', options: ['Activations and predictions', 'Gradients', 'Weight updates', 'Loss derivatives'], correctAnswer: 'Activations and predictions' }, sa: { text: 'Why is the forward pass needed before backpropagation?', correctAnswer: 'To compute activations and the loss value needed for gradient calculation' } },
          { mc: { text: 'What is gradient descent?', options: ['Optimization algorithm that uses gradients to minimize loss', 'A type of neural network', 'A data preprocessing step', 'An activation function'], correctAnswer: 'Optimization algorithm that uses gradients to minimize loss' }, sa: { text: 'How are weights updated using gradient descent?', correctAnswer: 'w = w - learning_rate * gradient' } },
        ],
        hard: [
          { mc: { text: 'What is the exploding gradient problem?', options: ['Gradients grow exponentially large during backprop', 'Network explodes', 'Too many gradients', 'Memory overflow'], correctAnswer: 'Gradients grow exponentially large during backprop' }, sa: { text: 'How can gradient clipping help with exploding gradients?', correctAnswer: 'It limits gradient values to a maximum threshold during backprop' } },
          { mc: { text: 'What is automatic differentiation?', options: ['Computing derivatives automatically using computation graphs', 'Manual derivative calculation', 'Numerical differentiation', 'Symbolic math'], correctAnswer: 'Computing derivatives automatically using computation graphs' }, sa: { text: 'How do frameworks like PyTorch implement backpropagation?', correctAnswer: 'Using automatic differentiation with dynamic computation graphs' } },
          { mc: { text: 'What is batch normalization\'s effect on backprop?', options: ['Stabilizes gradients and allows higher learning rates', 'Removes the need for backprop', 'Increases vanishing gradients', 'Slows down training'], correctAnswer: 'Stabilizes gradients and allows higher learning rates' }, sa: { text: 'Why does batch normalization help training?', correctAnswer: 'It normalizes layer inputs, reducing internal covariate shift and stabilizing gradients' } },
          { mc: { text: 'What is the difference between SGD and Adam optimizer?', options: ['Adam uses adaptive learning rates per parameter', 'They are identical', 'SGD is faster', 'Adam does not use gradients'], correctAnswer: 'Adam uses adaptive learning rates per parameter' }, sa: { text: 'What does Adam optimizer maintain that SGD does not?', correctAnswer: 'First and second moment estimates of gradients (momentum and adaptive learning rates)' } },
        ]
      },
      'Introduction to Machine Learning': {
        easy: [
          { mc: { text: 'What is Machine Learning?', options: ['Algorithms that learn patterns from data', 'Programming robots', 'Building computers', 'Data storage'], correctAnswer: 'Algorithms that learn patterns from data' }, sa: { text: 'Define Machine Learning in simple terms.', correctAnswer: 'A field where computers learn from data without being explicitly programmed' } },
          { mc: { text: 'What is a dataset in ML?', options: ['A collection of data used for training', 'A database software', 'A programming language', 'A neural network'], correctAnswer: 'A collection of data used for training' }, sa: { text: 'What are the two main parts of a labeled dataset?', correctAnswer: 'Features (inputs) and labels (outputs/targets)' } },
          { mc: { text: 'What is the difference between AI and ML?', options: ['ML is a subset of AI focused on learning from data', 'They are the same', 'AI is newer', 'ML is broader'], correctAnswer: 'ML is a subset of AI focused on learning from data' }, sa: { text: 'How does Machine Learning relate to Artificial Intelligence?', correctAnswer: 'ML is a subset of AI that focuses on learning from data' } },
          { mc: { text: 'What is a feature in ML?', options: ['An input variable used for prediction', 'The output', 'The algorithm', 'The model'], correctAnswer: 'An input variable used for prediction' }, sa: { text: 'What is a feature in machine learning?', correctAnswer: 'An individual measurable property or characteristic of the data' } },
        ],
        medium: [
          { mc: { text: 'What is overfitting?', options: ['Model performs well on training but poorly on new data', 'Model is too simple', 'Training takes too long', 'Model uses too little data'], correctAnswer: 'Model performs well on training but poorly on new data' }, sa: { text: 'How can you prevent overfitting?', correctAnswer: 'Regularization, more data, dropout, early stopping, cross-validation' } },
          { mc: { text: 'What is the purpose of a validation set?', options: ['To tune hyperparameters without using test data', 'To train the model', 'To clean the data', 'To deploy the model'], correctAnswer: 'To tune hyperparameters without using test data' }, sa: { text: 'Why do we need separate training, validation, and test sets?', correctAnswer: 'Training fits the model, validation tunes hyperparameters, test gives final unbiased evaluation' } },
          { mc: { text: 'What is cross-validation?', options: ['Technique to evaluate model using different data splits', 'Data cleaning method', 'Feature engineering', 'Model deployment'], correctAnswer: 'Technique to evaluate model using different data splits' }, sa: { text: 'Explain k-fold cross-validation.', correctAnswer: 'Data is split into k parts, model trained k times using k-1 parts, validated on remaining part' } },
          { mc: { text: 'What is feature engineering?', options: ['Creating new features from existing data', 'Building hardware', 'Writing algorithms', 'Collecting data'], correctAnswer: 'Creating new features from existing data' }, sa: { text: 'Give an example of feature engineering.', correctAnswer: 'Creating age groups from birth dates, or extracting day of week from timestamps' } },
        ],
        hard: [
          { mc: { text: 'What is the bias-variance tradeoff?', options: ['Balance between underfitting and overfitting', 'Choosing learning rate', 'Selecting features', 'Data preprocessing'], correctAnswer: 'Balance between underfitting and overfitting' }, sa: { text: 'Explain bias-variance tradeoff.', correctAnswer: 'High bias causes underfitting, high variance causes overfitting; need to balance both' } },
          { mc: { text: 'What is regularization?', options: ['Technique to prevent overfitting by penalizing complexity', 'Making data regular', 'Normalizing inputs', 'Scheduling training'], correctAnswer: 'Technique to prevent overfitting by penalizing complexity' }, sa: { text: 'What is the difference between L1 and L2 regularization?', correctAnswer: 'L1 adds absolute weight penalty (can zero weights), L2 adds squared weight penalty' } },
          { mc: { text: 'What is ensemble learning?', options: ['Combining multiple models for better predictions', 'Training one large model', 'Data augmentation', 'Feature selection'], correctAnswer: 'Combining multiple models for better predictions' }, sa: { text: 'Name two types of ensemble methods.', correctAnswer: 'Bagging (Random Forest), Boosting (XGBoost, AdaBoost), Stacking' } },
          { mc: { text: 'What is the curse of dimensionality?', options: ['Problems that arise with high-dimensional data', 'Running out of memory', 'Slow training', 'Bug in code'], correctAnswer: 'Problems that arise with high-dimensional data' }, sa: { text: 'How does the curse of dimensionality affect ML?', correctAnswer: 'Data becomes sparse, distances become less meaningful, more data needed' } },
        ]
      },
      'Supervised Learning Basics': {
        easy: [
          { mc: { text: 'What is supervised learning?', options: ['Learning from labeled data with known outputs', 'Learning without any data', 'Learning from unlabeled data', 'Reinforcement learning'], correctAnswer: 'Learning from labeled data with known outputs' }, sa: { text: 'What makes learning "supervised"?', correctAnswer: 'The training data includes both inputs and their correct outputs (labels)' } },
          { mc: { text: 'What is classification?', options: ['Predicting a category or class', 'Predicting a number', 'Clustering data', 'Reducing dimensions'], correctAnswer: 'Predicting a category or class' }, sa: { text: 'Give an example of a classification problem.', correctAnswer: 'Email spam detection, image recognition, disease diagnosis' } },
          { mc: { text: 'What is regression?', options: ['Predicting a continuous numerical value', 'Predicting categories', 'Grouping data', 'Finding patterns'], correctAnswer: 'Predicting a continuous numerical value' }, sa: { text: 'Give an example of a regression problem.', correctAnswer: 'House price prediction, temperature forecasting, stock prices' } },
          { mc: { text: 'What is a label in supervised learning?', options: ['The correct output for training data', 'The input features', 'The model name', 'The algorithm'], correctAnswer: 'The correct output for training data' }, sa: { text: 'What is the role of labels in supervised learning?', correctAnswer: 'Labels provide the correct answers the model learns to predict' } },
        ],
        medium: [
          { mc: { text: 'What is a decision tree?', options: ['A model that makes decisions based on feature thresholds', 'A data structure', 'A random forest', 'A neural network'], correctAnswer: 'A model that makes decisions based on feature thresholds' }, sa: { text: 'How does a decision tree make predictions?', correctAnswer: 'By following a series of if-then rules based on feature values' } },
          { mc: { text: 'What is logistic regression used for?', options: ['Binary classification problems', 'Linear regression', 'Clustering', 'Dimensionality reduction'], correctAnswer: 'Binary classification problems' }, sa: { text: 'What does logistic regression output?', correctAnswer: 'Probability values between 0 and 1' } },
          { mc: { text: 'What is a confusion matrix?', options: ['Table showing prediction results vs actual values', 'A complex algorithm', 'Data visualization', 'Feature matrix'], correctAnswer: 'Table showing prediction results vs actual values' }, sa: { text: 'What are the four values in a binary confusion matrix?', correctAnswer: 'True Positives, True Negatives, False Positives, False Negatives' } },
          { mc: { text: 'What is accuracy?', options: ['Percentage of correct predictions', 'Speed of training', 'Model complexity', 'Data size'], correctAnswer: 'Percentage of correct predictions' }, sa: { text: 'Why is accuracy not always the best metric?', correctAnswer: 'It can be misleading with imbalanced datasets' } },
        ],
        hard: [
          { mc: { text: 'What is precision vs recall?', options: ['Precision: correct positive predictions, Recall: found positives', 'They are identical', 'Precision is always higher', 'Recall measures negatives'], correctAnswer: 'Precision: correct positive predictions, Recall: found positives' }, sa: { text: 'When would you prioritize recall over precision?', correctAnswer: 'When missing positive cases is costly (e.g., cancer detection)' } },
          { mc: { text: 'What is the F1 score?', options: ['Harmonic mean of precision and recall', 'Arithmetic mean of accuracy', 'Model speed metric', 'Data quality score'], correctAnswer: 'Harmonic mean of precision and recall' }, sa: { text: 'When is F1 score useful?', correctAnswer: 'When you need to balance precision and recall, especially with imbalanced data' } },
          { mc: { text: 'What is the ROC curve?', options: ['Plot of true positive rate vs false positive rate', 'Training progress', 'Learning curve', 'Feature importance'], correctAnswer: 'Plot of true positive rate vs false positive rate' }, sa: { text: 'What does AUC-ROC measure?', correctAnswer: 'Model\'s ability to distinguish between classes across all thresholds' } },
          { mc: { text: 'What is support vector machine (SVM)?', options: ['Algorithm that finds optimal hyperplane to separate classes', 'A neural network', 'A clustering method', 'A regression technique'], correctAnswer: 'Algorithm that finds optimal hyperplane to separate classes' }, sa: { text: 'What is the kernel trick in SVM?', correctAnswer: 'Mapping data to higher dimensions to find linear separation' } },
        ]
      },
      'Neural Networks Basics': {
        easy: [
          { mc: { text: 'What is a neural network?', options: ['A computational model inspired by the brain', 'A computer network', 'A database system', 'A programming language'], correctAnswer: 'A computational model inspired by the brain' }, sa: { text: 'What biological system inspires neural networks?', correctAnswer: 'The human brain and its neurons' } },
          { mc: { text: 'What is a neuron in a neural network?', options: ['A computational unit that processes inputs', 'A brain cell', 'A data point', 'A layer'], correctAnswer: 'A computational unit that processes inputs' }, sa: { text: 'What does a single neuron do?', correctAnswer: 'Receives inputs, applies weights, sums them, and applies an activation function' } },
          { mc: { text: 'What is an activation function?', options: ['Function that introduces non-linearity', 'Input data', 'Weight values', 'Output layer'], correctAnswer: 'Function that introduces non-linearity' }, sa: { text: 'Why are activation functions needed?', correctAnswer: 'To introduce non-linearity so networks can learn complex patterns' } },
          { mc: { text: 'What are weights in a neural network?', options: ['Learnable parameters that scale inputs', 'Input features', 'Output values', 'Layer sizes'], correctAnswer: 'Learnable parameters that scale inputs' }, sa: { text: 'What gets adjusted during neural network training?', correctAnswer: 'Weights and biases' } },
        ],
        medium: [
          { mc: { text: 'What is a hidden layer?', options: ['Layers between input and output', 'Invisible data', 'Encrypted weights', 'Validation data'], correctAnswer: 'Layers between input and output' }, sa: { text: 'Why are they called "hidden" layers?', correctAnswer: 'Their values are not directly observed as inputs or outputs' } },
          { mc: { text: 'What is ReLU?', options: ['Activation function: max(0, x)', 'A neural network type', 'An optimizer', 'A loss function'], correctAnswer: 'Activation function: max(0, x)' }, sa: { text: 'What is the formula for ReLU?', correctAnswer: 'f(x) = max(0, x)' } },
          { mc: { text: 'What is a loss function?', options: ['Measures how wrong predictions are', 'The learning rate', 'Network architecture', 'Training speed'], correctAnswer: 'Measures how wrong predictions are' }, sa: { text: 'Give an example of a loss function for classification.', correctAnswer: 'Cross-entropy loss' } },
          { mc: { text: 'What is a deep neural network?', options: ['A network with many hidden layers', 'A very accurate network', 'A slow network', 'A complex input'], correctAnswer: 'A network with many hidden layers' }, sa: { text: 'What makes a neural network "deep"?', correctAnswer: 'Having multiple (many) hidden layers' } },
        ],
        hard: [
          { mc: { text: 'What is dropout?', options: ['Randomly deactivating neurons during training', 'Removing layers', 'Stopping training', 'Data removal'], correctAnswer: 'Randomly deactivating neurons during training' }, sa: { text: 'How does dropout prevent overfitting?', correctAnswer: 'Forces network to learn redundant representations and not rely on specific neurons' } },
          { mc: { text: 'What is batch normalization?', options: ['Normalizing layer inputs during training', 'Grouping training data', 'Reducing batch size', 'Sorting data'], correctAnswer: 'Normalizing layer inputs during training' }, sa: { text: 'What are the benefits of batch normalization?', correctAnswer: 'Faster training, higher learning rates, some regularization effect' } },
          { mc: { text: 'What is the softmax function?', options: ['Converts logits to probabilities summing to 1', 'A soft activation', 'Weight initialization', 'Loss calculation'], correctAnswer: 'Converts logits to probabilities summing to 1' }, sa: { text: 'When is softmax typically used?', correctAnswer: 'In the output layer of multi-class classification networks' } },
          { mc: { text: 'What is transfer learning?', options: ['Using a pre-trained model for a new task', 'Moving data between systems', 'Copying weights', 'Training from scratch'], correctAnswer: 'Using a pre-trained model for a new task' }, sa: { text: 'Why is transfer learning useful?', correctAnswer: 'Saves training time and works well with limited data by leveraging learned features' } },
        ]
      },
      'Types of Machine Learning': {
        easy: [
          { mc: { text: 'What are the three main types of machine learning?', options: ['Supervised, Unsupervised, Reinforcement', 'Fast, Medium, Slow', 'Simple, Complex, Deep', 'Linear, Non-linear, Mixed'], correctAnswer: 'Supervised, Unsupervised, Reinforcement' }, sa: { text: 'List the three main types of machine learning.', correctAnswer: 'Supervised learning, Unsupervised learning, Reinforcement learning' } },
          { mc: { text: 'What is unsupervised learning?', options: ['Learning patterns from unlabeled data', 'Learning with a teacher', 'Learning from rewards', 'Not learning at all'], correctAnswer: 'Learning patterns from unlabeled data' }, sa: { text: 'What is the key characteristic of unsupervised learning?', correctAnswer: 'The training data has no labels or correct answers' } },
          { mc: { text: 'What is reinforcement learning?', options: ['Learning through trial, error, and rewards', 'Learning from labeled data', 'Learning from unlabeled data', 'Supervised classification'], correctAnswer: 'Learning through trial, error, and rewards' }, sa: { text: 'What drives learning in reinforcement learning?', correctAnswer: 'Rewards and penalties from actions taken in an environment' } },
          { mc: { text: 'What is clustering?', options: ['Grouping similar data points together', 'Predicting values', 'Classifying with labels', 'Training neural networks'], correctAnswer: 'Grouping similar data points together' }, sa: { text: 'Is clustering supervised or unsupervised?', correctAnswer: 'Unsupervised' } },
        ],
        medium: [
          { mc: { text: 'What is semi-supervised learning?', options: ['Learning from both labeled and unlabeled data', 'Half-trained model', 'Supervised only', 'Reinforcement only'], correctAnswer: 'Learning from both labeled and unlabeled data' }, sa: { text: 'When is semi-supervised learning useful?', correctAnswer: 'When labeled data is scarce but unlabeled data is abundant' } },
          { mc: { text: 'What is self-supervised learning?', options: ['Creating labels from the data itself', 'Training without data', 'Manual labeling', 'Supervised classification'], correctAnswer: 'Creating labels from the data itself' }, sa: { text: 'Give an example of self-supervised learning.', correctAnswer: 'Predicting masked words in a sentence (like BERT)' } },
          { mc: { text: 'What is K-means clustering?', options: ['Algorithm that groups data into K clusters', 'K nearest neighbors', 'K-fold validation', 'Kernel method'], correctAnswer: 'Algorithm that groups data into K clusters' }, sa: { text: 'How does K-means work?', correctAnswer: 'Iteratively assigns points to nearest centroid and updates centroids' } },
          { mc: { text: 'What is dimensionality reduction?', options: ['Reducing the number of features', 'Making data smaller', 'Compressing files', 'Removing samples'], correctAnswer: 'Reducing the number of features' }, sa: { text: 'Name a popular dimensionality reduction technique.', correctAnswer: 'PCA (Principal Component Analysis)' } },
        ],
        hard: [
          { mc: { text: 'What is the difference between generative and discriminative models?', options: ['Generative models the data distribution, discriminative models decision boundary', 'They are the same', 'Generative is unsupervised only', 'Discriminative cannot classify'], correctAnswer: 'Generative models the data distribution, discriminative models decision boundary' }, sa: { text: 'Give an example of a generative model.', correctAnswer: 'GANs, VAEs, Naive Bayes' } },
          { mc: { text: 'What is active learning?', options: ['Model selects which data to be labeled', 'Highly active training', 'Real-time learning', 'Continuous training'], correctAnswer: 'Model selects which data to be labeled' }, sa: { text: 'When is active learning beneficial?', correctAnswer: 'When labeling is expensive and the model can identify most informative samples' } },
          { mc: { text: 'What is multi-task learning?', options: ['Training one model on multiple related tasks', 'Training many models', 'Sequential training', 'Parallel processing'], correctAnswer: 'Training one model on multiple related tasks' }, sa: { text: 'What is the benefit of multi-task learning?', correctAnswer: 'Shared representations improve performance on related tasks and reduce overfitting' } },
          { mc: { text: 'What is meta-learning?', options: ['Learning how to learn efficiently', 'Learning about metadata', 'Basic learning', 'Slow learning'], correctAnswer: 'Learning how to learn efficiently' }, sa: { text: 'What is "few-shot learning"?', correctAnswer: 'Learning to make predictions with very few training examples' } },
        ]
      },
      // Additional Web Development Topics
      'HTML Fundamentals': {
        easy: [
          { mc: { text: 'What does HTML stand for?', options: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Management'], correctAnswer: 'HyperText Markup Language' }, sa: { text: 'What does HTML stand for?', correctAnswer: 'HyperText Markup Language' } },
          { mc: { text: 'Which tag creates a paragraph?', options: ['<p>', '<para>', '<text>', '<paragraph>'], correctAnswer: '<p>' }, sa: { text: 'What HTML tag is used for paragraphs?', correctAnswer: '<p>' } },
          { mc: { text: 'What is the root element of an HTML page?', options: ['<html>', '<body>', '<head>', '<root>'], correctAnswer: '<html>' }, sa: { text: 'What is the root element of every HTML document?', correctAnswer: '<html>' } },
          { mc: { text: 'Which tag is used to create a link?', options: ['<a>', '<link>', '<href>', '<url>'], correctAnswer: '<a>' }, sa: { text: 'What tag creates hyperlinks in HTML?', correctAnswer: '<a> (anchor tag)' } },
        ],
        medium: [
          { mc: { text: 'What is the difference between <div> and <span>?', options: ['div is block-level, span is inline', 'They are identical', 'span is block-level', 'div is inline'], correctAnswer: 'div is block-level, span is inline' }, sa: { text: 'Explain the difference between block and inline elements.', correctAnswer: 'Block elements take full width and start new lines; inline elements only take needed width' } },
          { mc: { text: 'What does the <head> section contain?', options: ['Metadata, title, links to stylesheets', 'Main content', 'Navigation', 'Footer'], correctAnswer: 'Metadata, title, links to stylesheets' }, sa: { text: 'Name three things typically found in the HTML <head> section.', correctAnswer: 'Title, meta tags, stylesheet links, script tags, favicon' } },
          { mc: { text: 'What is the purpose of the alt attribute in images?', options: ['Provides alternative text for accessibility', 'Sets image alignment', 'Defines image size', 'Creates hover effect'], correctAnswer: 'Provides alternative text for accessibility' }, sa: { text: 'Why is the alt attribute important for images?', correctAnswer: 'For accessibility (screen readers) and when images fail to load' } },
          { mc: { text: 'Which input type creates a checkbox?', options: ['type="checkbox"', 'type="check"', 'type="box"', 'type="tick"'], correctAnswer: 'type="checkbox"' }, sa: { text: 'How do you create a checkbox input in HTML?', correctAnswer: '<input type="checkbox">' } },
        ],
        hard: [
          { mc: { text: 'What is the purpose of the data-* attribute?', options: ['Store custom data on elements', 'Connect to databases', 'Create data visualizations', 'Validate forms'], correctAnswer: 'Store custom data on elements' }, sa: { text: 'How do you access data attributes in JavaScript?', correctAnswer: 'element.dataset.attributeName or getAttribute("data-attributeName")' } },
          { mc: { text: 'What is the difference between <section> and <article>?', options: ['Article is self-contained content, section groups related content', 'They are identical', 'Section is self-contained', 'Article groups content'], correctAnswer: 'Article is self-contained content, section groups related content' }, sa: { text: 'When would you use <article> vs <section>?', correctAnswer: 'Article for independent, self-contained content; section for thematic grouping' } },
          { mc: { text: 'What is the contenteditable attribute?', options: ['Makes element content editable by user', 'Allows content changes via JS', 'Enables spell checking', 'Creates rich text editor'], correctAnswer: 'Makes element content editable by user' }, sa: { text: 'How do you make a div editable by the user?', correctAnswer: 'Add contenteditable="true" attribute' } },
          { mc: { text: 'What is the <template> tag used for?', options: ['Holds client-side content not rendered on load', 'Creates email templates', 'Defines page layouts', 'Stores server templates'], correctAnswer: 'Holds client-side content not rendered on load' }, sa: { text: 'When would you use the <template> element?', correctAnswer: 'To hold HTML that will be cloned and inserted via JavaScript' } },
        ]
      },
      'CSS Styling and Layout': {
        easy: [
          { mc: { text: 'What property changes background color?', options: ['background-color', 'bg-color', 'color-background', 'bgcolor'], correctAnswer: 'background-color' }, sa: { text: 'What CSS property sets an element\'s background color?', correctAnswer: 'background-color' } },
          { mc: { text: 'How do you select all paragraphs in CSS?', options: ['p', '.p', '#p', '*p'], correctAnswer: 'p' }, sa: { text: 'What selector targets all paragraph elements?', correctAnswer: 'p' } },
          { mc: { text: 'What property changes font size?', options: ['font-size', 'text-size', 'size', 'font'], correctAnswer: 'font-size' }, sa: { text: 'What CSS property controls text size?', correctAnswer: 'font-size' } },
          { mc: { text: 'What does the * selector target?', options: ['All elements', 'First element', 'Class elements', 'ID elements'], correctAnswer: 'All elements' }, sa: { text: 'What is the universal selector in CSS?', correctAnswer: '* (asterisk)' } },
        ],
        medium: [
          { mc: { text: 'What is Flexbox used for?', options: ['One-dimensional layouts', 'Two-dimensional layouts', 'Animations only', 'Print layouts'], correctAnswer: 'One-dimensional layouts' }, sa: { text: 'How do you make a container a flex container?', correctAnswer: 'display: flex' } },
          { mc: { text: 'What does position: relative do?', options: ['Positions relative to normal position', 'Removes from document flow', 'Positions relative to viewport', 'Centers the element'], correctAnswer: 'Positions relative to normal position' }, sa: { text: 'What is the difference between relative and absolute positioning?', correctAnswer: 'Relative keeps element in flow and offsets from original position; absolute removes from flow' } },
          { mc: { text: 'What does z-index control?', options: ['Stacking order of elements', 'Zoom level', 'Z-axis rotation', 'Height'], correctAnswer: 'Stacking order of elements' }, sa: { text: 'When does z-index work?', correctAnswer: 'Only on positioned elements (not static)' } },
          { mc: { text: 'What is the difference between em and rem?', options: ['em is relative to parent, rem to root', 'They are identical', 'rem is relative to parent', 'em is always 16px'], correctAnswer: 'em is relative to parent, rem to root' }, sa: { text: 'What does rem stand for and what is it relative to?', correctAnswer: 'Root em, relative to the root element (html) font size' } },
        ],
        hard: [
          { mc: { text: 'What is the CSS calc() function?', options: ['Performs calculations for property values', 'Calculates page load time', 'Counts elements', 'Validates values'], correctAnswer: 'Performs calculations for property values' }, sa: { text: 'Write a calc() expression for width that\'s 100% minus 50px.', correctAnswer: 'width: calc(100% - 50px)' } },
          { mc: { text: 'What are CSS Grid template areas?', options: ['Named grid regions for easier layout', 'Image templates', 'Print areas', 'Form templates'], correctAnswer: 'Named grid regions for easier layout' }, sa: { text: 'How do you define and use grid template areas?', correctAnswer: 'grid-template-areas on container, grid-area on children' } },
          { mc: { text: 'What is the :has() selector?', options: ['Selects parent based on children', 'Checks if element exists', 'Validates attributes', 'Tests conditions'], correctAnswer: 'Selects parent based on children' }, sa: { text: 'Write a selector that selects a div that has a paragraph inside.', correctAnswer: 'div:has(p)' } },
          { mc: { text: 'What is CSS containment?', options: ['Isolates element rendering for performance', 'Creates containers', 'Contains overflow', 'Wraps text'], correctAnswer: 'Isolates element rendering for performance' }, sa: { text: 'What are the values for the contain property?', correctAnswer: 'layout, paint, size, content, strict' } },
        ]
      },
      'JavaScript Basics': {
        easy: [
          { mc: { text: 'How do you declare a variable in JavaScript?', options: ['let, const, or var', 'variable', 'def', 'dim'], correctAnswer: 'let, const, or var' }, sa: { text: 'What are the three ways to declare variables in JavaScript?', correctAnswer: 'let, const, var' } },
          { mc: { text: 'What is the result of typeof "hello"?', options: ['string', 'text', 'char', 'String'], correctAnswer: 'string' }, sa: { text: 'What operator checks the type of a value?', correctAnswer: 'typeof' } },
          { mc: { text: 'How do you write a comment in JavaScript?', options: ['// or /* */', '# or """ """', '<!-- -->', '-- or {- -}'], correctAnswer: '// or /* */' }, sa: { text: 'What is the syntax for single-line comments in JavaScript?', correctAnswer: '// comment' } },
          { mc: { text: 'What does console.log() do?', options: ['Outputs to the console', 'Creates a log file', 'Displays an alert', 'Writes to HTML'], correctAnswer: 'Outputs to the console' }, sa: { text: 'How do you print output to the browser console?', correctAnswer: 'console.log()' } },
        ],
        medium: [
          { mc: { text: 'What is the difference between == and ===?', options: ['=== checks type and value, == only value', 'They are identical', '== is stricter', '=== converts types'], correctAnswer: '=== checks type and value, == only value' }, sa: { text: 'Why is === preferred over ==?', correctAnswer: 'It avoids type coercion bugs by checking both type and value' } },
          { mc: { text: 'What is an array in JavaScript?', options: ['An ordered collection of values', 'A type of object', 'A function', 'A loop'], correctAnswer: 'An ordered collection of values' }, sa: { text: 'How do you create an empty array?', correctAnswer: '[] or new Array()' } },
          { mc: { text: 'What does the push() method do?', options: ['Adds elements to end of array', 'Removes last element', 'Adds to beginning', 'Sorts array'], correctAnswer: 'Adds elements to end of array' }, sa: { text: 'How do you add an item to the end of an array?', correctAnswer: 'array.push(item)' } },
          { mc: { text: 'What is a callback function?', options: ['A function passed to another function', 'A function that calls back', 'A recursive function', 'An error handler'], correctAnswer: 'A function passed to another function' }, sa: { text: 'Give an example of using a callback function.', correctAnswer: 'array.forEach(function(item) { console.log(item); })' } },
        ],
        hard: [
          { mc: { text: 'What is closure in JavaScript?', options: ['A function with access to its outer scope', 'Closing a file', 'Ending a loop', 'Private variables only'], correctAnswer: 'A function with access to its outer scope' }, sa: { text: 'Explain what a closure is with an example use case.', correctAnswer: 'A function that retains access to variables from its outer scope even after outer function returns' } },
          { mc: { text: 'What is the event loop?', options: ['Mechanism that handles async operations', 'A for loop for events', 'DOM event system', 'Timer function'], correctAnswer: 'Mechanism that handles async operations' }, sa: { text: 'How does the JavaScript event loop work?', correctAnswer: 'It processes the call stack, then checks microtask queue, then macrotask queue' } },
          { mc: { text: 'What is prototypal inheritance?', options: ['Objects inherit from other objects', 'Class-based inheritance', 'No inheritance in JS', 'Multiple inheritance'], correctAnswer: 'Objects inherit from other objects' }, sa: { text: 'How do you set an object\'s prototype?', correctAnswer: 'Object.create(), Object.setPrototypeOf(), or __proto__' } },
          { mc: { text: 'What is the difference between call, apply, and bind?', options: ['call/apply invoke immediately, bind returns function', 'They are identical', 'bind invokes immediately', 'Only apply works'], correctAnswer: 'call/apply invoke immediately, bind returns function' }, sa: { text: 'When would you use bind()?', correctAnswer: 'To create a new function with a fixed this value for later execution' } },
        ]
      },
      'DOM Manipulation': {
        easy: [
          { mc: { text: 'What does DOM stand for?', options: ['Document Object Model', 'Data Object Model', 'Document Order Method', 'Display Object Manager'], correctAnswer: 'Document Object Model' }, sa: { text: 'What does DOM stand for?', correctAnswer: 'Document Object Model' } },
          { mc: { text: 'How do you get an element by its ID?', options: ['document.getElementById()', 'document.getElement()', 'document.findById()', 'document.selectId()'], correctAnswer: 'document.getElementById()' }, sa: { text: 'What method selects an element by ID?', correctAnswer: 'document.getElementById()' } },
          { mc: { text: 'How do you change an element\'s text content?', options: ['element.textContent = "text"', 'element.text = "text"', 'element.value = "text"', 'element.setText("text")'], correctAnswer: 'element.textContent = "text"' }, sa: { text: 'What property sets the text inside an element?', correctAnswer: 'textContent or innerText' } },
          { mc: { text: 'What method selects elements by class name?', options: ['getElementsByClassName()', 'getByClass()', 'selectClass()', 'findClass()'], correctAnswer: 'getElementsByClassName()' }, sa: { text: 'How do you select all elements with a specific class?', correctAnswer: 'document.getElementsByClassName() or document.querySelectorAll(".class")' } },
        ],
        medium: [
          { mc: { text: 'What is the difference between querySelector and querySelectorAll?', options: ['querySelector returns first match, querySelectorAll returns all', 'They are identical', 'querySelectorAll returns first', 'querySelector returns all'], correctAnswer: 'querySelector returns first match, querySelectorAll returns all' }, sa: { text: 'What does querySelectorAll return?', correctAnswer: 'A NodeList of all matching elements' } },
          { mc: { text: 'How do you add a class to an element?', options: ['element.classList.add()', 'element.addClass()', 'element.class.add()', 'element.addClassName()'], correctAnswer: 'element.classList.add()' }, sa: { text: 'What API is used to manipulate element classes?', correctAnswer: 'classList (add, remove, toggle, contains)' } },
          { mc: { text: 'What is event bubbling?', options: ['Events propagate from child to parent', 'Events bubble up visually', 'Events only fire once', 'Events propagate from parent to child'], correctAnswer: 'Events propagate from child to parent' }, sa: { text: 'What is the difference between bubbling and capturing?', correctAnswer: 'Capturing goes parent to child, bubbling goes child to parent' } },
          { mc: { text: 'How do you create a new element?', options: ['document.createElement()', 'document.newElement()', 'document.create()', 'new Element()'], correctAnswer: 'document.createElement()' }, sa: { text: 'How do you create and append a new div to the body?', correctAnswer: 'const div = document.createElement("div"); document.body.appendChild(div)' } },
        ],
        hard: [
          { mc: { text: 'What is event delegation?', options: ['Attaching event to parent to handle child events', 'Delegating events to workers', 'Removing event listeners', 'Creating custom events'], correctAnswer: 'Attaching event to parent to handle child events' }, sa: { text: 'Why is event delegation useful?', correctAnswer: 'Better performance with many elements, handles dynamically added elements' } },
          { mc: { text: 'What is the MutationObserver?', options: ['API to watch for DOM changes', 'Error monitoring tool', 'Performance observer', 'Network monitor'], correctAnswer: 'API to watch for DOM changes' }, sa: { text: 'When would you use MutationObserver?', correctAnswer: 'To react to DOM changes made by other scripts or dynamically' } },
          { mc: { text: 'What is the difference between innerHTML and textContent?', options: ['innerHTML parses HTML, textContent is plain text', 'They are identical', 'textContent parses HTML', 'innerHTML is faster'], correctAnswer: 'innerHTML parses HTML, textContent is plain text' }, sa: { text: 'Why can innerHTML be a security risk?', correctAnswer: 'It can execute injected scripts (XSS vulnerability)' } },
          { mc: { text: 'What is the DocumentFragment?', options: ['Lightweight document for batch DOM operations', 'Partial HTML document', 'Broken DOM node', 'Fragment of text'], correctAnswer: 'Lightweight document for batch DOM operations' }, sa: { text: 'Why use DocumentFragment for adding multiple elements?', correctAnswer: 'Better performance - only one reflow/repaint instead of multiple' } },
        ]
      },
      'Responsive Web Design': {
        easy: [
          { mc: { text: 'What is responsive web design?', options: ['Design that adapts to different screen sizes', 'Fast loading websites', 'Interactive websites', 'Single page apps'], correctAnswer: 'Design that adapts to different screen sizes' }, sa: { text: 'What is the goal of responsive web design?', correctAnswer: 'To make websites work well on all devices and screen sizes' } },
          { mc: { text: 'What HTML tag is essential for responsive design?', options: ['<meta name="viewport">', '<responsive>', '<mobile>', '<screen>'], correctAnswer: '<meta name="viewport">' }, sa: { text: 'What does the viewport meta tag do?', correctAnswer: 'Controls how the page is scaled on mobile devices' } },
          { mc: { text: 'What CSS unit is relative to viewport width?', options: ['vw', 'px', 'em', 'pt'], correctAnswer: 'vw' }, sa: { text: 'What does vw stand for in CSS?', correctAnswer: 'Viewport width (1vw = 1% of viewport width)' } },
          { mc: { text: 'What is a breakpoint in responsive design?', options: ['A point where layout changes based on screen size', 'Where code breaks', 'A debugging stop', 'A page break'], correctAnswer: 'A point where layout changes based on screen size' }, sa: { text: 'What are common breakpoints for responsive design?', correctAnswer: '320px, 480px, 768px, 1024px, 1200px (mobile, tablet, desktop)' } },
        ],
        medium: [
          { mc: { text: 'What is mobile-first design?', options: ['Designing for mobile before desktop', 'Mobile-only websites', 'Apps before websites', 'Mobile testing first'], correctAnswer: 'Designing for mobile before desktop' }, sa: { text: 'Why is mobile-first recommended?', correctAnswer: 'Forces focus on essential content, easier to scale up than down' } },
          { mc: { text: 'How do you make images responsive?', options: ['max-width: 100%; height: auto;', 'width: responsive;', 'display: responsive;', 'image-size: auto;'], correctAnswer: 'max-width: 100%; height: auto;' }, sa: { text: 'What CSS makes an image scale to fit its container?', correctAnswer: 'max-width: 100%; height: auto;' } },
          { mc: { text: 'What is the purpose of srcset in images?', options: ['Provide different images for different resolutions', 'Set image source', 'Create image sets', 'Style images'], correctAnswer: 'Provide different images for different resolutions' }, sa: { text: 'When would you use the srcset attribute?', correctAnswer: 'To serve different sized images based on screen resolution or viewport' } },
          { mc: { text: 'What does min-width in media queries do?', options: ['Applies styles when viewport is at least that width', 'Sets minimum element width', 'Minimum content width', 'Smallest allowed width'], correctAnswer: 'Applies styles when viewport is at least that width' }, sa: { text: 'Write a mobile-first media query for tablets (768px+).', correctAnswer: '@media (min-width: 768px) { }' } },
        ],
        hard: [
          { mc: { text: 'What is the CSS clamp() function?', options: ['Sets value between min and max based on preferred', 'Clamps elements together', 'Restricts movement', 'Validates ranges'], correctAnswer: 'Sets value between min and max based on preferred' }, sa: { text: 'Write a clamp() for font-size between 16px and 24px.', correctAnswer: 'font-size: clamp(16px, 4vw, 24px)' } },
          { mc: { text: 'What is container queries?', options: ['Style based on container size, not viewport', 'Query container elements', 'Database queries', 'Server queries'], correctAnswer: 'Style based on container size, not viewport' }, sa: { text: 'How do container queries differ from media queries?', correctAnswer: 'Container queries respond to parent element size, media queries to viewport' } },
          { mc: { text: 'What is intrinsic sizing with fit-content?', options: ['Element sizes based on content up to available space', 'Fixed content size', 'Minimum content', 'Maximum content'], correctAnswer: 'Element sizes based on content up to available space' }, sa: { text: 'Explain the difference between min-content, max-content, and fit-content.', correctAnswer: 'min-content: smallest size without overflow; max-content: size needed for content; fit-content: shrink to content but not beyond available space' } },
          { mc: { text: 'What is the aspect-ratio CSS property?', options: ['Maintains element proportions', 'Rotates element', 'Scales element', 'Positions element'], correctAnswer: 'Maintains element proportions' }, sa: { text: 'How do you create a 16:9 aspect ratio container?', correctAnswer: 'aspect-ratio: 16 / 9;' } },
        ]
      },
      // React-specific topics
      'React Components': {
        easy: [
          { mc: { text: 'What is a React component?', options: ['A reusable piece of UI', 'A styling library', 'A database connection', 'A server file'], correctAnswer: 'A reusable piece of UI' }, sa: { text: 'What is a React component?', correctAnswer: 'A reusable, self-contained piece of UI that can accept inputs (props) and return JSX' } },
          { mc: { text: 'What is JSX?', options: ['JavaScript XML - syntax for writing HTML in JS', 'Java Server Extensions', 'JSON XML', 'JavaScript Extra'], correctAnswer: 'JavaScript XML - syntax for writing HTML in JS' }, sa: { text: 'What does JSX stand for?', correctAnswer: 'JavaScript XML' } },
          { mc: { text: 'How do you pass data to a child component?', options: ['Using props', 'Using state', 'Using context only', 'Using refs'], correctAnswer: 'Using props' }, sa: { text: 'What are props in React?', correctAnswer: 'Properties passed from parent to child components' } },
          { mc: { text: 'What is the difference between functional and class components?', options: ['Functional use hooks, class use lifecycle methods', 'No difference', 'Class is newer', 'Functional cannot have state'], correctAnswer: 'Functional use hooks, class use lifecycle methods' }, sa: { text: 'What type of components are preferred in modern React?', correctAnswer: 'Functional components with hooks' } },
        ],
        medium: [
          { mc: { text: 'What is the children prop?', options: ['Content passed between component tags', 'Child components list', 'Nested state', 'Sub-components'], correctAnswer: 'Content passed between component tags' }, sa: { text: 'How do you access content placed between component tags?', correctAnswer: 'props.children' } },
          { mc: { text: 'What is prop drilling?', options: ['Passing props through many levels of components', 'Creating prop types', 'Drilling into props', 'Prop validation'], correctAnswer: 'Passing props through many levels of components' }, sa: { text: 'How can you avoid prop drilling?', correctAnswer: 'Using Context API, state management libraries, or component composition' } },
          { mc: { text: 'What does React.memo() do?', options: ['Memoizes component to prevent unnecessary re-renders', 'Creates a memo', 'Stores component in memory', 'Logs component'], correctAnswer: 'Memoizes component to prevent unnecessary re-renders' }, sa: { text: 'When should you use React.memo()?', correctAnswer: 'When a component renders often with the same props and rendering is expensive' } },
          { mc: { text: 'What is the key prop used for in lists?', options: ['Helps React identify which items changed', 'Sorts items', 'Filters items', 'Styles items'], correctAnswer: 'Helps React identify which items changed' }, sa: { text: 'Why is the key prop important when rendering lists?', correctAnswer: 'It helps React efficiently update the DOM by identifying which items changed, added, or removed' } },
        ],
        hard: [
          { mc: { text: 'What is a Higher-Order Component (HOC)?', options: ['A function that takes a component and returns enhanced component', 'A superior component', 'A parent component', 'A styled component'], correctAnswer: 'A function that takes a component and returns enhanced component' }, sa: { text: 'When would you use a Higher-Order Component?', correctAnswer: 'To share common logic between components, like authentication or data fetching' } },
          { mc: { text: 'What is the Compound Component pattern?', options: ['Components that work together sharing implicit state', 'Multiple components combined', 'Nested components', 'Complex components'], correctAnswer: 'Components that work together sharing implicit state' }, sa: { text: 'Give an example of the Compound Component pattern.', correctAnswer: 'Select and Option components, or Tabs and TabPanel components' } },
          { mc: { text: 'What is React.lazy() used for?', options: ['Code splitting - loading components lazily', 'Making components slower', 'Lazy evaluation', 'Delayed rendering'], correctAnswer: 'Code splitting - loading components lazily' }, sa: { text: 'How do you implement code splitting in React?', correctAnswer: 'React.lazy() with dynamic import() and Suspense for fallback' } },
          { mc: { text: 'What is the Render Props pattern?', options: ['Passing a render function as a prop', 'Props that render', 'Rendered properties', 'Prop rendering'], correctAnswer: 'Passing a render function as a prop' }, sa: { text: 'How do render props differ from HOCs?', correctAnswer: 'Render props use a function prop for flexibility, HOCs wrap components statically' } },
        ]
      },
      'State Management': {
        easy: [
          { mc: { text: 'What is state in React?', options: ['Data that changes over time in a component', 'Static data', 'Props from parent', 'CSS styles'], correctAnswer: 'Data that changes over time in a component' }, sa: { text: 'What is the difference between state and props?', correctAnswer: 'State is internal and mutable, props are external and read-only' } },
          { mc: { text: 'How do you update state in a functional component?', options: ['Using the setter function from useState', 'Direct assignment', 'Using this.setState', 'Modifying props'], correctAnswer: 'Using the setter function from useState' }, sa: { text: 'Why can\'t you directly modify state?', correctAnswer: 'React needs to know when state changes to re-render, direct mutation bypasses this' } },
          { mc: { text: 'What happens when state changes?', options: ['Component re-renders', 'Nothing happens', 'Page reloads', 'Error occurs'], correctAnswer: 'Component re-renders' }, sa: { text: 'What triggers a re-render in React?', correctAnswer: 'State changes, prop changes, or parent re-renders' } },
          { mc: { text: 'Can sibling components share state directly?', options: ['No, state must be lifted to parent', 'Yes, always', 'Only with refs', 'Only in class components'], correctAnswer: 'No, state must be lifted to parent' }, sa: { text: 'How do sibling components share state?', correctAnswer: 'Lift state up to common parent or use Context/state management library' } },
        ],
        medium: [
          { mc: { text: 'What is lifting state up?', options: ['Moving state to a common ancestor component', 'Increasing state value', 'Moving state to child', 'Optimizing state'], correctAnswer: 'Moving state to a common ancestor component' }, sa: { text: 'When should you lift state up?', correctAnswer: 'When multiple components need to share or sync the same state' } },
          { mc: { text: 'What is the Context API used for?', options: ['Sharing data without prop drilling', 'Creating contexts', 'Error handling', 'Routing'], correctAnswer: 'Sharing data without prop drilling' }, sa: { text: 'How do you create and use a Context?', correctAnswer: 'createContext(), Provider to supply value, useContext() to consume' } },
          { mc: { text: 'When should you use useReducer over useState?', options: ['Complex state logic with multiple sub-values', 'Simple boolean state', 'Single value state', 'Always'], correctAnswer: 'Complex state logic with multiple sub-values' }, sa: { text: 'What does useReducer return?', correctAnswer: 'Current state and a dispatch function' } },
          { mc: { text: 'What is controlled vs uncontrolled component?', options: ['Controlled: React manages form state; Uncontrolled: DOM manages it', 'They are the same', 'Uncontrolled is React-managed', 'Controlled is DOM-managed'], correctAnswer: 'Controlled: React manages form state; Uncontrolled: DOM manages it' }, sa: { text: 'When would you use an uncontrolled component?', correctAnswer: 'For simple forms, file inputs, or when integrating with non-React code' } },
        ],
        hard: [
          { mc: { text: 'What is Redux used for?', options: ['Centralized state management', 'Routing', 'Styling', 'Testing'], correctAnswer: 'Centralized state management' }, sa: { text: 'What are the three principles of Redux?', correctAnswer: 'Single source of truth, state is read-only, changes via pure reducers' } },
          { mc: { text: 'What is the flux pattern?', options: ['Unidirectional data flow architecture', 'Bidirectional updates', 'Random data flow', 'No data flow'], correctAnswer: 'Unidirectional data flow architecture' }, sa: { text: 'Describe the flux data flow.', correctAnswer: 'Action -> Dispatcher -> Store -> View -> Action' } },
          { mc: { text: 'What is Zustand?', options: ['Lightweight state management library', 'A German word only', 'React core library', 'Testing library'], correctAnswer: 'Lightweight state management library' }, sa: { text: 'How does Zustand differ from Redux?', correctAnswer: 'Less boilerplate, no providers needed, simpler API, built-in hooks' } },
          { mc: { text: 'What is state normalization?', options: ['Organizing state like a database to avoid duplication', 'Normalizing values', 'Default state', 'State validation'], correctAnswer: 'Organizing state like a database to avoid duplication' }, sa: { text: 'Why normalize state in complex applications?', correctAnswer: 'Avoids data duplication, easier updates, better performance, consistent data' } },
        ]
      },
      'React Router': {
        easy: [
          { mc: { text: 'What is React Router?', options: ['A library for navigation in React apps', 'A React component', 'A styling library', 'A state manager'], correctAnswer: 'A library for navigation in React apps' }, sa: { text: 'What is the purpose of React Router?', correctAnswer: 'To enable client-side navigation between different views/pages' } },
          { mc: { text: 'What component defines a route?', options: ['<Route>', '<Router>', '<Link>', '<Path>'], correctAnswer: '<Route>' }, sa: { text: 'How do you define a route in React Router?', correctAnswer: '<Route path="/path" element={<Component />} />' } },
          { mc: { text: 'What does the <Link> component do?', options: ['Creates navigation links without page reload', 'External links', 'Downloads files', 'Sends emails'], correctAnswer: 'Creates navigation links without page reload' }, sa: { text: 'What is the difference between Link and anchor tag?', correctAnswer: 'Link prevents full page reload, enabling SPA navigation' } },
          { mc: { text: 'What wraps all routes in React Router?', options: ['<BrowserRouter> or <Router>', '<Routes>', '<Navigation>', '<App>'], correctAnswer: '<BrowserRouter> or <Router>' }, sa: { text: 'Where should BrowserRouter be placed?', correctAnswer: 'At the top level, wrapping the entire app or route section' } },
        ],
        medium: [
          { mc: { text: 'What is a dynamic route parameter?', options: ['A variable part of the URL like /users/:id', 'A random route', 'A generated route', 'A query string'], correctAnswer: 'A variable part of the URL like /users/:id' }, sa: { text: 'How do you access route parameters in a component?', correctAnswer: 'useParams() hook' } },
          { mc: { text: 'What does useNavigate() do?', options: ['Programmatically navigate to routes', 'Get current location', 'Get params', 'Create routes'], correctAnswer: 'Programmatically navigate to routes' }, sa: { text: 'How do you redirect after form submission?', correctAnswer: 'const navigate = useNavigate(); navigate("/success");' } },
          { mc: { text: 'What are nested routes?', options: ['Routes defined inside other routes', 'Multiple routers', 'Hidden routes', 'Deep links'], correctAnswer: 'Routes defined inside other routes' }, sa: { text: 'How do you render child routes in a parent component?', correctAnswer: 'Using the <Outlet /> component' } },
          { mc: { text: 'What is the useLocation() hook?', options: ['Returns current location object', 'Sets location', 'Gets GPS', 'Finds elements'], correctAnswer: 'Returns current location object' }, sa: { text: 'What information does useLocation provide?', correctAnswer: 'pathname, search, hash, state, key' } },
        ],
        hard: [
          { mc: { text: 'What are route loaders in React Router 6.4+?', options: ['Functions that fetch data before rendering route', 'Loading spinners', 'Lazy loading', 'Bundle loaders'], correctAnswer: 'Functions that fetch data before rendering route' }, sa: { text: 'How do loaders improve data fetching?', correctAnswer: 'Data loads in parallel with route, available immediately on render' } },
          { mc: { text: 'What is the purpose of route actions?', options: ['Handle form submissions and mutations', 'Animate routes', 'Log analytics', 'Validate routes'], correctAnswer: 'Handle form submissions and mutations' }, sa: { text: 'How do actions work with forms in React Router?', correctAnswer: 'Form submits to action, action processes and returns data or redirects' } },
          { mc: { text: 'What is code splitting with React Router?', options: ['Loading route components only when needed', 'Splitting URL paths', 'Multiple routers', 'Breaking routes'], correctAnswer: 'Loading route components only when needed' }, sa: { text: 'How do you implement lazy loading routes?', correctAnswer: 'React.lazy() for components, Suspense for fallback' } },
          { mc: { text: 'What is the errorElement prop?', options: ['Renders when route throws error', 'Error logging', 'Validates routes', 'Catches 404s only'], correctAnswer: 'Renders when route throws error' }, sa: { text: 'How do you handle errors in React Router?', correctAnswer: 'errorElement prop on routes, useRouteError() hook in error component' } },
        ]
      },
      'React Performance': {
        easy: [
          { mc: { text: 'What causes unnecessary re-renders?', options: ['Parent re-renders or new object/array references', 'Using hooks', 'Writing JSX', 'Importing modules'], correctAnswer: 'Parent re-renders or new object/array references' }, sa: { text: 'What is a re-render in React?', correctAnswer: 'When React calls the component function again to check for UI updates' } },
          { mc: { text: 'What tool helps identify performance issues?', options: ['React DevTools Profiler', 'Console.log', 'Network tab', 'Elements panel'], correctAnswer: 'React DevTools Profiler' }, sa: { text: 'How can you measure component render time?', correctAnswer: 'React DevTools Profiler or React.Profiler component' } },
          { mc: { text: 'What is the virtual DOM?', options: ['In-memory representation of real DOM', 'A hidden DOM', 'Browser feature', 'CSS system'], correctAnswer: 'In-memory representation of real DOM' }, sa: { text: 'How does the virtual DOM improve performance?', correctAnswer: 'React compares virtual DOMs and only updates changed parts of real DOM' } },
          { mc: { text: 'Should you optimize every component?', options: ['No, premature optimization can hurt', 'Yes, always', 'Only class components', 'Never optimize'], correctAnswer: 'No, premature optimization can hurt' }, sa: { text: 'When should you optimize React performance?', correctAnswer: 'When you identify actual performance problems through profiling' } },
        ],
        medium: [
          { mc: { text: 'What does useMemo do?', options: ['Memoizes computed values', 'Memorizes components', 'Creates memos', 'Logs values'], correctAnswer: 'Memoizes computed values' }, sa: { text: 'When should you use useMemo?', correctAnswer: 'For expensive calculations that should not re-run on every render' } },
          { mc: { text: 'What is the purpose of useCallback?', options: ['Memoizes functions to prevent recreation', 'Creates callbacks', 'Handles events', 'Fetches data'], correctAnswer: 'Memoizes functions to prevent recreation' }, sa: { text: 'Why use useCallback with React.memo children?', correctAnswer: 'To prevent child re-renders caused by new function references' } },
          { mc: { text: 'What is windowing/virtualization?', options: ['Only rendering visible list items', 'Opening windows', 'VM usage', 'Scrolling technique'], correctAnswer: 'Only rendering visible list items' }, sa: { text: 'Name a library for list virtualization.', correctAnswer: 'react-window, react-virtualized, or TanStack Virtual' } },
          { mc: { text: 'What is code splitting?', options: ['Loading code only when needed', 'Breaking code into files', 'Splitting components', 'Dividing state'], correctAnswer: 'Loading code only when needed' }, sa: { text: 'How does code splitting improve performance?', correctAnswer: 'Reduces initial bundle size, faster first load' } },
        ],
        hard: [
          { mc: { text: 'What is reconciliation in React?', options: ['Algorithm to diff and update DOM efficiently', 'Combining components', 'Error recovery', 'State merging'], correctAnswer: 'Algorithm to diff and update DOM efficiently' }, sa: { text: 'How does React\'s reconciliation algorithm work?', correctAnswer: 'Compares virtual DOM trees, uses heuristics like keys to minimize operations' } },
          { mc: { text: 'What are React Concurrent Features?', options: ['Allow React to interrupt rendering for urgent updates', 'Multiple React instances', 'Parallel processing', 'Multi-threading'], correctAnswer: 'Allow React to interrupt rendering for urgent updates' }, sa: { text: 'What is useTransition used for?', correctAnswer: 'Mark state updates as non-urgent, keeping UI responsive' } },
          { mc: { text: 'What is the useDeferredValue hook?', options: ['Defers updating a value during urgent updates', 'Delays rendering', 'Postpones effects', 'Slows components'], correctAnswer: 'Defers updating a value during urgent updates' }, sa: { text: 'When would you use useDeferredValue?', correctAnswer: 'For expensive re-renders triggered by fast-changing values like search input' } },
          { mc: { text: 'What causes layout thrashing?', options: ['Reading and writing to DOM repeatedly', 'Too many components', 'Large state', 'Many effects'], correctAnswer: 'Reading and writing to DOM repeatedly' }, sa: { text: 'How do you avoid layout thrashing?', correctAnswer: 'Batch reads together, then batch writes; use requestAnimationFrame' } },
        ]
      }
    };
    
    // Function to get questions for a topic, with fallback based on course type
    const getQuestionsForTopic = (topicTitle: string, difficulty: 'easy' | 'medium' | 'hard'): any[] => {
      // Try exact match first
      if (topicQuestionBanks[topicTitle]) {
        return topicQuestionBanks[topicTitle][difficulty];
      }
      
      // Try partial match (topic contains key or key contains topic)
      const lowerTopic = topicTitle.toLowerCase();
      for (const [key, bank] of Object.entries(topicQuestionBanks)) {
        const lowerKey = key.toLowerCase();
        if (lowerTopic.includes(lowerKey) || lowerKey.includes(lowerTopic) ||
            lowerTopic.split(' ').some(word => lowerKey.includes(word) && word.length > 3) ||
            lowerKey.split(' ').some(word => lowerTopic.includes(word) && word.length > 3)) {
          return bank[difficulty];
        }
      }
      
      // If this is a web course, default to web questions
      if (isWebCourse) {
        const webBanks = ['HTML Fundamentals', 'CSS Styling and Layout', 'JavaScript Basics', 'DOM Manipulation', 'Responsive Web Design', 'React Hooks', 'JavaScript ES6 Features'];
        const randomBank = webBanks[Math.floor(Math.random() * webBanks.length)];
        if (topicQuestionBanks[randomBank]) {
          return topicQuestionBanks[randomBank][difficulty];
        }
      }
      
      // Check for category keywords in topic name
      const webKeywords = ['html', 'css', 'javascript', 'js', 'react', 'vue', 'angular', 'web', 'dom', 'api', 'http', 'frontend', 'backend', 'node', 'express', 'typescript'];
      const mlKeywords = ['machine', 'learning', 'neural', 'network', 'deep', 'ai', 'model', 'training', 'classification', 'regression', 'supervised', 'unsupervised', 'backprop'];
      
      const isWeb = webKeywords.some(kw => lowerTopic.includes(kw));
      const isML = mlKeywords.some(kw => lowerTopic.includes(kw));
      
      if (isWeb) {
        const webBanks = ['React Hooks', 'JavaScript ES6 Features', 'HTML Fundamentals', 'CSS Styling and Layout'];
        const randomBank = webBanks[Math.floor(Math.random() * webBanks.length)];
        return topicQuestionBanks[randomBank][difficulty];
      }
      
      if (isML) {
        const mlBanks = ['Introduction to Machine Learning', 'Supervised Learning Basics', 'Neural Networks Basics'];
        const randomBank = mlBanks[Math.floor(Math.random() * mlBanks.length)];
        return topicQuestionBanks[randomBank][difficulty];
      }
      
      // Ultimate fallback: if web course, use web questions; otherwise generic
      if (isWebCourse) {
        return topicQuestionBanks['JavaScript Basics'][difficulty];
      }
      
      // Fallback: generate generic questions about the topic
      return [
        { mc: { text: `What is ${topicTitle}?`, options: ['A key concept in this field', 'An unrelated topic', 'A deprecated approach', 'None of the above'], correctAnswer: 'A key concept in this field' }, sa: { text: `Define ${topicTitle}.`, correctAnswer: topicTitle } },
        { mc: { text: `What is the main purpose of ${topicTitle}?`, options: ['To solve specific problems efficiently', 'It has no purpose', 'To create complexity', 'To slow things down'], correctAnswer: 'To solve specific problems efficiently' }, sa: { text: `What is ${topicTitle} used for?`, correctAnswer: topicTitle } },
        { mc: { text: `When should you use ${topicTitle}?`, options: ['When it fits the problem requirements', 'Never', 'Always', 'Randomly'], correctAnswer: 'When it fits the problem requirements' }, sa: { text: `Describe when to use ${topicTitle}.`, correctAnswer: topicTitle } },
        { mc: { text: `What are the benefits of ${topicTitle}?`, options: ['Improved efficiency and results', 'No benefits', 'More complexity', 'Slower performance'], correctAnswer: 'Improved efficiency and results' }, sa: { text: `What are the advantages of ${topicTitle}?`, correctAnswer: topicTitle } },
      ];
    };
    
    const questions: any[] = [];
    let questionNum = 1;
    
    // Generate 4 questions for each selected topic
    for (const topic of selectedLessonTitles) {
      const topicQuestions = getQuestionsForTopic(topic, diff);
      
      for (let i = 0; i < QUESTIONS_PER_TOPIC; i++) {
        // Determine question type based on setting
        let actualType: 'multiple_choice' | 'short_answer';
        if (qType === 'multiple_choice') {
          actualType = 'multiple_choice';
        } else if (qType === 'short_answer') {
          actualType = 'short_answer';
        } else {
          actualType = i % 2 === 0 ? 'multiple_choice' : 'short_answer';
        }
        
        const questionData = topicQuestions[i % topicQuestions.length];
        const q = actualType === 'multiple_choice' ? questionData.mc : questionData.sa;
        
        if (actualType === 'multiple_choice') {
          questions.push({
            id: `Q${questionNum}`,
            text: q.text,
            type: 'multiple_choice',
            difficulty: diff,
            options: q.options,
            correctAnswer: q.correctAnswer,
            topic: topic
          });
        } else {
          questions.push({
            id: `Q${questionNum}`,
            text: q.text,
            type: 'short_answer',
            difficulty: diff,
            correctAnswer: q.correctAnswer,
            topic: topic
          });
        }
        questionNum++;
      }
    }
    
    // Shuffle questions to mix topics
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    
    // Re-number after shuffle
    questions.forEach((q, idx) => { q.id = `Q${idx + 1}`; });
    
    return questions;
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
              <Badge size="sm" className="bg-purple-100 text-purple-800 border-purple-200">{effectiveSelectedLessons.length} lessons selected</Badge>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">Estimated {effectiveSelectedLessons.length * questionsPerTopic} questions</span>
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
                  <p className="text-sm text-gray-500 text-center mt-2">{effectiveSelectedLessons.length} lessons selected • {numberOfQuestions} questions</p>
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
