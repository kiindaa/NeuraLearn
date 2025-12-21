from datetime import datetime
from app import db
from flask_bcrypt import Bcrypt
import uuid
from sqlalchemy.dialects.postgresql import JSONB
import json

bcrypt = Bcrypt()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.Enum('student', 'instructor', 'admin', name='user_role'), nullable=False, default='student')
    avatar = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    courses_created = db.relationship('Course', backref='instructor', lazy='dynamic')
    enrollments = db.relationship('Enrollment', backref='student', lazy='dynamic')
    quiz_attempts = db.relationship('QuizAttempt', backref='user', lazy='dynamic')
    progress = db.relationship('Progress', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'role': self.role,
            'avatar': self.avatar,
            'isActive': self.is_active,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

class Course(db.Model):
    __tablename__ = 'courses'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    instructor_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    thumbnail = db.Column(db.String(255))
    duration = db.Column(db.Integer, default=0)  # in minutes
    difficulty = db.Column(db.Enum('beginner', 'intermediate', 'advanced', name='course_difficulty'), default='beginner')
    category = db.Column(db.String(100))
    is_published = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lessons = db.relationship('Lesson', backref='course', lazy='dynamic', cascade='all, delete-orphan')
    enrollments = db.relationship('Enrollment', backref='course', lazy='dynamic')
    quizzes = db.relationship('Quiz', backref='course', lazy='dynamic')
    progress = db.relationship('Progress', backref='course', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'instructor': self.instructor.to_dict() if self.instructor else None,
            'instructorId': self.instructor_id,
            'thumbnail': self.thumbnail,
            'duration': self.duration,
            'difficulty': self.difficulty,
            'category': self.category,
            'isPublished': self.is_published,
            'enrolledStudents': self.enrollments.count(),
            'rating': 4.5,  # TODO: Calculate actual rating
            'lessons': [lesson.to_dict() for lesson in self.lessons],
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

class Lesson(db.Model):
    __tablename__ = 'lessons'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    content = db.Column(db.Text)
    video_url = db.Column(db.String(255))
    duration = db.Column(db.Integer, default=0)  # in minutes
    order = db.Column(db.Integer, default=0)
    course_id = db.Column(db.String(36), db.ForeignKey('courses.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'content': self.content,
            'videoUrl': self.video_url,
            'duration': self.duration,
            'order': self.order,
            'courseId': self.course_id,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    course_id = db.Column(db.String(36), db.ForeignKey('courses.id'), nullable=False)
    scheduled_at = db.Column(db.DateTime)
    duration = db.Column(db.Integer, default=30)  # in minutes
    difficulty = db.Column(db.Enum('easy', 'medium', 'hard', name='quiz_difficulty'), default='medium')
    is_ai_generated = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    questions = db.relationship('Question', backref='quiz', lazy='dynamic', cascade='all, delete-orphan')
    attempts = db.relationship('QuizAttempt', backref='quiz', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'courseId': self.course_id,
            'course': self.course.to_dict() if self.course else None,
            'questions': [question.to_dict() for question in self.questions],
            'scheduledAt': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'duration': self.duration,
            'difficulty': self.difficulty,
            'isAiGenerated': self.is_ai_generated,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    text = db.Column(db.Text, nullable=False)
    type = db.Column(db.Enum('multiple_choice', 'short_answer', 'essay', name='question_type'), nullable=False)
    options = db.Column(db.JSON)  # For multiple choice questions
    correct_answer = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text)
    difficulty = db.Column(db.Enum('easy', 'medium', 'hard', name='question_difficulty'), default='medium')
    points = db.Column(db.Integer, default=1)
    quiz_id = db.Column(db.String(36), db.ForeignKey('quizzes.id'), nullable=False)
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'type': self.type,
            'options': self.options,
            'correctAnswer': self.correct_answer,
            'explanation': self.explanation,
            'difficulty': self.difficulty,
            'points': self.points,
            'quizId': self.quiz_id,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.String(36), db.ForeignKey('quizzes.id'), nullable=False)
    score = db.Column(db.Float, default=0)
    total_points = db.Column(db.Float, default=0)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    answers = db.relationship('QuizAnswer', backref='attempt', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'quizId': self.quiz_id,
            'quiz': self.quiz.to_dict() if self.quiz else None,
            'answers': [answer.to_dict() for answer in self.answers],
            'score': self.score,
            'totalPoints': self.total_points,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
            'createdAt': self.created_at.isoformat()
        }

class QuizAnswer(db.Model):
    __tablename__ = 'quiz_answers'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = db.Column(db.String(36), db.ForeignKey('questions.id'), nullable=False)
    answer = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, default=False)
    points = db.Column(db.Float, default=0)
    attempt_id = db.Column(db.String(36), db.ForeignKey('quiz_attempts.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'questionId': self.question_id,
            'question': self.question.to_dict() if self.question else None,
            'answer': self.answer,
            'isCorrect': self.is_correct,
            'points': self.points,
            'attemptId': self.attempt_id
        }

class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.String(36), db.ForeignKey('courses.id'), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    completion_status = db.Column(db.String(20), default='not_started')  # not_started, in_progress, completed
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('user_id', 'course_id', name='unique_enrollment'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'courseId': self.course_id,
            'enrolledAt': self.enrolled_at.isoformat()
        }

class Progress(db.Model):
    __tablename__ = 'progress'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.String(36), db.ForeignKey('courses.id'), nullable=False)
    completed_lessons = db.Column(db.Integer, default=0)
    total_lessons = db.Column(db.Integer, default=0)
    completed_quizzes = db.Column(db.Integer, default=0)
    total_quizzes = db.Column(db.Integer, default=0)
    average_score = db.Column(db.Float, default=0)
    last_accessed_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('user_id', 'course_id', name='unique_progress'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'courseId': self.course_id,
            'completedLessons': self.completed_lessons,
            'totalLessons': self.total_lessons,
            'completedQuizzes': self.completed_quizzes,
            'totalQuizzes': self.total_quizzes,
            'averageScore': self.average_score,
            'lastAccessedAt': self.last_accessed_at.isoformat(),
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

class LessonCompletion(db.Model):
    __tablename__ = 'lesson_completions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.String(36), db.ForeignKey('courses.id'), nullable=False)
    lesson_id = db.Column(db.String(36), db.ForeignKey('lessons.id'), nullable=False)
    time_spent_minutes = db.Column(db.Integer, default=0)
    score = db.Column(db.Float)  # quiz score associated with the lesson, if any
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'courseId': self.course_id,
            'lessonId': self.lesson_id,
            'timeSpentMinutes': self.time_spent_minutes,
            'score': self.score,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
        }

# AI Quiz Generation Models
class AIGeneratedQuiz(db.Model):
    """Tracks AI-generated quiz sessions"""
    __tablename__ = 'ai_generated_quizzes'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    session_uuid = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    topic_ids = db.Column(db.Text, default='[]')  # Store as JSON string
    difficulty = db.Column(db.String(20))  # Store as string instead of enum for SQLite
    question_types = db.Column(db.Text, default='[]')  # Store as JSON string
    total_questions = db.Column(db.Integer, default=5)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    questions = db.relationship('AIQuestion', backref='quiz', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'studentId': self.student_id,
            'sessionUuid': self.session_uuid,
            'topicIds': json.loads(self.topic_ids) if self.topic_ids else [],
            'difficulty': self.difficulty,
            'questionTypes': json.loads(self.question_types) if self.question_types else [],
            'totalQuestions': self.total_questions,
            'generatedAt': self.generated_at.isoformat(),
            'questions': [q.to_dict() for q in self.questions]
        }


class AIQuestion(db.Model):
    """Stores AI-generated questions and their answers"""
    __tablename__ = 'ai_questions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = db.Column(db.String(36), db.ForeignKey('ai_generated_quizzes.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20))  # Store as string instead of enum for SQLite
    options = db.Column(db.Text, default='[]')  # Store as JSON string
    correct_answer = db.Column(db.Text)
    student_answer = db.Column(db.Text)
    is_correct = db.Column(db.Boolean)
    answered_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'quizId': self.quiz_id,
            'questionText': self.question_text,
            'questionType': self.question_type,
            'options': json.loads(self.options) if self.options else [],
            'correctAnswer': self.correct_answer,
            'studentAnswer': self.student_answer,
            'isCorrect': self.is_correct,
            'answeredAt': self.answered_at.isoformat() if self.answered_at else None
        }


# Update User model to include AI quiz attempts
User.ai_quiz_attempts = db.relationship('AIGeneratedQuiz', backref='student', lazy='dynamic')

# Update Course model to include topics
Course.topics = db.relationship('CourseTopic', backref='course', lazy='dynamic', cascade='all, delete-orphan')

# Add CourseTopic model
class CourseTopic(db.Model):
    """Represents topics within a course"""
    __tablename__ = 'course_topics'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id = db.Column(db.String(36), db.ForeignKey('courses.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    order_index = db.Column(db.Integer)
    
    def to_dict(self):
        return {
            'id': self.id,
            'courseId': self.course_id,
            'name': self.name,
            'description': self.description,
            'orderIndex': self.order_index
        }
