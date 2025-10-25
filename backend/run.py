import os
from app import create_app

# Set environment variables directly
os.environ['FLASK_ENV'] = 'development'
os.environ['FLASK_DEBUG'] = 'True'
os.environ['SECRET_KEY'] = 'dev-secret-key-change-in-production'
os.environ['JWT_SECRET_KEY'] = 'jwt-secret-string-change-in-production'
os.environ['DATABASE_URL'] = 'sqlite:///neuralearn.db'

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)