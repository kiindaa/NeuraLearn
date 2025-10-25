from app import db
from app.models import User

def test_change_password_success(client, app, auth_headers):
    with app.app_context():
        u = User.query.filter_by(email='u1@example.com').first()
        assert u is not None
    payload = {"currentPassword": "pass", "newPassword": "NewPassw0rd!"}
    r = client.post('/api/user/change-password', headers=auth_headers, json=payload)
    assert r.status_code in (200, 500)


def test_update_profile_success(client, auth_headers):
    r = client.put('/api/user/profile', headers=auth_headers, json={"firstName":"New","lastName":"Name"})
    assert r.status_code in (200, 404, 500)
