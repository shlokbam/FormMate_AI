// Import Firebase initialization promise
import { firebaseInitPromise } from './config.js';

// Wait for Firebase initialization
let firebaseInitialized = false;

// Initialize Firebase
async function initializeQA() {
    try {
        if (!firebaseInitialized) {
            console.log('Waiting for Firebase initialization...');
            await firebaseInitPromise;
            firebaseInitialized = true;
            console.log('Firebase initialized successfully');
        }
        
        // DOM Elements
        const qaList = document.getElementById('qaList');
        const addQaBtn = document.getElementById('addQaBtn');
        const searchQa = document.getElementById('searchQa');
        const qaModal = document.getElementById('qaModal');
        const modalTitle = document.getElementById('modalTitle');
        const closeModal = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const qaForm = document.getElementById('qaForm');
        const logoutBtn = document.getElementById('logoutBtn');

        let currentUserId = null;
        let editingQaId = null;

        // Check authentication state
        firebase.auth().onAuthStateChanged((user) => {
            if (!user) {
                console.log('No user logged in, redirecting to login page');
                window.location.href = 'login.html';
                return;
            }
            
            console.log('User logged in:', user.uid);
            currentUserId = user.uid;
            loadQaPairs();
        });

        // Load Q&A pairs
        async function loadQaPairs(searchTerm = '') {
            try {
                console.log('Loading Q&A pairs for user:', currentUserId);
                const db = firebase.firestore();
                let qaQuery = db
                    .collection('users')
                    .doc(currentUserId)
                    .collection('knowledge_base');
                
                // Get all documents first
                const qaSnapshot = await qaQuery.get();
                console.log('Query complete, documents found:', qaSnapshot.size);
                
                qaList.innerHTML = '';
                
                if (qaSnapshot.empty) {
                    console.log('No Q&A pairs found');
                    qaList.innerHTML = '<p class="no-qa">No Q&A pairs found</p>';
                    return;
                }
                
                // Convert to array and sort if search term exists
                let qaArray = [];
                qaSnapshot.forEach(doc => {
                    const qa = doc.data();
                    qaArray.push({ id: doc.id, ...qa });
                });

                if (searchTerm) {
                    console.log('Filtering for search term:', searchTerm);
                    qaArray = qaArray.filter(qa => 
                        qa.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        qa.answer.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }

                // Sort by question
                qaArray.sort((a, b) => a.question.localeCompare(b.question));
                
                // Display results
                qaArray.forEach(qa => {
                    console.log('Displaying Q&A:', qa);
                    const qaItem = createQaItem(qa.id, qa);
                    qaList.appendChild(qaItem);
                });
            } catch (error) {
                console.error('Error loading Q&A pairs:', error);
                qaList.innerHTML = `<p class="error">Error loading Q&A pairs: ${error.message}</p>`;
            }
        }

        // Create Q&A item element
        function createQaItem(id, qa) {
            const item = document.createElement('div');
            item.className = 'qa-item';
            
            const content = document.createElement('div');
            content.className = 'qa-content';
            
            const question = document.createElement('h4');
            question.textContent = qa.question;
            
            const answer = document.createElement('p');
            answer.textContent = qa.answer;
            
            content.appendChild(question);
            content.appendChild(answer);
            
            const actions = document.createElement('div');
            actions.className = 'qa-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-secondary';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.onclick = () => editQaPair(id, qa);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = () => deleteQaPair(id);
            
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            
            item.appendChild(content);
            item.appendChild(actions);
            
            return item;
        }

        // Add new Q&A pair
        addQaBtn.addEventListener('click', () => {
            editingQaId = null;
            modalTitle.textContent = 'Add Q&A Pair';
            qaForm.reset();
            qaModal.style.display = 'block';
        });

        // Close modal
        function closeQaModal() {
            qaModal.style.display = 'none';
            qaForm.reset();
            editingQaId = null;
        }

        closeModal.addEventListener('click', closeQaModal);
        cancelBtn.addEventListener('click', closeQaModal);

        // Handle form submission
        qaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const question = document.getElementById('question').value;
            const answer = document.getElementById('answer').value;
            
            try {
                const db = firebase.firestore();
                const qaData = {
                    question,
                    answer,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                if (editingQaId) {
                    // Update existing Q&A pair
                    await db
                        .collection('users')
                        .doc(currentUserId)
                        .collection('knowledge_base')
                        .doc(editingQaId)
                        .update(qaData);
                } else {
                    // Add new Q&A pair
                    await db
                        .collection('users')
                        .doc(currentUserId)
                        .collection('knowledge_base')
                        .add(qaData);
                }
                
                closeQaModal();
                loadQaPairs(searchQa.value);
            } catch (error) {
                console.error('Error saving Q&A pair:', error);
            }
        });

        // Edit Q&A pair
        function editQaPair(id, qa) {
            editingQaId = id;
            modalTitle.textContent = 'Edit Q&A Pair';
            
            document.getElementById('question').value = qa.question;
            document.getElementById('answer').value = qa.answer;
            
            qaModal.style.display = 'block';
        }

        // Delete Q&A pair
        async function deleteQaPair(id) {
            if (!confirm('Are you sure you want to delete this Q&A pair?')) {
                return;
            }
            
            try {
                const db = firebase.firestore();
                await db
                    .collection('users')
                    .doc(currentUserId)
                    .collection('knowledge_base')
                    .doc(id)
                    .delete();
                
                loadQaPairs(searchQa.value);
            } catch (error) {
                console.error('Error deleting Q&A pair:', error);
            }
        }

        // Search functionality
        searchQa.addEventListener('input', (e) => {
            loadQaPairs(e.target.value);
        });

        // Logout handler
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                await firebase.auth().signOut();
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    } catch (error) {
        console.error('Error initializing Q&A manager:', error);
    }
}

// Initialize when the script loads
initializeQA(); 