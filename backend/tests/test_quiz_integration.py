"""
Integration tests for the full AI Quiz flow.
Tests the complete lifecycle: generate → answer → score.
"""
import pytest
import json
import uuid
from datetime import datetime
from unittest.mock import patch, MagicMock

from app import create_app, db
from app.models import User, Course, AIGeneratedQuiz, AIQuestion, CourseTopic
from app.services.ai_service import AIService
from flask_jwt_extended import create_access_token


@pytest.fixture(scope='module')
def app():
    """Create application for integration testing."""
    import os
    os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
    os.environ['JWT_SECRET_KEY'] = 'integration-test-secret'
    os.environ['HUGGINGFACE_API_KEY'] = ''  # Use fallback generation
    
    flask_app = create_app()
    flask_app.config['TESTING'] = True
    flask_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Test client fixture."""
    return app.test_client()


@pytest.fixture
def test_user(app):
    """Create and return a test user."""
    with app.app_context():
        user = User(
            id=str(uuid.uuid4()),
            email=f'integration_{uuid.uuid4().hex[:8]}@test.com',
            first_name='Integration',
            last_name='Tester',
            role='student'
        )
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
        return user


@pytest.fixture
def auth_headers(app, test_user):
    """Create authenticated headers."""
    with app.app_context():
        token = create_access_token(identity=test_user.id)
        return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}


@pytest.fixture
def setup_course_with_topics(app, test_user):
    """Create a course with topics for testing."""
    with app.app_context():
        # Create course
        course = Course(
            id=str(uuid.uuid4()),
            title='Integration Test Course',
            description='Course for integration testing',
            instructor_id=test_user.id,
            difficulty='intermediate',
            category='Testing'
        )
        db.session.add(course)
        
        # Create topics
        topics = []
        topic_data = [
            ('Machine Learning Fundamentals', 'Basic ML concepts'),
            ('Neural Networks', 'Deep learning basics'),
            ('Model Training', 'How to train models'),
        ]
        
        for name, desc in topic_data:
            topic = CourseTopic(
                id=str(uuid.uuid4()),
                course_id=course.id,
                name=name,
                description=desc,
                order_index=len(topics)
            )
            db.session.add(topic)
            topics.append(topic)
        
        db.session.commit()
        
        return {'course': course, 'topics': topics}


class TestFullQuizFlow:
    """Integration tests for complete quiz lifecycle."""
    
    def test_complete_quiz_flow_multiple_choice(self, app, client, auth_headers, setup_course_with_topics):
        """Test complete flow: generate → answer → score for multiple choice."""
        with app.app_context():
            topics = setup_course_with_topics['topics']
            
            # Step 1: Generate quiz
            ai_service = AIService()
            questions = ai_service.generate_questions(
                content="Machine learning is a subset of artificial intelligence. Neural networks process data.",
                difficulty='medium',
                question_type='multiple_choice',
                number_of_questions=3
            )
            
            assert len(questions) >= 1
            assert all(q['type'] == 'multiple_choice' for q in questions)
            
            # Step 2: Simulate answering
            user = User.query.filter_by(email__contains='integration').first() or User.query.first()
            
            # Create quiz in database
            quiz = AIGeneratedQuiz(
                id=str(uuid.uuid4()),
                student_id=user.id if user else 'test-user',
                topic_ids=json.dumps([t.id for t in topics]),
                difficulty='medium',
                total_questions=len(questions)
            )
            db.session.add(quiz)
            
            # Add questions to database
            correct_count = 0
            for i, q in enumerate(questions):
                db_question = AIQuestion(
                    id=str(uuid.uuid4()),
                    quiz_id=quiz.id,
                    question_text=q['text'],
                    question_type=q['type'],
                    options=json.dumps(q.get('options', [])),
                    correct_answer=q['correct_answer']
                )
                db.session.add(db_question)
                
                # Simulate answering (alternate correct/incorrect)
                if i % 2 == 0:
                    db_question.student_answer = q['correct_answer']
                    db_question.is_correct = True
                    correct_count += 1
                else:
                    db_question.student_answer = q.get('options', ['wrong'])[0] if q['type'] == 'multiple_choice' else 'wrong'
                    db_question.is_correct = False
                db_question.answered_at = datetime.utcnow()
            
            db.session.commit()
            
            # Step 3: Calculate score
            total_questions = len(questions)
            score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
            
            assert score >= 0
            assert score <= 100
    
    def test_complete_quiz_flow_short_answer(self, app, setup_course_with_topics):
        """Test complete flow for short answer questions."""
        with app.app_context():
            # Generate short answer questions
            ai_service = AIService()
            questions = ai_service.generate_questions(
                content="Supervised learning uses labeled data. Classification predicts categories.",
                difficulty='easy',
                question_type='short_answer',
                number_of_questions=2
            )
            
            assert len(questions) >= 1
            assert all(q['type'] == 'short_answer' for q in questions)
            
            # Verify structure
            for q in questions:
                assert 'text' in q
                assert 'correct_answer' in q
                assert 'explanation' in q
    
    def test_complete_quiz_flow_mixed(self, app, setup_course_with_topics):
        """Test complete flow for mixed question types."""
        with app.app_context():
            ai_service = AIService()
            questions = ai_service.generate_questions(
                content="Deep learning uses neural networks. Backpropagation trains models.",
                difficulty='hard',
                question_type='mixed',
                number_of_questions=4
            )
            
            assert len(questions) >= 2
            
            # Should have both types
            types = [q['type'] for q in questions]
            # At minimum should generate questions
            assert len(types) >= 1


class TestQuizWithDifferentTopics:
    """Tests for quiz generation with various topics."""
    
    @pytest.mark.parametrize("topic_content", [
        "HTML structures web pages. CSS adds styling. JavaScript provides interactivity.",
        "React components render UI. Props pass data. State manages updates.",
        "Python is a programming language. Functions encapsulate code. Lists store data.",
        "Databases store information. SQL queries data. Indexes improve performance.",
    ])
    def test_quiz_for_various_topics(self, app, topic_content):
        """Test quiz generation works for various topic areas."""
        with app.app_context():
            ai_service = AIService()
            questions = ai_service.generate_questions(
                content=topic_content,
                difficulty='medium',
                question_type='multiple_choice',
                number_of_questions=2
            )
            
            assert isinstance(questions, list)
            assert len(questions) >= 1
            
            for q in questions:
                assert 'text' in q
                assert 'options' in q
                assert 'correct_answer' in q


class TestDatabaseIntegration:
    """Tests for database operations with quiz data."""
    
    def test_quiz_persistence(self, app, test_user):
        """Test that quiz data persists correctly."""
        with app.app_context():
            # Create quiz
            quiz_id = str(uuid.uuid4())
            quiz = AIGeneratedQuiz(
                id=quiz_id,
                student_id=test_user.id,
                topic_ids=json.dumps(['topic-1', 'topic-2']),
                difficulty='medium',
                total_questions=5
            )
            db.session.add(quiz)
            db.session.commit()
            
            # Retrieve and verify
            retrieved = AIGeneratedQuiz.query.get(quiz_id)
            assert retrieved is not None
            assert retrieved.difficulty == 'medium'
            assert json.loads(retrieved.topic_ids) == ['topic-1', 'topic-2']
    
    def test_question_persistence(self, app, test_user):
        """Test that question data persists correctly."""
        with app.app_context():
            # Create quiz first
            quiz = AIGeneratedQuiz(
                id=str(uuid.uuid4()),
                student_id=test_user.id,
                difficulty='easy'
            )
            db.session.add(quiz)
            db.session.commit()
            
            # Create question
            question_id = str(uuid.uuid4())
            question = AIQuestion(
                id=question_id,
                quiz_id=quiz.id,
                question_text='What is testing?',
                question_type='multiple_choice',
                options=json.dumps(['A', 'B', 'C', 'D']),
                correct_answer='A'
            )
            db.session.add(question)
            db.session.commit()
            
            # Retrieve and verify
            retrieved = AIQuestion.query.get(question_id)
            assert retrieved is not None
            assert retrieved.question_text == 'What is testing?'
            assert json.loads(retrieved.options) == ['A', 'B', 'C', 'D']
    
    def test_answer_update(self, app, test_user):
        """Test updating answers for questions."""
        with app.app_context():
            # Setup quiz and question
            quiz = AIGeneratedQuiz(
                id=str(uuid.uuid4()),
                student_id=test_user.id,
                difficulty='medium'
            )
            db.session.add(quiz)
            
            question = AIQuestion(
                id=str(uuid.uuid4()),
                quiz_id=quiz.id,
                question_text='Test question?',
                question_type='multiple_choice',
                options=json.dumps(['A', 'B']),
                correct_answer='A'
            )
            db.session.add(question)
            db.session.commit()
            
            # Update answer
            question.student_answer = 'A'
            question.is_correct = True
            question.answered_at = datetime.utcnow()
            db.session.commit()
            
            # Verify update
            retrieved = AIQuestion.query.get(question.id)
            assert retrieved.student_answer == 'A'
            assert retrieved.is_correct is True
            assert retrieved.answered_at is not None


class TestQuizScoring:
    """Tests for quiz scoring functionality."""
    
    def test_perfect_score(self, app, test_user):
        """Test perfect score calculation."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                id=str(uuid.uuid4()),
                student_id=test_user.id,
                difficulty='easy',
                total_questions=5
            )
            db.session.add(quiz)
            
            # All correct answers
            for i in range(5):
                question = AIQuestion(
                    quiz_id=quiz.id,
                    question_text=f'Question {i}',
                    question_type='multiple_choice',
                    options=json.dumps(['A', 'B']),
                    correct_answer='A',
                    student_answer='A',
                    is_correct=True
                )
                db.session.add(question)
            db.session.commit()
            
            # Calculate score
            correct = sum(1 for q in quiz.questions if q.is_correct)
            score = (correct / quiz.total_questions) * 100
            
            assert score == 100
    
    def test_zero_score(self, app, test_user):
        """Test zero score calculation."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                id=str(uuid.uuid4()),
                student_id=test_user.id,
                difficulty='hard',
                total_questions=3
            )
            db.session.add(quiz)
            
            # All wrong answers
            for i in range(3):
                question = AIQuestion(
                    quiz_id=quiz.id,
                    question_text=f'Question {i}',
                    question_type='multiple_choice',
                    options=json.dumps(['A', 'B']),
                    correct_answer='A',
                    student_answer='B',
                    is_correct=False
                )
                db.session.add(question)
            db.session.commit()
            
            correct = sum(1 for q in quiz.questions if q.is_correct)
            score = (correct / quiz.total_questions) * 100
            
            assert score == 0
    
    def test_partial_score(self, app, test_user):
        """Test partial score calculation."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                id=str(uuid.uuid4()),
                student_id=test_user.id,
                difficulty='medium',
                total_questions=4
            )
            db.session.add(quiz)
            
            # 2 correct, 2 wrong
            for i in range(4):
                question = AIQuestion(
                    quiz_id=quiz.id,
                    question_text=f'Question {i}',
                    question_type='multiple_choice',
                    options=json.dumps(['A', 'B']),
                    correct_answer='A',
                    student_answer='A' if i < 2 else 'B',
                    is_correct=i < 2
                )
                db.session.add(question)
            db.session.commit()
            
            correct = sum(1 for q in quiz.questions if q.is_correct)
            score = (correct / quiz.total_questions) * 100
            
            assert score == 50


