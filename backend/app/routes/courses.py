from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Course, Lesson, Enrollment, Progress, User, db, LessonCompletion
from app.services.course_service import CourseService
from app.utils.decorators import validate_json, admin_required

courses_bp = Blueprint('courses', __name__)
course_service = CourseService()

@courses_bp.route('/', methods=['GET'])
def get_courses():
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        category = request.args.get('category')
        difficulty = request.args.get('difficulty')
        
        courses = course_service.get_courses(page, limit, category, difficulty)
        
        return jsonify({
            'success': True,
            'data': courses
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@courses_bp.route('/<course_id>', methods=['GET'])
def get_course(course_id):
    try:
        course = course_service.get_course_by_id(course_id)
        if not course:
            return jsonify({'message': 'Course not found'}), 404
        
        return jsonify({
            'success': True,
            'data': course.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@courses_bp.route('/<course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_in_course(course_id):
    try:
        user_id = get_jwt_identity()
        
        # Check if user is already enrolled
        enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
        if enrollment:
            return jsonify({'message': 'Already enrolled in this course'}), 400
        
        # Enroll user
        success = course_service.enroll_user(user_id, course_id)
        if not success:
            return jsonify({'message': 'Course not found'}), 404
        
        return jsonify({'message': 'Enrolled successfully'}), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@courses_bp.route('/<course_id>/progress', methods=['GET'])
@jwt_required()
def get_course_progress(course_id):
    try:
        user_id = get_jwt_identity()
        
        progress = course_service.get_user_progress(user_id, course_id)
        if not progress:
            return jsonify({'message': 'Progress not found'}), 404
        
        return jsonify({
            'success': True,
            'data': progress.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@courses_bp.route('/<course_id>/lessons/<lesson_id>/complete', methods=['POST'])
@jwt_required()
def mark_lesson_complete(course_id, lesson_id):
    try:
        user_id = get_jwt_identity()
        
        success = course_service.mark_lesson_complete(user_id, course_id, lesson_id)
        if not success:
            return jsonify({'message': 'Lesson not found'}), 404
        
        # Persist granular completion
        data = request.get_json(silent=True) or {}
        time_spent = int(data.get('timeSpentMinutes') or 0)
        score = data.get('score')
        lc = LessonCompletion(
            user_id=user_id,
            course_id=course_id,
            lesson_id=lesson_id,
            time_spent_minutes=time_spent,
            score=score
        )
        db.session.add(lc)
        db.session.commit()

        return jsonify({'message': 'Lesson marked as complete', 'data': lc.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@courses_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
@validate_json(['title', 'description', 'difficulty', 'category'])
def create_course():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        course = course_service.create_course(user_id, data)
        
        return jsonify({
            'success': True,
            'data': course.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@courses_bp.route('/<course_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_course(course_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        course = course_service.update_course(user_id, course_id, data)
        if not course:
            return jsonify({'message': 'Course not found'}), 404
        
        return jsonify({
            'success': True,
            'data': course.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@courses_bp.route('/<course_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_course(course_id):
    try:
        user_id = get_jwt_identity()
        
        success = course_service.delete_course(user_id, course_id)
        if not success:
            return jsonify({'message': 'Course not found'}), 404
        
        return jsonify({'message': 'Course deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@courses_bp.route('/<course_id>/lessons', methods=['POST'])
@jwt_required()
@admin_required
@validate_json(['title', 'description', 'content', 'duration', 'order'])
def create_lesson(course_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        lesson = course_service.create_lesson(user_id, course_id, data)
        if not lesson:
            return jsonify({'message': 'Course not found'}), 404
        
        return jsonify({
            'success': True,
            'data': lesson.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@courses_bp.route('/<course_id>/lessons/<lesson_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_lesson(course_id, lesson_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        lesson = course_service.update_lesson(user_id, course_id, lesson_id, data)
        if not lesson:
            return jsonify({'message': 'Lesson not found'}), 404
        
        return jsonify({
            'success': True,
            'data': lesson.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@courses_bp.route('/<course_id>/lessons/<lesson_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_lesson(course_id, lesson_id):
    try:
        user_id = get_jwt_identity()
        
        success = course_service.delete_lesson(user_id, course_id, lesson_id)
        if not success:
            return jsonify({'message': 'Lesson not found'}), 404
        
        return jsonify({'message': 'Lesson deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500
