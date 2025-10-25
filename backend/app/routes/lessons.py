from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.analytics_service import AnalyticsService
from app.models import db

lessons_bp = Blueprint('lessons', __name__)
analytics_service = AnalyticsService()

@lessons_bp.route('/completed/summary', methods=['GET'])
@jwt_required()
def completed_lessons_summary():
    try:
        user_id = get_jwt_identity()
        data = analytics_service.completed_lessons_summary(user_id)
        return jsonify({'success': True, 'data': data}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@lessons_bp.route('/completed', methods=['GET'])
@jwt_required()
def completed_lessons_list():
    try:
        user_id = get_jwt_identity()
        items = analytics_service.completed_lessons_list(user_id)
        return jsonify({'success': True, 'data': items}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500
