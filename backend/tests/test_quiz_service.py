from app.services.quiz_service import QuizService


def test_check_answer_returns_shape(app):
    qs = QuizService()
    res = qs.check_question_answer('nonexistent', 'nonexistent', 'A')
    assert isinstance(res, dict)
    assert 'isCorrect' in res
