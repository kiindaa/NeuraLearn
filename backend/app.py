import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
import uuid
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()
bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://postgres:password@localhost/neuralearn')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-string')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = False
    app.config['HUGGINGFACE_API_KEY'] = os.environ.get('HUGGINGFACE_API_KEY')
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])
    bcrypt.init_app(app)
    
    # Import models to register them and for seeding
    from app.models import User, Course, Lesson, Quiz, Question, QuizAttempt, QuizAnswer, Enrollment, Progress

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.courses import courses_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.quiz import quiz_bp
    from app.routes.users import users_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(courses_bp, url_prefix='/api/courses')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(quiz_bp, url_prefix='/api/quiz')
    app.register_blueprint(users_bp, url_prefix='/api/user')
    
    # Seed demo data if empty (dev convenience)
    with app.app_context():
        try:
            if Course.query.filter_by(is_published=True).count() == 0:
                instructor = User.query.filter_by(email='instructor@neuralearn.dev').first()
                if not instructor:
                    instructor = User(
                        id=str(uuid.uuid4()),
                        email='instructor@neuralearn.dev',
                        first_name='Sarah',
                        last_name='Chen',
                        role='instructor',
                        is_active=True,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                    )
                    instructor.set_password('password')
                    db.session.add(instructor)
                    db.session.flush()

                demo_courses = [
                    {
                        'title': 'Introduction to Machine Learning',
                        'description': 'Foundations of ML including supervised and unsupervised learning, model evaluation, and practical workflows.',
                        'category': 'AI/ML',
                        'difficulty': 'beginner',
                        'duration': 480,
                    },
                    {
                        'title': 'Web Development Fundamentals',
                        'description': 'Core web concepts: HTML, CSS, JavaScript, and building accessible, responsive pages.',
                        'category': 'Web',
                        'difficulty': 'beginner',
                        'duration': 360,
                    },
                    {
                        'title': 'Data Structures & Algorithms',
                        'description': 'Practical introduction to arrays, linked lists, trees, graphs, sorting, and Big-O.',
                        'category': 'CS',
                        'difficulty': 'intermediate',
                        'duration': 600,
                    },
                    {
                        'title': 'React Hooks Deep Dive',
                        'description': 'Modern React development with Hooks, state management patterns, and performance tips.',
                        'category': 'Web',
                        'difficulty': 'intermediate',
                        'duration': 420,
                    },
                ]

                created_courses = []
                for c in demo_courses:
                    course = Course(
                        id=str(uuid.uuid4()),
                        title=c['title'],
                        description=c['description'],
                        instructor_id=instructor.id,
                        thumbnail=None,
                        duration=c['duration'],
                        difficulty=c['difficulty'],
                        category=c['category'],
                        is_published=True,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                    )
                    db.session.add(course)
                    created_courses.append(course)
                db.session.flush()

                for course in created_courses[:2]:
                    lessons = [
                        {
                            'title': 'Getting Started',
                            'description': 'Overview and course setup.',
                            'content': 'Welcome to the course!',
                            'duration': 20,
                            'order': 1,
                        },
                        {
                            'title': 'Core Concepts',
                            'description': 'Key ideas and terminology.',
                            'content': 'Core content.',
                            'duration': 35,
                            'order': 2,
                        },
                        {
                            'title': 'Hands-on Exercise',
                            'description': 'Apply what you learned.',
                            'content': 'Exercise details.',
                            'duration': 40,
                            'order': 3,
                        },
                    ]
                    for l in lessons:
                        db.session.add(Lesson(
                            id=str(uuid.uuid4()),
                            title=l['title'],
                            description=l['description'],
                            content=l['content'],
                            video_url=None,
                            duration=l['duration'],
                            order=l['order'],
                            course_id=course.id,
                            created_at=datetime.utcnow(),
                            updated_at=datetime.utcnow(),
                        ))

                # Ensure a demo student exists and is enrolled for dashboard data
                student = User.query.filter_by(email='student@neuralearn.dev').first()
                if not student:
                    student = User(
                        id=str(uuid.uuid4()),
                        email='student@neuralearn.dev',
                        first_name='Alex',
                        last_name='Taylor',
                        role='student',
                        is_active=True,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                    )
                    student.set_password('password')
                    db.session.add(student)
                    db.session.flush()

                # Enroll student in first two courses with starter progress
                from app.models import Enrollment, Progress
                for course in created_courses[:2]:
                    if not Enrollment.query.filter_by(user_id=student.id, course_id=course.id).first():
                        db.session.add(Enrollment(id=str(uuid.uuid4()), user_id=student.id, course_id=course.id))
                    if not Progress.query.filter_by(user_id=student.id, course_id=course.id).first():
                        total_lessons = course.lessons.count()
                        db.session.add(Progress(
                            id=str(uuid.uuid4()),
                            user_id=student.id,
                            course_id=course.id,
                            completed_lessons=min(1, total_lessons),
                            total_lessons=total_lessons,
                            completed_quizzes=0,
                            total_quizzes=0,
                            average_score=87.0,
                            last_accessed_at=datetime.utcnow(),
                            created_at=datetime.utcnow(),
                            updated_at=datetime.utcnow(),
                        ))

                db.session.commit()
        except Exception:
            db.session.rollback()

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'message': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'message': 'Internal server error'}, 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return {'message': 'Bad request'}, 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return {'message': 'Unauthorized'}, 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return {'message': 'Forbidden'}, 403
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
