import os
import sys
import json
from datetime import datetime
from faker import Faker

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import CourseTopic, User, Course, AIQuestion, AIGeneratedQuiz

app = create_app()

def create_sample_topics():
    """Create sample course topics for testing."""
    print("Creating sample course topics...")
    
    # Get or create a course
    course = Course.query.first()
    if not course:
        print("No courses found. Please run the main seed script first.")
        return
    
    topics_data = [
        {
            "name": "Neural Networks",
            "description": "Fundamentals of artificial neural networks, backpropagation, and deep learning architectures.",
            "order_index": 1
        },
        {
            "name": "Supervised Learning",
            "description": "Algorithms that learn from labeled training data to make predictions.",
            "order_index": 2
        },
        {
            "name": "Unsupervised Learning",
            "description": "Algorithms that find patterns in unlabeled data, such as clustering and dimensionality reduction.",
            "order_index": 3
        },
        {
            "name": "Reinforcement Learning",
            "description": "Learning through interaction with an environment to maximize rewards.",
            "order_index": 4
        },
        {
            "name": "Natural Language Processing",
            "description": "Techniques for processing and analyzing human language data.",
            "order_index": 5
        },
        {
            "name": "Computer Vision",
            "description": "Algorithms for processing and understanding visual data.",
            "order_index": 6
        },
        {
            "name": "Model Evaluation",
            "description": "Techniques for evaluating and improving machine learning models.",
            "order_index": 7
        },
        {
            "name": "Deployment & Production",
            "description": "Best practices for deploying machine learning models in production.",
            "order_index": 8
        },
        {
            "name": "Ethics in AI",
            "description": "Ethical considerations and responsible AI development.",
            "order_index": 9
        },
        {
            "name": "Advanced Topics",
            "description": "Cutting-edge research and advanced techniques in machine learning.",
            "order_index": 10
        }
    ]
    
    for topic_data in topics_data:
        topic = CourseTopic(
            course_id=course.id,
            name=topic_data['name'],
            description=topic_data['description'],
            order_index=topic_data['order_index']
        )
        db.session.add(topic)
    
    db.session.commit()
    print(f"Created {len(topics_data)} course topics.")

def create_sample_ai_questions():
    """Create sample AI-generated questions for testing."""
    print("Creating sample AI questions...")
    
    # Get a student and a course topic
    student = User.query.filter_by(role='student').first()
    if not student:
        print("No student user found. Please create a student user first.")
        return
    
    topic = CourseTopic.query.first()
    if not topic:
        print("No course topics found. Please create topics first.")
        return
    
    # Create a sample quiz
    quiz = AIGeneratedQuiz(
        student_id=student.id,
        topic_ids=[topic.id],
        difficulty='medium',
        question_types=['multiple_choice', 'short_answer'],
        total_questions=5
    )
    db.session.add(quiz)
    db.session.flush()  # Get the quiz ID
    
    # Sample questions
    questions = [
        {
            "quiz_id": quiz.id,
            "question_text": "What is the primary purpose of backpropagation in neural networks?",
            "question_type": "multiple_choice",
            "options": [
                "To initialize the weights of the network",
                "To update the weights based on the error gradient",
                "To normalize the input data",
                "To visualize the network architecture"
            ],
            "correct_answer": "To update the weights based on the error gradient",
            "explanation": "Backpropagation is used to calculate the gradient of the loss function with respect to each weight by the chain rule, allowing for efficient weight updates.",
            "is_correct": None,
            "answered_at": None
        },
        {
            "quiz_id": quiz.id,
            "question_text": "What is the time complexity of binary search?",
            "question_type": "short_answer",
            "options": [],
            "correct_answer": "O(log n)",
            "explanation": "Binary search divides the search space in half with each comparison, resulting in logarithmic time complexity.",
            "is_correct": None,
            "answered_at": None
        },
        {
            "quiz_id": quiz.id,
            "question_text": "In machine learning, what is the main advantage of using a validation set?",
            "question_type": "multiple_choice",
            "options": [
                "It increases the amount of training data",
                "It provides an unbiased evaluation of model performance",
                "It speeds up the training process",
                "It reduces the need for feature engineering"
            ],
            "correct_answer": "It provides an unbiased evaluation of model performance",
            "explanation": "A validation set is used to tune hyperparameters and evaluate model performance on unseen data, providing an unbiased estimate of how the model might perform on new data.",
            "is_correct": None,
            "answered_at": None
        },
        {
            "quiz_id": quiz.id,
            "question_text": "What is the difference between L1 and L2 regularization?",
            "question_type": "short_answer",
            "options": [],
            "correct_answer": "L1 uses absolute values and can produce sparse models, while L2 uses squared values and tends to distribute weights more evenly.",
            "explanation": "L1 regularization adds a penalty equal to the absolute value of the magnitude of coefficients, which can lead to some coefficients becoming exactly zero. L2 adds a penalty equal to the square of the magnitude of coefficients, which encourages smaller weights but rarely reduces them to zero.",
            "is_correct": None,
            "answered_at": None
        },
        {
            "quiz_id": quiz.id,
            "question_text": "True or False: Overfitting occurs when a model learns the training data too well, including noise and outliers, resulting in poor generalization to new data.",
            "question_type": "true_false",
            "options": ["True", "False"],
            "correct_answer": "True",
            "explanation": "Overfitting happens when a model captures noise in the training data as if it were a true pattern, leading to poor performance on new, unseen data.",
            "is_correct": None,
            "answered_at": None
        }
    ]
    
    for q_data in questions:
        question = AIQuestion(**q_data)
        db.session.add(question)
    
    db.session.commit()
    print(f"Created {len(questions)} sample AI questions in quiz {quiz.id}.")

if __name__ == '__main__':
    with app.app_context():
        print("Seeding AI data...")
        create_sample_topics()
        create_sample_ai_questions()
        print("AI data seeding complete!")
