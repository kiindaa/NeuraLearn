from flask import Blueprint, jsonify
import pytest
from app.utils.decorators import (
    validate_json,
    admin_required,
    instructor_required,
    student_required,
    validate_file_upload,
)
from app import create_app, db
from app.models import User
from flask_jwt_extended import create_access_token


def build_local_app():
    app = create_app()
    app.config['TESTING'] = True
    with app.app_context():
        db.create_all()
        # register blueprint before any request
        bp = Blueprint('test_decorators', __name__)

        @bp.route('/test/json', methods=['POST'])
        @validate_json(['a'])
        def test_json():
            return jsonify({'ok': True}), 200

        @bp.route('/test/admin', methods=['GET'])
        @admin_required
        def test_admin():
            return jsonify({'ok': True}), 200

        @bp.route('/test/instructor', methods=['GET'])
        @instructor_required
        def test_instructor():
            return jsonify({'ok': True}), 200

        @bp.route('/test/student', methods=['GET'])
        @student_required
        def test_student():
            return jsonify({'ok': True}), 200

        @bp.route('/test/upload', methods=['POST'])
        @validate_file_upload()
        def test_upload():
            return jsonify({'ok': True}), 200

        app.register_blueprint(bp)
        return app


@pytest.fixture(scope='module')
def local_app():
    app = build_local_app()
    yield app


@pytest.fixture()
def local_client(local_app):
    return local_app.test_client()


def auth_for_role(local_app, role: str):
    with local_app.app_context():
        u = User.query.filter_by(email=f'{role}@example.com').first()
        if not u:
            u = User(id=f'{role}-id', email=f'{role}@example.com', first_name=role, last_name='User', role=role)
            u.set_password('pw')
            db.session.add(u)
            db.session.commit()
        return {'Authorization': f'Bearer {create_access_token(identity=u.id)}'}


def test_validate_json_cases(local_client):
    r1 = local_client.post('/test/json', data='plain')
    assert r1.status_code == 400
    r2 = local_client.post('/test/json', json={})
    assert r2.status_code == 400
    r3 = local_client.post('/test/json', json={'a': ''})
    assert r3.status_code == 400
    r4 = local_client.post('/test/json', json={'a': 'x'})
    assert r4.status_code == 200


def test_role_requirements(local_client, local_app):
    student_headers = auth_for_role(local_app, 'student')
    assert local_client.get('/test/student', headers=student_headers).status_code == 200
    assert local_client.get('/test/instructor', headers=student_headers).status_code == 403
    assert local_client.get('/test/admin', headers=student_headers).status_code == 403

    instructor_headers = auth_for_role(local_app, 'instructor')
    assert local_client.get('/test/student', headers=instructor_headers).status_code == 200
    assert local_client.get('/test/instructor', headers=instructor_headers).status_code == 200
    assert local_client.get('/test/admin', headers=instructor_headers).status_code == 403


def test_validate_file_upload_negative(local_client):
    r1 = local_client.post('/test/upload')
    assert r1.status_code == 400
    from werkzeug.datastructures import FileStorage
    import io
    f = FileStorage(stream=io.BytesIO(b"data"), filename='')
    data = {'file': f}
    r2 = local_client.post('/test/upload', data=data, content_type='multipart/form-data')
    assert r2.status_code == 400
    f2 = FileStorage(stream=io.BytesIO(b"data"), filename='bad.exe')
    data2 = {'file': f2}
    r3 = local_client.post('/test/upload', data=data2, content_type='multipart/form-data')
    assert r3.status_code == 400
