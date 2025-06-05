import os

class Config:
    # Flask
    SECRET_KEY = 'your-secret-key-here'
    
    # OpenAI
    OPENAI_API_KEY = 'your-openai-api-key-here'
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH = 'firebase-credentials.json'
    
    # Database
    SQLALCHEMY_DATABASE_URI = 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
} 