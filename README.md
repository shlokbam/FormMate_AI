# FormMate AI - Chrome Extension

FormMate AI is a Chrome extension that helps you automatically fill out Google Forms using your personal knowledge base. It uses AI to match form questions with your stored answers and provides a user-friendly interface to manage your Q&A pairs.

## Features

- **Automatic Form Filling**: Automatically fills Google Forms using your stored Q&A pairs
- **Smart Question Matching**: Uses advanced text matching to find the best answers for form questions
- **Q&A Management**: Easy-to-use interface to add, edit, and delete your Q&A pairs
- **Secure Authentication**: Firebase Authentication for secure user management
- **Profile Management**: Change password and manage your account settings

## Extension & Legal

- **Extension on Chrome Web Store**: [FormMate AI - Chrome Extension](https://chromewebstore.google.com/detail/pdkfcjpmfhoecmipgadlagbmammoocll?utm_source=item-share-cb)  
- **Privacy Policy**: [Read our Privacy Policy](https://shlokbam.github.io/FormMate_AI-Privacy-Policy/)
- **Deployed Backend**: [Backend](backend-deploy-psi.vercel.app)

## Project Structure

```
FormMate_AI/
├── backend/
│   ├── app.py           # Main backend application with all routes
│   ├── requirements.txt # Python dependencies
│   └── .env            # Environment variables
├── extension/
│   ├── manifest.json   # Extension configuration
│   ├── popup.html      # Extension popup UI
│   ├── popup.js        # Extension popup logic
│   ├── content.js      # Form filling logic
│   ├── background.js   # Background tasks
│   └── icons/          # Extension icons
└── README.md           # Project documentation
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with the following variables:
   ```
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY_ID=your_private_key_id
   FIREBASE_PRIVATE_KEY=your_private_key
   FIREBASE_CLIENT_EMAIL=your_client_email
   FIREBASE_CLIENT_ID=your_client_id
   FIREBASE_CLIENT_CERT_URL=your_client_cert_url
   GEMINI_API_KEY=your_gemini_api_key
   JWT_SECRET=your_jwt_secret
   ```

5. Start the backend server:
   ```bash
   python app.py
   ```

### Extension Setup

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `extension` directory
4. The FormMate AI extension should now be installed

## Usage

1. **Login/Register**:
   - Click the extension icon
   - Create an account or log in with existing credentials

2. **Manage Q&A Pairs**:
   - Go to the "Q&A Manager" tab
   - Add new Q&A pairs using the form
   - Edit or delete existing pairs
   - Search through your Q&A pairs

3. **Fill Forms**:
   - Navigate to any Google Form
   - Click the extension icon
   - Click "Fill Form" to automatically fill the form using your stored answers

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `GET /api/validate-token` - Validate JWT token

### Q&A Management
- `GET /api/qa` - Get all Q&A items
- `POST /api/qa` - Add new Q&A item
- `PUT /api/qa/<qa_id>` - Update Q&A item
- `DELETE /api/qa/<qa_id>` - Delete Q&A item

### Form Processing
- `POST /api/process-form` - Process form questions and return answers

### Profile Management
- `POST /api/change-password` - Change user password

## Technologies Used

- **Frontend**:
  - HTML/CSS/JavaScript
  - Chrome Extension APIs
  - Firebase Authentication

- **Backend**:
  - Python/Flask
  - Firebase Admin SDK
  - JWT Authentication
  - Google Gemini AI

## Security Features

- JWT-based authentication
- Secure password storage with Firebase Auth
- CORS protection
- Environment variable configuration
- Token validation middleware

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
