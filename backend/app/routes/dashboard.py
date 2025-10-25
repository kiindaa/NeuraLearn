from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Course, Quiz, Enrollment, Progress, User, db
from app.services.dashboard_service import DashboardService
from app.utils.decorators import validate_json

dashboard_bp = Blueprint('dashboard', __name__)
dashboard_service = DashboardService()

@dashboard_bp.route('/metrics', methods=['GET'])
@jwt_required()
def get_dashboard_metrics():
    try:
        user_id = get_jwt_identity()
        
        metrics = dashboard_service.get_user_metrics(user_id)
        
        return jsonify({
            'success': True,
            'data': metrics
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@dashboard_bp.route('/courses', methods=['GET'])
@jwt_required()
def get_student_courses():
    try:
        user_id = get_jwt_identity()
        
        courses = dashboard_service.get_user_courses(user_id)
        
        return jsonify({
            'success': True,
            'data': courses
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@dashboard_bp.route('/quizzes', methods=['GET'])
@jwt_required()
def get_upcoming_quizzes():
    try:
        user_id = get_jwt_identity()
        
        quizzes = dashboard_service.get_upcoming_quizzes(user_id)
        
        return jsonify({
            'success': True,
            'data': quizzes
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@dashboard_bp.route('/progress', methods=['GET'])
@jwt_required()
def get_user_progress():
    try:
        user_id = get_jwt_identity()
        
        progress = dashboard_service.get_user_progress(user_id)
        
        return jsonify({
            'success': True,
            'data': progress
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@dashboard_bp.route('/recent-activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    try:
        user_id = get_jwt_identity()
        
        activity = dashboard_service.get_recent_activity(user_id)
        
        return jsonify({
            'success': True,
            'data': activity
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@dashboard_bp.route('/achievements', methods=['GET'])
@jwt_required()
def get_achievements():
    try:
        user_id = get_jwt_identity()
        
        achievements = dashboard_service.get_user_achievements(user_id)
        
        return jsonify({
            'success': True,
            'data': achievements
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@dashboard_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    try:
        user_id = get_jwt_identity()
        
        recommendations = dashboard_service.get_course_recommendations(user_id)
        
        return jsonify({
            'success': True,
            'data': recommendations
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500
