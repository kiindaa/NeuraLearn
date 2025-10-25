# Style Guide

## Backend (Python)
- Formatter: Black (line length 88)
- Import sorter: isort (profile = black)
- Linter: Flake8
- Run locally:
  - black app/
  - isort app/
  - flake8 app/
- CI enforces black --check, isort --check-only, flake8 on backend/app

## Frontend (TypeScript/React)
- Linter: ESLint with TypeScript and React plugins
- Type-checker: `tsc --noEmit`
- Scripts:
  - npm run lint
  - npm run type-check

## Commit Style
- Conventional Commits (feat, fix, docs, chore, test, refactor)

## Editor Setup
- Enable format on save (Black via Python extension; ESLint for TS/TSX)
- Prettier optional for Markdown/JSON formatting

## References
- ESLint rules: frontend/.eslintrc.json
- Python: PEP8, Black, isort
