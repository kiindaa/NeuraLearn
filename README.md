# NeuraLearn

An AI-assisted learning platform with quiz generation, progress analytics, and a modern React + Flask stack.

## Features
- AI-powered quiz generation from lesson content
- Student and instructor dashboards with analytics
- Course management, enrollments, and lesson tracking
- JWT authentication with roles
- Full-stack app: React (Vite) + Flask + SQLAlchemy

## Architecture (at a glance)
- Frontend: React + TypeScript + Tailwind
- Backend: Flask, SQLAlchemy, JWT, services/blueprints pattern
- Database: Postgres (dev default), SQLite for tests
- See docs/Architecture.md and diagrams in docs/diagrams

## Getting Started
1) Prerequisites
   - Node 18+
   - Python 3.10+
   - Postgres 14+ (or set DATABASE_URL to your instance)

2) Backend
```
cd backend
python -m venv .venv && .venv\\Scripts\\activate  # Windows
pip install -r requirements.txt
set DATABASE_URL=postgresql://postgres:password@localhost/neuralearn
set JWT_SECRET_KEY=dev-jwt
flask --app app.py run
```

3) Frontend
```
cd frontend
npm install
npm run dev
```

## Running Tests (backend)
```
cd backend
pytest --maxfail=1 --disable-warnings -q
pytest --cov=app --cov-report=term-missing
```

## API
- OpenAPI spec: docs/api/openapi.yaml
- Key areas: auth, courses, quiz, users, dashboard

## Deployment
- Docker Compose provided for local/prod: docker-compose.yml, docker-compose.prod.yml
- CI: .github/workflows/ci-cd.yml

## Documentation
- docs/Architecture.md
- docs/AI-Ethics/AI-Ethics.md
- docs/Features.md
- docs/DEMO.md
- docs/CHANGELOG.md
- docs/Refactor.md
- docs/AI_Usage_Log.md
- docs/diagrams/* (Mermaid + export instructions)
- docs/api/openapi.yaml

---

For additional notes see docs/session-notes.md and docs/TESTCASES.md.
