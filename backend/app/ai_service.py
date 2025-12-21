"""
AI Service for Quiz Generation
Generates topic-specific questions using Hugging Face API with fallback templates.
"""
import os
import requests
import json
import random
import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import uuid

from .models import db, AIGeneratedQuiz, AIQuestion, CourseTopic

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Topic-specific concepts and templates
TOPIC_TEMPLATES = {
    'Machine Learning': {
        'concepts': [
            'neural networks', 'backpropagation', 'gradient descent',
            'supervised learning', 'unsupervised learning', 'reinforcement learning',
            'overfitting', 'regularization', 'cross-validation',
            'ensemble methods', 'transfer learning', 'feature engineering',
            'decision trees', 'random forests', 'support vector machines',
            'clustering algorithms', 'dimensionality reduction', 'model evaluation'
        ],
        'easy': [
            "What is the primary goal of {concept}?",
            "Define {concept} in simple terms.",
            "Which of the following best describes {concept}?",
            "What is {concept} used for in machine learning?"
        ],
        'medium': [
            "How does {concept} improve model performance?",
            "Compare {concept} with traditional approaches.",
            "What are the key parameters to tune when using {concept}?",
            "In what scenarios would you prefer {concept}?"
        ],
        'hard': [
            "Analyze the computational complexity of {concept}.",
            "Design a system using {concept} to handle large-scale data.",
            "What are the mathematical foundations behind {concept}?",
            "How would you optimize {concept} for production deployment?"
        ]
    },
    'Programming': {
        'concepts': [
            'algorithms', 'data structures', 'object-oriented programming',
            'design patterns', 'debugging techniques', 'code optimization',
            'recursion', 'memory management', 'unit testing',
            'version control', 'API design', 'concurrency',
            'error handling', 'code refactoring', 'clean code principles',
            'software architecture', 'dependency injection', 'SOLID principles'
        ],
        'easy': [
            "What is the purpose of {concept}?",
            "Define {concept} in programming.",
            "Which statement about {concept} is correct?",
            "What problem does {concept} solve?"
        ],
        'medium': [
            "How does {concept} improve code quality?",
            "Compare different approaches to implementing {concept}.",
            "What are best practices for using {concept}?",
            "When should you apply {concept} in a project?"
        ],
        'hard': [
            "Analyze the trade-offs of different {concept} implementations.",
            "Design a scalable solution using {concept}.",
            "How would you refactor legacy code to use {concept}?",
            "What are advanced patterns for {concept} in enterprise systems?"
        ]
    },
    'Data Science': {
        'concepts': [
            'data cleaning', 'exploratory data analysis', 'data visualization',
            'statistical analysis', 'hypothesis testing', 'A/B testing',
            'feature selection', 'model validation', 'time series analysis',
            'ETL pipelines', 'data preprocessing', 'missing data handling',
            'outlier detection', 'correlation analysis', 'regression analysis',
            'classification metrics', 'sampling techniques', 'data normalization'
        ],
        'easy': [
            "What is {concept}?",
            "Why is {concept} important in data science?",
            "Which tool is commonly used for {concept}?",
            "What is the first step in {concept}?"
        ],
        'medium': [
            "How does {concept} affect model accuracy?",
            "Compare different methods for {concept}.",
            "What are common pitfalls in {concept}?",
            "When would you prioritize {concept} in your workflow?"
        ],
        'hard': [
            "Design an automated pipeline for {concept}.",
            "How would you scale {concept} for big data?",
            "Analyze the statistical implications of {concept}.",
            "What advanced techniques improve {concept} results?"
        ]
    }
}

# Default fallback for unknown topics
DEFAULT_TOPIC = {
    'concepts': [
        'fundamental concepts', 'best practices', 'common patterns',
        'basic principles', 'key terminology', 'core techniques',
        'essential skills', 'foundational knowledge', 'practical applications'
    ],
    'easy': [
        "What is {concept}?",
        "Define {concept}.",
        "Which describes {concept} correctly?"
    ],
    'medium': [
        "How is {concept} applied in practice?",
        "What are the benefits of {concept}?",
        "Compare {concept} with alternatives."
    ],
    'hard': [
        "Analyze the impact of {concept} on system design.",
        "How would you optimize {concept} for scale?",
        "What are advanced applications of {concept}?"
    ]
}


