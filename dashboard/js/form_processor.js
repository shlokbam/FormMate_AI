import { getFirebaseServices } from './firebase.js';

// Form Processor logic
// Ensure db is imported from firebase.js
import { getFirebaseServices as getFS } from './firebase.js';

let db;
document.addEventListener('DOMContentLoaded', async () => {
    const { auth: authInstance, db: dbInstance } = await getFS();
    db = dbInstance;
    const form = document.getElementById('formProcessor');
    const questionsInput = document.getElementById('questions');
    const answersContainer = document.getElementById('answers');
    const loadingIndicator = document.getElementById('loading');

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get current user
        const user = authInstance.currentUser;
        if (!user) {
            alert('You must be logged in.');
            return;
        }

        const questions = questionsInput.value.split('\n').filter(q => q.trim()).map(q => ({ question: q.trim() }));
        if (questions.length === 0) {
            alert('Please enter at least one question');
            return;
        }

        // Show loading indicator
        loadingIndicator.style.display = 'block';
        answersContainer.innerHTML = '';

        try {
            // Get user's knowledge base (optional, not sent to backend anymore)
            // const knowledgeBaseDoc = await db.collection('users').doc(user.uid).collection('knowledge_base').get();
            // const knowledgeBase = {};
            // knowledgeBaseDoc.forEach(doc => {
            //     const data = doc.data();
            //     knowledgeBase[data.question] = data.answer;
            // });

            // Process questions
            const payload = {
                uid: user.uid,
                questions: questions
            };
            console.log('Sending payload:', payload);

            const response = await fetch('/api/process-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            console.log('Received response:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Display answers (data is a list)
            (Array.isArray(data) ? data : data.answers).forEach(item => {
                const answerDiv = document.createElement('div');
                answerDiv.className = 'answer-item';
                answerDiv.innerHTML = `
                    <h3>${item.question}</h3>
                    <p>${item.answer}</p>
                    <span class="source-badge">${item.source}</span>
                `;
                answersContainer.appendChild(answerDiv);
            });

            // Save to history
            await db.collection('users').doc(user.uid).collection('history').add({
                questions: questions,
                answers: Array.isArray(data) ? data : data.answers,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Error:', error);
            alert('Error processing questions: ' + error.message);
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });

    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await authInstance.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });
});

// TODO: Integrate with backend to preview answers using AI 