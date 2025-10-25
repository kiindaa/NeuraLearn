#!/bin/bash

# NeuraLearn Setup Script
# This script sets up the complete NeuraLearn AI e-learning platform

set -e

echo "🚀 Setting up NeuraLearn AI E-Learning Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.9+ from https://python.org/"
        exit 1
    fi
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL is not installed. Please install PostgreSQL 13+ from https://postgresql.org/"
        exit 1
    fi
    
    print_success "All requirements are met!"
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    print_status "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Setup environment variables
    if [ ! -f ".env" ]; then
        print_status "Creating environment file..."
        cp env.example .env
        print_warning "Please edit backend/.env with your configuration"
    fi
    
    # Setup database
    print_status "Setting up database..."
    createdb neuralearn 2>/dev/null || print_warning "Database 'neuralearn' might already exist"
    
    # Run migrations
    print_status "Running database migrations..."
    flask db upgrade
    
    # Seed sample data
    print_status "Seeding sample data..."
    python seed_data.py
    
    cd ..
    print_success "Backend setup complete!"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Setup environment variables
    if [ ! -f ".env.local" ]; then
        print_status "Creating environment file..."
        cp env.example .env.local
        print_warning "Please edit frontend/.env.local with your configuration"
    fi
    
    cd ..
    print_success "Frontend setup complete!"
}

# Setup Docker (optional)
setup_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        print_status "Docker is available. You can also run: docker-compose up --build"
    else
        print_warning "Docker not found. Skipping Docker setup."
    fi
}

# Main setup function
main() {
    echo "🎓 NeuraLearn AI E-Learning Platform Setup"
    echo "=========================================="
    
    check_requirements
    setup_backend
    setup_frontend
    setup_docker
    
    echo ""
    print_success "🎉 Setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Edit backend/.env with your database and API keys"
    echo "2. Edit frontend/.env.local with your API URL"
    echo "3. Start the backend: cd backend && source venv/bin/activate && flask run"
    echo "4. Start the frontend: cd frontend && npm start"
    echo "5. Visit http://localhost:3000 to see your app!"
    echo ""
    echo "🔑 Default login credentials:"
    echo "   Student: student@neuralearn.com / password123"
    echo "   Instructor: instructor@neuralearn.com / password123"
    echo "   Admin: admin@neuralearn.com / password123"
    echo ""
    echo "📚 For more information, see README.md and SETUP.md"
}

# Run main function
main "$@"
