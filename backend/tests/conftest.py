import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import pytest
from app import create_app, db
from flask_jwt_extended import create_access_token
from app.models import User, Course, Lesson, Enrollment, Progress, LessonCompletion

@pytest.fixture(scope='session')
def app():
    os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
    os.environ['JWT_SECRET_KEY'] = 'test-secret'
    flask_app = create_app()
    flask_app.config['TESTING'] = True
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()

@pytest.fixture()
def client(app):
    return app.test_client()

@pytest.fixture()
def auth_headers(app):
    with app.app_context():
        # seed a user and issue a token
        u = User.query.filter_by(email='u1@example.com').first()
        if not u:
            u = User(id='u1', email='u1@example.com', first_name='Test', last_name='User', role='student')
            u.set_password('pass')
            db.session.add(u)
            db.session.commit()
        token = create_access_token(identity=u.id)
        return {'Authorization': f'Bearer {token}'}

@pytest.fixture()
def seed_basic_data(app):
    with app.app_context():
        # create a course, lessons, enrollment, and progress
        c = Course.query.get('c1')
        if not c:
            c = Course(id='c1', title='Intro to ML', description='desc', instructor_id='u1', difficulty='beginner', category='AI')
            db.session.add(c)
        l1 = Lesson.query.get('l1')
        if not l1:
            l1 = Lesson(id='l1', title='Lesson 1', course_id='c1', order=1, duration=15)
            db.session.add(l1)
        l2 = Lesson.query.get('l2')
        if not l2:
            l2 = Lesson(id='l2', title='Lesson 2', course_id='c1', order=2, duration=20)
            db.session.add(l2)
        en = Enrollment.query.get('e1')
        if not en:
            en = Enrollment(id='e1', user_id='u1', course_id='c1')
            db.session.add(en)
        pr = Progress.query.get('p1')
        if not pr:
            pr = Progress(id='p1', user_id='u1', course_id='c1', completed_lessons=2, total_lessons=2, average_score=88)
            db.session.add(pr)
        db.session.commit()
        yield {'course': c, 'lessons': [l1, l2]}

@pytest.fixture()
def seed_completions(app, seed_basic_data):
    with app.app_context():
        l1, l2 = seed_basic_data['lessons']
        lc1 = LessonCompletion(user_id='u1', course_id='c1', lesson_id=l1.id, time_spent_minutes=14, score=90)
        lc2 = LessonCompletion(user_id='u1', course_id='c1', lesson_id=l2.id, time_spent_minutes=21, score=86)
        db.session.add_all([lc1, lc2])
        db.session.commit()
        yield [lc1, lc2]
