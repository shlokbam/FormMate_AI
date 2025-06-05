import openai
from flask import current_app

def generate_ai_response(question):
    """
    Generate an AI response for a given question using OpenAI's GPT
    """
    try:
        openai.api_key = current_app.config['OPENAI_API_KEY']
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates concise, professional responses to form questions."},
                {"role": "user", "content": f"Please provide a brief, professional response to this form question: {question}"}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        raise Exception(f"Error generating AI response: {str(e)}") 