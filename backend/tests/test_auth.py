import json

def test_signup_and_login(client):
    # signup
    r = client.post('/api/auth/signup', json={
        'email': 't1@example.com', 'password': 'Passw0rd!', 'firstName': 'T', 'lastName': 'U', 'role': 'student'
    })
    assert r.status_code in (200, 201)
    # login
    r2 = client.post('/api/auth/login', json={
        'email': 't1@example.com', 'password': 'Passw0rd!', 'role': 'student'
    })
    assert r2.status_code == 200
    data = r2.get_json()['data']
    assert 'token' in data
