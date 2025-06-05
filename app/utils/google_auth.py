from flask import session, redirect, url_for, request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
import os
import json
from jose import jwt

import os

scopes = os.getenv('GOOGLE_OAUTH_SCOPES', '').split()

GOOGLE_CLIENT_CONFIG = {
    "web": {
        "client_id": os.getenv('GOOGLE_CLIENT_ID'),
        "client_secret": os.getenv('GOOGLE_CLIENT_SECRET'),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [os.getenv('GOOGLE_REDIRECT_URI')],
        "scopes": scopes
    }
}

def get_google_auth_url():
    """Generate Google OAuth URL"""
    flow = Flow.from_client_config(
        GOOGLE_CLIENT_CONFIG,
        scopes=GOOGLE_CLIENT_CONFIG['web']['scopes'],
        redirect_uri=GOOGLE_CLIENT_CONFIG['web']['redirect_uris'][0]
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    
    session['google_oauth_state'] = state
    return authorization_url

def handle_google_callback():
    """Handle Google OAuth callback"""
    flow = Flow.from_client_config(
        GOOGLE_CLIENT_CONFIG,
        scopes=GOOGLE_CLIENT_CONFIG['web']['scopes'],
        redirect_uri=GOOGLE_CLIENT_CONFIG['web']['redirect_uris'][0],
        state=session['google_oauth_state']
    )
    
    flow.fetch_token(
        authorization_response=request.url,
        include_granted_scopes=True
    )
    
    credentials = flow.credentials
    session['google_credentials'] = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }
    
    # Decode the JWT to get user info
    user_info = jwt.get_unverified_claims(credentials.id_token)
    user = User.query.filter_by(email=user_info['email']).first()
    
    return credentials

def get_google_credentials():
    """Get Google credentials from session"""
    if 'google_credentials' not in session:
        return None
    
    creds_dict = session['google_credentials']
    return Credentials(
        token=creds_dict['token'],
        refresh_token=creds_dict['refresh_token'],
        token_uri=creds_dict['token_uri'],
        client_id=creds_dict['client_id'],
        client_secret=creds_dict['client_secret'],
        scopes=creds_dict['scopes']
    ) 