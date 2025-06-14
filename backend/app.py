from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai
from datetime import datetime
from firebase_admin import credentials, initialize_app, firestore
import json
import re

# Load environment variables
load_dotenv()

# Debug: Print all environment variables
print("\nEnvironment Variables:")
print("FIREBASE_PROJECT_ID:", os.getenv('FIREBASE_PROJECT_ID'))
print("FIREBASE_PRIVATE_KEY_ID:", os.getenv('FIREBASE_PRIVATE_KEY_ID'))
print("FIREBASE_PRIVATE_KEY:", "Present" if os.getenv('FIREBASE_PRIVATE_KEY') else "Missing")
print("FIREBASE_CLIENT_EMAIL:", os.getenv('FIREBASE_CLIENT_EMAIL'))
print("FIREBASE_CLIENT_ID:", os.getenv('FIREBASE_CLIENT_ID'))
print("FIREBASE_CLIENT_CERT_URL:", os.getenv('FIREBASE_CLIENT_CERT_URL'))
print("GEMINI_API_KEY:", "Present" if os.getenv('GEMINI_API_KEY') else "Missing")
print("\n")

app = Flask(__name__, static_folder='../dashboard')
CORS(app)

# Initialize Gemini
gemini_api_key = os.getenv('GEMINI_API_KEY')
if not gemini_api_key:
    print("Warning: GEMINI_API_KEY is not set")
else:
    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel('gemini-1.5-pro-002')
    print("Gemini API key initialized")

# Initialize Firebase
try:
    print("Loading Firebase credentials...")
    
    # Get the private key and handle it safely
    private_key = os.getenv('FIREBASE_PRIVATE_KEY')
    if not private_key:
        raise ValueError("FIREBASE_PRIVATE_KEY is not set in environment variables")
    
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": os.getenv('FIREBASE_PROJECT_ID'),
        "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
        "private_key": private_key.replace('\\n', '\n'),
        "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
        "client_id": os.getenv('FIREBASE_CLIENT_ID'),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": os.getenv('FIREBASE_CLIENT_CERT_URL')
    })
    
    print("Initializing Firebase app...")
    initialize_app(cred)
    db = firestore.client()
    print("Firebase initialized successfully!")
except Exception as e:
    print(f"Error initializing Firebase: {str(e)}")
    raise e

# Serve dashboard files
@app.route('/')
def serve_dashboard():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# Serve frontend configuration
@app.route('/api/config')
def get_config():
    config = {
        'FIREBASE_API_KEY': os.getenv('FIREBASE_API_KEY'),
        'FIREBASE_AUTH_DOMAIN': os.getenv('FIREBASE_AUTH_DOMAIN'),
        'FIREBASE_PROJECT_ID': os.getenv('FIREBASE_PROJECT_ID'),
        'FIREBASE_STORAGE_BUCKET': os.getenv('FIREBASE_STORAGE_BUCKET'),
        'FIREBASE_MESSAGING_SENDER_ID': os.getenv('FIREBASE_MESSAGING_SENDER_ID'),
        'FIREBASE_APP_ID': os.getenv('FIREBASE_APP_ID')
    }
    return jsonify(config)

def normalize_question(text):
    if not text:
        return ''
    
    # Remove asterisks and other special characters first
    text = text.replace('*', '').strip()
    
    # Convert to lowercase and remove remaining special characters
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s]+', '', text)  # keep only alphanumerics and spaces
    
    # Common variations mapping
    variations = {
        'contact number': ['phone number', 'mobile number', 'cell number', 'telephone number', 'contact', 'phone', 'mobile', 'telephone'],
        'name': ['full name', 'complete name', 'your name', 'fullname', 'first name', 'last name', 'given name', 'surname'],
        'email': ['email address', 'e mail', 'e-mail', 'mail id', 'mail address'],
        'location': ['current location', 'where are you', 'your location', 'present location', 'current place', 'where do you live', 'residence', 'address', 'city', 'state', 'country'],
        'hometown': ['home town', 'native place', 'place of origin', 'where are you from', 'birth place', 'native city', 'birth city', 'birth town'],
        'role': ['role applied for', 'position', 'job role', 'applied position', 'desired role', 'job title', 'applying for', 'job position'],
        'prn': ['permanent registration number', 'registration number', 'student id', 'roll number', 'enrollment number'],
        'cpi': ['cumulative performance index', 'cgpa', 'grade point average', 'academic performance', 'performance index'],
        'branch': ['department', 'course', 'stream', 'field of study', 'major', 'specialization']
    }

    # First try exact match
    for standard, alts in variations.items():
        if text == standard or text in alts:
            return standard

    # Then try partial match
    for standard, alts in variations.items():
        if any(alt in text for alt in [standard] + alts):
            return standard

    # Special cases for common fields
    if 'name' in text:
        return 'name'
    if any(word in text for word in ['location', 'where', 'place', 'address', 'city', 'state', 'country']):
        return 'location'
    if any(word in text for word in ['home', 'town', 'native', 'birth']):
        return 'hometown'
    if any(word in text for word in ['role', 'position', 'job', 'applying']):
        return 'role'
    if any(word in text for word in ['phone', 'contact', 'mobile', 'telephone']):
        return 'contact number'
    if any(word in text for word in ['email', 'mail']):
        return 'email'
    if any(word in text for word in ['prn', 'registration', 'roll', 'enrollment']):
        return 'prn'
    if any(word in text for word in ['cpi', 'cgpa', 'grade', 'performance']):
        return 'cpi'
    if any(word in text for word in ['branch', 'department', 'course', 'stream']):
        return 'branch'

    return text

@app.route('/api/process-form', methods=['POST'])
def process_form():
    try:
        data = request.get_json()
        uid = data.get('uid')
        if not uid:
            return jsonify({'error': 'No user ID provided'}), 400
        if not data or 'questions' not in data:
            return jsonify({'error': 'No questions provided'}), 400

        questions = data['questions']
        if not isinstance(questions, list):
            return jsonify({'error': 'Questions must be a list'}), 400

        answers = []
        
        for question_data in questions:
            question = question_data.get('question', '').strip()
            if not question:
                continue

            print(f"\nProcessing question: {question}")

            normalized_question = normalize_question(question)
            print(f"Normalized question: {normalized_question}")

            # Use the user's UID in the Firestore path
            try:
                qa_ref = db.collection('users').document(uid).collection('knowledge_base')
                qa_docs = qa_ref.get()
                found_match = False
                for doc in qa_docs:
                    qa_data = doc.to_dict()
                    stored_question = normalize_question(qa_data.get('question', ''))
                    print(f"Comparing with stored question: {stored_question}")
                    if stored_question == normalized_question:
                        print(f"Found matching Q&A in database: {qa_data}")
                        answers.append({
                            'question': question,
                            'answer': qa_data.get('answer', ''),
                            'source': 'database'
                        })
                        found_match = True
                        break
                if not found_match:
                    print(f"No matching Q&A found in database for: {question}")
                    answers.append({
                        'question': question,
                        'answer': '',
                        'source': 'database',
                        'error': 'No answer found in knowledge base. Please add this question to your knowledge base.'
                    })
            except Exception as e:
                print(f"Error checking Firestore for question '{question}': {str(e)}")
                answers.append({
                    'question': question,
                    'answer': '',
                    'source': 'database',
                    'error': f'Error accessing knowledge base: {str(e)}'
                })

        return jsonify(answers)

    except Exception as e:
        print(f"Error processing form: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 