from app.models import Course, Quiz, Enrollment, Progress, User, db
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import uuid

class DashboardService:
    def get_user_metrics(self, user_id):
        """Get dashboard metrics for user"""
        # Get enrolled courses count
        enrolled_courses = Enrollment.query.filter_by(user_id=user_id).count()
        
        # Get completed lessons count
        completed_lessons = db.session.query(func.sum(Progress.completed_lessons)).filter_by(user_id=user_id).scalar() or 0
        
        # Get quizzes taken count
        quizzes_taken = db.session.query(func.count(Quiz.id)).join(Enrollment).filter(
            Enrollment.user_id == user_id
        ).scalar() or 0
        
        # Get average score
        average_score = db.session.query(func.avg(Progress.average_score)).filter_by(user_id=user_id).scalar() or 0
        
        return {
            'enrolledCourses': enrolled_courses,
            'lessonsCompleted': completed_lessons,
            'quizzesTaken': quizzes_taken,
            'averageScore': round(average_score, 1)
        }
    
    def get_user_courses(self, user_id):
        """Get user's enrolled courses with progress"""
        courses = db.session.query(Course).join(Enrollment).filter(
            Enrollment.user_id == user_id
        ).all()
        
        course_data = []
        for course in courses:
            progress = Progress.query.filter_by(
                user_id=user_id, 
                course_id=course.id
            ).first()
            
            course_data.append({
                'id': course.id,
                'title': course.title,
                'instructor': f"{course.instructor.first_name} {course.instructor.last_name}",
                'completedLessons': progress.completed_lessons if progress else 0,
                'totalLessons': course.lessons.count(),
                'nextLesson': self._get_next_lesson(course, progress),
                'color': self._get_course_color(course.id)
            })
        
        return course_data
    
    def get_upcoming_quizzes(self, user_id):
        """Get upcoming quizzes for user"""
        quizzes = db.session.query(Quiz).join(Course).join(Enrollment).filter(
            Enrollment.user_id == user_id,
            Quiz.scheduled_at > datetime.utcnow()
        ).order_by(Quiz.scheduled_at).limit(5).all()
        
        return [{
            'id': quiz.id,
            'title': quiz.title,
            'course': quiz.course.title,
            'scheduledAt': quiz.scheduled_at.isoformat() if quiz.scheduled_at else None
        } for quiz in quizzes]
    
    def get_user_progress(self, user_id):
        """Get detailed user progress"""
        progress_records = Progress.query.filter_by(user_id=user_id).all()
        
        return [progress.to_dict() for progress in progress_records]
    
    def get_recent_activity(self, user_id):
        """Get recent user activity"""
        # This would typically include recent lessons completed, quizzes taken, etc.
        return []
    
    def get_user_achievements(self, user_id):
        """Get user achievements"""
        # This would typically include badges, certificates, etc.
        return []
    
    def get_course_recommendations(self, user_id):
        """Get course recommendations for user"""
        # This would typically use ML to recommend courses
        return []
    
    def _get_next_lesson(self, course, progress):
        """Get next lesson for course"""
        if not progress:
            return course.lessons.order_by(Lesson.order).first().title if course.lessons.count() > 0 else "No lessons"
        
        next_lesson = course.lessons.filter(
            Lesson.order > progress.completed_lessons
        ).order_by(Lesson.order).first()
        
        return next_lesson.title if next_lesson else "Course Complete"
    
    def _get_course_color(self, course_id):
        """Get color for course based on ID"""
        colors = ['bg-primary-100', 'bg-secondary-100', 'bg-accent-100']
        return colors[hash(course_id) % len(colors)]
