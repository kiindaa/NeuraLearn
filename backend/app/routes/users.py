from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, db
from app.services.user_service import UserService
from app.utils.decorators import validate_json

users_bp = Blueprint('users', __name__)
user_service = UserService()

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        
        user = user_service.get_user_by_id(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'data': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
@validate_json(['firstName', 'lastName'])
def update_profile():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        user = user_service.update_user_profile(user_id, data)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'data': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@users_bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    try:
        user_id = get_jwt_identity()
        
        if 'avatar' not in request.files:
            return jsonify({'message': 'No file uploaded'}), 400
        
        file = request.files['avatar']
        if file.filename == '':
            return jsonify({'message': 'No file selected'}), 400
        
        # Upload avatar
        avatar_url = user_service.upload_avatar(user_id, file)
        
        return jsonify({
            'success': True,
            'data': {'url': avatar_url}
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@users_bp.route('/change-password', methods=['POST'])
@jwt_required()
@validate_json(['currentPassword', 'newPassword'])
def change_password():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        success = user_service.change_password(
            user_id, 
            data['currentPassword'], 
            data['newPassword']
        )
        
        if not success:
            return jsonify({'message': 'Current password is incorrect'}), 400
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@users_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    try:
        user_id = get_jwt_identity()
        
        preferences = user_service.get_user_preferences(user_id)
        
        return jsonify({
            'success': True,
            'data': preferences
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@users_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        preferences = user_service.update_user_preferences(user_id, data)
        
        return jsonify({
            'success': True,
            'data': preferences
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@users_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    try:
        user_id = get_jwt_identity()
        
        notifications = user_service.get_user_notifications(user_id)
        
        return jsonify({
            'success': True,
            'data': notifications
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@users_bp.route('/notifications/<notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    try:
        user_id = get_jwt_identity()
        
        success = user_service.mark_notification_read(user_id, notification_id)
        if not success:
            return jsonify({'message': 'Notification not found'}), 404
        
        return jsonify({'message': 'Notification marked as read'}), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@users_bp.route('/activity', methods=['GET'])
@jwt_required()
def get_user_activity():
    try:
        user_id = get_jwt_identity()
        
        activity = user_service.get_user_activity(user_id)
        
        return jsonify({
            'success': True,
            'data': activity
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500
