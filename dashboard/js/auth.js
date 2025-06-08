// import { getFirebaseServices } from './firebase.js';
// Remove ES module import for firebase/auth
// Use firebase.auth() from the global firebase object provided by the CDN
// import { 
//     doc, 
//     setDoc, 
//     serverTimestamp 
// } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth script loaded');
    // Use global firebase.auth() from CDN
    console.log('Firebase services ready');
    
    // Optionally listen for auth state changes (not required for login/register page)
    // firebase.auth().onAuthStateChanged((user) => {
    //     // You can add logic here if you want to redirect logged-in users
    // });

    // Get new form elements by ID
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const registerEmail = document.getElementById('register-email');
    const registerPassword = document.getElementById('register-password');
    const registerConfirm = document.getElementById('register-confirm');
    const errorDiv = document.getElementById('auth-error');

    if (!loginForm || !registerForm || !loginEmail || !loginPassword || !registerEmail || !registerPassword || !registerConfirm) {
        console.error('Required form elements not found');
        return;
    }

    // Login handler
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        errorDiv.textContent = '';
        const email = loginEmail.value.trim();
        const password = loginPassword.value;
        if (!email || !password) {
            errorDiv.textContent = 'Please enter both email and password.';
            return;
        }
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(() => {
                window.location.href = 'dashboard.html';
            })
            .catch((err) => {
                errorDiv.textContent = err.message;
            });
    });

    // Register handler
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        errorDiv.textContent = '';
        const email = registerEmail.value.trim();
        const password = registerPassword.value;
        const confirm = registerConfirm.value;
        if (!email || !password || !confirm) {
            errorDiv.textContent = 'Please fill in all fields.';
            return;
        }
        if (password !== confirm) {
            errorDiv.textContent = 'Passwords do not match.';
            return;
        }
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters.';
            return;
        }
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(() => {
                window.location.href = 'dashboard.html';
            })
            .catch((err) => {
                errorDiv.textContent = err.message;
            });
    });
});

// Placeholder for Firebase Auth logic
// TODO: Integrate Firebase Auth for login/register 