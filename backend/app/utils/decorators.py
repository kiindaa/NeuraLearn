from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User

def validate_json(required_fields):
    """Decorator to validate required JSON fields"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({'message': 'Request must be JSON'}), 400
            
            data = request.get_json()
            if not data:
                return jsonify({'message': 'Request body is empty'}), 400
            
            missing_fields = []
            for field in required_fields:
                if field not in data or not data[field]:
                    missing_fields.append(field)
            
            if missing_fields:
                return jsonify({
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def instructor_required(f):
    """Decorator to require instructor role"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role not in ['instructor', 'admin']:
            return jsonify({'message': 'Instructor access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def student_required(f):
    """Decorator to require student role"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role not in ['student', 'instructor', 'admin']:
            return jsonify({'message': 'Student access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def rate_limit(max_requests=100, window=3600):
    """Decorator to implement rate limiting"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # In a real implementation, you would use Redis or similar
            # to track request counts per IP/user
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_file_upload(allowed_extensions=None, max_size=16*1024*1024):
    """Decorator to validate file uploads"""
    if allowed_extensions is None:
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx'}
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'file' not in request.files:
                return jsonify({'message': 'No file uploaded'}), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({'message': 'No file selected'}), 400
            
            # Check file extension
            if '.' not in file.filename:
                return jsonify({'message': 'File must have an extension'}), 400
            
            extension = file.filename.rsplit('.', 1)[1].lower()
            if extension not in allowed_extensions:
                return jsonify({
                    'message': f'File type not allowed. Allowed types: {", ".join(allowed_extensions)}'
                }), 400
            
            # Check file size
            file.seek(0, 2)  # Seek to end
            file_size = file.tell()
            file.seek(0)  # Reset to beginning
            
            if file_size > max_size:
                return jsonify({
                    'message': f'File too large. Maximum size: {max_size // (1024*1024)}MB'
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def handle_errors(f):
    """Decorator to handle common errors"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({'message': str(e)}), 400
        except PermissionError as e:
            return jsonify({'message': str(e)}), 403
        except FileNotFoundError as e:
            return jsonify({'message': str(e)}), 404
        except Exception as e:
            return jsonify({'message': 'Internal server error'}), 500
    return decorated_function

def cache_response(ttl=300):
    """Decorator to cache response (placeholder)"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # In a real implementation, you would use Redis or similar
            # to cache responses
            return f(*args, **kwargs)
        return decorated_function
    return decorator
