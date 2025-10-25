# AI Ethics Guidelines

## Principles
- Transparency: explain quiz generation and limitations
- Privacy: no sensitive data sent to third parties without consent
- Fairness: avoid biased prompts and datasets
- Accountability: human-in-the-loop for high-stakes decisions

## Risks & Mitigations
- Hallucinations → Use local fallbacks, validate outputs
- Bias → Diverse training prompts, reviews
- Data leakage → Minimize inputs, redact PII

## Usage Policy
- Log prompts/responses scale (see docs/AI_Usage_Log.md)
- Provide opt-out for AI features

## Evaluation
- Manual review samples of generated questions
- Track user feedback and correction rates
