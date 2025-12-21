import os
import sys
import json
import random
from typing import List, Dict, Any

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import CourseTopic, AIGeneratedQuiz, AIQuestion
from app.ai_service import QuizGenerator

app = create_app()
app.app_context().push()

def test_quiz_generation():
    """Test the quiz generation with different parameters."""
    print("\n=== Testing Quiz Generation ===")
    
    # Create a test course if it doesn't exist
    from app.models import Course
    test_course = Course.query.filter_by(title="Test Course").first()
    if not test_course:
        test_course = Course(
            title="Test Course",
            description="A test course for quiz generation",
            instructor_id=1  # Assuming user with ID 1 exists
        )
        db.session.add(test_course)
        db.session.commit()
    
    # Create test topics if they don't exist
    topics = ["Machine Learning", "Programming", "Data Science"]
    topic_objects = []
    for topic_name in topics:
        topic = CourseTopic.query.filter_by(name=topic_name).first()
        if not topic:
            topic = CourseTopic(
                name=topic_name,
                description=f"{topic_name} description",
                course_id=test_course.id
            )
            db.session.add(topic)
            db.session.commit()
        topic_objects.append(topic)
    
    test_cases = [
        {"difficulty": "easy", "num_questions": 3, "types": ["multiple_choice"]},
        {"difficulty": "medium", "num_questions": 4, "types": ["short_answer"]},
        {"difficulty": "hard", "num_questions": 5, "types": ["multiple_choice", "short_answer"]},
    ]
    
    generator = QuizGenerator()
    
    for i, test in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test}")
        print("-" * 50)
        
        # Select a random topic
        topic = random.choice(topic_objects)
        
        try:
            # Generate quiz
            result = generator.generate_quiz(
                student_id="test_user",
                topic_ids=[str(topic.id)],
                difficulty=test["difficulty"],
                question_types=test["types"],
                num_questions=test["num_questions"]
            )
            
            # Print results
            print(f"Generated {len(result.get('questions', []))} questions for {topic.name} ({test['difficulty']}):")
            for i, q in enumerate(result.get('questions', []), 1):
                print(f"  {i}. {q['question']} ({q.get('type', 'unknown')})")
                if 'options' in q:
                    print(f"     Options: {', '.join(q['options'])}")
            
            # Verify question count
            assert len(result.get('questions', [])) == test["num_questions"], \
                f"Expected {test['num_questions']} questions, got {len(result.get('questions', []))}"
                
            print("✓ Test passed")
            
        except Exception as e:
            print(f"✗ Test failed: {str(e)}")
            import traceback
            traceback.print_exc()

def test_variation():
    """Test that different quizzes have different questions."""
    print("\n=== Testing Question Variation ===")
    
    topic = CourseTopic.query.filter_by(name="Machine Learning").first()
    if not topic:
        print("Test topic not found")
        return
    
    generator = QuizGenerator()
    questions = []
    
    # Generate multiple quizzes and collect questions
    for i in range(3):
        result = generator.generate_quiz(
            student_id=f"test_user_{i}",
            topic_ids=[str(topic.id)],
            difficulty="medium",
            question_types=["multiple_choice"],
            num_questions=2
        )
        questions.extend([q['question'] for q in result.get('questions', [])])
    
    # Check for duplicates
    unique_questions = set(questions)
    print(f"Generated {len(questions)} total questions")
    print(f"Unique questions: {len(unique_questions)}")
    
    if len(unique_questions) < len(questions) * 0.8:  # Allow some overlap
        print("⚠ Warning: High number of duplicate questions")
    else:
        print("✓ Good question variation")

if __name__ == "__main__":
    print("Starting quiz generation tests...")
    
    try:
        # Run tests
        test_quiz_generation()
        test_variation()
        
        print("\nAll tests completed!")
    except Exception as e:
        print(f"Error running tests: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        # Clean up test data
        AIGeneratedQuiz.query.filter(AIGeneratedQuiz.student_id.like("test_user%")).delete()
        db.session.commit()
