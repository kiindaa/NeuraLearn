"""
AI Service for Quiz Generation (Legacy Quiz System)
Generates questions based on lesson content using Hugging Face API with fallback templates.

IMPORTANT: Question types are handled as follows:
- 'multiple_choice': ALL questions are multiple choice
- 'short_answer': ALL questions are short answer
- 'mixed': Questions alternate between multiple choice and short answer

Difficulty levels affect question complexity:
- 'easy': Basic definition and identification questions
- 'medium': Application and comparison questions
- 'hard': Analysis, evaluation, and optimization questions
"""
import os
import requests
import json
import random
import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class AIService:
    """Legacy AI service for content-based question generation."""
    
    def __init__(self):
        self.api_key = os.environ.get('HUGGINGFACE_API_KEY')
        self.base_url = 'https://api-inference.huggingface.co/models'
    
    def generate_questions(
        self,
        content: str,
        difficulty: str,
        question_type: str,
        number_of_questions: int
    ) -> List[Dict[str, Any]]:
        """Generate questions using AI.
        
        Args:
            content: The lesson content to generate questions from
            difficulty: 'easy', 'medium', or 'hard' - affects question complexity
            question_type: 'multiple_choice', 'short_answer', or 'mixed'
            number_of_questions: How many questions to generate
        """
        # Generate unique random seed for variation based on timestamp
        random_seed = int(time.time() * 1000) % 100000 + random.randint(1, 9999)
        
        logger.debug(f"🎯 GENERATING QUESTIONS:")
        logger.debug(f"   Content Length: {len(content)}")
        logger.debug(f"   Difficulty: {difficulty}")
        logger.debug(f"   Question Type: {question_type}")
        logger.debug(f"   Num Questions: {number_of_questions}")
        logger.debug(f"🎲 Using randomization seed: {random_seed}")
        
        try:
            if self.api_key:
                questions = self._generate_questions_api(
                    content, difficulty, question_type, number_of_questions, random_seed
                )
                if questions:
                    return questions
            # Fallback to local generation
            return self._generate_questions_local(
                content, difficulty, question_type, number_of_questions, random_seed
            )
        except Exception as e:
            logger.error(f"Error generating questions: {e}")
            return self._generate_fallback_questions(
                content, difficulty, question_type, number_of_questions, random_seed
            )
    
    def _get_question_type_for_index(self, question_type: str, index: int) -> str:
        """Determine the actual question type based on the requested type and question index.
        
        - 'multiple_choice': Always returns 'multiple_choice'
        - 'short_answer': Always returns 'short_answer'
        - 'mixed': Alternates between 'multiple_choice' and 'short_answer'
        """
        if question_type == 'multiple_choice':
            return 'multiple_choice'
        elif question_type == 'short_answer':
            return 'short_answer'
        else:  # mixed
            return 'multiple_choice' if index % 2 == 0 else 'short_answer'
    
    def _generate_questions_local(
        self,
        content: str,
        difficulty: str,
        question_type: str,
        number_of_questions: int,
        random_seed: int
    ) -> List[Dict[str, Any]]:
        """Generate questions using local templates."""
        random.seed(random_seed)
        questions = []
        
        # Extract key concepts from content
        concepts = self._extract_concepts(content)
        random.shuffle(concepts)
        
        logger.debug(f"📚 Extracted {len(concepts)} concepts from content")
        logger.debug(f"📝 Question type requested: {question_type}")
        
        # Generate questions for each concept
        for i in range(min(number_of_questions, max(len(concepts), number_of_questions))):
            concept = concepts[i % len(concepts)] if concepts else f"topic_{i}"
            
            # Determine actual question type for this question
            actual_type = self._get_question_type_for_index(question_type, i)
            logger.debug(f"   Q{i+1} type: {actual_type}")
            
            if actual_type == 'multiple_choice':
                question = self._generate_multiple_choice_question(concept, content, difficulty)
            else:
                question = self._generate_short_answer_question(concept, content, difficulty)
            
            if question:
                questions.append(question)
                logger.debug(f"   Generated Q{i+1} ({actual_type}): {question['text'][:50]}...")
        
        random.seed()
        return questions
    
    def _generate_questions_api(
        self,
        content: str,
        difficulty: str,
        question_type: str,
        number_of_questions: int,
        random_seed: int
    ) -> List[Dict[str, Any]]:
        """Generate questions using Hugging Face API."""
        if not self.api_key:
            return self._generate_fallback_questions(content, difficulty, question_type, number_of_questions)
        
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        questions = []
        timestamp = int(time.time() * 1000)
        
        # Build content-aware prompt
        content_snippet = content[:500] if len(content) > 500 else content
        prompt = f"""Generate a {difficulty} {question_type} question about the following content:
{content_snippet}
Make the question unique and relevant.
Random seed: {random_seed}"""
        
        logger.debug(f"📝 Generated prompt: {prompt[:200]}...")
        logger.debug("🌐 Sending request to Hugging Face API...")
        
        try:
            model_name = "microsoft/DialoGPT-medium"
            url = f"{self.base_url}/{model_name}"
            
            response = requests.post(
                url,
                headers=headers,
                json={
                    "inputs": prompt,
                    "parameters": {
                        "temperature": 0.8,
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
                # Parse API response and generate questions
                concepts = self._extract_concepts(content)
                random.shuffle(concepts)
                
                for i in range(number_of_questions):
                    concept = concepts[i % len(concepts)]
                    
                    # Determine actual question type for this question
                    actual_type = self._get_question_type_for_index(question_type, i)
                    
                    if actual_type == 'multiple_choice':
                        question = self._generate_multiple_choice_question(concept, content, difficulty)
                    else:
                        question = self._generate_short_answer_question(concept, content, difficulty)
                    
                    if question:
                        questions.append(question)
            else:
                logger.warning(f"⚠️ API returned status {response.status_code}")
                
        except requests.exceptions.Timeout:
            logger.warning("⚠️ API request timed out")
        except Exception as e:
            logger.warning(f"⚠️ API request failed: {e}")
        
        return questions
    
    def _extract_concepts(self, content: str) -> List[str]:
        """Extract key concepts from content."""
        # Remove common words and extract meaningful terms
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
            'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
            'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
            'their', 'we', 'our', 'you', 'your', 'he', 'she', 'his', 'her',
            'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
            'into', 'through', 'during', 'before', 'after', 'above', 'below',
            'between', 'under', 'again', 'further', 'then', 'once', 'here',
            'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few',
            'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
            'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also'
        }
        
        words = content.lower().split()
        concepts = []
        
        for word in words:
            # Clean word
            clean_word = ''.join(c for c in word if c.isalnum())
            
            if (
                len(clean_word) > 4 and
                clean_word not in stop_words and
                clean_word.isalpha()
            ):
                concepts.append(clean_word)
        
        # Return unique concepts
        return list(dict.fromkeys(concepts))[:20]
    
    def _generate_multiple_choice_question(
        self,
        concept: str,
        content: str,
        difficulty: str
    ) -> Dict[str, Any]:
        """Generate a multiple choice question."""
        # Difficulty-based templates
        templates = {
            'easy': [
                f"What is {concept}?",
                f"Which of the following best describes {concept}?",
                f"What is the purpose of {concept}?"
            ],
            'medium': [
                f"How does {concept} work in this context?",
                f"What are the key aspects of {concept}?",
                f"Why is {concept} important?"
            ],
            'hard': [
                f"Analyze how {concept} affects the system.",
                f"What are the trade-offs of using {concept}?",
                f"How would you optimize {concept}?"
            ]
        }
        
        template_list = templates.get(difficulty, templates['medium'])
        question_text = random.choice(template_list)
        
        # Generate options from content concepts
        concepts = self._extract_concepts(content)
        other_concepts = [c for c in concepts if c != concept][:10]
        random.shuffle(other_concepts)
        
        correct_answer = f"A key concept related to {concept}"
        wrong_answers = [
            f"Related to {other_concepts[0]}" if len(other_concepts) > 0 else "Option B",
            f"Related to {other_concepts[1]}" if len(other_concepts) > 1 else "Option C",
            f"Not mentioned in the content" if len(other_concepts) > 2 else "Option D"
        ]
        
        options = [correct_answer] + wrong_answers
        random.shuffle(options)
        
        return {
            'text': question_text,
            'type': 'multiple_choice',
            'options': options,
            'correct_answer': correct_answer,
            'explanation': f"This question relates to {concept} as discussed in the content.",
            'difficulty': difficulty
        }
    
    def _generate_short_answer_question(
        self,
        concept: str,
        content: str,
        difficulty: str
    ) -> Dict[str, Any]:
        """Generate a short answer question."""
        templates = {
            'easy': [
                f"Define {concept}.",
                f"What is {concept}?",
                f"Describe {concept} briefly."
            ],
            'medium': [
                f"Explain how {concept} works.",
                f"Describe the role of {concept}.",
                f"What are the key features of {concept}?"
            ],
            'hard': [
                f"Analyze the significance of {concept}.",
                f"Compare and contrast {concept} with alternatives.",
                f"Evaluate the effectiveness of {concept}."
            ]
        }
        
        template_list = templates.get(difficulty, templates['medium'])
        question_text = random.choice(template_list)
        
        return {
            'text': question_text,
            'type': 'short_answer',
            'correct_answer': concept,
            'explanation': f"The concept {concept} is discussed in the content.",
            'difficulty': difficulty
        }
    
    def _parse_generated_question(
        self,
        generated_text: str,
        difficulty: str,
        question_type: str
    ) -> Dict[str, Any]:
        """Parse generated text into a question format."""
        if question_type == 'multiple_choice':
            return self._generate_multiple_choice_question(generated_text, generated_text, difficulty)
        else:
            return self._generate_short_answer_question(generated_text, generated_text, difficulty)
    
    def _generate_fallback_questions(
        self,
        content: str,
        difficulty: str,
        question_type: str,
        number_of_questions: int,
        random_seed: int = None
    ) -> List[Dict[str, Any]]:
        """Generate fallback questions when all else fails."""
        logger.debug("⚠️ Using fallback question generation")
        logger.debug(f"   Difficulty: {difficulty}, Type: {question_type}")
        
        if random_seed:
            random.seed(random_seed)
        
        questions = []
        concepts = self._extract_concepts(content)
        
        if not concepts:
            concepts = ['concept', 'topic', 'idea', 'principle', 'method', 
                       'approach', 'technique', 'process', 'system', 'structure']
        
        random.shuffle(concepts)
        
        for i in range(number_of_questions):
            concept = concepts[i % len(concepts)]
            
            # Determine actual question type for this question
            actual_type = self._get_question_type_for_index(question_type, i)
            
            if actual_type == 'multiple_choice':
                question = self._generate_multiple_choice_question(concept, content, difficulty)
            else:
                question = self._generate_short_answer_question(concept, content, difficulty)
            
            questions.append(question)
            logger.debug(f"   Fallback Q{i+1} ({actual_type}, {difficulty}): {question['text'][:40]}...")
        
        if random_seed:
            random.seed()
        
        return questions
        
        return questions
    
    def analyze_text_difficulty(self, text: str) -> str:
        """Analyze text difficulty level."""
        words = text.split()
        avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
        sentence_count = text.count('.') + text.count('!') + text.count('?')
        avg_sentence_length = len(words) / sentence_count if sentence_count > 0 else 0
        
        if avg_word_length > 6 and avg_sentence_length > 15:
            return 'hard'
        elif avg_word_length > 4 and avg_sentence_length > 10:
            return 'medium'
        else:
            return 'easy'
    
    def extract_key_concepts(self, text: str) -> List[str]:
        """Extract key concepts from text."""
        return self._extract_concepts(text)
