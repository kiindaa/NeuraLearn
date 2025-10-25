import re
from typing import Dict, List

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> Dict[str, any]:
    """Validate password strength"""
    errors = []
    
    if len(password) < 8:
        errors.append('Password must be at least 8 characters long')
    
    if not re.search(r'[A-Z]', password):
        errors.append('Password must contain at least one uppercase letter')
    
    if not re.search(r'[a-z]', password):
        errors.append('Password must contain at least one lowercase letter')
    
    if not re.search(r'\d', password):
        errors.append('Password must contain at least one number')
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append('Password must contain at least one special character')
    
    return {
        'is_valid': len(errors) == 0,
        'errors': errors
    }

def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    pattern = r'^\+?1?\d{9,15}$'
    return re.match(pattern, phone) is not None

def validate_url(url: str) -> bool:
    """Validate URL format"""
    pattern = r'^https?://(?:[-\w.])+(?:\:[0-9]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$'
    return re.match(pattern, url) is not None

def sanitize_input(text: str) -> str:
    """Sanitize user input"""
    if not text:
        return ''
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove script tags
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove potentially dangerous characters
    text = re.sub(r'[<>"\']', '', text)
    
    return text.strip()

def validate_course_data(data: Dict) -> Dict[str, any]:
    """Validate course data"""
    errors = []
    
    if not data.get('title') or len(data['title'].strip()) < 3:
        errors.append('Title must be at least 3 characters long')
    
    if not data.get('description') or len(data['description'].strip()) < 10:
        errors.append('Description must be at least 10 characters long')
    
    if data.get('difficulty') not in ['beginner', 'intermediate', 'advanced']:
        errors.append('Difficulty must be beginner, intermediate, or advanced')
    
    if not data.get('category') or len(data['category'].strip()) < 2:
        errors.append('Category must be at least 2 characters long')
    
    return {
        'is_valid': len(errors) == 0,
        'errors': errors
    }

def validate_lesson_data(data: Dict) -> Dict[str, any]:
    """Validate lesson data"""
    errors = []
    
    if not data.get('title') or len(data['title'].strip()) < 3:
        errors.append('Title must be at least 3 characters long')
    
    if not data.get('description') or len(data['description'].strip()) < 10:
        errors.append('Description must be at least 10 characters long')
    
    if not data.get('content') or len(data['content'].strip()) < 20:
        errors.append('Content must be at least 20 characters long')
    
    if not isinstance(data.get('duration'), int) or data['duration'] < 1:
        errors.append('Duration must be a positive integer')
    
    if not isinstance(data.get('order'), int) or data['order'] < 0:
        errors.append('Order must be a non-negative integer')
    
    return {
        'is_valid': len(errors) == 0,
        'errors': errors
    }

def validate_quiz_data(data: Dict) -> Dict[str, any]:
    """Validate quiz data"""
    errors = []
    
    if not data.get('title') or len(data['title'].strip()) < 3:
        errors.append('Title must be at least 3 characters long')
    
    if not data.get('description') or len(data['description'].strip()) < 10:
        errors.append('Description must be at least 10 characters long')
    
    if data.get('difficulty') not in ['easy', 'medium', 'hard']:
        errors.append('Difficulty must be easy, medium, or hard')
    
    if not isinstance(data.get('duration'), int) or data['duration'] < 1:
        errors.append('Duration must be a positive integer')
    
    return {
        'is_valid': len(errors) == 0,
        'errors': errors
    }

def validate_question_data(data: Dict) -> Dict[str, any]:
    """Validate question data"""
    errors = []
    
    if not data.get('text') or len(data['text'].strip()) < 10:
        errors.append('Question text must be at least 10 characters long')
    
    if data.get('type') not in ['multiple_choice', 'short_answer', 'essay']:
        errors.append('Question type must be multiple_choice, short_answer, or essay')
    
    if not data.get('correct_answer') or len(data['correct_answer'].strip()) < 1:
        errors.append('Correct answer is required')
    
    if data.get('type') == 'multiple_choice' and not data.get('options'):
        errors.append('Options are required for multiple choice questions')
    
    if data.get('type') == 'multiple_choice' and len(data.get('options', [])) < 2:
        errors.append('Multiple choice questions must have at least 2 options')
    
    if data.get('difficulty') not in ['easy', 'medium', 'hard']:
        errors.append('Difficulty must be easy, medium, or hard')
    
    if not isinstance(data.get('points'), int) or data['points'] < 1:
        errors.append('Points must be a positive integer')
    
    return {
        'is_valid': len(errors) == 0,
        'errors': errors
    }
