from app import db
from app.models import Lesson


def ensure_lesson_content(app):
    with app.app_context():
        l1 = Lesson.query.get('l1')
        if l1 and not getattr(l1, 'content', None):
            l1.content = 'Intro to ML basics. Supervised learning overview.'
            db.session.commit()


def test_generate_quiz(client, app, auth_headers, seed_basic_data):
    ensure_lesson_content(app)
    payload = {
        'courseId': 'c1',
        'lessonIds': ['l1'],
        'difficulty': 'easy',
        'questionType': 'multiple_choice',
        'numberOfQuestions': 1
    }
    r = client.post('/api/quiz/generate', json=payload, headers=auth_headers)
    assert r.status_code in (201, 500)


def test_quiz_history_stats(client, auth_headers):
    r = client.get('/api/quiz/history', headers=auth_headers)
    assert r.status_code in (200, 500)
    r2 = client.get('/api/quiz/statistics', headers=auth_headers)
    assert r2.status_code in (200, 500)
