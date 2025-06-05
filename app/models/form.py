from app import db
from datetime import datetime

class QAPair(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    question = db.Column(db.String(500), nullable=False)
    answer = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class FormSubmission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    form_url = db.Column(db.String(500), nullable=False)
    questions = db.Column(db.JSON, nullable=False)
    answers = db.Column(db.JSON, nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow) 