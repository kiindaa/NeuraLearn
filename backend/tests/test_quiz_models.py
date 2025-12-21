"""
Comprehensive tests for Quiz Models (AIGeneratedQuiz, AIQuestion, CourseTopic)
Tests model creation, relationships, serialization, and database operations.
"""
import pytest
import json
import uuid
from datetime import datetime

from app import create_app, db
from app.models import (
    User, Course, AIGeneratedQuiz, AIQuestion, CourseTopic
)


@pytest.fixture(scope='module')
def app():
    """Create application for testing."""
    import os
    os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
    os.environ['JWT_SECRET_KEY'] = 'test-secret-key'
    
    flask_app = create_app()
    flask_app.config['TESTING'] = True
    flask_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def db_session(app):
    """Provide a database session for tests."""
    with app.app_context():
        yield db.session
        db.session.rollback()


@pytest.fixture
def test_user(app, db_session):
    """Create a test user."""
    with app.app_context():
        user = User(
            id=str(uuid.uuid4()),
            email=f'model_test_{uuid.uuid4().hex[:8]}@test.com',
            first_name='Model',
            last_name='Tester',
            role='student'
        )
        user.set_password('testpass')
        db_session.add(user)
        db_session.commit()
        return user


@pytest.fixture
def test_course(app, db_session, test_user):
    """Create a test course."""
    with app.app_context():
        course = Course(
            id=str(uuid.uuid4()),
            title='Test Course for Models',
            description='A course for testing models',
            instructor_id=test_user.id,
            difficulty='beginner',
            category='Testing'
        )
        db_session.add(course)
        db_session.commit()
        return course


