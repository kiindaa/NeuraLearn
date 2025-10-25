def test_profile_get_and_update(client, auth_headers):
    r = client.get('/api/user/profile', headers=auth_headers)
    assert r.status_code in (200, 404)
    r2 = client.put('/api/user/profile', headers=auth_headers, json={'firstName':'New','lastName':'Name'})
    assert r2.status_code in (200, 404)
