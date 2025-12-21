from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, User, AIGeneratedQuiz, AIQuestion, CourseTopic
from ..ai_service import QuizGenerator, submit_quiz_answer
from datetime import datetime
import uuid

bp = Blueprint('ai_quiz', __name__, url_prefix='/api/ai-quiz')

# Initialize quiz generator
quiz_generator = QuizGenerator()

@bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_quiz():
    """
    Generate a new AI-powered quiz
    
    Request body should be a JSON object with:
    - topic_ids: List of topic IDs to generate questions for
    - difficulty: Optional difficulty level (easy, medium, hard)
    - question_types: Optional list of question types (multiple_choice, short_answer, true_false)
    - num_questions: Optional number of questions (default: 5)
    """
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    # Validate request data
    if not data.get('topic_ids'):
        return jsonify({'error': 'Topic IDs are required'}), 400
    
    try:
        # Generate the quiz
        result = quiz_generator.generate_quiz(
            student_id=current_user_id,
            topic_ids=data['topic_ids'],
            difficulty=data.get('difficulty', 'medium'),
            question_types=data.get('question_types', ['multiple_choice', 'short_answer']),
            num_questions=int(data.get('num_questions', 5))
        )
        
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Error generating quiz: {str(e)}")
        return jsonify({'error': 'Failed to generate quiz', 'details': str(e)}), 500

@bp.route('/<quiz_id>/submit-answer', methods=['POST'])
@jwt_required()
def submit_answer(quiz_id):
    """
    Submit an answer to a quiz question
    
    Request body should be a JSON object with:
    - question_id: ID of the question being answered
    - answer: The student's answer
    """
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    if not data.get('question_id'):
        return jsonify({'error': 'Question ID is required'}), 400
    if 'answer' not in data:
        return jsonify({'error': 'Answer is required'}), 400
    
    try:
        result = submit_quiz_answer(
            quiz_id=quiz_id,
            question_id=data['question_id'],
            answer=data['answer']
        )
        
        if not result['success']:
            return jsonify(result), 400
            
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Error submitting answer: {str(e)}")
        return jsonify({'error': 'Failed to submit answer', 'details': str(e)}), 500

@bp.route('/<quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz(quiz_id):
    """Get details of a specific quiz"""
    current_user_id = get_jwt_identity()
    
    quiz = AIGeneratedQuiz.query.filter_by(
        id=quiz_id,
        student_id=current_user_id
    ).first_or_404()
    
    return jsonify({
        'id': quiz.id,
        'session_uuid': str(quiz.session_uuid),
        'difficulty': quiz.difficulty,
        'generated_at': quiz.generated_at.isoformat(),
        'questions': [{
            'id': q.id,
            'question_text': q.question_text,
            'question_type': q.question_type,
            'options': q.options or [],
            'student_answer': q.student_answer,
            'is_correct': q.is_correct,
            'answered_at': q.answered_at.isoformat() if q.answered_at else None
        } for q in quiz.questions]
    })

@bp.route('/topics', methods=['GET'])
@jwt_required()
def get_topics():
    """Get all available topics for quiz generation"""
    topics = CourseTopic.query.all()
    return jsonify([{
        'id': topic.id,
        'name': topic.name,
        'description': topic.description,
        'course_id': topic.course_id
    } for topic in topics])

@bp.route('/history', methods=['GET'])
@jwt_required()
def get_quiz_history():
    """Get the user's quiz history"""
    current_user_id = get_jwt_identity()
    
    quizzes = AIGeneratedQuiz.query.filter_by(
        student_id=current_user_id
    ).order_by(AIGeneratedQuiz.generated_at.desc()).all()
    
    return jsonify([{
        'id': quiz.id,
        'session_uuid': str(quiz.session_uuid),
        'difficulty': quiz.difficulty,
        'total_questions': quiz.total_questions,
        'correct_answers': len([q for q in quiz.questions if q.is_correct is True]),
        'generated_at': quiz.generated_at.isoformat(),
        'topics': [{
            'id': topic_id,
            'name': CourseTopic.query.get(topic_id).name if topic_id else 'Unknown'
        } for topic_id in (quiz.topic_ids or [])]
    } for quiz in quizzes])
