from app.services.ai_service import AIService

def test_ai_local_generation():
    ai = AIService()
    qs = ai.generate_questions('Neural networks are powerful models. They learn representations.', 'easy', 'multiple_choice', 2)
    assert isinstance(qs, list)
    assert len(qs) >= 1


def test_ai_analysis_extract():
    ai = AIService()
    diff = ai.analyze_text_difficulty('Short sentence.')
    assert diff in ('easy','medium','hard')
    concepts = ai.extract_key_concepts('Representation Learning and Generalization in Networks')
    assert isinstance(concepts, list)
