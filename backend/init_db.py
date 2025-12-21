import os
import sys
from app import create_app, db
from app.models import User, Course, Lesson, Quiz, Question, QuizAttempt, QuizAnswer, Enrollment, Progress, CourseTopic, AIQuestion, AIGeneratedQuiz

def init_db():
    # Set environment to development to use SQLite
    os.environ['FLASK_ENV'] = 'development'
    
    # Create app with development config
    app = create_app()
    
    # Create data directory if it doesn't exist
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    with app.app_context():
        try:
            # Drop all tables
            print("Dropping all tables...")
            db.drop_all()
            
            # Create all database tables
            print("Creating database tables...")
            db.create_all()
            
            # Create a test user if needed
            from werkzeug.security import generate_password_hash
            
            if not User.query.filter_by(email='test@example.com').first():
                user = User(
                    id=str(uuid.uuid4()),
                    email='test@example.com',
                    password_hash=generate_password_hash('test123'),
                    first_name='Test',
                    last_name='User',
                    role='student'
                )
                db.session.add(user)
                db.session.commit()
                print("Created test user: test@example.com / test123")
            
            print("✅ Database initialized successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Error initializing database: {str(e)}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    import uuid
    if init_db():
        sys.exit(0)
    else:
        sys.exit(1)
