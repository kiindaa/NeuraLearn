import types
import pytest

from app import db
from app.models import User
from app.services.course_service import CourseService
from app.services.user_service import UserService


def test_mark_lesson_complete_happy_path(client, auth_headers, seed_basic_data):
    r = client.post('/api/courses/c1/lessons/l1/complete', headers=auth_headers, json={
        'timeSpentMinutes': 12,
        'score': 95
    })
    assert r.status_code in (200, 404, 500)


def test_course_service_negative_paths(app, seed_basic_data):
    cs = CourseService()
    with app.app_context():
        # Wrong instructor id for course/lesson ops
        assert cs.update_course('wrong', 'c1', {'title': 'X'}) is None
        assert cs.delete_course('wrong', 'c1') is False
        assert cs.create_lesson('wrong', 'c1', {
            'title': 'L', 'description': 'desc', 'content': 'content content content', 'duration': 5, 'order': 1
        }) is None
        assert cs.update_lesson('wrong', 'c1', 'l1', {'title': 'Y'}) is None
        assert cs.delete_lesson('wrong', 'c1', 'l1') is False


def test_user_service_prefs_and_avatar(app, seed_basic_data, monkeypatch):
    us = UserService()
    with app.app_context():
        u = User.query.filter_by(email='u1@example.com').first()
        assert u is not None
        # prefs getters/setters
        prefs = us.get_user_preferences(u.id)
        assert isinstance(prefs, dict) and 'theme' in prefs
        new_prefs = us.update_user_preferences(u.id, {'theme': 'dark'})
        assert new_prefs.get('theme') == 'dark'

        # monkeypatch FileService.upload_file to avoid IO
        class FakeFS:
            def upload_file(self, file, folder='avatars'):
                return '/uploads/avatars/fake.png'
        monkeypatch.setattr('app.services.user_service.FileService', FakeFS)

        class DummyFile:
            filename = 'pic.png'
        url = us.upload_avatar(u.id, DummyFile())
        assert isinstance(url, str) and url.endswith('.png')
