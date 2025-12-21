# NeuraLearn 🧠📚

An AI-powered adaptive learning platform that provides personalized education experiences through intelligent quiz generation, progress tracking, and course management.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.9+-green.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

## 🌟 Features

### For Students
- **📖 Course Management** - Browse and enroll in courses across various topics
- **🤖 AI-Powered Quiz Generation** - Generate topic-specific quizzes with intelligent question selection
- **📊 Progress Tracking** - Monitor your learning journey with detailed analytics
- **🎯 Personalized Learning** - Adaptive content based on your performance
- **🔍 Smart Search** - Quickly find courses and content

### For Instructors
- **📝 Course Creation** - Create and manage comprehensive courses
- **📈 Student Analytics** - Track student progress and performance
- **❓ Quiz Management** - Create custom quizzes and assessments
- **👥 Class Management** - Manage enrolled students and groups

### AI Features
- **Intelligent Question Generation** - Generates questions tailored to specific topics
- **Multiple Question Types** - Supports multiple choice, short answer, and mixed formats
- **Topic-Specific Banks** - Curated question banks for Web Development, Machine Learning, and more
- **Adaptive Difficulty** - Questions adjusted based on learner level

### Tech Stack
- Full-stack app: React + TypeScript + Flask + SQLAlchemy
- JWT authentication with role-based access
- Real-time analytics dashboards

## 🏗️ Architecture

```
NeuraLearn/
├── backend/                 # Flask REST API
│   ├── app/
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic & AI services
│   │   └── utils/          # Helpers & validators
│   ├── migrations/         # Database migrations (Alembic)
│   └── tests/              # Backend test suite
├── frontend/               # React TypeScript SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   └── utils/          # Helper functions
│   └── cypress/            # E2E tests
├── docs/                   # Documentation
│   ├── api/               # API specifications (OpenAPI)
│   ├── diagrams/          # Architecture diagrams
│   └── AI-Ethics/         # AI ethics documentation
└── tests/                  # Integration tests
```

### Tech Details
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Flask, SQLAlchemy, JWT, services/blueprints pattern
- Database: PostgreSQL (production), SQLite (tests)
- See docs/Architecture.md and diagrams in docs/diagrams

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+ (or set DATABASE_URL to your instance)

### Backend Setup
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### Configure Environment
```bash
# Windows
set DATABASE_URL=postgresql://postgres:password@localhost/neuralearn
set JWT_SECRET_KEY=dev-jwt

# macOS/Linux
export DATABASE_URL=postgresql://postgres:password@localhost/neuralearn
export JWT_SECRET_KEY=dev-jwt
```

### Start Backend
```bash
flask --app app.py run
# or
python run.py
```
The API will be available at `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install
npm start
# or
npm run dev
```
The app will be available at `http://localhost:3000`

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
pytest --maxfail=1 --disable-warnings -q
pytest --cov=app --cov-report=term-missing  # With coverage
pytest --cov=app --cov-report=html          # HTML coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                    # Unit tests
npm run cypress:open        # E2E tests (interactive)
npm run cypress:run         # E2E tests (headless)
```

## 📖 API Documentation
- OpenAPI spec: `docs/api/openapi.yaml`
- Key areas: auth, courses, quiz, users, dashboard

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/courses` | List all courses |
| GET | `/api/courses/:id` | Get course details |
| POST | `/api/quiz/generate` | Generate AI quiz |
| GET | `/api/progress/dashboard` | Get user progress |

## 🐳 Deployment

### Using Docker
```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up
```

### CI/CD
- GitHub Actions workflow: `.github/workflows/ci-cd.yml`

## 📚 Documentation
- [Architecture](docs/Architecture.md) - System design overview
- [AI Ethics](docs/AI-Ethics/AI-Ethics.md) - AI usage guidelines
- [Features](docs/Features.md) - Feature specifications
- [Demo Guide](docs/DEMO.md) - Demo walkthrough
- [Changelog](docs/CHANGELOG.md) - Version history
- [Style Guide](docs/STYLEGUIDE.md) - Code style conventions
- [Testing Guide](docs/TESTING.md) - Testing best practices
- [API Spec](docs/api/openapi.yaml) - OpenAPI specification
- [Contributing](CONTRIBUTING.md) - Contribution guidelines

### Diagrams
Architecture diagrams available in `docs/diagrams/` (PlantUML + Mermaid formats)

---

## 🔒 Security
- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation and sanitization
- SQL injection prevention via ORM

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⚙️ CI and Coverage Policy
- CI runs on push and PR via GitHub Actions
- **Frontend**: lint, type-check, test:coverage
- **Backend**: flake8, black --check, isort --check-only, pytest with coverage
- **Security**: Trivy scan, results uploaded to Security tab
- **Coverage target**: ≥ 60% repository-wide

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Author

- **Kinda** - Lead Developer - [@kiindaa](https://github.com/kiindaa)

---

<p align="center">
  Made with ❤️ for learners everywhere
</p>
