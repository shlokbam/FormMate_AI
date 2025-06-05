from flask import render_template, request, jsonify, flash, redirect, url_for
from flask_login import login_required, current_user
from . import main_bp
from app.models.form import FormSubmission, QAPair
from app.utils.form_parser import parse_google_form
from app.utils.ai_generator import generate_ai_response
from app import db

@main_bp.route('/')
def index():
    return render_template('main/index.html')

@main_bp.route('/dashboard')
@login_required
def dashboard():
    qa_pairs = QAPair.query.filter_by(user_id=current_user.id).all()
    recent_submissions = FormSubmission.query.filter_by(user_id=current_user.id).order_by(FormSubmission.submitted_at.desc()).limit(5).all()
    return render_template('main/dashboard.html', qa_pairs=qa_pairs, recent_submissions=recent_submissions)

@main_bp.route('/process-form', methods=['POST'])
@login_required
def process_form():
    form_url = request.json.get('form_url')
    if not form_url:
        return jsonify({'error': 'No form URL provided'}), 400
    
    try:
        # Parse the Google Form
        form_data = parse_google_form(form_url)
        
        # Match with user's saved answers
        matched_answers = current_user.match_answers(form_data['questions'])
        
        # Generate AI responses for unmatched questions
        for question in form_data['questions']:
            if question['id'] not in matched_answers:
                matched_answers[question['id']] = generate_ai_response(question['text'])
        
        return jsonify({
            'success': True,
            'form_data': form_data,
            'answers': matched_answers
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main_bp.route('/save-qa', methods=['POST'])
@login_required
def save_qa():
    question = request.json.get('question')
    answer = request.json.get('answer')
    
    if not question or not answer:
        return jsonify({'error': 'Question and answer are required'}), 400
    
    qa_pair = QAPair(
        user_id=current_user.id,
        question=question,
        answer=answer
    )
    
    db.session.add(qa_pair)
    db.session.commit()
    
    return jsonify({'success': True, 'id': qa_pair.id})

@main_bp.route('/save-submission', methods=['POST'])
@login_required
def save_submission():
    data = request.json
    submission = FormSubmission(
        user_id=current_user.id,
        form_url=data['form_url'],
        questions=data['questions'],
        answers=data['answers']
    )
    
    db.session.add(submission)
    db.session.commit()
    
    return jsonify({'success': True, 'id': submission.id})

@main_bp.route('/submissions')
@login_required
def submissions():
    submissions = FormSubmission.query.filter_by(user_id=current_user.id).order_by(FormSubmission.submitted_at.desc()).all()
    return render_template('main/submissions.html', submissions=submissions) 

from flask import session
import secrets
from app.routes.main import main_bp

@main_bp.route('/test-session')
def test_session():
    if 'test_state' not in session:
        session['test_state'] = secrets.token_urlsafe(16)
        return f"Set state: {session['test_state']}"
    else:
        return f"Session state: {session['test_state']}"