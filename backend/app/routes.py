from flask import Blueprint, request, jsonify
from firebase_admin import firestore
import os
from datetime import datetime

main = Blueprint('main', __name__)
db = firestore.client()

@main.route('/api/process-form', methods=['POST'])
def process_form():
    try:
        data = request.json
        form_data = data.get('formData', {})
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400

        # Get user's knowledge base
        user_doc = db.collection('users').document(user_id)
        user_data = user_doc.get().to_dict()
        knowledge_base = user_data.get('knowledge_base', {})

        answers = {}
        unknown_questions = []

        # Process each question
        for question in form_data.get('questions', []):
            field_id = question.get('fieldId')
            question_text = question.get('question')

            # Check knowledge base first
            if question_text in knowledge_base:
                answers[field_id] = knowledge_base[question_text]
            else:
                unknown_questions.append({
                    'fieldId': field_id,
                    'question': question_text
                })

        # Use AI for unknown questions if enabled
        if unknown_questions and data.get('useAI', True):
            ai_answers = generate_ai_answers(unknown_questions, user_data)
            answers.update(ai_answers)

        return jsonify(answers)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/api/log-submission', methods=['POST'])
def log_submission():
    try:
        data = request.json
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400

        # Add timestamp
        data['timestamp'] = datetime.utcnow()

        # Log to Firestore
        db.collection('submissions').add(data)

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_ai_answers(questions, user_data):
    try:
        # Gemini API integration should be added here if needed
        # For now, just return empty answers for unknown questions
        answers = {}
        for question in questions:
            answers[question['fieldId']] = "[Gemini answer placeholder]"
        return answers
    except Exception as e:
        print(f"Error generating AI answers: {str(e)}")
        return {}

@main.route('/api/config/firebase')
def get_firebase_config():
    return jsonify({
        'apiKey': os.getenv('FIREBASE_API_KEY'),
        'authDomain': os.getenv('FIREBASE_AUTH_DOMAIN'),
        'projectId': os.getenv('FIREBASE_PROJECT_ID'),
        'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET'),
        'messagingSenderId': os.getenv('FIREBASE_MESSAGING_SENDER_ID'),
        'appId': os.getenv('FIREBASE_APP_ID')
    }) 