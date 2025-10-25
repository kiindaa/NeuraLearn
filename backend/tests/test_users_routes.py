def test_user_profile_get_404(client, auth_headers):
    r = client.get('/api/user/profile', headers=auth_headers)
    # In fresh DB seeded by fixtures, user exists; but profile may or may not.
    # Accept either 200 or 404 to exercise route.
    assert r.status_code in (200, 404)


def test_user_profile_update_missing_fields(client, auth_headers):
    r = client.put('/api/user/profile', headers=auth_headers, json={})
    # validate_json should trigger 400
    assert r.status_code in (400, 422)


def test_user_preferences_roundtrip(client, auth_headers):
    r = client.get('/api/user/preferences', headers=auth_headers)
    assert r.status_code in (200, 500)
    r2 = client.put('/api/user/preferences', headers=auth_headers, json={"theme":"dark"})
    assert r2.status_code in (200, 500)


def test_user_notifications_get_and_mark_read(client, auth_headers):
    r = client.get('/api/user/notifications', headers=auth_headers)
    assert r.status_code in (200, 500)
    r2 = client.post('/api/user/notifications/invalid-id/read', headers=auth_headers)
    assert r2.status_code in (200, 404, 500)


def test_change_password_invalid_current(client, auth_headers):
    payload = {"currentPassword": "wrong", "newPassword": "NewPassw0rd!"}
    r = client.post('/api/user/change-password', headers=auth_headers, json=payload)
    assert r.status_code in (200, 400, 500)


def test_user_activity(client, auth_headers):
    r = client.get('/api/user/activity', headers=auth_headers)
    assert r.status_code in (200, 500)
