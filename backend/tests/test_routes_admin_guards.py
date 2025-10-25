def test_courses_admin_guards(client, auth_headers, seed_basic_data):
    # Create course requires admin -> expect 403
    payload = {
        'title': 'T', 'description': 'Long enough description', 'difficulty': 'beginner', 'category': 'AI'
    }
    r = client.post('/api/courses/', headers=auth_headers, json=payload)
    assert r.status_code in (401, 403)

    # Update/Delete course require admin
    r2 = client.put('/api/courses/c1', headers=auth_headers, json={'title': 'New'})
    assert r2.status_code in (401, 403)
    r3 = client.delete('/api/courses/c1', headers=auth_headers)
    assert r3.status_code in (401, 403)


def test_lessons_admin_guards(client, auth_headers, seed_basic_data):
    # Create/Update/Delete lesson require admin
    r = client.post('/api/courses/c1/lessons', headers=auth_headers, json={
        'title': 'L', 'description': 'Long enough description', 'content': 'x'*25, 'duration': 5, 'order': 1
    })
    assert r.status_code in (401, 403)
    r2 = client.put('/api/courses/c1/lessons/l1', headers=auth_headers, json={'title': 'New L'})
    assert r2.status_code in (401, 403)
    r3 = client.delete('/api/courses/c1/lessons/l1', headers=auth_headers)
    assert r3.status_code in (401, 403)
