import pytest
import json
from app import create_app, db
from app.models import User, Course, Lesson, Quiz, Question

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    """Get authentication headers for testing."""
    # Create test user
    user_data = {
        'email': 'test@example.com',
        'password': 'testpassword123',
        'firstName': 'Test',
        'lastName': 'User',
        'role': 'student'
    }
    
    # Register user
    response = client.post('/api/auth/signup', json=user_data)
    assert response.status_code == 201
    
    # Login user
    login_data = {
        'email': 'test@example.com',
        'password': 'testpassword123',
        'role': 'student'
    }
    
    response = client.post('/api/auth/login', json=login_data)
    assert response.status_code == 200
    
    token = response.json['data']['token']
    return {'Authorization': f'Bearer {token}'}

class TestAuthRoutes:
    """Test authentication routes."""
    
    def test_signup_success(self, client):
        """Test successful user signup."""
        user_data = {
            'email': 'newuser@example.com',
            'password': 'newpassword123',
            'firstName': 'New',
            'lastName': 'User',
            'role': 'student'
        }
        
        response = client.post('/api/auth/signup', json=user_data)
        assert response.status_code == 201
        assert 'user' in response.json['data']
        assert 'token' in response.json['data']
    
    def test_signup_duplicate_email(self, client):
        """Test signup with duplicate email."""
        user_data = {
            'email': 'test@example.com',
            'password': 'password123',
            'firstName': 'Test',
            'lastName': 'User',
            'role': 'student'
        }
        
        # First signup
        client.post('/api/auth/signup', json=user_data)
        
        # Second signup with same email
        response = client.post('/api/auth/signup', json=user_data)
        assert response.status_code == 400
    
    def test_login_success(self, client):
        """Test successful login."""
        # First create a user
        user_data = {
            'email': 'login@example.com',
            'password': 'loginpassword123',
            'firstName': 'Login',
            'lastName': 'User',
            'role': 'student'
        }
        client.post('/api/auth/signup', json=user_data)
        
        # Then login
        login_data = {
            'email': 'login@example.com',
            'password': 'loginpassword123',
            'role': 'student'
        }
        
        response = client.post('/api/auth/login', json=login_data)
        assert response.status_code == 200
        assert 'user' in response.json['data']
        assert 'token' in response.json['data']
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        login_data = {
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword',
            'role': 'student'
        }
        
        response = client.post('/api/auth/login', json=login_data)
        assert response.status_code == 401
    
    def test_verify_token(self, client, auth_headers):
        """Test token verification."""
        response = client.get('/api/auth/verify', headers=auth_headers)
        assert response.status_code == 200
        assert 'user' in response.json['data']

class TestCourseRoutes:
    """Test course routes."""
    
    def test_get_courses(self, client):
        """Test getting courses."""
        response = client.get('/api/courses')
        assert response.status_code == 200
        assert 'items' in response.json['data']
    
    def test_get_course_by_id(self, client):
        """Test getting course by ID."""
        # Create a test course
        course = Course(
            id='test-course-id',
            title='Test Course',
            description='Test Description',
            instructor_id='test-instructor-id',
            difficulty='beginner',
            category='test'
        )
        
        with client.application.app_context():
            db.session.add(course)
            db.session.commit()
        
        response = client.get('/api/courses/test-course-id')
        assert response.status_code == 200
        assert response.json['data']['title'] == 'Test Course'
    
    def test_enroll_in_course(self, client, auth_headers):
        """Test enrolling in a course."""
        # Create a test course
        course = Course(
            id='enroll-course-id',
            title='Enroll Course',
            description='Enroll Description',
            instructor_id='test-instructor-id',
            difficulty='beginner',
            category='test'
        )
        
        with client.application.app_context():
            db.session.add(course)
            db.session.commit()
        
        response = client.post('/api/courses/enroll-course-id/enroll', headers=auth_headers)
        assert response.status_code == 200

class TestQuizRoutes:
    """Test quiz routes."""
    
    def test_generate_quiz(self, client, auth_headers):
        """Test generating a quiz."""
        # Create a test course
        course = Course(
            id='quiz-course-id',
            title='Quiz Course',
            description='Quiz Description',
            instructor_id='test-instructor-id',
            difficulty='beginner',
            category='test'
        )
        
        # Create test lessons
        lesson1 = Lesson(
            id='lesson-1',
            title='Lesson 1',
            description='Lesson 1 Description',
            content='This is lesson 1 content about machine learning.',
            course_id='quiz-course-id',
            order=1
        )
        
        lesson2 = Lesson(
            id='lesson-2',
            title='Lesson 2',
            description='Lesson 2 Description',
            content='This is lesson 2 content about neural networks.',
            course_id='quiz-course-id',
            order=2
        )
        
        with client.application.app_context():
            db.session.add(course)
            db.session.add(lesson1)
            db.session.add(lesson2)
            db.session.commit()
        
        quiz_data = {
            'courseId': 'quiz-course-id',
            'lessonIds': ['lesson-1', 'lesson-2'],
            'difficulty': 'medium',
            'questionType': 'mixed',
            'numberOfQuestions': 3
        }
        
        response = client.post('/api/quiz/generate', json=quiz_data, headers=auth_headers)
        assert response.status_code == 201
        assert 'questions' in response.json['data']

class TestDashboardRoutes:
    """Test dashboard routes."""
    
    def test_get_dashboard_metrics(self, client, auth_headers):
        """Test getting dashboard metrics."""
        response = client.get('/api/dashboard/metrics', headers=auth_headers)
        assert response.status_code == 200
        assert 'enrolledCourses' in response.json['data']
        assert 'lessonsCompleted' in response.json['data']
        assert 'quizzesTaken' in response.json['data']
        assert 'averageScore' in response.json['data']
    
    def test_get_student_courses(self, client, auth_headers):
        """Test getting student courses."""
        response = client.get('/api/dashboard/courses', headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json['data'], list)
    
    def test_get_upcoming_quizzes(self, client, auth_headers):
        """Test getting upcoming quizzes."""
        response = client.get('/api/dashboard/quizzes', headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json['data'], list)

class TestUserRoutes:
    """Test user routes."""
    
    def test_get_profile(self, client, auth_headers):
        """Test getting user profile."""
        response = client.get('/api/user/profile', headers=auth_headers)
        assert response.status_code == 200
        assert 'email' in response.json['data']
        assert 'firstName' in response.json['data']
        assert 'lastName' in response.json['data']
    
    def test_update_profile(self, client, auth_headers):
        """Test updating user profile."""
        update_data = {
            'firstName': 'Updated',
            'lastName': 'Name'
        }
        
        response = client.put('/api/user/profile', json=update_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json['data']['firstName'] == 'Updated'
        assert response.json['data']['lastName'] == 'Name'
