from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os
import openai
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
print("\n")

app = Flask(__name__, static_folder='../dashboard')
CORS(app)

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Initialize Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-pro')

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
    # Lowercase, remove special characters, normalize whitespace
    text = text.lower()
    text = re.sub(r'[^a-z0-9 ]+', '', text)  # keep only alphanumerics and spaces
    text = ' '.join(text.split())
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

            # Use the user's UID in the Firestore path
            try:
                qa_ref = db.collection('users').document(uid).collection('knowledge_base')
                qa_docs = qa_ref.get()
                found_match = False
                for doc in qa_docs:
                    qa_data = doc.to_dict()
                    stored_question = normalize_question(qa_data.get('question', ''))
                    if stored_question == normalized_question:
                        print(f"Found matching Q&A in database: {qa_data}")
                        answers.append({
                            'question': question,
                            'answer': qa_data.get('answer', ''),
                            'source': 'database'
                        })
                        found_match = True
                        break
                if found_match:
                    continue
                else:
                    print(f"No matching Q&A found in database for: {question}")
            except Exception as e:
                print(f"Error checking Firestore for question '{question}': {str(e)}")
                # Continue to AI processing if database check fails

            # If no match found or error occurred, use AI
            try:
                print(f"Using AI to generate answer for: {question}")
                openai_response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": f"You are a helpful assistant. Answer the following question in a concise way. Question type: {question_data.get('type', 'text')}"},
                        {"role": "user", "content": question}
                    ],
                    max_tokens=150
                )
                answer = openai_response.choices[0].message.content.strip()
            except Exception as e:
                print(f"OpenAI error for question '{question}': {str(e)}")
                try:
                    gemini_response = model.generate_content(
                        f"Answer this question concisely: {question}"
                    )
                    answer = gemini_response.text.strip()
                except Exception as e:
                    print(f"Gemini error for question '{question}': {str(e)}")
                    answer = "Sorry, I couldn't generate an answer at this time."

            answers.append({
                'question': question,
                'answer': answer,
                'source': 'ai'
            })

        return jsonify(answers)

    except Exception as e:
        print(f"Error processing form: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 