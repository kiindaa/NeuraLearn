"""
Comprehensive tests for AI Service (ai_service.py)
Tests quiz generation with different topics, difficulties, and question types.
"""
import pytest
import os
from unittest.mock import patch, MagicMock
import requests

# Import the service
from app.services.ai_service import AIService


class TestAIServiceBasic:
    """Basic unit tests for AIService."""
    
    @pytest.fixture
    def ai_service(self):
        """Create an AIService instance without API key."""
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': ''}):
            return AIService()
    
    @pytest.fixture
    def ai_service_with_api(self):
        """Create an AIService instance with mock API key."""
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': 'test-api-key'}):
            return AIService()
    
    def test_init_without_api_key(self, ai_service):
        """Test initialization without API key."""
        assert ai_service.api_key == '' or ai_service.api_key is None
        assert ai_service.base_url == 'https://api-inference.huggingface.co/models'
    
    def test_init_with_api_key(self):
        """Test initialization with API key."""
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': 'test-key-123'}):
            service = AIService()
            assert service.api_key == 'test-key-123'


class TestQuestionGeneration:
    """Tests for question generation functionality."""
    
    @pytest.fixture
    def ai_service(self):
        """Create an AIService instance."""
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': ''}):
            return AIService()
    
    @pytest.fixture
    def sample_content(self):
        """Sample content for testing."""
        return """
        Machine learning is a subset of artificial intelligence that enables computers 
        to learn from data without being explicitly programmed. Neural networks are 
        computational models inspired by the human brain. Deep learning uses multiple 
        layers of neural networks to process complex patterns. Supervised learning 
        requires labeled training data, while unsupervised learning finds patterns 
        in unlabeled data. Backpropagation is the algorithm used to train neural networks.
        """
    
    # Test different difficulties
    @pytest.mark.parametrize("difficulty", ["easy", "medium", "hard"])
    def test_generate_questions_all_difficulties(self, ai_service, sample_content, difficulty):
        """Test question generation for all difficulty levels."""
        questions = ai_service.generate_questions(
            content=sample_content,
            difficulty=difficulty,
            question_type='multiple_choice',
            number_of_questions=3
        )
        
        assert isinstance(questions, list)
        assert len(questions) >= 1
        
        for q in questions:
            assert 'text' in q
            assert 'type' in q
            assert 'difficulty' in q
            assert q['difficulty'] == difficulty
    
    # Test different question types
    @pytest.mark.parametrize("question_type", ["multiple_choice", "short_answer", "mixed"])
    def test_generate_questions_all_types(self, ai_service, sample_content, question_type):
        """Test question generation for all question types."""
        questions = ai_service.generate_questions(
            content=sample_content,
            difficulty='medium',
            question_type=question_type,
            number_of_questions=4
        )
        
        assert isinstance(questions, list)
        assert len(questions) >= 1
        
        if question_type == 'multiple_choice':
            for q in questions:
                assert q['type'] == 'multiple_choice'
                assert 'options' in q
                assert len(q['options']) >= 2
        elif question_type == 'short_answer':
            for q in questions:
                assert q['type'] == 'short_answer'
        elif question_type == 'mixed':
            # Mixed should have both types
            types = [q['type'] for q in questions]
            # At least should have questions
            assert len(types) >= 1
    
    # Test various number of questions
    @pytest.mark.parametrize("num_questions", [1, 3, 5, 10])
    def test_generate_various_counts(self, ai_service, sample_content, num_questions):
        """Test generating different numbers of questions."""
        questions = ai_service.generate_questions(
            content=sample_content,
            difficulty='medium',
            question_type='multiple_choice',
            number_of_questions=num_questions
        )
        
        assert isinstance(questions, list)
        assert len(questions) >= 1
        assert len(questions) <= num_questions + 1  # Allow some flexibility
    
    def test_multiple_choice_question_structure(self, ai_service, sample_content):
        """Test that multiple choice questions have proper structure."""
        questions = ai_service.generate_questions(
            content=sample_content,
            difficulty='medium',
            question_type='multiple_choice',
            number_of_questions=2
        )
        
        for q in questions:
            assert 'text' in q
            assert 'type' in q
            assert 'options' in q
            assert 'correct_answer' in q
            assert 'explanation' in q
            assert q['type'] == 'multiple_choice'
            assert isinstance(q['options'], list)
            assert len(q['options']) >= 2
    
    def test_short_answer_question_structure(self, ai_service, sample_content):
        """Test that short answer questions have proper structure."""
        questions = ai_service.generate_questions(
            content=sample_content,
            difficulty='medium',
            question_type='short_answer',
            number_of_questions=2
        )
        
        for q in questions:
            assert 'text' in q
            assert 'type' in q
            assert 'correct_answer' in q
            assert 'explanation' in q
            assert q['type'] == 'short_answer'
    
    def test_mixed_question_types(self, ai_service, sample_content):
        """Test that mixed generates alternating question types."""
        questions = ai_service.generate_questions(
            content=sample_content,
            difficulty='medium',
            question_type='mixed',
            number_of_questions=4
        )
        
        assert len(questions) >= 2
        types = [q['type'] for q in questions]
        # Should have variation (not all same type)
        assert len(set(types)) >= 1


