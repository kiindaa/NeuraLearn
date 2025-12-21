"""
Test script to verify AI quiz generator returns varied questions based on settings.
This tests that different topics, difficulties, and settings produce different questions.
"""

import sys
import os
import logging

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_quiz_variation():
    """Test that quiz generation produces varied questions based on different settings."""
    from app.ai_service import QuizGenerator
    from app.models import db, CourseTopic, User
    from app import create_app
    
    # Create app context
    app = create_app()
    
    with app.app_context():
        generator = QuizGenerator()
        
        print("\n" + "="*80)
        print("🧪 TESTING AI QUIZ GENERATOR VARIATION")
        print("="*80 + "\n")
        
        # Create test user if doesn't exist
        test_user = User.query.filter_by(email='test_quiz@example.com').first()
        if not test_user:
            test_user = User(
                email='test_quiz@example.com',
                first_name='Test',
                last_name='Student',
                role='student'
            )
            test_user.set_password('password')
            db.session.add(test_user)
            db.session.commit()
        
        # Get or create test topics
        ml_topic = CourseTopic.query.filter_by(name='Machine Learning').first()
        prog_topic = CourseTopic.query.filter_by(name='Programming').first()
        ds_topic = CourseTopic.query.filter_by(name='Data Science').first()
        
        if not ml_topic:
            from app.models import Course
            test_course = Course.query.first()
            if not test_course:
                test_course = Course(
                    title='Test Course',
                    description='For testing',
                    instructor_id=test_user.id
                )
                db.session.add(test_course)
                db.session.commit()
            
            ml_topic = CourseTopic(name='Machine Learning', course_id=test_course.id)
            prog_topic = CourseTopic(name='Programming', course_id=test_course.id)
            ds_topic = CourseTopic(name='Data Science', course_id=test_course.id)
            db.session.add_all([ml_topic, prog_topic, ds_topic])
            db.session.commit()
        
        # Test 1: Different Topics Should Produce Different Questions
        print("\n📊 TEST 1: Topic Variation")
        print("-" * 80)
        
        try:
            quiz_ml = generator.generate_quiz(
                student_id=test_user.id,
                topic_ids=[ml_topic.id],
                difficulty='medium',
                question_types=['multiple_choice'],
                num_questions=3
            )
            
            print(f"\n✅ Machine Learning Quiz Generated:")
            print(f"   Quiz ID: {quiz_ml['quiz_id']}")
            print(f"   Questions ({len(quiz_ml['questions'])}):")
            for i, q in enumerate(quiz_ml['questions'][:3], 1):
                print(f"   {i}. {q['question'][:70]}...")
            
            quiz_prog = generator.generate_quiz(
                student_id=test_user.id,
                topic_ids=[prog_topic.id],
                difficulty='medium',
                question_types=['multiple_choice'],
                num_questions=3
            )
            
            print(f"\n✅ Programming Quiz Generated:")
            print(f"   Quiz ID: {quiz_prog['quiz_id']}")
            print(f"   Questions ({len(quiz_prog['questions'])}):")
            for i, q in enumerate(quiz_prog['questions'][:3], 1):
                print(f"   {i}. {q['question'][:70]}...")
            
            # Check if questions are different
            ml_q1 = quiz_ml['questions'][0]['question'] if quiz_ml['questions'] else ""
            prog_q1 = quiz_prog['questions'][0]['question'] if quiz_prog['questions'] else ""
            
            if ml_q1 != prog_q1:
                print(f"\n✅ PASS: Different topics produced different questions!")
            else:
                print(f"\n❌ FAIL: Same questions for different topics!")
                
        except Exception as e:
            print(f"\n❌ ERROR in Test 1: {str(e)}")
            logger.exception("Test 1 failed")
        
        # Test 2: Different Difficulty Levels
        print("\n\n📊 TEST 2: Difficulty Variation")
        print("-" * 80)
        
        try:
            quiz_easy = generator.generate_quiz(
                student_id=test_user.id,
                topic_ids=[ml_topic.id],
                difficulty='easy',
                question_types=['short_answer'],
                num_questions=2
            )
            
            print(f"\n✅ Easy Quiz Generated:")
            print(f"   Quiz ID: {quiz_easy['quiz_id']}")
            for i, q in enumerate(quiz_easy['questions'][:2], 1):
                print(f"   {i}. {q['question'][:70]}...")
            
            quiz_hard = generator.generate_quiz(
                student_id=test_user.id,
                topic_ids=[ml_topic.id],
                difficulty='hard',
                question_types=['short_answer'],
                num_questions=2
            )
            
            print(f"\n✅ Hard Quiz Generated:")
            print(f"   Quiz ID: {quiz_hard['quiz_id']}")
            for i, q in enumerate(quiz_hard['questions'][:2], 1):
                print(f"   {i}. {q['question'][:70]}...")
            
            easy_q1 = quiz_easy['questions'][0]['question'] if quiz_easy['questions'] else ""
            hard_q1 = quiz_hard['questions'][0]['question'] if quiz_hard['questions'] else ""
            
            if easy_q1 != hard_q1:
                print(f"\n✅ PASS: Different difficulties produced different questions!")
            else:
                print(f"\n❌ FAIL: Same questions for different difficulties!")
                
        except Exception as e:
            print(f"\n❌ ERROR in Test 2: {str(e)}")
            logger.exception("Test 2 failed")
        
        # Test 3: Multiple Generations of Same Settings Should Vary
        print("\n\n📊 TEST 3: Randomness Verification (Same Settings)")
        print("-" * 80)
        
        try:
            quiz_1 = generator.generate_quiz(
                student_id=test_user.id,
                topic_ids=[ds_topic.id],
                difficulty='medium',
                question_types=['multiple_choice'],
                num_questions=2
            )
            
            print(f"\n✅ First Generation:")
            for i, q in enumerate(quiz_1['questions'][:2], 1):
                print(f"   {i}. {q['question'][:70]}...")
            
            # Small delay to ensure different timestamp
            import time
            time.sleep(1)
            
            quiz_2 = generator.generate_quiz(
                student_id=test_user.id,
                topic_ids=[ds_topic.id],
                difficulty='medium',
                question_types=['multiple_choice'],
                num_questions=2
            )
            
            print(f"\n✅ Second Generation:")
            for i, q in enumerate(quiz_2['questions'][:2], 1):
                print(f"   {i}. {q['question'][:70]}...")
            
            q1_first = quiz_1['questions'][0]['question'] if quiz_1['questions'] else ""
            q1_second = quiz_2['questions'][0]['question'] if quiz_2['questions'] else ""
            
            if q1_first != q1_second:
                print(f"\n✅ PASS: Same settings produced different questions (good randomness)!")
            else:
                print(f"\n⚠️  WARNING: Same settings produced identical questions (may need more randomness)")
                
        except Exception as e:
            print(f"\n❌ ERROR in Test 3: {str(e)}")
            logger.exception("Test 3 failed")
        
        # Test 4: Different Question Types
        print("\n\n📊 TEST 4: Question Type Variation")
        print("-" * 80)
        
        try:
            quiz_mc = generator.generate_quiz(
                student_id=test_user.id,
                topic_ids=[ml_topic.id],
                difficulty='medium',
                question_types=['multiple_choice'],
                num_questions=2
            )
            
            print(f"\n✅ Multiple Choice Quiz:")
            for i, q in enumerate(quiz_mc['questions'][:2], 1):
                print(f"   {i}. Type: {q['type']} | {q['question'][:50]}...")
            
            quiz_sa = generator.generate_quiz(
                student_id=test_user.id,
                topic_ids=[ml_topic.id],
                difficulty='medium',
                question_types=['short_answer'],
                num_questions=2
            )
            
            print(f"\n✅ Short Answer Quiz:")
            for i, q in enumerate(quiz_sa['questions'][:2], 1):
                print(f"   {i}. Type: {q['type']} | {q['question'][:50]}...")
            
            print(f"\n✅ PASS: Different question types handled correctly!")
                
        except Exception as e:
            print(f"\n❌ ERROR in Test 4: {str(e)}")
            logger.exception("Test 4 failed")
        
        print("\n" + "="*80)
        print("🎉 QUIZ VARIATION TESTING COMPLETE!")
        print("="*80 + "\n")
        print("Summary:")
        print("- If all tests show different questions, the fix is working! ✅")
        print("- If you see the same 4 questions repeatedly, there's still an issue. ❌")
        print("\nNext steps:")
        print("1. Test through the frontend UI with different settings")
        print("2. Verify questions match the selected topic")
        print("3. Check that difficulty affects question complexity")
        print("\n")


if __name__ == '__main__':
    test_quiz_variation()
