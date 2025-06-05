# FormMate AI

FormMate AI is a smart assistant that helps you fill out Google Forms by leveraging your personal knowledge bank and AI-powered responses.

## Features

- **Personal Knowledge Bank**: Store and manage your frequently used answers
- **AI-Powered Responses**: Get intelligent suggestions for form responses
- **Submission History**: Track your form submissions and responses
- **Preview & Control**: Review and edit responses before submission

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/FormMate_AI.git
cd FormMate_AI
```

2. Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
FLASK_APP=app
FLASK_ENV=development
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-api-key
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
```

5. Initialize the database:
```bash
flask db init
flask db migrate
flask db upgrade
```

6. Run the application:
```bash
flask run
```

## Project Structure

```
FormMate_AI/
├── app/
│   ├── __init__.py
│   ├── models/
│   ├── routes/
│   ├── static/
│   ├── templates/
│   └── utils/
├── venv/
├── .env
├── .gitignore
├── README.md
└── requirements.txt
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - your.email@example.com
Project Link: https://github.com/yourusername/FormMate_AI 