from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app.models import User, db
from app.services.auth_service import AuthService
from app.utils.validators import validate_email, validate_password
from app.utils.decorators import validate_json

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()

@auth_bp.route('/login', methods=['POST'])
@validate_json(['email', 'password', 'role'])
def login():
    try:
        data = request.get_json()
        email = data.get('email').lower().strip()
        password = data.get('password')
        role = data.get('role')
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'message': 'Invalid email format'}), 400
        
        # Authenticate user
        user = auth_service.authenticate_user(email, password, role)
        if not user:
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict(),
                'token': access_token,
                'refreshToken': refresh_token
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/signup', methods=['POST'])
@validate_json(['email', 'password', 'firstName', 'lastName', 'role'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email').lower().strip()
        password = data.get('password')
        first_name = data.get('firstName').strip()
        last_name = data.get('lastName').strip()
        role = data.get('role')
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'message': 'Invalid email format'}), 400
        
        # Validate password
        password_validation = validate_password(password)
        if not password_validation['is_valid']:
            return jsonify({'message': password_validation['errors'][0]}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'User already exists'}), 400
        
        # Create new user
        user = auth_service.create_user(email, password, first_name, last_name, role)
        
        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict(),
                'token': access_token,
                'refreshToken': refresh_token
            }
        }), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@validate_json(['refreshToken'])
def refresh():
    try:
        data = request.get_json()
        refresh_token = data.get('refreshToken')
        
        # Verify refresh token and get user
        user_id = auth_service.verify_refresh_token(refresh_token)
        if not user_id:
            return jsonify({'message': 'Invalid refresh token'}), 401
        
        # Generate new access token
        access_token = create_access_token(identity=user_id)
        new_refresh_token = create_refresh_token(identity=user_id)
        
        return jsonify({
            'success': True,
            'data': {
                'token': access_token,
                'refreshToken': new_refresh_token
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    try:
        # In a real application, you might want to blacklist the token
        return jsonify({'message': 'Logged out successfully'}), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
@validate_json(['email'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email').lower().strip()
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'message': 'Invalid email format'}), 400
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Send password reset email (implement this)
        auth_service.send_password_reset_email(user)
        
        return jsonify({'message': 'Password reset email sent'}), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/reset-password', methods=['POST'])
@validate_json(['token', 'password'])
def reset_password():
    try:
        data = request.get_json()
        token = data.get('token')
        password = data.get('password')
        
        # Validate password
        password_validation = validate_password(password)
        if not password_validation['is_valid']:
            return jsonify({'message': password_validation['errors'][0]}), 400
        
        # Reset password (implement token verification)
        success = auth_service.reset_password(token, password)
        if not success:
            return jsonify({'message': 'Invalid or expired token'}), 400
        
        return jsonify({'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500
