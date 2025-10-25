# Architecture

- Frontend: React + TypeScript + Tailwind, Vite dev server
- Backend: Flask app factory, Blueprints (auth, courses, quiz, users, dashboard), Services layer, SQLAlchemy ORM
- DB: Postgres (prod/dev), SQLite (tests)
- Auth: JWT (flask-jwt-extended)
- AI: AIService wraps external Hugging Face API with local fallbacks

## Key Modules
- app/__init__.py: create_app, extension init, blueprint register
- app/routes/*: HTTP endpoints
- app/services/*: business logic
- app/models/*: SQLAlchemy models

## Data Flow (quiz generation)
1. Frontend sends POST /api/quiz/generate
2. quiz_bp calls QuizService.generate_quiz
3. AIService generates questions (API or local)
4. Quiz + Questions persisted via SQLAlchemy
5. Response returns quiz payload

See diagrams in docs/diagrams for detailed flows.