class TestAIGeneratedQuizModel:
    """Tests for AIGeneratedQuiz model."""
    
    def test_create_quiz_basic(self, app, db_session, test_user):
        """Test basic quiz creation."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                id=str(uuid.uuid4()),
                student_id=test_user.id,
                difficulty='medium',
                total_questions=5
            )
            db_session.add(quiz)
            db_session.commit()
            
            assert quiz.id is not None
            assert quiz.student_id == test_user.id
            assert quiz.difficulty == 'medium'
            assert quiz.total_questions == 5
    
    def test_quiz_auto_uuid(self, app, db_session, test_user):
        """Test that quiz gets auto-generated UUID."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                student_id=test_user.id,
                difficulty='easy'
            )
            db_session.add(quiz)
            db_session.commit()
            
            assert quiz.id is not None
            assert quiz.session_uuid is not None
    
    def test_quiz_auto_timestamp(self, app, db_session, test_user):
        """Test that quiz gets auto-generated timestamp."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                student_id=test_user.id,
                difficulty='hard'
            )
            db_session.add(quiz)
            db_session.commit()
            
            assert quiz.generated_at is not None
            assert isinstance(quiz.generated_at, datetime)
    
    def test_quiz_topic_ids_json(self, app, db_session, test_user):
        """Test topic_ids JSON storage."""
        with app.app_context():
            topic_ids = ['topic-1', 'topic-2', 'topic-3']
            quiz = AIGeneratedQuiz(
                student_id=test_user.id,
                topic_ids=json.dumps(topic_ids),
                difficulty='medium'
            )
            db_session.add(quiz)
            db_session.commit()
            
            # Retrieve and parse
            retrieved = AIGeneratedQuiz.query.get(quiz.id)
            parsed_ids = json.loads(retrieved.topic_ids)
            assert parsed_ids == topic_ids
    
    def test_quiz_question_types_json(self, app, db_session, test_user):
        """Test question_types JSON storage."""
        with app.app_context():
            q_types = ['multiple_choice', 'short_answer']
            quiz = AIGeneratedQuiz(
                student_id=test_user.id,
                question_types=json.dumps(q_types),
                difficulty='medium'
            )
            db_session.add(quiz)
            db_session.commit()
            
            retrieved = AIGeneratedQuiz.query.get(quiz.id)
            parsed_types = json.loads(retrieved.question_types)
            assert parsed_types == q_types
    
    def test_quiz_to_dict(self, app, db_session, test_user):
        """Test quiz serialization to dictionary."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                student_id=test_user.id,
                topic_ids=json.dumps(['topic-1']),
                question_types=json.dumps(['multiple_choice']),
                difficulty='medium',
                total_questions=3
            )
            db_session.add(quiz)
            db_session.commit()
            
            quiz_dict = quiz.to_dict()
            
            assert 'id' in quiz_dict
            assert 'studentId' in quiz_dict
            assert 'sessionUuid' in quiz_dict
            assert 'topicIds' in quiz_dict
            assert 'difficulty' in quiz_dict
            assert 'totalQuestions' in quiz_dict
            assert 'generatedAt' in quiz_dict
            assert quiz_dict['topicIds'] == ['topic-1']
    
    def test_quiz_difficulty_values(self, app, db_session, test_user):
        """Test different difficulty values."""
        with app.app_context():
            for difficulty in ['easy', 'medium', 'hard']:
                quiz = AIGeneratedQuiz(
                    student_id=test_user.id,
                    difficulty=difficulty
                )
                db_session.add(quiz)
                db_session.commit()
                
                assert quiz.difficulty == difficulty
    
    def test_quiz_default_values(self, app, db_session, test_user):
        """Test default values for optional fields."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                student_id=test_user.id
            )
            db_session.add(quiz)
            db_session.commit()
            
            assert quiz.total_questions == 5  # Default
            assert quiz.topic_ids == '[]' or quiz.topic_ids is None or json.loads(quiz.topic_ids or '[]') == []


class TestAIQuestionModel:
    """Tests for AIQuestion model."""
    
    @pytest.fixture
    def test_quiz(self, app, db_session, test_user):
        """Create a test quiz for questions."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                id=str(uuid.uuid4()),
                student_id=test_user.id,
                difficulty='medium'
            )
            db_session.add(quiz)
            db_session.commit()
            return quiz
    
    def test_create_multiple_choice_question(self, app, db_session, test_quiz):
        """Test creating a multiple choice question."""
        with app.app_context():
            question = AIQuestion(
                id=str(uuid.uuid4()),
                quiz_id=test_quiz.id,
                question_text='What is machine learning?',
                question_type='multiple_choice',
                options=json.dumps(['A', 'B', 'C', 'D']),
                correct_answer='A'
            )
            db_session.add(question)
            db_session.commit()
            
            assert question.id is not None
            assert question.question_type == 'multiple_choice'
            assert json.loads(question.options) == ['A', 'B', 'C', 'D']
    
    def test_create_short_answer_question(self, app, db_session, test_quiz):
        """Test creating a short answer question."""
        with app.app_context():
            question = AIQuestion(
                quiz_id=test_quiz.id,
                question_text='Explain neural networks.',
                question_type='short_answer',
                correct_answer='Neural networks are computational models.'
            )
            db_session.add(question)
            db_session.commit()
            
            assert question.question_type == 'short_answer'
            assert question.options is None or question.options == '[]'
    
    def test_question_answer_tracking(self, app, db_session, test_quiz):
        """Test tracking student answers."""
        with app.app_context():
            question = AIQuestion(
                quiz_id=test_quiz.id,
                question_text='Test question?',
                question_type='multiple_choice',
                options=json.dumps(['A', 'B']),
                correct_answer='A'
            )
            db_session.add(question)
            db_session.commit()
            
            # Simulate answering
            question.student_answer = 'A'
            question.is_correct = True
            question.answered_at = datetime.utcnow()
            db_session.commit()
            
            assert question.student_answer == 'A'
            assert question.is_correct is True
            assert question.answered_at is not None
    
    def test_question_to_dict(self, app, db_session, test_quiz):
        """Test question serialization to dictionary."""
        with app.app_context():
            question = AIQuestion(
                quiz_id=test_quiz.id,
                question_text='What is AI?',
                question_type='multiple_choice',
                options=json.dumps(['A', 'B', 'C']),
                correct_answer='B',
                student_answer='B',
                is_correct=True
            )
            db_session.add(question)
            db_session.commit()
            
            q_dict = question.to_dict()
            
            assert 'id' in q_dict
            assert 'quizId' in q_dict
            assert 'questionText' in q_dict
            assert 'questionType' in q_dict
            assert 'options' in q_dict
            assert 'correctAnswer' in q_dict
            assert 'studentAnswer' in q_dict
            assert 'isCorrect' in q_dict
            assert q_dict['options'] == ['A', 'B', 'C']
    
    def test_question_quiz_relationship(self, app, db_session, test_quiz):
        """Test question-quiz relationship."""
        with app.app_context():
            question = AIQuestion(
                quiz_id=test_quiz.id,
                question_text='Test relationship',
                question_type='short_answer',
                correct_answer='test'
            )
            db_session.add(question)
            db_session.commit()
            
            # Access through relationship
            assert question.quiz is not None
            assert question.quiz.id == test_quiz.id
    
    def test_quiz_has_multiple_questions(self, app, db_session, test_quiz):
        """Test quiz can have multiple questions."""
        with app.app_context():
            for i in range(5):
                question = AIQuestion(
                    quiz_id=test_quiz.id,
                    question_text=f'Question {i}',
                    question_type='multiple_choice',
                    options=json.dumps(['A', 'B']),
                    correct_answer='A'
                )
                db_session.add(question)
            db_session.commit()
            
            quiz = AIGeneratedQuiz.query.get(test_quiz.id)
            assert quiz.questions.count() >= 5


