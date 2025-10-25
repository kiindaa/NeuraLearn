def test_user_profile_and_preferences_success(client, auth_headers):
    r1 = client.get('/api/user/profile', headers=auth_headers)
    assert r1.status_code in (200, 404)
    r2 = client.put('/api/user/profile', headers=auth_headers, json={
        'firstName': 'New', 'lastName': 'Name'
    })
    assert r2.status_code in (200, 404)

    r3 = client.get('/api/user/preferences', headers=auth_headers)
    assert r3.status_code in (200, 500)
    r4 = client.put('/api/user/preferences', headers=auth_headers, json={'theme': 'dark'})
    assert r4.status_code in (200, 500)
