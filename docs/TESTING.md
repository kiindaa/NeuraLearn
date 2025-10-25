# Testing

## Goals
- Each feature must include unit tests and, where applicable, integration tests.
- Target coverage ≥ 60% (course policy adjustable). Aim higher when possible.

## Backend
- Install deps: `pip install -r backend/requirements.txt`
- Run tests: `cd backend && pytest --cov=app --cov-report=term-missing`
- Coverage HTML: `pytest --cov=app --cov-report=html` → open `backend/htmlcov/index.html`
- Lint/format checks: `flake8 app/`, `black --check app/`, `isort --check-only app/`

## Frontend
- Install deps: `cd frontend && npm ci`
- Lint: `npm run lint`
- Type-check: `npm run type-check`
- Tests with coverage: `npm run test:coverage`

## CI
- GitHub Actions runs on push and PRs (see .github/workflows/ci-cd.yml):
  - test-frontend: lint, type-check, test:coverage
  - test-backend: flake8, black --check, isort --check-only, pytest with coverage
  - build-and-test: builds and runs e2e (compose)
  - security-scan: Trivy vulnerability scan

## Writing Tests
- Backend: pytest with fixtures in backend/tests/conftest.py
- Frontend: React Testing Library for UI; keep tests close to code or under `src/__tests__`

## Coverage Thresholds
- Backend: enforce minimum via pytest.ini (fail under threshold)
- Frontend: use CI gate on Codecov or parse Jest summary