class TestCourseTopicModel:
    """Tests for CourseTopic model."""
    
    def test_create_topic(self, app, db_session, test_course):
        """Test basic topic creation."""
        with app.app_context():
            topic = CourseTopic(
                id=str(uuid.uuid4()),
                course_id=test_course.id,
                name='Introduction to Testing',
                description='Learn the basics of testing',
                order_index=1
            )
            db_session.add(topic)
            db_session.commit()
            
            assert topic.id is not None
            assert topic.name == 'Introduction to Testing'
            assert topic.course_id == test_course.id
    
    def test_topic_to_dict(self, app, db_session, test_course):
        """Test topic serialization to dictionary."""
        with app.app_context():
            topic = CourseTopic(
                course_id=test_course.id,
                name='Advanced Testing',
                description='Deep dive into testing',
                order_index=2
            )
            db_session.add(topic)
            db_session.commit()
            
            t_dict = topic.to_dict()
            
            assert 'id' in t_dict
            assert 'courseId' in t_dict
            assert 'name' in t_dict
            assert 'description' in t_dict
            assert 'orderIndex' in t_dict
    
    def test_topic_course_relationship(self, app, db_session, test_course):
        """Test topic-course relationship."""
        with app.app_context():
            topic = CourseTopic(
                course_id=test_course.id,
                name='Test Topic',
                order_index=1
            )
            db_session.add(topic)
            db_session.commit()
            
            assert topic.course is not None
            assert topic.course.id == test_course.id
    
    def test_course_has_multiple_topics(self, app, db_session, test_course):
        """Test course can have multiple topics."""
        with app.app_context():
            for i in range(3):
                topic = CourseTopic(
                    course_id=test_course.id,
                    name=f'Topic {i}',
                    order_index=i
                )
                db_session.add(topic)
            db_session.commit()
            
            course = Course.query.get(test_course.id)
            assert course.topics.count() >= 3
    
    def test_topic_ordering(self, app, db_session, test_course):
        """Test topic ordering by order_index."""
        with app.app_context():
            topics_data = [
                ('Topic C', 3),
                ('Topic A', 1),
                ('Topic B', 2),
            ]
            
            for name, order in topics_data:
                topic = CourseTopic(
                    course_id=test_course.id,
                    name=name,
                    order_index=order
                )
                db_session.add(topic)
            db_session.commit()
            
            course = Course.query.get(test_course.id)
            ordered_topics = course.topics.order_by(CourseTopic.order_index).all()
            
            if len(ordered_topics) >= 3:
                assert ordered_topics[0].order_index <= ordered_topics[1].order_index


class TestModelValidation:
    """Tests for model validation and constraints."""
    
    def test_quiz_requires_student(self, app, db_session):
        """Test that quiz requires a student_id."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                difficulty='medium'
            )
            db_session.add(quiz)
            
            with pytest.raises(Exception):
                db_session.commit()
            db_session.rollback()
    
    def test_question_requires_quiz(self, app, db_session):
        """Test that question requires a quiz_id."""
        with app.app_context():
            question = AIQuestion(
                question_text='Orphan question?',
                question_type='short_answer',
                correct_answer='test'
            )
            db_session.add(question)
            
            with pytest.raises(Exception):
                db_session.commit()
            db_session.rollback()
    
    def test_question_requires_text(self, app, db_session, test_user):
        """Test that question requires question_text."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                student_id=test_user.id,
                difficulty='medium'
            )
            db_session.add(quiz)
            db_session.commit()
            
            question = AIQuestion(
                quiz_id=quiz.id,
                question_type='short_answer',
                correct_answer='test'
            )
            db_session.add(question)
            
            with pytest.raises(Exception):
                db_session.commit()
            db_session.rollback()
    
    def test_topic_requires_course(self, app, db_session):
        """Test that topic requires a course_id."""
        with app.app_context():
            topic = CourseTopic(
                name='Orphan Topic',
                order_index=1
            )
            db_session.add(topic)
            
            with pytest.raises(Exception):
                db_session.commit()
            db_session.rollback()
    
    def test_topic_requires_name(self, app, db_session, test_course):
        """Test that topic requires a name."""
        with app.app_context():
            topic = CourseTopic(
                course_id=test_course.id,
                order_index=1
            )
            db_session.add(topic)
            
            with pytest.raises(Exception):
                db_session.commit()
            db_session.rollback()


