# Contributing

## Coding Standards
- Backend: Black, isort, Flake8 enforced in CI.
- Frontend: ESLint + TypeScript strict, CRA.
- See docs/STYLEGUIDE.md for rules, editor setup, and commands.

## Branching and PRs
- Create feature branches off `develop`.
- Open PRs to `develop` with clear description and checklist.
- All PRs must pass CI and meet coverage thresholds.

## Tests and Coverage
- Unit tests and integration tests required for each feature.
- Target coverage: ≥ 60% project-wide (raise as policy evolves).
- See docs/TESTING.md for commands and tips.

## CI
- GitHub Actions runs on push and PRs.
- Jobs: test-frontend, test-backend, build-and-test, security-scan.
- Coverage uploaded to Codecov if configured.

## Commit Messages
- Conventional commits recommended (feat, fix, docs, chore, test, refactor).

## Security
- Do not commit secrets. Use environment variables.
- Trivy scans run in CI; address HIGH/CRITICAL promptly.
