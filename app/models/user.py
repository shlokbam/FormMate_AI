from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app import db, login_manager
from datetime import datetime

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    qa_pairs = db.relationship('QAPair', backref='user', lazy=True)
    submissions = db.relationship('FormSubmission', backref='user', lazy=True)

    def match_answers(self, questions):
        """Match questions with saved Q&A pairs"""
        matched_answers = {}
        for qa in self.qa_pairs:
            for question in questions:
                if qa.question.lower() in question['text'].lower():
                    matched_answers[question['id']] = qa.answer
        return matched_answers

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id)) 