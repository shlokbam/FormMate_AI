document.addEventListener('DOMContentLoaded', () => {
    console.log('Q&A Manager script loaded');
    
    // Use global firebase object
    const auth = firebase.auth();
    const db = firebase.firestore();

    const qaForm = document.getElementById('qaForm');
    const qaList = document.getElementById('qaList');
    const logoutBtn = document.getElementById('logoutBtn');

    // Check authentication state
    auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');
        if (user) {
            // User is signed in
            loadQAPairs();
        } else {
            // User is signed out
            window.location.href = 'index.html';
        }
    });

    // Load Q&A pairs
    function loadQAPairs() {
        try {
            const user = auth.currentUser;
            if (!user) {
                console.error('No user logged in');
                return;
            }

            console.log('Loading Q&A pairs for user:', user.uid);
            db.collection('users').doc(user.uid).collection('knowledge_base').get()
                .then(snapshot => {
                    qaList.innerHTML = '';
                    
                    if (snapshot.empty) {
                        qaList.innerHTML = '<p class="no-data">No Q&A pairs found. Add your first pair!</p>';
                        return;
                    }

                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const qaItem = document.createElement('div');
                        qaItem.className = 'qa-item';
                        qaItem.innerHTML = `
                            <div class="qa-content">
                                <h3>${data.question}</h3>
                                <p>${data.answer}</p>
                            </div>
                            <div class="qa-actions">
                                <button onclick="editQA('${doc.id}')" class="btn-edit">Edit</button>
                                <button onclick="deleteQA('${doc.id}')" class="btn-delete">Delete</button>
                            </div>
                        `;
                        qaList.appendChild(qaItem);
                    });
                });
        } catch (error) {
            console.error('Error loading Q&A pairs:', error);
            qaList.innerHTML = '<p class="error">Error loading Q&A pairs. Please try again.</p>';
        }
    }

    // Add new Q&A pair
    qaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const question = document.getElementById('question').value.trim();
        const answer = document.getElementById('answer').value.trim();
        
        if (!question || !answer) {
            alert('Please fill in both question and answer');
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('No user logged in');
            }

            console.log('Adding Q&A pair for user:', user.uid);
            db.collection('users').doc(user.uid).collection('knowledge_base').add({
                question,
                answer,
                createdAt: new Date()
            });

            // Clear form
            qaForm.reset();
            
            // Reload Q&A pairs
            loadQAPairs();
        } catch (error) {
            console.error('Error adding Q&A pair:', error);
            alert('Error adding Q&A pair. Please try again.');
        }
    });

    // Edit Q&A pair
    window.editQA = async (qaId) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('No user logged in');
            }

            const qaDoc = db.collection('users').doc(user.uid).collection('knowledge_base').doc(qaId);
            const newQuestion = prompt('Enter new question:');
            const newAnswer = prompt('Enter new answer:');

            if (newQuestion && newAnswer) {
                await qaDoc.update({
                    question: newQuestion,
                    answer: newAnswer,
                    updatedAt: new Date()
                });
                loadQAPairs();
            }
        } catch (error) {
            console.error('Error editing Q&A pair:', error);
            alert('Error editing Q&A pair. Please try again.');
        }
    };

    // Delete Q&A pair
    window.deleteQA = async (qaId) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('No user logged in');
            }

            if (confirm('Are you sure you want to delete this Q&A pair?')) {
                await db.collection('users').doc(user.uid).collection('knowledge_base').doc(qaId).delete();
                loadQAPairs();
            }
        } catch (error) {
            console.error('Error deleting Q&A pair:', error);
            alert('Error deleting Q&A pair. Please try again.');
        }
    };

    // Handle logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });
});

// TODO: Integrate with Firestore for CRUD Q&A pairs 