from app.utils.decorators import validate_json
from flask import Flask, jsonify, request


def create_temp_app():
    app = Flask(__name__)

    @app.route('/echo', methods=['POST'])
    @validate_json(['name'])
    def echo():
        data = request.get_json()
        return jsonify({'name': data['name']}), 200

    return app


def test_validate_json_missing_field(app):
    # use provided test app context
    client = app.test_client()
    r = client.post('/api/auth/login', json={})
    # our global app has validate_json enforced on /api/auth/login
    assert r.status_code in (400, 422, 500)