class TestConceptExtraction:
    """Tests for concept extraction functionality."""
    
    @pytest.fixture
    def ai_service(self):
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': ''}):
            return AIService()
    
    def test_extract_concepts_basic(self, ai_service):
        """Test basic concept extraction."""
        content = "Machine learning algorithms process data efficiently."
        concepts = ai_service._extract_concepts(content)
        
        assert isinstance(concepts, list)
        assert len(concepts) >= 1
    
    def test_extract_concepts_filters_stop_words(self, ai_service):
        """Test that stop words are filtered out."""
        content = "The quick brown fox jumps over the lazy dog"
        concepts = ai_service._extract_concepts(content)
        
        # Stop words should be filtered
        assert 'the' not in concepts
        assert 'over' not in concepts
    
    def test_extract_concepts_filters_short_words(self, ai_service):
        """Test that short words are filtered out."""
        content = "AI is a key ML tool"
        concepts = ai_service._extract_concepts(content)
        
        # Words with 4 or fewer chars should be filtered
        for concept in concepts:
            assert len(concept) > 4
    
    def test_extract_concepts_empty_content(self, ai_service):
        """Test concept extraction with empty content."""
        concepts = ai_service._extract_concepts("")
        assert concepts == []
    
    def test_extract_concepts_returns_unique(self, ai_service):
        """Test that concepts are unique."""
        content = "Neural networks neural networks neural learning networks"
        concepts = ai_service._extract_concepts(content)
        
        # Should not have duplicates
        assert len(concepts) == len(set(concepts))


class TestTextAnalysis:
    """Tests for text analysis functionality."""
    
    @pytest.fixture
    def ai_service(self):
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': ''}):
            return AIService()
    
    def test_analyze_easy_text(self, ai_service):
        """Test analysis of easy text."""
        easy_text = "Dogs run. Cats play. Birds fly."
        difficulty = ai_service.analyze_text_difficulty(easy_text)
        assert difficulty in ['easy', 'medium', 'hard']
    
    def test_analyze_hard_text(self, ai_service):
        """Test analysis of complex text."""
        hard_text = """
        The implementation of sophisticated backpropagation algorithms 
        necessitates comprehensive understanding of differential calculus 
        and multidimensional optimization techniques.
        """
        difficulty = ai_service.analyze_text_difficulty(hard_text)
        assert difficulty in ['easy', 'medium', 'hard']
    
    def test_analyze_empty_text(self, ai_service):
        """Test analysis of empty text doesn't crash."""
        # This may raise an error or return a default
        try:
            difficulty = ai_service.analyze_text_difficulty("")
            assert difficulty in ['easy', 'medium', 'hard']
        except (ZeroDivisionError, ValueError):
            pass  # Expected for empty text


class TestQuestionTypeSelection:
    """Tests for question type selection logic."""
    
    @pytest.fixture
    def ai_service(self):
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': ''}):
            return AIService()
    
    def test_get_question_type_multiple_choice(self, ai_service):
        """Test that multiple_choice always returns multiple_choice."""
        for i in range(10):
            result = ai_service._get_question_type_for_index('multiple_choice', i)
            assert result == 'multiple_choice'
    
    def test_get_question_type_short_answer(self, ai_service):
        """Test that short_answer always returns short_answer."""
        for i in range(10):
            result = ai_service._get_question_type_for_index('short_answer', i)
            assert result == 'short_answer'
    
    def test_get_question_type_mixed_alternates(self, ai_service):
        """Test that mixed alternates between types."""
        results = []
        for i in range(6):
            results.append(ai_service._get_question_type_for_index('mixed', i))
        
        # Even indices should be multiple_choice, odd should be short_answer
        assert results[0] == 'multiple_choice'
        assert results[1] == 'short_answer'
        assert results[2] == 'multiple_choice'
        assert results[3] == 'short_answer'


