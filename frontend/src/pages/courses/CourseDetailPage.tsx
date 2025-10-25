import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, CheckCircle, Clock, BookOpen, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/Progress';
import { Badge } from '../../components/ui/Progress';
import { apiService } from '../../services/apiService';
import { formatDuration } from '../../utils';

const LessonItem: React.FC<{
  lesson: any;
  isCompleted: boolean;
  isCurrent: boolean;
  onPlay: () => void;
}> = ({ lesson, isCompleted, isCurrent, onPlay }) => (
  <div className={`flex items-center justify-between p-4 rounded-lg border ${
    isCurrent ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
  }`}>
    <div className="flex items-center space-x-3">
      {isCompleted ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <div className={`w-5 h-5 rounded-full border-2 ${
          isCurrent ? 'border-primary-500' : 'border-gray-300'
        }`} />
      )}
      <div>
        <h4 className={`font-medium ${
          isCompleted ? 'text-gray-900' : isCurrent ? 'text-primary-700' : 'text-gray-700'
        }`}>
          {lesson.title}
        </h4>
        <p className="text-sm text-gray-600">{lesson.description}</p>
      </div>
    </div>
    <div className="flex items-center space-x-3">
      <div className="flex items-center text-sm text-gray-500">
        <Clock className="h-4 w-4 mr-1" />
        {formatDuration(lesson.duration)}
      </div>
      {isCurrent && (
        <Button variant="primary" size="sm" onClick={onPlay}>
          <Play className="h-4 w-4 mr-1" />
          Play
        </Button>
      )}
    </div>
  </div>
);

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => apiService.getCourse(id!),
    enabled: !!id,
  });

  const { data: progress } = useQuery({
    queryKey: ['course-progress', id],
    queryFn: () => apiService.getCourseProgress(id!),
    enabled: !!id,
  });

  // Demo fallback course when API is empty
  const demoCourse = {
    id: id || 'mock-ml',
    title: 'Introduction to Machine Learning',
    description: 'Foundations of ML including supervised and unsupervised learning, model evaluation, and practical workflows.',
    instructor: { firstName: 'Sarah', lastName: 'Chen' },
    lessons: [
      { id: 'l1', title: 'Introduction to Machine Learning', description: 'Overview of the course and goals.', duration: 930, isCompleted: true, videoUrl: null },
      { id: 'l2', title: 'Types of Machine Learning', description: 'Supervised vs Unsupervised.', duration: 765, isCompleted: true, videoUrl: null },
      { id: 'l3', title: 'Supervised Learning Basics', description: 'Key concepts and algorithms.', duration: 1100, isCompleted: true, videoUrl: null },
      { id: 'l4', title: 'Linear Regression', description: 'Model, loss, and optimization.', duration: 980, isCompleted: false, videoUrl: null },
      { id: 'l5', title: 'Backpropagation', description: 'Gradient computation in neural nets.', duration: 1410, isCompleted: false, videoUrl: null },
    ],
  } as any;
  const c = course || demoCourse;

  const completedLessons = c.lessons?.filter((lesson: any) => lesson.isCompleted).length || 0;
  const totalLessons = c.lessons?.length || 0;
  const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
  const [currentLessonId, setCurrentLessonId] = React.useState<string | null>(
    c.lessons?.find((l: any) => !l.isCompleted)?.id || c.lessons?.[0]?.id || null
  );
  const currentLesson = c.lessons?.find((l: any) => l.id === currentLessonId);

  // Show loader while fetching first time (but after hooks have been called)
  if (isLoading && !course) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4 md:mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <BookOpen className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{c.title}</h1>
              <div className="flex items-center space-x-2 mt-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{c.instructor?.firstName} {c.instructor?.lastName}</span>
              </div>
            </div>
          </div>
          <Badge variant="primary" size="lg">
            {progressPercentage}%
          </Badge>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Course Progress</span>
            <span className="text-sm text-gray-600">{completedLessons}/{totalLessons} lessons</span>
          </div>
          <ProgressBar 
            value={completedLessons} 
            max={totalLessons}
            color="primary"
            size="lg"
          />
        </div>

        <p className="text-gray-600">{c.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {c.lessons?.map((lesson: any, index: number) => {
                const isCompleted = lesson.isCompleted;
                const isCurrent = !isCompleted && index === completedLessons;
                
                return (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    isCompleted={isCompleted}
                    isCurrent={isCurrent}
                    onPlay={() => {
                      setCurrentLessonId(lesson.id);
                    }}
                  />
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Video Player */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Video Player</CardTitle>
            </CardHeader>
            <CardContent>
              {currentLesson?.videoUrl ? (
                <video
                  key={currentLesson.id}
                  src={currentLesson.videoUrl}
                  controls
                  className="w-full rounded-lg bg-black aspect-video"
                />
              ) : (
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <button
                      type="button"
                      aria-label="Play"
                      className="mx-auto mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
                    >
                      <Play className="h-8 w-8 text-white ml-0.5" />
                    </button>
                    <h3 className="text-white text-lg font-semibold">
                      {currentLesson ? `Video: ${currentLesson.title}` : 'Video: Backpropagation'}
                    </h3>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
