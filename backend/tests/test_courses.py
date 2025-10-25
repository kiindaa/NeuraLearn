def test_list_courses(client, seed_basic_data):
    r = client.get('/api/courses/')
    assert r.status_code == 200
    js = r.get_json()
    assert js['success'] is True


def test_get_course(client, seed_basic_data):
    r = client.get('/api/courses/c1')
    assert r.status_code == 200


def test_enroll_course(client, auth_headers, seed_basic_data):
    r = client.post('/api/courses/c1/enroll', headers=auth_headers)
    assert r.status_code in (200, 400)


def test_progress(client, auth_headers, seed_basic_data):
    r = client.get('/api/courses/c1/progress', headers=auth_headers)
    assert r.status_code in (200, 404)