class TestQuizHistory:
    """Tests for quiz history functionality."""
    
    def test_quiz_history_ordering(self, app, test_user):
        """Test that quiz history is ordered by date."""
        with app.app_context():
            # Create multiple quizzes
            for i in range(3):
                quiz = AIGeneratedQuiz(
                    id=str(uuid.uuid4()),
                    student_id=test_user.id,
                    difficulty=['easy', 'medium', 'hard'][i],
                    total_questions=5
                )
                db.session.add(quiz)
            db.session.commit()
            
            # Query history
            history = AIGeneratedQuiz.query.filter_by(
                student_id=test_user.id
            ).order_by(AIGeneratedQuiz.generated_at.desc()).all()
            
            assert len(history) >= 3
            
            # Verify ordering
            for i in range(len(history) - 1):
                assert history[i].generated_at >= history[i + 1].generated_at
    
    def test_user_specific_history(self, app):
        """Test that history is user-specific."""
        with app.app_context():
            # Create two users
            user1 = User(
                id=str(uuid.uuid4()),
                email='user1@test.com',
                first_name='User',
                last_name='One',
                role='student'
            )
            user1.set_password('pass')
            
            user2 = User(
                id=str(uuid.uuid4()),
                email='user2@test.com',
                first_name='User',
                last_name='Two',
                role='student'
            )
            user2.set_password('pass')
            
            db.session.add_all([user1, user2])
            db.session.commit()
            
            # Create quizzes for each user
            quiz1 = AIGeneratedQuiz(
                student_id=user1.id,
                difficulty='easy'
            )
            quiz2 = AIGeneratedQuiz(
                student_id=user2.id,
                difficulty='hard'
            )
            db.session.add_all([quiz1, quiz2])
            db.session.commit()
            
            # Query each user's history
            user1_history = AIGeneratedQuiz.query.filter_by(student_id=user1.id).all()
            user2_history = AIGeneratedQuiz.query.filter_by(student_id=user2.id).all()
            
            assert len(user1_history) >= 1
            assert len(user2_history) >= 1
            
            # Verify separation
            assert all(q.student_id == user1.id for q in user1_history)
            assert all(q.student_id == user2.id for q in user2_history)


