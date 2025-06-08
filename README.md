# FormMate AI 🤖

Your Smart Assistant to Fill, Manage & Remember Forms — Like a Real Teammate.

## Overview

FormMate AI is an intelligent form-filling assistant that helps you automate the process of filling out Google Forms. It combines a personal knowledge base with AI-powered smart answers to make form filling effortless and accurate.

## Features

- 🧩 **Chrome Extension**
  - Automatically detects and activates on Google Forms
  - Parses form questions and field IDs
  - Smart autofill functionality
  - Optional preview before submission

- 🌐 **Web Dashboard**
  - User authentication with Firebase
  - Personal knowledge bank management
  - Form submission history
  - Answer preview functionality

- 🤖 **AI Integration**
  - Smart answer generation for unknown questions
  - Context-aware responses
  - Customizable AI behavior

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Flask (Python)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI Engine**: OpenAI GPT API
- **Extension**: Chrome Extension API
- **Hosting**: Vercel/Netlify (Frontend), Render/Railway (Backend)

## Project Structure

```
formmate-ai/
├── extension/           # Chrome extension files
├── backend/            # Flask backend
├── dashboard/          # Web dashboard
└── docs/              # Documentation
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- Chrome browser
- Firebase account
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shlokbam/formmate-ai.git
   cd formmate-ai
   ```

2. Set up the backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the dashboard:
   ```bash
   cd dashboard
   npm install
   ```

4. Load the Chrome extension:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` directory

### Environment Variables

Create a `.env` file in the backend directory with:

```
OPENAI_API_KEY=your_api_key
FIREBASE_CONFIG=your_firebase_config
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact


Project Link: [https://github.com/yourusername/formmate-ai](https://github.com/yourusername/formmate-ai) 