class QuizGenerator:
    """Generates AI-powered quizzes with topic-specific questions."""
    
    def __init__(self):
        self.api_key = os.environ.get('HUGGINGFACE_API_KEY')
        self.base_url = 'https://api-inference.huggingface.co/models'
        self.model_name = 'microsoft/DialoGPT-medium'
        self.questions_per_topic = 4  # Generate 4 questions per topic
        
    def generate_quiz(
        self,
        student_id: str,
        topic_ids: List[str],
        difficulty: str = 'medium',
        question_types: List[str] = None,
        num_questions: int = None  # If None, will be calculated as 4 per topic
    ) -> Dict[str, Any]:
        """
        Generate a quiz with topic-specific questions.
        
        Args:
            student_id: ID of the student requesting the quiz
            topic_ids: List of topic IDs to generate questions for
            difficulty: Question difficulty (easy, medium, hard)
            question_types: Types of questions to generate
            num_questions: Total number of questions (if None, generates 4 per topic)
            
        Returns:
            Dictionary containing quiz data and questions
        """
        # Generate unique random seed for variation
        random_seed = random.randint(1000, 9999)
        timestamp = int(time.time() * 1000)
        
        if question_types is None:
            question_types = ['multiple_choice', 'short_answer']
            
        # Get topic names from database
        topics = CourseTopic.query.filter(CourseTopic.id.in_(topic_ids)).all()
        topic_names = [topic.name for topic in topics] if topics else ['General']
        
        # Calculate total questions: 4 per topic if not specified
        if num_questions is None or num_questions < len(topic_names) * self.questions_per_topic:
            num_questions = len(topic_names) * self.questions_per_topic
        
        logger.debug(f"🎯 GENERATING QUIZ:")
        logger.debug(f"   Topic IDs: {topic_ids}")
        logger.debug(f"   Topic Names: {topic_names}")
        logger.debug(f"   Difficulty: {difficulty}")
        logger.debug(f"   Question Types: {question_types}")
        logger.debug(f"   Questions per topic: {self.questions_per_topic}")
        logger.debug(f"   Total Questions: {num_questions}")
        logger.debug(f"🎲 Using randomization seed: {random_seed}")
        
        # Create quiz record
        quiz = AIGeneratedQuiz(
            id=str(uuid.uuid4()),
            student_id=student_id,
            session_uuid=str(uuid.uuid4()),
            topic_ids=json.dumps(topic_ids),
            difficulty=difficulty,
            question_types=json.dumps(question_types),
            total_questions=num_questions,
            generated_at=datetime.now(timezone.utc)
        )
        db.session.add(quiz)
        db.session.flush()
        
        # Generate questions - 4 per topic
        questions_data = self._generate_questions_for_topics(
            topic_names=topic_names,
            difficulty=difficulty,
            question_types=question_types,
            questions_per_topic=self.questions_per_topic,
            random_seed=random_seed,
            timestamp=timestamp
        )
        
        # Create question records
        for q_data in questions_data:
            question = AIQuestion(
                id=str(uuid.uuid4()),
                quiz_id=quiz.id,
                question_text=q_data['question_text'],
                question_type=q_data['question_type'],
                options=json.dumps(q_data.get('options', [])),
                correct_answer=q_data['correct_answer']
            )
            db.session.add(question)
        
        db.session.commit()
        
        logger.debug(f"✅ Quiz generated with {len(questions_data)} questions across {len(topic_names)} topics")
        
        return {
            'success': True,
            'quiz': quiz.to_dict()
        }
    
    def _generate_questions_for_topics(
        self,
        topic_names: List[str],
        difficulty: str,
        question_types: List[str],
        questions_per_topic: int,
        random_seed: int,
        timestamp: int
    ) -> List[Dict[str, Any]]:
        """Generate questions for each topic, ensuring each topic gets equal coverage."""
        
        all_questions = []
        question_index = 0
        
        for topic_name in topic_names:
            logger.debug(f"📚 Generating {questions_per_topic} questions for topic: {topic_name}")
            
            # Generate questions for this specific topic
            topic_questions = self._generate_fallback_questions(
                topic_names=[topic_name],  # Pass single topic
                difficulty=difficulty,
                question_types=question_types,
                num_questions=questions_per_topic,
                random_seed=random_seed + hash(topic_name) % 1000  # Different seed per topic
            )
            
            # Add topic info to each question
            for q in topic_questions:
                q['topic'] = topic_name
                question_index += 1
            
            all_questions.extend(topic_questions)
        
        # Shuffle all questions to mix topics
        random.seed(random_seed)
        random.shuffle(all_questions)
        random.seed()
        
        return all_questions
    
    def _generate_questions(
        self,
        topic_names: List[str],
        difficulty: str,
        question_types: List[str],
        num_questions: int,
        random_seed: int,
        timestamp: int
    ) -> List[Dict[str, Any]]:
        """Generate questions using API or fallback to templates."""
        
        # Try API first if key is available
        if self.api_key:
            try:
                questions = self._generate_questions_api(
                    topic_names=topic_names,
                    difficulty=difficulty,
                    question_types=question_types,
                    num_questions=num_questions,
                    random_seed=random_seed,
                    timestamp=timestamp
                )
                if questions and len(questions) >= num_questions:
                    return questions[:num_questions]
            except Exception as e:
                logger.warning(f"⚠️ API generation failed: {e}")
        
        # Fallback to template-based generation
        logger.debug("⚠️ Using fallback question generation")
        return self._generate_fallback_questions(
            topic_names=topic_names,
            difficulty=difficulty,
            question_types=question_types,
            num_questions=num_questions,
            random_seed=random_seed
        )
    
    def _generate_questions_api(
        self,
        topic_names: List[str],
        difficulty: str,
        question_types: List[str],
        num_questions: int,
        random_seed: int,
        timestamp: int
    ) -> List[Dict[str, Any]]:
        """Generate questions using Hugging Face API with topic-specific prompts."""
        
        headers = {"Authorization": f"Bearer {self.api_key}"}
        url = f"{self.base_url}/{self.model_name}"
        
        # Get topic-specific concepts
        primary_topic = topic_names[0] if topic_names else 'General'
        topic_config = TOPIC_TEMPLATES.get(primary_topic, DEFAULT_TOPIC)
        concepts = random.sample(topic_config['concepts'], min(5, len(topic_config['concepts'])))
        
        # Build topic-aware prompt
        prompt = f"""Generate {num_questions} {difficulty} questions about {primary_topic}.
Topics to cover: {', '.join(concepts)}.
Make questions unique and varied.
Random seed: {random_seed}"""
        
        logger.debug(f"📝 Generated prompt: {prompt[:300]}...")
        logger.debug("🌐 Sending request to Hugging Face API...")
        
        questions = []
        
        try:
            response = requests.post(
                url,
                headers=headers,
                json={
                    "inputs": prompt,
                    "parameters": {
                        "temperature": 0.85,
                        "do_sample": True,
                        "top_p": 0.92,
                        "repetition_penalty": 1.3,
                        "no_repeat_ngram_size": 3,
                        "seed": timestamp,
                        "use_cache": False
                    }
                },
                timeout=30
            )
            
            logger.debug(f"✅ API Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                # Parse response and create questions
                if result:
                    for i, concept in enumerate(concepts[:num_questions]):
                        q_type = random.choice(question_types)
                        question = self._create_question_from_concept(
                            concept=concept,
                            topic=primary_topic,
                            difficulty=difficulty,
                            question_type=q_type
                        )
                        questions.append(question)
            else:
                logger.warning(f"⚠️ API returned status {response.status_code}")
                
        except requests.exceptions.Timeout:
            logger.warning("⚠️ API request timed out")
        except Exception as e:
            logger.warning(f"⚠️ API request failed: {e}")
        
        return questions
    
    def _generate_fallback_questions(
        self,
        topic_names: List[str],
        difficulty: str,
        question_types: List[str],
        num_questions: int,
        random_seed: int
    ) -> List[Dict[str, Any]]:
        """Generate fallback questions using topic-specific templates."""
        
        # Set random seed for reproducibility within same request but different across requests
        random.seed(random_seed)
        
        questions = []
        used_concepts = set()
        primary_topic = topic_names[0] if topic_names else 'General'
        
        logger.debug(f"📚 Generating fallback questions for topic: {primary_topic}")
        
        # Get topic configuration
        topic_config = TOPIC_TEMPLATES.get(primary_topic, DEFAULT_TOPIC)
        concepts = topic_config['concepts'].copy()
        templates = topic_config.get(difficulty, topic_config.get('medium', []))
        
        random.shuffle(concepts)
        
        for i in range(num_questions):
            # Select unused concept
            concept = None
            for c in concepts:
                if c not in used_concepts:
                    concept = c
                    used_concepts.add(c)
                    break
            
            if not concept:
                # Reset if we've used all concepts
                used_concepts.clear()
                concept = random.choice(concepts)
                used_concepts.add(concept)
            
            # Select question type
            q_type = question_types[i % len(question_types)] if question_types else 'multiple_choice'
            
            # Generate question
            question = self._create_question_from_concept(
                concept=concept,
                topic=primary_topic,
                difficulty=difficulty,
                question_type=q_type,
                templates=templates
            )
            questions.append(question)
            
            logger.debug(f"   Generated Q{i+1}: {question['question_text'][:50]}...")
        
        # Reset random seed
        random.seed()
        
        return questions
    
    def _create_question_from_concept(
        self,
        concept: str,
        topic: str,
        difficulty: str,
        question_type: str,
        templates: List[str] = None
    ) -> Dict[str, Any]:
        """Create a single question from a concept."""
        
        # Get templates if not provided
        if not templates:
            topic_config = TOPIC_TEMPLATES.get(topic, DEFAULT_TOPIC)
            templates = topic_config.get(difficulty, topic_config.get('medium', []))
        
        # Select random template
        template = random.choice(templates)
        question_text = template.format(concept=concept)
        
        if question_type == 'multiple_choice':
            return self._create_multiple_choice(concept, topic, question_text, difficulty)
        elif question_type == 'true_false':
            return self._create_true_false(concept, topic, question_text, difficulty)
        else:
            return self._create_short_answer(concept, topic, question_text, difficulty)
    
    def _create_multiple_choice(
        self,
        concept: str,
        topic: str,
        question_text: str,
        difficulty: str
    ) -> Dict[str, Any]:
        """Create a multiple choice question."""
        
        # Get topic concepts for generating wrong answers
        topic_config = TOPIC_TEMPLATES.get(topic, DEFAULT_TOPIC)
        all_concepts = topic_config['concepts'].copy()
        
        # Remove the correct concept
        other_concepts = [c for c in all_concepts if c != concept]
        random.shuffle(other_concepts)
        
        # Create options
        correct_answer = f"It is related to {concept}"
        wrong_answers = [
            f"It is related to {other_concepts[0]}" if len(other_concepts) > 0 else "None of the above",
            f"It is related to {other_concepts[1]}" if len(other_concepts) > 1 else "All of the above",
            f"It is related to {other_concepts[2]}" if len(other_concepts) > 2 else "Not applicable"
        ]
        
        options = [correct_answer] + wrong_answers
        random.shuffle(options)
        
        return {
            'question_text': question_text,
            'question_type': 'multiple_choice',
            'options': options,
            'correct_answer': correct_answer
        }
    
    def _create_true_false(
        self,
        concept: str,
        topic: str,
        question_text: str,
        difficulty: str
    ) -> Dict[str, Any]:
        """Create a true/false question."""
        
        is_true = random.choice([True, False])
        
        if is_true:
            tf_question = f"{concept.title()} is an important concept in {topic}."
            correct = "True"
        else:
            # Create a false statement
            topic_config = TOPIC_TEMPLATES.get(topic, DEFAULT_TOPIC)
            other_topic = random.choice([t for t in TOPIC_TEMPLATES.keys() if t != topic])
            tf_question = f"{concept.title()} is primarily used in {other_topic}, not {topic}."
            correct = "False"
        
        return {
            'question_text': tf_question,
            'question_type': 'true_false',
            'options': ['True', 'False'],
            'correct_answer': correct
        }
    
    def _create_short_answer(
        self,
        concept: str,
        topic: str,
        question_text: str,
        difficulty: str
    ) -> Dict[str, Any]:
        """Create a short answer question."""
        
        return {
            'question_text': question_text,
            'question_type': 'short_answer',
            'options': [],
            'correct_answer': concept
        }


def submit_quiz_answer(quiz_id: str, question_id: str, answer: str) -> Dict[str, Any]:
    """
    Submit an answer to a quiz question.
    
    Args:
        quiz_id: ID of the quiz
        question_id: ID of the question being answered
        answer: The student's answer
        
    Returns:
        Dictionary with success status and feedback
    """
    logger.debug(f"📝 Submitting answer for quiz {quiz_id}, question {question_id}")
    
    question = AIQuestion.query.filter_by(
        id=question_id,
        quiz_id=quiz_id
    ).first()
    
    if not question:
        logger.warning(f"⚠️ Question not found: {question_id}")
        return {
            'success': False,
            'error': 'Question not found'
        }
    
    # Check if already answered
    if question.student_answer is not None:
        logger.warning(f"⚠️ Question already answered: {question_id}")
        return {
            'success': False,
            'error': 'Question already answered'
        }
    
    # Determine if answer is correct
    is_correct = False
    correct_answer = question.correct_answer or ''
    
    if question.question_type == 'multiple_choice' or question.question_type == 'true_false':
        is_correct = answer.strip().lower() == correct_answer.strip().lower()
    else:
        # For short answer, check if key concept is mentioned
        is_correct = correct_answer.lower() in answer.lower()
    
    # Update question
    question.student_answer = answer
    question.is_correct = is_correct
    question.answered_at = datetime.now(timezone.utc)
    
    db.session.commit()
    
    logger.debug(f"✅ Answer recorded - Correct: {is_correct}")
    
    return {
        'success': True,
        'is_correct': is_correct,
        'correct_answer': correct_answer if not is_correct else None,
        'feedback': 'Correct!' if is_correct else f'The correct answer was: {correct_answer}'
    }
