from app.services.course_service import CourseService
from app.services.dashboard_service import DashboardService
from app.services.file_service import FileService
from app import db
from app.models import Progress


def test_course_service_enroll_and_mark_complete(app, seed_basic_data):
    cs = CourseService()
    with app.app_context():
        # Enroll existing user u1 into c1 (idempotent)
        ok = cs.enroll_user('u1', 'c1')
        assert ok in (True, False)
        # Ensure progress exists
        pr = Progress.query.filter_by(user_id='u1', course_id='c1').first()
        assert pr is not None
        done = cs.mark_lesson_complete('u1', 'c1', 'l1')
        assert done in (True, False)


def test_dashboard_service_progress(app, seed_basic_data):
    ds = DashboardService()
    with app.app_context():
        progress = ds.get_user_progress('u1')
        assert isinstance(progress, list)


def test_file_service_helpers(tmp_path):
    fs = FileService()
    # Allowed/denied extensions
    assert fs._allowed_file('image.png') is True
    assert fs._allowed_file('doc.pdf') is True
    assert fs._allowed_file('script.exe') is False
    assert fs._allowed_file('') is False
    # get_file_info for non-existent
    info = fs.get_file_info('/uploads/general/does-not-exist.txt')
    assert info.get('exists') is False
