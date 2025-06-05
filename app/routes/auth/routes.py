from flask import render_template, redirect, url_for, flash, request, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User
from app import db
from app.routes.auth import auth_bp
from app.utils.google_auth import get_google_auth_url, handle_google_callback
from jose import jwt
from app.models.user import User

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = request.form.get('remember', False)
        
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password, password):
            login_user(user, remember=remember)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('main.dashboard'))
        
        flash('Invalid email or password', 'error')
    
    return render_template('auth/login.html')

@auth_bp.route('/google-login')
def google_login():
    """Initiate Google OAuth login"""
    auth_url = get_google_auth_url()
    return redirect(auth_url)

@auth_bp.route('/google-callback')
def google_callback():
    # Debug prints
    print("Session google_oauth_state:", session.get('google_oauth_state'))
    print("Request state:", request.args.get('state'))
    if 'google_oauth_state' not in session:
        flash('Session expired or invalid. Please try logging in again.', 'error')
        return redirect(url_for('auth.login'))
    """Handle Google OAuth callback"""
    try:
        credentials = handle_google_callback()
        # Decode the JWT to get user info
        user_info = jwt.get_unverified_claims(credentials.id_token)
        
        # Check if user exists
        user = User.query.filter_by(email=user_info['email']).first()
        
        if not user:
            # Create new user
            user = User(
                name=user_info.get('name', ''),
                email=user_info['email'],
                password=generate_password_hash('google-oauth')  # Set a random password
            )
            db.session.add(user)
            db.session.commit()
        
        # Log in the user
        login_user(user)
        return redirect(url_for('main.dashboard'))
        
    except Exception as e:
        flash(f'Error during Google authentication: {str(e)}', 'error')
        return redirect(url_for('auth.login'))

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return render_template('auth/register.html')
        
        # Use pbkdf2_sha256 method for password hashing
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        
        user = User(
            name=name,
            email=email,
            password=hashed_password
        )
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/register.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    # Clear Google credentials from session
    session.pop('google_credentials', None)
    return redirect(url_for('main.index')) 