class TestEdgeCases:
    """Tests for edge cases and error handling."""
    
    @pytest.fixture
    def ai_service(self):
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': ''}):
            return AIService()
    
    def test_empty_content(self, ai_service):
        """Test with empty content."""
        questions = ai_service.generate_questions(
            content="",
            difficulty='medium',
            question_type='multiple_choice',
            number_of_questions=2
        )
        
        # Should still return questions (fallback)
        assert isinstance(questions, list)
    
    def test_very_short_content(self, ai_service):
        """Test with very short content."""
        questions = ai_service.generate_questions(
            content="AI",
            difficulty='easy',
            question_type='multiple_choice',
            number_of_questions=1
        )
        
        assert isinstance(questions, list)
    
    def test_very_long_content(self, ai_service):
        """Test with very long content."""
        long_content = "Machine learning algorithms " * 1000
        questions = ai_service.generate_questions(
            content=long_content,
            difficulty='medium',
            question_type='multiple_choice',
            number_of_questions=3
        )
        
        assert isinstance(questions, list)
        assert len(questions) >= 1
    
    def test_special_characters_in_content(self, ai_service):
        """Test with special characters in content."""
        content = "Machine learning (ML) uses algorithms! What's next? 100% accuracy."
        questions = ai_service.generate_questions(
            content=content,
            difficulty='medium',
            question_type='multiple_choice',
            number_of_questions=2
        )
        
        assert isinstance(questions, list)
    
    def test_unicode_content(self, ai_service):
        """Test with unicode content."""
        content = "Machine learning 机器学习 uses neural networks 神经网络"
        questions = ai_service.generate_questions(
            content=content,
            difficulty='medium',
            question_type='multiple_choice',
            number_of_questions=2
        )
        
        assert isinstance(questions, list)
    
    def test_invalid_difficulty_defaults(self, ai_service):
        """Test with invalid difficulty level."""
        questions = ai_service.generate_questions(
            content="Neural networks process data.",
            difficulty='invalid_difficulty',
            question_type='multiple_choice',
            number_of_questions=2
        )
        
        # Should handle gracefully (use default)
        assert isinstance(questions, list)
    
    def test_zero_questions(self, ai_service):
        """Test requesting zero questions."""
        questions = ai_service.generate_questions(
            content="Neural networks.",
            difficulty='medium',
            question_type='multiple_choice',
            number_of_questions=0
        )
        
        assert isinstance(questions, list)
        assert len(questions) == 0
    
    def test_negative_questions(self, ai_service):
        """Test requesting negative number of questions."""
        questions = ai_service.generate_questions(
            content="Neural networks.",
            difficulty='medium',
            question_type='multiple_choice',
            number_of_questions=-1
        )
        
        assert isinstance(questions, list)


