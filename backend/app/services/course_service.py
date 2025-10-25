from app.models import Course, Lesson, Enrollment, Progress, User, db
from sqlalchemy import func
import uuid
from datetime import datetime

class CourseService:
    def get_courses(self, page=1, limit=10, category=None, difficulty=None):
        """Get paginated list of courses"""
        query = Course.query.filter_by(is_published=True)
        
        if category:
            query = query.filter_by(category=category)
        if difficulty:
            query = query.filter_by(difficulty=difficulty)
        
        courses = query.paginate(
            page=page, 
            per_page=limit, 
            error_out=False
        )
        
        return {
            'items': [course.to_dict() for course in courses.items],
            'total': courses.total,
            'page': page,
            'limit': limit,
            'totalPages': courses.pages
        }
    
    def get_course_by_id(self, course_id):
        """Get course by ID"""
        return Course.query.get(course_id)
    
    def enroll_user(self, user_id, course_id):
        """Enroll user in course"""
        course = Course.query.get(course_id)
        if not course:
            return False
        
        # Check if already enrolled
        existing_enrollment = Enrollment.query.filter_by(
            user_id=user_id, 
            course_id=course_id
        ).first()
        
        if existing_enrollment:
            return True
        
        # Create enrollment
        enrollment = Enrollment(
            id=str(uuid.uuid4()),
            user_id=user_id,
            course_id=course_id
        )
        
        # Create progress record
        progress = Progress(
            id=str(uuid.uuid4()),
            user_id=user_id,
            course_id=course_id,
            total_lessons=course.lessons.count(),
            total_quizzes=course.quizzes.count()
        )
        
        db.session.add(enrollment)
        db.session.add(progress)
        db.session.commit()
        
        return True
    
    def get_user_progress(self, user_id, course_id):
        """Get user progress for a course"""
        return Progress.query.filter_by(
            user_id=user_id, 
            course_id=course_id
        ).first()
    
    def mark_lesson_complete(self, user_id, course_id, lesson_id):
        """Mark lesson as complete for user"""
        progress = Progress.query.filter_by(
            user_id=user_id, 
            course_id=course_id
        ).first()
        
        if not progress:
            return False
        
        # Update progress
        progress.completed_lessons += 1
        progress.last_accessed_at = datetime.utcnow()
        
        db.session.commit()
        
        return True
    
    def create_course(self, instructor_id, data):
        """Create a new course"""
        course = Course(
            id=str(uuid.uuid4()),
            title=data['title'],
            description=data['description'],
            instructor_id=instructor_id,
            difficulty=data['difficulty'],
            category=data['category']
        )
        
        db.session.add(course)
        db.session.commit()
        
        return course
    
    def update_course(self, instructor_id, course_id, data):
        """Update course"""
        course = Course.query.filter_by(
            id=course_id, 
            instructor_id=instructor_id
        ).first()
        
        if not course:
            return None
        
        for key, value in data.items():
            if hasattr(course, key):
                setattr(course, key, value)
        
        course.updated_at = datetime.utcnow()
        db.session.commit()
        
        return course
    
    def delete_course(self, instructor_id, course_id):
        """Delete course"""
        course = Course.query.filter_by(
            id=course_id, 
            instructor_id=instructor_id
        ).first()
        
        if not course:
            return False
        
        db.session.delete(course)
        db.session.commit()
        
        return True
    
    def create_lesson(self, instructor_id, course_id, data):
        """Create a new lesson"""
        course = Course.query.filter_by(
            id=course_id, 
            instructor_id=instructor_id
        ).first()
        
        if not course:
            return None
        
        lesson = Lesson(
            id=str(uuid.uuid4()),
            title=data['title'],
            description=data['description'],
            content=data['content'],
            duration=data['duration'],
            order=data['order'],
            course_id=course_id
        )
        
        db.session.add(lesson)
        db.session.commit()
        
        return lesson
    
    def update_lesson(self, instructor_id, course_id, lesson_id, data):
        """Update lesson"""
        lesson = Lesson.query.join(Course).filter(
            Lesson.id == lesson_id,
            Course.id == course_id,
            Course.instructor_id == instructor_id
        ).first()
        
        if not lesson:
            return None
        
        for key, value in data.items():
            if hasattr(lesson, key):
                setattr(lesson, key, value)
        
        lesson.updated_at = datetime.utcnow()
        db.session.commit()
        
        return lesson
    
    def delete_lesson(self, instructor_id, course_id, lesson_id):
        """Delete lesson"""
        lesson = Lesson.query.join(Course).filter(
            Lesson.id == lesson_id,
            Course.id == course_id,
            Course.instructor_id == instructor_id
        ).first()
        
        if not lesson:
            return False
        
        db.session.delete(lesson)
        db.session.commit()
        
        return True