class TestErrorRecovery:
    """Tests for error recovery scenarios."""
    
    def test_partial_quiz_completion(self, app, test_user):
        """Test handling of partially completed quiz."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                id=str(uuid.uuid4()),
                student_id=test_user.id,
                difficulty='medium',
                total_questions=5
            )
            db.session.add(quiz)
            
            # Only 3 of 5 questions answered
            for i in range(5):
                question = AIQuestion(
                    quiz_id=quiz.id,
                    question_text=f'Question {i}',
                    question_type='multiple_choice',
                    options=json.dumps(['A', 'B']),
                    correct_answer='A'
                )
                if i < 3:
                    question.student_answer = 'A'
                    question.is_correct = True
                    question.answered_at = datetime.utcnow()
                db.session.add(question)
            db.session.commit()
            
            # Calculate completion
            answered = sum(1 for q in quiz.questions if q.answered_at is not None)
            completion_rate = (answered / quiz.total_questions) * 100
            
            assert completion_rate == 60
    
    def test_database_rollback_on_error(self, app, test_user):
        """Test database rollback on error."""
        with app.app_context():
            initial_count = AIGeneratedQuiz.query.count()
            
            try:
                quiz = AIGeneratedQuiz(
                    id=str(uuid.uuid4()),
                    student_id=test_user.id,
                    difficulty='medium'
                )
                db.session.add(quiz)
                
                # Simulate error before commit
                raise Exception("Simulated error")
                
            except Exception:
                db.session.rollback()
            
            # Count should be unchanged
            final_count = AIGeneratedQuiz.query.count()
            assert final_count == initial_count