class TestCascadeDelete:
    """Tests for cascade delete behavior."""
    
    def test_delete_quiz_deletes_questions(self, app, db_session, test_user):
        """Test that deleting a quiz deletes its questions."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                id='cascade-test-quiz',
                student_id=test_user.id,
                difficulty='medium'
            )
            db_session.add(quiz)
            db_session.commit()
            
            for i in range(3):
                question = AIQuestion(
                    quiz_id='cascade-test-quiz',
                    question_text=f'Question {i}',
                    question_type='short_answer',
                    correct_answer='test'
                )
                db_session.add(question)
            db_session.commit()
            
            # Verify questions exist
            q_count_before = AIQuestion.query.filter_by(quiz_id='cascade-test-quiz').count()
            assert q_count_before == 3
            
            # Delete quiz
            db_session.delete(quiz)
            db_session.commit()
            
            # Verify questions deleted
            q_count_after = AIQuestion.query.filter_by(quiz_id='cascade-test-quiz').count()
            assert q_count_after == 0


class TestModelEdgeCases:
    """Tests for edge cases in model handling."""
    
    def test_empty_options_json(self, app, db_session, test_user):
        """Test handling of empty options JSON."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                student_id=test_user.id,
                difficulty='medium'
            )
            db_session.add(quiz)
            db_session.commit()
            
            question = AIQuestion(
                quiz_id=quiz.id,
                question_text='Short answer?',
                question_type='short_answer',
                options=json.dumps([]),
                correct_answer='answer'
            )
            db_session.add(question)
            db_session.commit()
            
            q_dict = question.to_dict()
            assert q_dict['options'] == []
    
    def test_null_options(self, app, db_session, test_user):
        """Test handling of null options."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                student_id=test_user.id,
                difficulty='medium'
            )
            db_session.add(quiz)
            db_session.commit()
            
            question = AIQuestion(
                quiz_id=quiz.id,
                question_text='Short answer?',
                question_type='short_answer',
                options=None,
                correct_answer='answer'
            )
            db_session.add(question)
            db_session.commit()
            
            q_dict = question.to_dict()
            assert q_dict['options'] == []
    
    def test_long_question_text(self, app, db_session, test_user):
        """Test handling of very long question text."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                student_id=test_user.id,
                difficulty='medium'
            )
            db_session.add(quiz)
            db_session.commit()
            
            long_text = "This is a very long question. " * 100
            question = AIQuestion(
                quiz_id=quiz.id,
                question_text=long_text,
                question_type='short_answer',
                correct_answer='answer'
            )
            db_session.add(question)
            db_session.commit()
            
            assert len(question.question_text) == len(long_text)
    
    def test_special_characters_in_text(self, app, db_session, test_user):
        """Test handling of special characters."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                student_id=test_user.id,
                difficulty='medium'
            )
            db_session.add(quiz)
            db_session.commit()
            
            special_text = "What is <script>alert('xss')</script>? & \"quotes\" 'apostrophes'"
            question = AIQuestion(
                quiz_id=quiz.id,
                question_text=special_text,
                question_type='short_answer',
                correct_answer='safe'
            )
            db_session.add(question)
            db_session.commit()
            
            retrieved = AIQuestion.query.get(question.id)
            assert retrieved.question_text == special_text
    
    def test_unicode_in_content(self, app, db_session, test_user):
        """Test handling of unicode characters."""
        with app.app_context():
            quiz = AIGeneratedQuiz(
                student_id=test_user.id,
                difficulty='medium'
            )
            db_session.add(quiz)
            db_session.commit()
            
            unicode_text = "What is 机器学习? Explain émojis: 🤖🧠"
            question = AIQuestion(
                quiz_id=quiz.id,
                question_text=unicode_text,
                question_type='short_answer',
                correct_answer='Machine learning'
            )
            db_session.add(question)
            db_session.commit()
            
            retrieved = AIQuestion.query.get(question.id)
            assert retrieved.question_text == unicode_text
