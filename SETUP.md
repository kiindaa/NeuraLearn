# NeuraLearn - AI-Assisted E-Learning Platform

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 13+
- Docker (optional)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd neuralearn
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Set up database
createdb neuralearn
flask db upgrade

# Seed sample data
python seed_data.py

# Start backend server
flask run
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm start
```

### 4. Docker Setup (Alternative)

```bash
# Start all services
docker-compose up --build

# Or start individual services
docker-compose up frontend backend postgres
```

## 🎯 Features Implemented

### ✅ Authentication System
- JWT-based authentication
- Role-based access control (Student/Instructor/Admin)
- Secure password hashing
- Token refresh mechanism

### ✅ Student Dashboard
- Progress metrics (Enrolled Courses, Lessons Completed, Quizzes Taken, Average Score)
- Course cards with progress tracking
- Upcoming quizzes with dates
- Responsive design matching screenshots

### ✅ Course Management
- Course detail pages with lesson lists
- Video player integration
- Lesson progress tracking
- Enrollment system

### ✅ AI Quiz Generation
- Hugging Face AI integration
- Lesson selection interface
- Difficulty and question type configuration
- Real-time quiz generation
- Multiple question types (Multiple Choice, Short Answer, Mixed)

### ✅ Modern UI/UX
- Custom AI+Education logo with multiple variants
- Tailwind CSS styling
- Responsive mobile-first design
- Component library with reusable UI elements
- Loading states and error handling

### ✅ Backend API
- Flask REST API with comprehensive endpoints
- PostgreSQL database with SQLAlchemy ORM
- Database migrations
- Service layer architecture
- Input validation and error handling

### ✅ Testing & Quality
- Comprehensive test suite (Frontend & Backend)
- Unit tests, integration tests, and E2E tests
- Code coverage reporting
- Linting and code formatting
- Security scanning

### ✅ DevOps & Deployment
- Docker containerization
- GitHub Actions CI/CD pipeline
- Production deployment configuration
- Environment management
- Database seeding

## 📁 Project Structure

```
neuralearn/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── types/          # TypeScript types
│   │   ├── contexts/       # React contexts
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Flask backend
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/         # Utilities
│   ├── migrations/         # Database migrations
│   └── requirements.txt
├── tests/                  # Test suites
├── docker/                 # Docker configuration
├── .github/workflows/      # CI/CD workflows
└── docs/                   # Documentation
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```
FLASK_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost/neuralearn
JWT_SECRET_KEY=your-secret-key
HUGGINGFACE_API_KEY=your-hf-api-key
```

**Frontend (.env.local)**
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test
npm run test:coverage

# Backend tests
cd backend
pytest tests/ --cov=app --cov-report=html

# E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Production Build

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
gunicorn --bind 0.0.0.0:5000 app:create_app()
```

### Docker Deployment

```bash
# Production
docker-compose -f docker-compose.prod.yml up -d

# Development
docker-compose up --build
```

## 📊 Sample Data

The application includes comprehensive sample data:

- **Users**: Student, Instructor, Admin accounts
- **Courses**: Machine Learning, Web Development, Data Structures
- **Lessons**: Detailed lesson content for each course
- **Quizzes**: Pre-configured quizzes with questions
- **Progress**: Sample progress tracking data

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- SQL injection prevention
- XSS protection

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: 320px, 768px, 1024px, 1200px+
- Touch-friendly interfaces
- Optimized for all devices

## 🤖 AI Integration

- Hugging Face API integration
- Local model fallback
- Question generation from lesson content
- Multiple difficulty levels
- Various question types

## 📈 Performance

- Code splitting and lazy loading
- Image optimization
- Caching strategies
- Database query optimization
- CDN-ready static assets

## 🛠️ Development

### Code Quality
- ESLint and Prettier for frontend
- Black, Flake8, and isort for backend
- TypeScript strict mode
- Comprehensive error handling

### Git Workflow
- Feature branches
- Pull request reviews
- Automated testing
- Code coverage requirements

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the test cases
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**NeuraLearn** - Empowering education through AI-driven learning experiences.
