from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Quiz, Question, QuizAttempt, QuizAnswer, Course, db
from app.services.quiz_service import QuizService
from app.utils.decorators import validate_json

quiz_bp = Blueprint('quiz', __name__)
quiz_service = QuizService()

@quiz_bp.route('/generate', methods=['POST'])
@jwt_required()
@validate_json(['courseId', 'lessonIds', 'difficulty', 'questionType', 'numberOfQuestions'])
def generate_quiz():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Generate quiz using QuizService (calls AIService internally)
        quiz = quiz_service.generate_quiz(
            course_id=data['courseId'],
            lesson_ids=data['lessonIds'],
            difficulty=data['difficulty'],
            question_type=data['questionType'],
            number_of_questions=data['numberOfQuestions']
        )
        
        return jsonify({
            'success': True,
            'data': quiz.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@quiz_bp.route('/<quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz(quiz_id):
    try:
        quiz = quiz_service.get_quiz_by_id(quiz_id)
        if not quiz:
            return jsonify({'message': 'Quiz not found'}), 404
        
        return jsonify({
            'success': True,
            'data': quiz.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@quiz_bp.route('/<quiz_id>/submit', methods=['POST'])
@jwt_required()
@validate_json(['answers'])
def submit_quiz(quiz_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        answers = data['answers']
        
        # Submit quiz attempt
        attempt = quiz_service.submit_quiz_attempt(user_id, quiz_id, answers)
        
        return jsonify({
            'success': True,
            'data': attempt.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@quiz_bp.route('/<quiz_id>/attempts', methods=['GET'])
@jwt_required()
def get_quiz_attempts(quiz_id):
    try:
        user_id = get_jwt_identity()
        
        attempts = quiz_service.get_user_attempts(user_id, quiz_id)
        
        return jsonify({
            'success': True,
            'data': attempts
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@quiz_bp.route('/<quiz_id>/attempts/<attempt_id>', methods=['GET'])
@jwt_required()
def get_quiz_attempt(quiz_id, attempt_id):
    try:
        user_id = get_jwt_identity()
        
        attempt = quiz_service.get_attempt_by_id(user_id, attempt_id)
        if not attempt:
            return jsonify({'message': 'Attempt not found'}), 404
        
        return jsonify({
            'success': True,
            'data': attempt.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@quiz_bp.route('/<quiz_id>/questions', methods=['GET'])
@jwt_required()
def get_quiz_questions(quiz_id):
    try:
        questions = quiz_service.get_quiz_questions(quiz_id)
        
        return jsonify({
            'success': True,
            'data': questions
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@quiz_bp.route('/<quiz_id>/questions/<question_id>/answer', methods=['POST'])
@jwt_required()
@validate_json(['answer'])
def check_answer(quiz_id, question_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        answer = data['answer']
        
        result = quiz_service.check_question_answer(quiz_id, question_id, answer)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@quiz_bp.route('/<quiz_id>/questions/<question_id>/reveal', methods=['GET'])
@jwt_required()
def reveal_answer(quiz_id, question_id):
    try:
        question = quiz_service.get_question_by_id(quiz_id, question_id)
        if not question:
            return jsonify({'message': 'Question not found'}), 404
        
        return jsonify({
            'success': True,
            'data': {
                'correctAnswer': question.correct_answer,
                'explanation': question.explanation
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@quiz_bp.route('/history', methods=['GET'])
@jwt_required()
def get_quiz_history():
    try:
        user_id = get_jwt_identity()
        
        history = quiz_service.get_user_quiz_history(user_id)
        
        return jsonify({
            'success': True,
            'data': history
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@quiz_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_quiz_statistics():
    try:
        user_id = get_jwt_identity()
        
        stats = quiz_service.get_user_quiz_statistics(user_id)
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500
