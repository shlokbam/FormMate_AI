import os

class Config:
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key')
    
    # OpenAI
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH = 'firebase-credentials.json'
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Google OAuth
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI')
    GOOGLE_OAUTH_SCOPES = os.environ.get('GOOGLE_OAUTH_SCOPES')

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    # Add any production-specific settings here

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
} 