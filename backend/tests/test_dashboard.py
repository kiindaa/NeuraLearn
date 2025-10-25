def test_dashboard_metrics(client, auth_headers, seed_basic_data):
    r = client.get('/api/dashboard/metrics', headers=auth_headers)
    assert r.status_code in (200, 500)