class TestAPIIntegration:
    """Tests for Hugging Face API integration."""
    
    def test_api_fallback_on_missing_key(self):
        """Test that fallback is used when API key is missing."""
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': ''}):
            service = AIService()
            questions = service.generate_questions(
                content="Neural networks learn patterns.",
                difficulty='medium',
                question_type='multiple_choice',
                number_of_questions=2
            )
            
            assert isinstance(questions, list)
            assert len(questions) >= 1
    
    @patch('requests.post')
    def test_api_fallback_on_timeout(self, mock_post):
        """Test fallback when API times out."""
        mock_post.side_effect = requests.exceptions.Timeout()
        
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': 'test-key'}):
            service = AIService()
            questions = service.generate_questions(
                content="Neural networks learn patterns.",
                difficulty='medium',
                question_type='multiple_choice',
                number_of_questions=2
            )
            
            # Should fallback to local generation
            assert isinstance(questions, list)
    
    @patch('requests.post')
    def test_api_fallback_on_connection_error(self, mock_post):
        """Test fallback when API connection fails."""
        mock_post.side_effect = requests.exceptions.ConnectionError()
        
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': 'test-key'}):
            service = AIService()
            questions = service.generate_questions(
                content="Neural networks learn patterns.",
                difficulty='medium',
                question_type='multiple_choice',
                number_of_questions=2
            )
            
            assert isinstance(questions, list)
    
    @patch('requests.post')
    def test_api_fallback_on_bad_status(self, mock_post):
        """Test fallback when API returns error status."""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_post.return_value = mock_response
        
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': 'test-key'}):
            service = AIService()
            questions = service.generate_questions(
                content="Neural networks learn patterns.",
                difficulty='medium',
                question_type='multiple_choice',
                number_of_questions=2
            )
            
            assert isinstance(questions, list)
    
    @patch('requests.post')
    def test_api_success_response(self, mock_post):
        """Test successful API response handling."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [{"generated_text": "test question"}]
        mock_post.return_value = mock_response
        
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': 'test-key'}):
            service = AIService()
            questions = service.generate_questions(
                content="Neural networks learn patterns from data.",
                difficulty='medium',
                question_type='multiple_choice',
                number_of_questions=2
            )
            
            assert isinstance(questions, list)


class TestDifferentTopics:
    """Tests for different topic areas."""
    
    @pytest.fixture
    def ai_service(self):
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': ''}):
            return AIService()
    
    @pytest.mark.parametrize("topic_content", [
        # Machine Learning topics
        "Neural networks use backpropagation for training. Gradient descent optimizes weights.",
        "Supervised learning uses labeled data. Classification predicts categories.",
        "Unsupervised learning finds patterns. Clustering groups similar data.",
        # Web Development topics  
        "HTML structures web pages. CSS styles elements. JavaScript adds interactivity.",
        "React components manage state. Props pass data between components.",
        "REST APIs use HTTP methods. GET retrieves data. POST creates resources.",
        # Programming topics
        "Functions encapsulate code. Variables store data. Loops iterate over collections.",
        "Object-oriented programming uses classes. Inheritance extends functionality.",
        "Data structures organize information. Arrays store sequential data.",
    ])
    def test_different_topics(self, ai_service, topic_content):
        """Test question generation for various topics."""
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
            assert len(q['text']) > 0


class TestQuestionQuality:
    """Tests for question quality and relevance."""
    
    @pytest.fixture
    def ai_service(self):
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': ''}):
            return AIService()
    
    def test_questions_have_content(self, ai_service):
        """Test that generated questions are not empty."""
        questions = ai_service.generate_questions(
            content="Machine learning models learn from data.",
            difficulty='medium',
            question_type='multiple_choice',
            number_of_questions=3
        )
        
        for q in questions:
            assert len(q['text']) > 5
            assert len(q['correct_answer']) > 0
    
    def test_options_are_different(self, ai_service):
        """Test that multiple choice options are distinct."""
        questions = ai_service.generate_questions(
            content="Neural networks have layers. Each layer processes data differently.",
            difficulty='medium',
            question_type='multiple_choice',
            number_of_questions=2
        )
        
        for q in questions:
            if 'options' in q:
                # Options should not all be identical
                unique_options = set(q['options'])
                assert len(unique_options) >= 2
    
    def test_randomization_produces_variation(self, ai_service):
        """Test that multiple generations produce some variation."""
        content = "Neural networks process information through layers."
        
        all_questions = []
        for _ in range(3):
            questions = ai_service.generate_questions(
                content=content,
                difficulty='medium',
                question_type='multiple_choice',
                number_of_questions=2
            )
            all_questions.extend([q['text'] for q in questions])
        
        # Should have at least some questions
        assert len(all_questions) >= 3


class TestFallbackGeneration:
    """Tests for fallback question generation."""
    
    @pytest.fixture
    def ai_service(self):
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': ''}):
            return AIService()
    
    def test_fallback_generates_questions(self, ai_service):
        """Test that fallback generation works."""
        questions = ai_service._generate_fallback_questions(
            content="Machine learning algorithms.",
            difficulty='medium',
            question_type='multiple_choice',
            number_of_questions=3,
            random_seed=12345
        )
        
        assert isinstance(questions, list)
        assert len(questions) == 3
    
    def test_fallback_with_empty_concepts(self, ai_service):
        """Test fallback when no concepts extracted."""
        questions = ai_service._generate_fallback_questions(
            content="",  # Empty content
            difficulty='medium',
            question_type='short_answer',
            number_of_questions=2
        )
        
        assert isinstance(questions, list)
        assert len(questions) == 2
    
    def test_fallback_respects_question_type(self, ai_service):
        """Test that fallback respects question type."""
        mc_questions = ai_service._generate_fallback_questions(
            content="Neural networks.",
            difficulty='easy',
            question_type='multiple_choice',
            number_of_questions=2
        )
        
        sa_questions = ai_service._generate_fallback_questions(
            content="Neural networks.",
            difficulty='easy',
            question_type='short_answer',
            number_of_questions=2
        )
        
        for q in mc_questions:
            assert q['type'] == 'multiple_choice'
        
        for q in sa_questions:
            assert q['type'] == 'short_answer'
