import requests
from bs4 import BeautifulSoup
import re
from flask import session
import json

def parse_google_form(form_url):
    """
    Parse a Google Form and extract questions
    """
    try:
        # Add headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        # Make sure we're using the correct form URL format
        if '?usp=send_form' in form_url:
            form_url = form_url.replace('?usp=send_form', '')
        
        # First try to get the form without authentication
        response = requests.get(form_url, headers=headers)
        
        # If we get a 401 or 403, the form requires authentication
        if response.status_code in [401, 403]:
            # Check if we have stored credentials
            if 'google_credentials' in session:
                headers['Authorization'] = f"Bearer {session['google_credentials']}"
                response = requests.get(form_url, headers=headers)
                response.raise_for_status()
            else:
                raise Exception("This form requires authentication. Please make sure you're logged in with your university account.")
        
        soup = BeautifulSoup(response.text, 'html.parser')
        questions = []
        
        # Find all form questions
        question_elements = soup.find_all('div', class_='freebirdFormviewerViewItemsItemItem')
        
        if not question_elements:
            # Try alternative class names
            question_elements = soup.find_all('div', class_='freebirdFormviewerViewItemsItemItemContainer')
        
        for idx, element in enumerate(question_elements):
            question_text = element.find('div', class_='freebirdFormviewerViewItemsItemItemTitle')
            if not question_text:
                question_text = element.find('div', class_='freebirdFormviewerViewItemsItemItemHeader')
            
            if question_text:
                questions.append({
                    'id': f'q_{idx}',
                    'text': question_text.text.strip(),
                    'type': determine_question_type(element)
                })
        
        if not questions:
            raise Exception("No questions found in the form. The form might be private or require authentication.")
        
        title_element = soup.find('div', class_='freebirdFormviewerViewHeaderTitle')
        if not title_element:
            title_element = soup.find('h1')
        
        form_title = title_element.text.strip() if title_element else "Untitled Form"
        
        return {
            'title': form_title,
            'questions': questions
        }
    
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            raise Exception("This form requires authentication. Please make sure you're logged in with your university account.")
        elif e.response.status_code == 403:
            raise Exception("Access to this form is forbidden. Please make sure you have the necessary permissions.")
        else:
            raise Exception(f"Error accessing form: {str(e)}")
    except Exception as e:
        raise Exception(f"Error parsing form: {str(e)}")

def determine_question_type(element):
    """
    Determine the type of question (text, multiple choice, etc.)
    """
    if element.find('div', class_='freebirdFormviewerViewItemsTextTextItem'):
        return 'text'
    elif element.find('div', class_='freebirdFormviewerViewItemsRadioRadioGroup'):
        return 'multiple_choice'
    elif element.find('div', class_='freebirdFormviewerViewItemsCheckboxCheckboxGroup'):
        return 'checkbox'
    elif element.find('div', class_='freebirdFormviewerViewItemsDateDateInputs'):
        return 'date'
    elif element.find('div', class_='freebirdFormviewerViewItemsTimeTimeInputs'):
        return 'time'
    else:
        return 'unknown' 