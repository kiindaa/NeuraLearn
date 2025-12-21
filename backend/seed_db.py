import os
import sys
import uuid
import json
from datetime import datetime, timedelta
from faker import Faker
from werkzeug.security import generate_password_hash
from app import create_app, db
from app.models import User, Course, Lesson, Quiz, Question, QuizAttempt, QuizAnswer, Enrollment, Progress, CourseTopic, AIQuestion, AIGeneratedQuiz

def seed_db():
    """Main function to seed the database with sample data."""
    return create_sample_data()

def create_sample_data():
    # Set environment to development to use SQLite
    os.environ['FLASK_ENV'] = 'development'
    
    # Create app with development config
    app = create_app()
    
    with app.app_context():
        try:
            fake = Faker()
            
            # Create a test instructor if not exists
            instructor = User.query.filter_by(email='instructor@example.com').first()
            if not instructor:
                from werkzeug.security import generate_password_hash
                instructor = User(
                    id=str(uuid.uuid4()),
                    email='instructor@example.com',
                    password_hash=generate_password_hash('instructor123'),
                    first_name='AI',
                    last_name='Instructor',
                    role='instructor'
                )
                db.session.add(instructor)
                db.session.commit()
                print("✅ Created instructor: instructor@example.com / instructor123")
            
            # Create a test course if not exists
            course = Course.query.first()
            if not course:
                course = Course(
                    id=str(uuid.uuid4()),
                    title='Introduction to AI and Machine Learning',
                    description='Learn the fundamentals of AI and Machine Learning',
                    instructor_id=instructor.id,
                    price=99.99,
                    duration_weeks=12,
                    is_published=True,
                    created_at=datetime.utcnow()
                )
                db.session.add(course)
                db.session.commit()
                print("✅ Created sample course")
            
            # Create course topics
            topics = [
                'Introduction to AI',
                'Machine Learning Basics',
                'Neural Networks',
                'Deep Learning',
                'Natural Language Processing',
                'Computer Vision',
                'Reinforcement Learning',
                'AI Ethics and Future'
            ]
            
            for i, topic_name in enumerate(topics, 1):
                topic = CourseTopic.query.filter_by(name=topic_name).first()
                if not topic:
                    topic = CourseTopic(
                        id=str(uuid.uuid4()),
                        course_id=course.id,
                        name=topic_name,
                        description=f"Learn about {topic_name}",
                        order_index=i
                    )
                    db.session.add(topic)
            
            db.session.commit()
            print(f"✅ Created {len(topics)} course topics")
            
            # Create a test student if not exists
            student = User.query.filter_by(email='student@example.com').first()
            if not student:
                student = User(
                    id=str(uuid.uuid4()),
                    email='student@example.com',
                    password_hash=generate_password_hash('student123'),
                    first_name='Test',
                    last_name='Student',
                    role='student'
                )
                db.session.add(student)
                db.session.commit()
                print("✅ Created student: student@example.com / student123")
            
            # Create enrollment if it doesn't exist
            enrollment = Enrollment.query.filter_by(user_id=student.id, course_id=course.id).first()
            if not enrollment:
                enrollment = Enrollment(
                    id=str(uuid.uuid4()),
                    user_id=student.id,
                    course_id=course.id,
                    enrolled_at=datetime.utcnow() - timedelta(days=7),
                    completion_status='in_progress'
                )
                db.session.add(enrollment)
                db.session.commit()
                print("✅ Enrolled student in the course")
            
            # Create sample questions
            ml_quiz = Quiz(
                id=str(uuid.uuid4()),
                title="Machine Learning Fundamentals",
                description="Test your knowledge of basic ML concepts",
                course_id=course.id,
                difficulty='medium',
                is_ai_generated=False
            )
            db.session.add(ml_quiz)

            prog_quiz = Quiz(
                id=str(uuid.uuid4()),
                title="Programming Concepts",
                description="Test your programming knowledge",
                course_id=course.id,
                difficulty='easy',
                is_ai_generated=False
            )
            db.session.add(prog_quiz)

            ds_quiz = Quiz(
                id=str(uuid.uuid4()),
                title="Data Science Essentials",
                description="Test your data science knowledge",
                course_id=course.id,
                difficulty='hard',
                is_ai_generated=False
            )
            db.session.add(ds_quiz)
            db.session.commit()

            # Machine Learning Questions
            ml_questions = [
                {
                    'text': 'What is the main goal of supervised learning?',
                    'type': 'multiple_choice',
                    'options': ['To find patterns in unlabeled data', 'To predict outputs from inputs', 'To reduce data dimensions', 'To visualize data'],
                    'correct_answer': 'To predict outputs from inputs',
                    'explanation': 'Supervised learning aims to learn a mapping from inputs to outputs based on example input-output pairs.',
                    'difficulty': 'easy'
                },
                {
                    'text': 'Explain the difference between classification and regression.',
                    'type': 'short_answer',
                    'correct_answer': 'Classification predicts discrete class labels, while regression predicts continuous values.',
                    'explanation': 'Classification deals with predicting categories, while regression predicts numerical values.',
                    'difficulty': 'medium'
                },
                {
                    'text': 'What is the purpose of the activation function in a neural network?',
                    'type': 'multiple_choice',
                    'options': ['To normalize the input data', 'To introduce non-linearity', 'To reduce overfitting', 'To speed up training'],
                    'correct_answer': 'To introduce non-linearity',
                    'explanation': 'Activation functions introduce non-linear properties to the network, allowing it to learn complex patterns.',
                    'difficulty': 'medium'
                },
                {
                    'text': 'Describe the bias-variance tradeoff in machine learning.',
                    'type': 'short_answer',
                    'correct_answer': 'The bias-variance tradeoff is the balance between underfitting (high bias) and overfitting (high variance) when training a model.',
                    'explanation': 'Reducing bias increases variance and vice versa, requiring a balance for optimal model performance.',
                    'difficulty': 'hard'
                },
                {
                    'text': 'What is the primary advantage of using a decision tree algorithm?',
                    'type': 'multiple_choice',
                    'options': ['High accuracy on all datasets', 'Easy to interpret and explain', 'Works only with numerical data', 'Requires no parameter tuning'],
                    'correct_answer': 'Easy to interpret and explain',
                    'explanation': 'Decision trees are intuitive and can be visualized, making them easy to understand and explain.',
                    'difficulty': 'easy'
                },
                {
                    'text': 'What is the purpose of the learning rate in gradient descent?',
                    'type': 'multiple_choice',
                    'options': [
                        'To control the step size during optimization',
                        'To determine the number of training epochs',
                        'To set the initial weights of the model',
                        'To normalize the input data'
                    ],
                    'correct_answer': 'To control the step size during optimization',
                    'explanation': 'The learning rate determines how big of a step we take towards the minimum of the loss function.',
                    'difficulty': 'medium',
                    'order_index': 2
                },
                {
                    'text': 'Explain the concept of transfer learning and when it is particularly useful.',
                    'type': 'short_answer',
                    'correct_answer': 'Transfer learning is a technique where a model developed for one task is reused as the starting point for a model on a second task. It is particularly useful when the target task has limited labeled data available.',
                    'explanation': 'Transfer learning leverages knowledge from a source task to improve learning in a related target task.',
                    'difficulty': 'medium',
                    'order_index': 3
                },
                {
                    'text': 'What is the main advantage of using a convolutional neural network (CNN) for image processing?',
                    'type': 'multiple_choice',
                    'options': ['Faster training time', 'Automatic feature extraction', 'Works with any data type', 'Requires less data'],
                    'correct_answer': 'Automatic feature extraction',
                    'explanation': 'CNNs can automatically and adaptively learn spatial hierarchies of features from input images.',
                    'difficulty': 'medium',
                    'order_index': 4
                },
                {
                    'text': 'What is the vanishing gradient problem in deep learning?',
                    'type': 'multiple_choice',
                    'options': [
                        'When gradients become too large during training',
                        'When gradients become too small to effectively update weights',
                        'When the model overfits to the training data',
                        'When the learning rate is too high'
                    ],
                    'correct_answer': 'When gradients become too small to effectively update weights',
                    'explanation': 'This is particularly problematic in deep networks where gradients can become extremely small during backpropagation.',
                    'difficulty': 'hard',
                    'order_index': 5
                },
                {
                    'text': 'Explain the difference between batch, mini-batch, and stochastic gradient descent.',
                    'type': 'short_answer',
                    'correct_answer': 'Batch GD uses the entire training set to compute the gradient, mini-batch GD uses small random subsets, and stochastic GD uses a single random sample. Mini-batch offers a good balance between computational efficiency and convergence stability.',
                    'explanation': 'The choice affects both the training speed and the quality of convergence.',
                    'difficulty': 'hard',
                    'order_index': 6
                },
                {
                    'text': 'What is the purpose of dropout in neural networks?',
                    'type': 'multiple_choice',
                    'options': [
                        'To speed up training',
                        'To reduce overfitting',
                        'To increase model capacity',
                        'To normalize the input data'
                    ],
                    'correct_answer': 'To reduce overfitting',
                    'explanation': 'Dropout randomly sets a fraction of input units to 0 during training, which helps prevent overfitting.',
                    'difficulty': 'medium',
                    'order_index': 7
                },
                {
                    'text': 'What is the difference between precision and recall?',
                    'type': 'multiple_choice',
                    'options': [
                        'Precision measures true positives among predicted positives, recall measures true positives among actual positives',
                        'They are the same metric',
                        'Precision is for regression, recall is for classification',
                        'Recall is always better than precision'
                    ],
                    'correct_answer': 'Precision measures true positives among predicted positives, recall measures true positives among actual positives',
                    'explanation': 'Precision = TP/(TP+FP), Recall = TP/(TP+FN)',
                    'difficulty': 'medium',
                    'order_index': 8
                },
                {
                    'text': 'Explain the concept of word embeddings in NLP.',
                    'type': 'short_answer',
                    'correct_answer': 'Word embeddings are dense vector representations of words where similar words have similar vector representations. They capture semantic and syntactic relationships between words.',
                    'explanation': 'Popular word embedding techniques include Word2Vec, GloVe, and FastText.',
                    'difficulty': 'medium',
                    'order_index': 9
                },
                {
                    'text': 'What is the main advantage of using attention mechanisms in sequence models?',
                    'type': 'multiple_choice',
                    'options': [
                        'They reduce the need for training data',
                        'They allow the model to focus on relevant parts of the input',
                        'They eliminate the need for backpropagation',
                        'They make the model smaller in size'
                    ],
                    'correct_answer': 'They allow the model to focus on relevant parts of the input',
                    'explanation': 'Attention mechanisms help models focus on the most relevant parts of the input when making predictions.',
                    'difficulty': 'hard',
                    'order_index': 10
                }
            ]

            # Programming Questions (10 questions)
            prog_questions = [
                {
                    'text': 'What is the time complexity of accessing an element in an array by index?',
                    'type': 'multiple_choice',
                    'options': ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
                    'correct_answer': 'O(1)',
                    'explanation': 'Array access by index is a constant time operation.',
                    'difficulty': 'easy',
                    'order_index': 1
                },
                {
                    'text': 'Explain the concept of recursion in programming and provide a simple example.',
                    'type': 'short_answer',
                    'correct_answer': 'Recursion is when a function calls itself to solve smaller instances of the same problem. Example: function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }',
                    'explanation': 'Recursion requires a base case to terminate the recursive calls.',
                    'difficulty': 'medium',
                    'order_index': 2
                },
                {
                    'text': 'What is the difference between == and === in JavaScript?',
                    'type': 'multiple_choice',
                    'options': ['== compares values, === compares values and types', '== compares objects, === compares primitives', 'No difference', '== is for assignment, === is for comparison'],
                    'correct_answer': '== compares values, === compares values and types',
                    'explanation': '== performs type coercion, while === is a strict equality check.',
                    'difficulty': 'easy',
                    'order_index': 3
                },
                {
                    'text': 'What is a closure in Python and how is it useful?',
                    'type': 'short_answer',
                    'correct_answer': 'A closure is a function object that remembers values in enclosing scopes. It is useful for data hiding, creating function factories, and implementing decorators.',
                    'explanation': 'Closures help in maintaining state between function calls.',
                    'difficulty': 'hard',
                    'order_index': 4
                },
                {
                    'text': 'What is the purpose of the virtual DOM in React?',
                    'type': 'multiple_choice',
                    'options': ['To improve security', 'To optimize rendering performance', 'To manage state', 'To handle routing'],
                    'correct_answer': 'To optimize rendering performance',
                    'explanation': 'The virtual DOM minimizes direct manipulation of the actual DOM, which is expensive.',
                    'difficulty': 'medium',
                    'order_index': 5
                },
                {
                    'text': 'Explain the concept of dependency injection in software development with an example.',
                    'type': 'short_answer',
                    'correct_answer': 'Dependency injection is a design pattern where a class receives its dependencies from external sources. Example: Instead of creating a database connection inside a UserService, you would inject it through the constructor: `new UserService(database)`.',
                    'explanation': 'This makes the code more modular, testable, and maintainable.',
                    'difficulty': 'hard',
                    'order_index': 6
                },
                {
                    'text': 'What is the difference between a stack and a queue?',
                    'type': 'multiple_choice',
                    'options': ['Stack is LIFO, queue is FIFO', 'Stack is FIFO, queue is LIFO', 'Both are LIFO', 'Both are FIFO'],
                    'correct_answer': 'Stack is LIFO, queue is FIFO',
                    'explanation': 'Stack: Last In First Out, Queue: First In First Out.',
                    'difficulty': 'easy',
                    'order_index': 7
                },
                {
                    'text': 'What is the purpose of the \'yield\' keyword in Python and how does it differ from \'return\'?',
                    'type': 'short_answer',
                    'correct_answer': 'The yield keyword is used to create generator functions, which can be paused and resumed. Unlike return, yield allows the function to maintain its state between calls, enabling memory-efficient iteration over large datasets.',
                    'explanation': 'Generators are memory efficient for large datasets as they generate values on the fly.',
                    'difficulty': 'medium',
                    'order_index': 8
                },
                {
                    'text': 'What is the time complexity of a binary search algorithm?',
                    'type': 'multiple_choice',
                    'options': ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
                    'correct_answer': 'O(log n)',
                    'explanation': 'Binary search halves the search space with each comparison.',
                    'difficulty': 'medium',
                    'order_index': 9
                },
                {
                    'text': 'Explain the concept of immutability in programming and its benefits.',
                    'type': 'short_answer',
                    'correct_answer': 'Immutability means that once an object is created, its state cannot be modified. Any modification creates a new object. Benefits include thread safety, easier debugging, and predictable state management.',
                    'explanation': 'Immutability is a core principle in functional programming.',
                    'difficulty': 'medium',
                    'order_index': 10
                }
            ]

            # Data Science Questions (10 questions)
            ds_questions = [
                {
                    'text': 'What is the difference between a bar chart and a histogram?',
                    'type': 'multiple_choice',
                    'options': ['No difference', 'Bar charts show categorical data, histograms show distributions', 'Histograms show categorical data, bar charts show distributions', 'They are the same but with different names'],
                    'correct_answer': 'Bar charts show categorical data, histograms show distributions',
                    'explanation': 'Bar charts compare different categories, while histograms show the distribution of a single variable.',
                    'difficulty': 'easy'
                },
                {
                    'text': 'Explain the concept of feature scaling and why it\'s important in machine learning.',
                    'type': 'short_answer',
                    'correct_answer': 'Feature scaling is the process of normalizing the range of features in a dataset. It\'s important because many machine learning algorithms perform better when numerical input variables are on the same scale.',
                    'explanation': 'Algorithms that use distance measures or gradient descent are particularly sensitive to feature scales.',
                    'difficulty': 'medium'
                },
                {
                    'text': 'What is the purpose of a confusion matrix?',
                    'type': 'multiple_choice',
                    'options': ['To visualize model performance', 'To store training data', 'To preprocess features', 'To split data into training and test sets'],
                    'correct_answer': 'To visualize model performance',
                    'explanation': 'A confusion matrix shows the counts of true positive, true negative, false positive, and false negative predictions.',
                    'difficulty': 'medium'
                },
                {
                    'text': 'What is the difference between correlation and causation?',
                    'type': 'short_answer',
                    'correct_answer': 'Correlation means that two variables move together, while causation means that one variable directly affects the other. Correlation does not imply causation.',
                    'explanation': 'Just because two variables are correlated doesn\'t mean one causes the other.',
                    'difficulty': 'easy'
                },
                {
                    'text': 'What is the purpose of A/B testing?',
                    'type': 'multiple_choice',
                    'options': ['To compare two versions of something', 'To clean data', 'To visualize data', 'To train machine learning models'],
                    'correct_answer': 'To compare two versions of something',
                    'explanation': 'A/B testing is used to compare two versions to determine which one performs better.',
                    'difficulty': 'easy'
                },
                {
                    'text': 'Explain the concept of p-value in hypothesis testing.',
                    'type': 'short_answer',
                    'correct_answer': 'The p-value is the probability of obtaining test results at least as extreme as the observed results, assuming that the null hypothesis is true. A small p-value (typically ≤ 0.05) indicates strong evidence against the null hypothesis.',
                    'explanation': 'Lower p-values provide stronger evidence against the null hypothesis.',
                    'difficulty': 'hard'
                },
                {
                    'text': 'What is the difference between supervised and unsupervised learning?',
                    'type': 'multiple_choice',
                    'options': ['Supervised uses labeled data, unsupervised uses unlabeled data', 'Supervised is faster than unsupervised', 'Unsupervised is more accurate than supervised', 'There is no difference'],
                    'correct_answer': 'Supervised uses labeled data, unsupervised uses unlabeled data',
                    'explanation': 'Supervised learning requires input-output pairs, while unsupervised learning finds patterns in input data without explicit outputs.',
                    'difficulty': 'easy'
                },
                {
                    'text': 'What is the purpose of cross-validation?',
                    'type': 'short_answer',
                    'correct_answer': 'Cross-validation is a technique to evaluate machine learning models by training on subsets of the available data and validating on the remaining data. It helps prevent overfitting and provides a better estimate of model performance.',
                    'explanation': 'Common types include k-fold and leave-one-out cross-validation.',
                    'difficulty': 'medium'
                },
                {
                    'text': 'What is the central limit theorem?',
                    'type': 'multiple_choice',
                    'options': ['All data is normally distributed', 'The mean of a large sample is normally distributed', 'The sum of random variables is normally distributed', 'The sample mean approaches the population mean as sample size increases'],
                    'correct_answer': 'The mean of a large sample is normally distributed',
                    'explanation': 'The central limit theorem states that the sampling distribution of the mean of any independent, random variable will be normal or nearly normal, if the sample size is large enough.',
                    'difficulty': 'hard'
                },
                {
                    'text': 'Explain the concept of feature engineering in machine learning.',
                    'type': 'short_answer',
                    'correct_answer': 'Feature engineering is the process of using domain knowledge to create new features or modify existing ones to improve model performance. It involves techniques like creating interaction terms, handling missing values, encoding categorical variables, and scaling features.',
                    'explanation': 'Good features can significantly improve model performance, often more than the choice of the model itself.',
                    'difficulty': 'medium'
                }
            ]

            # Add questions to database
            for i, q in enumerate(ml_questions):
                question = Question(
                    id=str(uuid.uuid4()),
                    text=q['text'],
                    type=q['type'],
                    options=json.dumps(q['options']) if 'options' in q else None,
                    correct_answer=q['correct_answer'],
                    explanation=q.get('explanation', ''),
                    difficulty=q['difficulty'],
                    quiz_id=ml_quiz.id,
                    order_index=i+1
                )
                db.session.add(question)

            for i, q in enumerate(prog_questions):
                question = Question(
                    id=str(uuid.uuid4()),
                    text=q['text'],
                    type=q['type'],
                    options=json.dumps(q['options']) if 'options' in q else None,
                    correct_answer=q['correct_answer'],
                    explanation=q.get('explanation', ''),
                    difficulty=q['difficulty'],
                    quiz_id=prog_quiz.id,
                    order_index=i+1
                )
                db.session.add(question)

            for i, q in enumerate(ds_questions):
                question = Question(
                    id=str(uuid.uuid4()),
                    text=q['text'],
                    type=q['type'],
                    options=json.dumps(q['options']) if 'options' in q else None,
                    correct_answer=q['correct_answer'],
                    explanation=q.get('explanation', ''),
                    difficulty=q['difficulty'],
                    quiz_id=ds_quiz.id,
                    order_index=i+1
                )
                db.session.add(question)

            db.session.commit()
            print("✅ Added 30 sample questions (10 ML, 10 Programming, 10 Data Science)")
            print("✅ Database seeded successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Error seeding database: {str(e)}")
            db.session.rollback()
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    if seed_db():
        sys.exit(0)
    else:
        sys.exit(1)
