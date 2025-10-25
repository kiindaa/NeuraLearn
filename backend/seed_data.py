from flask import Flask
from flask_migrate import Migrate, upgrade
from app import create_app, db
from app.models import User, Course, Lesson, Quiz, Question, Enrollment, Progress
from datetime import datetime, timedelta
import uuid

def create_sample_data():
    """Create sample data for development and testing"""
    
    # Create sample users
    users = [
        User(
            id=str(uuid.uuid4()),
            email='student@neuralearn.com',
            first_name='John',
            last_name='Student',
            role='student'
        ),
        User(
            id=str(uuid.uuid4()),
            email='instructor@neuralearn.com',
            first_name='Dr. Sarah',
            last_name='Chen',
            role='instructor'
        ),
        User(
            id=str(uuid.uuid4()),
            email='admin@neuralearn.com',
            first_name='Admin',
            last_name='User',
            role='admin'
        )
    ]
    
    # Set passwords
    for user in users:
        user.set_password('password123')
        db.session.add(user)
    
    db.session.flush()  # Get user IDs
    
    # Create sample courses
    courses = [
        Course(
            id=str(uuid.uuid4()),
            title='Introduction to Machine Learning',
            description='Learn the fundamentals of machine learning, including supervised and unsupervised learning, neural networks, and deep learning.',
            instructor_id=users[1].id,
            difficulty='beginner',
            category='Machine Learning',
            duration=1200,  # 20 hours
            is_published=True
        ),
        Course(
            id=str(uuid.uuid4()),
            title='Web Development Fundamentals',
            description='Master the basics of web development including HTML, CSS, JavaScript, and modern frameworks.',
            instructor_id=users[1].id,
            difficulty='beginner',
            category='Web Development',
            duration=1800,  # 30 hours
            is_published=True
        ),
        Course(
            id=str(uuid.uuid4()),
            title='Data Structures & Algorithms',
            description='Learn essential data structures and algorithms for efficient problem-solving and coding interviews.',
            instructor_id=users[1].id,
            difficulty='intermediate',
            category='Computer Science',
            duration=1500,  # 25 hours
            is_published=True
        )
    ]
    
    for course in courses:
        db.session.add(course)
    
    db.session.flush()  # Get course IDs
    
    # Create sample lessons for each course
    lessons_data = [
        # Machine Learning Course
        {
            'course_id': courses[0].id,
            'lessons': [
                {'title': 'Introduction to Machine Learning', 'description': 'Overview of ML concepts', 'content': 'Machine learning is a subset of artificial intelligence...', 'duration': 45, 'order': 1},
                {'title': 'Types of Machine Learning', 'description': 'Supervised, unsupervised, and reinforcement learning', 'content': 'There are three main types of machine learning...', 'duration': 60, 'order': 2},
                {'title': 'Supervised Learning Basics', 'description': 'Introduction to supervised learning algorithms', 'content': 'Supervised learning uses labeled training data...', 'duration': 75, 'order': 3},
                {'title': 'Linear Regression', 'description': 'Understanding linear regression', 'content': 'Linear regression is a fundamental algorithm...', 'duration': 90, 'order': 4},
                {'title': 'Neural Networks Basics', 'description': 'Introduction to neural networks', 'content': 'Neural networks are inspired by biological neurons...', 'duration': 120, 'order': 5},
                {'title': 'Backpropagation', 'description': 'Learning about backpropagation algorithm', 'content': 'Backpropagation is used to train neural networks...', 'duration': 90, 'order': 6}
            ]
        },
        # Web Development Course
        {
            'course_id': courses[1].id,
            'lessons': [
                {'title': 'HTML Fundamentals', 'description': 'Learn HTML basics', 'content': 'HTML is the foundation of web development...', 'duration': 60, 'order': 1},
                {'title': 'CSS Styling', 'description': 'Master CSS for beautiful designs', 'content': 'CSS allows you to style your HTML elements...', 'duration': 90, 'order': 2},
                {'title': 'JavaScript Basics', 'description': 'Introduction to JavaScript', 'content': 'JavaScript adds interactivity to web pages...', 'duration': 120, 'order': 3},
                {'title': 'React Fundamentals', 'description': 'Learn React library', 'content': 'React is a popular JavaScript library...', 'duration': 150, 'order': 4},
                {'title': 'React Hooks', 'description': 'Understanding React Hooks', 'content': 'React Hooks allow you to use state...', 'duration': 90, 'order': 5},
                {'title': 'JavaScript ES6 Features', 'description': 'Modern JavaScript features', 'content': 'ES6 introduced many new features...', 'duration': 75, 'order': 6}
            ]
        },
        # Data Structures Course
        {
            'course_id': courses[2].id,
            'lessons': [
                {'title': 'Arrays and Lists', 'description': 'Understanding arrays and linked lists', 'content': 'Arrays are fundamental data structures...', 'duration': 60, 'order': 1},
                {'title': 'Stacks and Queues', 'description': 'Learn stack and queue data structures', 'content': 'Stacks follow LIFO principle...', 'duration': 75, 'order': 2},
                {'title': 'Trees and Binary Trees', 'description': 'Introduction to tree structures', 'content': 'Trees are hierarchical data structures...', 'duration': 90, 'order': 3},
                {'title': 'Tree Traversal', 'description': 'Different ways to traverse trees', 'content': 'Tree traversal methods include...', 'duration': 60, 'order': 4},
                {'title': 'Graph Algorithms', 'description': 'Understanding graph algorithms', 'content': 'Graphs are collections of nodes...', 'duration': 120, 'order': 5}
            ]
        }
    ]
    
    for course_data in lessons_data:
        for lesson_data in course_data['lessons']:
            lesson = Lesson(
                id=str(uuid.uuid4()),
                title=lesson_data['title'],
                description=lesson_data['description'],
                content=lesson_data['content'],
                duration=lesson_data['duration'],
                order=lesson_data['order'],
                course_id=course_data['course_id']
            )
            db.session.add(lesson)
    
    # Create sample quizzes
    quizzes = [
        Quiz(
            id=str(uuid.uuid4()),
            title='Supervised Learning',
            description='Test your knowledge of supervised learning concepts',
            course_id=courses[0].id,
            scheduled_at=datetime.utcnow() + timedelta(days=1),
            duration=30,
            difficulty='medium',
            is_ai_generated=False
        ),
        Quiz(
            id=str(uuid.uuid4()),
            title='React Hooks',
            description='Quiz on React Hooks and modern React patterns',
            course_id=courses[1].id,
            scheduled_at=datetime.utcnow() + timedelta(days=2),
            duration=25,
            difficulty='medium',
            is_ai_generated=False
        ),
        Quiz(
            id=str(uuid.uuid4()),
            title='Tree Traversal',
            description='Test your understanding of tree traversal algorithms',
            course_id=courses[2].id,
            scheduled_at=datetime.utcnow() + timedelta(days=3),
            duration=20,
            difficulty='hard',
            is_ai_generated=False
        )
    ]
    
    for quiz in quizzes:
        db.session.add(quiz)
    
    db.session.flush()  # Get quiz IDs
    
    # Create sample questions for quizzes
    questions_data = [
        # Supervised Learning Quiz
        {
            'quiz_id': quizzes[0].id,
            'questions': [
                {
                    'text': 'What is supervised learning?',
                    'type': 'multiple_choice',
                    'options': ['Learning with labeled data', 'Learning without labels', 'Learning from rewards', 'Learning from unlabeled data'],
                    'correct_answer': 'Learning with labeled data',
                    'explanation': 'Supervised learning uses labeled training data to learn patterns.',
                    'difficulty': 'easy',
                    'points': 1
                },
                {
                    'text': 'Which algorithm is commonly used for classification?',
                    'type': 'multiple_choice',
                    'options': ['Linear Regression', 'Logistic Regression', 'K-Means', 'DBSCAN'],
                    'correct_answer': 'Logistic Regression',
                    'explanation': 'Logistic regression is designed for classification tasks.',
                    'difficulty': 'medium',
                    'points': 2
                },
                {
                    'text': 'Explain the difference between overfitting and underfitting.',
                    'type': 'short_answer',
                    'correct_answer': 'Overfitting occurs when a model learns the training data too well and performs poorly on new data, while underfitting occurs when a model is too simple to capture the underlying patterns.',
                    'explanation': 'Both concepts relate to model complexity and generalization.',
                    'difficulty': 'hard',
                    'points': 3
                }
            ]
        },
        # React Hooks Quiz
        {
            'quiz_id': quizzes[1].id,
            'questions': [
                {
                    'text': 'What is the purpose of useState hook?',
                    'type': 'multiple_choice',
                    'options': ['To manage side effects', 'To manage state', 'To perform cleanup', 'To handle events'],
                    'correct_answer': 'To manage state',
                    'explanation': 'useState is used to add state to functional components.',
                    'difficulty': 'easy',
                    'points': 1
                },
                {
                    'text': 'When should you use useEffect hook?',
                    'type': 'short_answer',
                    'correct_answer': 'To perform side effects in functional components, such as data fetching, subscriptions, or manually changing the DOM.',
                    'explanation': 'useEffect is the React hook for side effects.',
                    'difficulty': 'medium',
                    'points': 2
                }
            ]
        },
        # Tree Traversal Quiz
        {
            'quiz_id': quizzes[2].id,
            'questions': [
                {
                    'text': 'What is the time complexity of inorder traversal?',
                    'type': 'multiple_choice',
                    'options': ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
                    'correct_answer': 'O(n)',
                    'explanation': 'Inorder traversal visits each node exactly once.',
                    'difficulty': 'medium',
                    'points': 2
                },
                {
                    'text': 'Describe the difference between depth-first and breadth-first traversal.',
                    'type': 'short_answer',
                    'correct_answer': 'Depth-first traversal explores as far as possible along each branch before backtracking, while breadth-first traversal explores all nodes at the current depth before moving to the next level.',
                    'explanation': 'The key difference is the order in which nodes are visited.',
                    'difficulty': 'hard',
                    'points': 3
                }
            ]
        }
    ]
    
    for quiz_data in questions_data:
        for question_data in quiz_data['questions']:
            question = Question(
                id=str(uuid.uuid4()),
                text=question_data['text'],
                type=question_data['type'],
                options=question_data.get('options'),
                correct_answer=question_data['correct_answer'],
                explanation=question_data['explanation'],
                difficulty=question_data['difficulty'],
                points=question_data['points'],
                quiz_id=quiz_data['quiz_id']
            )
            db.session.add(question)
    
    # Create sample enrollments
    enrollments = [
        Enrollment(
            id=str(uuid.uuid4()),
            user_id=users[0].id,  # Student
            course_id=courses[0].id,  # ML Course
            enrolled_at=datetime.utcnow() - timedelta(days=30)
        ),
        Enrollment(
            id=str(uuid.uuid4()),
            user_id=users[0].id,  # Student
            course_id=courses[1].id,  # Web Dev Course
            enrolled_at=datetime.utcnow() - timedelta(days=15)
        )
    ]
    
    for enrollment in enrollments:
        db.session.add(enrollment)
    
    # Create sample progress
    progress_records = [
        Progress(
            id=str(uuid.uuid4()),
            user_id=users[0].id,
            course_id=courses[0].id,
            completed_lessons=13,
            total_lessons=20,
            completed_quizzes=2,
            total_quizzes=3,
            average_score=87.5,
            last_accessed_at=datetime.utcnow() - timedelta(hours=2)
        ),
        Progress(
            id=str(uuid.uuid4()),
            user_id=users[0].id,
            course_id=courses[1].id,
            completed_lessons=8,
            total_lessons=20,
            completed_quizzes=1,
            total_quizzes=2,
            average_score=92.0,
            last_accessed_at=datetime.utcnow() - timedelta(hours=1)
        )
    ]
    
    for progress in progress_records:
        db.session.add(progress)
    
    # Commit all changes
    db.session.commit()
    print("Sample data created successfully!")

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        create_sample_data()
