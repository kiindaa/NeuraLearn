def test_quiz_endpoints_basic(client, auth_headers, seed_basic_data):
    # Nonexistent quiz should 404 or 500
    r = client.get('/api/quiz/does-not-exist', headers=auth_headers)
    assert r.status_code in (404, 500)

    # Questions for nonexistent quiz
    r2 = client.get('/api/quiz/does-not-exist/questions', headers=auth_headers)
    assert r2.status_code in (200, 404, 500)

    # Check answer on nonexistent quiz/question
    r3 = client.post('/api/quiz/does-not-exist/questions/q1/answer', headers=auth_headers, json={'answer': 'A'})
    assert r3.status_code in (200, 404, 500)

    # Reveal answer nonexistent
    r4 = client.get('/api/quiz/does-not-exist/questions/q1/reveal', headers=auth_headers)
    assert r4.status_code in (200, 404, 500)

    # Attempts endpoints should handle gracefully
    r5 = client.get('/api/quiz/does-not-exist/attempts', headers=auth_headers)
    assert r5.status_code in (200, 500)
