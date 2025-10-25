from app import create_app, db

def test_completed_lessons_summary_without_completions(client, auth_headers, seed_basic_data):
    resp = client.get('/api/lessons/completed/summary', headers=auth_headers)
    assert resp.status_code == 200
    data = resp.get_json()['data']
    assert data['totalCompleted'] >= 0
    assert isinstance(data['averageScore'], (int, float))
    assert isinstance(data['totalTime'], str)


def test_completed_lessons_list_fallback_from_progress(client, auth_headers, seed_basic_data):
    # No LessonCompletion records seeded; should fall back to Progress and Lessons
    resp = client.get('/api/lessons/completed', headers=auth_headers)
    assert resp.status_code == 200
    items = resp.get_json()['data']
    assert len(items) >= 1
    assert all('title' in i and 'courseTitle' in i and 'completedAt' in i for i in items)


def test_completed_lessons_with_real_completions(client, auth_headers, seed_basic_data, seed_completions):
    resp = client.get('/api/lessons/completed', headers=auth_headers)
    assert resp.status_code == 200
    items = resp.get_json()['data']
    # With real completions, should be based on LessonCompletion
    assert len(items) >= 2
    assert any(i.get('timeSpent') for i in items)
    assert any(i.get('quizScore') is not None for i in items)
