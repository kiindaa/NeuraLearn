import os
import requests
import json
from typing import List, Dict, Any

class AIService:
    def __init__(self):
        self.api_key = os.environ.get('HUGGINGFACE_API_KEY')
        self.base_url = 'https://api-inference.huggingface.co/models'
    
    def generate_questions(self, content: str, difficulty: str, question_type: str, number_of_questions: int) -> List[Dict[str, Any]]:
        """Generate questions using AI"""
        try:
            if self.api_key:
                questions = self._generate_questions_api(content, difficulty, question_type, number_of_questions)
                if questions:
                    return questions
            # Lightweight local heuristic generation (no external models)
            return self._generate_questions_local(content, difficulty, question_type, number_of_questions)
        except Exception as e:
            print(f"Error generating questions: {e}")
            return self._generate_fallback_questions(content, difficulty, question_type, number_of_questions)
    
    def _generate_questions_local(self, content: str, difficulty: str, question_type: str, number_of_questions: int) -> List[Dict[str, Any]]:
        """Generate questions using local models"""
        questions = []
        
        # Split content into sentences
        sentences = content.split('.')[:10]  # Use first 10 sentences
        
        for i in range(min(number_of_questions, len(sentences))):
            sentence = sentences[i].strip()
            if not sentence:
                continue
            
            if question_type == 'multiple_choice' or question_type == 'mixed':
                question = self._generate_multiple_choice_question(sentence, difficulty)
            else:
                question = self._generate_short_answer_question(sentence, difficulty)
            
            if question:
                questions.append(question)
        
        return questions
    
    def _generate_questions_api(self, content: str, difficulty: str, question_type: str, number_of_questions: int) -> List[Dict[str, Any]]:
        """Generate questions using Hugging Face API"""
        if not self.api_key:
            return self._generate_fallback_questions(content, difficulty, question_type, number_of_questions)
        
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        questions = []
        for i in range(number_of_questions):
            try:
                # Use a question generation model via API
                model_name = "microsoft/DialoGPT-medium"
                url = f"{self.base_url}/{model_name}"
                
                prompt = f"Generate a {difficulty} question about: {content[:200]}"
                
                response = requests.post(
                    url,
                    headers=headers,
                    json={"inputs": prompt}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result and len(result) > 0:
                        generated_text = result[0].get('generated_text', '')
                        question = self._parse_generated_question(generated_text, difficulty, question_type)
                        if question:
                            questions.append(question)
                
            except Exception as e:
                print(f"Error with API call: {e}")
                continue
        
        return questions
    
    def _generate_multiple_choice_question(self, sentence: str, difficulty: str) -> Dict[str, Any]:
        """Generate a multiple choice question"""
        # Extract key terms from sentence
        words = sentence.split()
        key_words = [word for word in words if len(word) > 4 and word.isalpha()]
        
        if len(key_words) < 2:
            return None
        
        # Create question
        question_text = f"What is the main concept discussed in: '{sentence}'?"
        
        # Generate options
        correct_answer = key_words[0] if key_words else "concept"
        incorrect_answers = key_words[1:4] if len(key_words) > 1 else ["idea", "theory", "method"]
        
        options = [correct_answer] + incorrect_answers[:3]
        
        return {
            'text': question_text,
            'type': 'multiple_choice',
            'options': options,
            'correct_answer': correct_answer,
            'explanation': f"The main concept is {correct_answer} as mentioned in the text.",
            'difficulty': difficulty
        }
    
    def _generate_short_answer_question(self, sentence: str, difficulty: str) -> Dict[str, Any]:
        """Generate a short answer question"""
        words = sentence.split()
        key_word = words[0] if words else "concept"
        
        question_text = f"Explain the concept of {key_word} based on the following: '{sentence}'"
        
        return {
            'text': question_text,
            'type': 'short_answer',
            'correct_answer': key_word,
            'explanation': f"The concept refers to {key_word} as described in the text.",
            'difficulty': difficulty
        }
    
    def _parse_generated_question(self, generated_text: str, difficulty: str, question_type: str) -> Dict[str, Any]:
        """Parse generated text into a question format"""
        # Simple parsing - in a real implementation, you'd use more sophisticated NLP
        if question_type == 'multiple_choice':
            return self._generate_multiple_choice_question(generated_text, difficulty)
        else:
            return self._generate_short_answer_question(generated_text, difficulty)
    
    def _generate_fallback_questions(self, content: str, difficulty: str, question_type: str, number_of_questions: int) -> List[Dict[str, Any]]:
        """Generate fallback questions when AI fails"""
        questions = []
        
        # Split content into sentences
        sentences = content.split('.')[:number_of_questions]
        
        for i, sentence in enumerate(sentences):
            if not sentence.strip():
                continue
            
            if question_type == 'multiple_choice' or question_type == 'mixed':
                question = {
                    'text': f"What is the main topic discussed in: '{sentence.strip()}'?",
                    'type': 'multiple_choice',
                    'options': ['Topic A', 'Topic B', 'Topic C', 'Topic D'],
                    'correct_answer': 'Topic A',
                    'explanation': 'This is the main topic as mentioned in the text.',
                    'difficulty': difficulty
                }
            else:
                question = {
                    'text': f"Explain the main concept from: '{sentence.strip()}'",
                    'type': 'short_answer',
                    'correct_answer': 'Main concept',
                    'explanation': 'This is the main concept as described in the text.',
                    'difficulty': difficulty
                }
            
            questions.append(question)
        
        return questions
    
    def analyze_text_difficulty(self, text: str) -> str:
        """Analyze text difficulty level"""
        # Simple difficulty analysis based on word length and sentence complexity
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
        """Extract key concepts from text"""
        # Simple keyword extraction - in a real implementation, you'd use NLP libraries
        words = text.split()
        key_concepts = []
        
        for word in words:
            if len(word) > 5 and word.isalpha() and word.lower() not in ['the', 'and', 'for', 'with', 'that', 'this']:
                key_concepts.append(word.lower())
        
        return list(set(key_concepts))[:10]  # Return top 10 unique concepts
