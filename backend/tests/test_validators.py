from app.utils.validators import (
    validate_email, validate_password, validate_phone, validate_url,
    sanitize_input, validate_course_data, validate_lesson_data,
    validate_quiz_data, validate_question_data
)


def test_validate_email():
    assert validate_email('user@example.com') is True
    assert validate_email('bad-email') is False


def test_validate_password():
    res = validate_password('Aa1!aaaa')
    assert res['is_valid'] is True
    res2 = validate_password('short')
    assert res2['is_valid'] is False
    assert any('at least 8' in e.lower() for e in res2['errors'])


def test_misc_validators():
    assert validate_phone('+12345678901') is True
    assert validate_phone('123') is False
    assert validate_url('https://example.com/path?q=1') is True
    assert validate_url('ftp://bad') is False
    assert sanitize_input('<b>Hi</b><script>alert(1)</script>') == 'Hi'


def test_validate_course_lesson_quiz_question():
    course_ok = validate_course_data({
        'title': 'ML1', 'description': 'Introduction to ML',
        'difficulty': 'beginner', 'category': 'AI'
    })
    assert course_ok['is_valid'] is True

    lesson_bad = validate_lesson_data({
        'title': 'x', 'description': 'short', 'content': 'tiny', 'duration': 0, 'order': -1
    })
    assert lesson_bad['is_valid'] is False

    quiz_ok = validate_quiz_data({
        'title': 'Quiz 1', 'description': 'A valid description', 'difficulty': 'easy', 'duration': 10
    })
    assert quiz_ok['is_valid'] is True

    question_bad = validate_question_data({
        'text': 'too short', 'type': 'multiple_choice', 'options': ['A'], 'correct_answer': '', 'difficulty': 'hard', 'points': 0
    })
    assert question_bad['is_valid'] is False
