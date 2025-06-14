// Import Firebase initialization promise
import { firebaseInitPromise } from './config.js';

// Initialize Firebase
async function initializeAuth() {
    try {
        console.log('Initializing auth...');
        // Wait for Firebase to be initialized
        await firebaseInitPromise;
        console.log('Firebase initialized for auth');
        
        // DOM Elements
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const loginError = document.getElementById('loginError');
        const registerError = document.getElementById('registerError');
        const authTabs = document.querySelectorAll('.auth-tab');

        if (!loginForm || !registerForm || !loginError || !registerError || !authTabs.length) {
            throw new Error('Required DOM elements not found');
        }

        console.log('DOM elements found, setting up event listeners...');

        // Tab Switching
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                console.log('Tab clicked:', tab.dataset.tab);
                // Remove active class from all tabs and forms
                authTabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding form
                tab.classList.add('active');
                document.getElementById(`${tab.dataset.tab}Form`).classList.add('active');
                
                // Clear error messages
                loginError.textContent = '';
                registerError.textContent = '';
            });
        });

        // Login Form Handler
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Login form submitted');
            loginError.textContent = '';
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                loginError.textContent = 'Please fill in all fields';
                return;
            }
            
            try {
                console.log('Attempting to sign in...');
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                console.log('Sign in successful:', user.email);
                
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify({
                    uid: user.uid,
                    email: user.email
                }));
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Login error:', error);
                loginError.textContent = getErrorMessage(error.code);
            }
        });

        // Register Form Handler
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Register form submitted');
            registerError.textContent = '';
            
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!email || !password || !confirmPassword) {
                registerError.textContent = 'Please fill in all fields';
                return;
            }
            
            // Check if passwords match
            if (password !== confirmPassword) {
                registerError.textContent = 'Passwords do not match';
                return;
            }
            
            try {
                console.log('Attempting to create user...');
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                console.log('User created successfully:', user.email);
                
                // Create user document in Firestore
                const db = firebase.firestore();
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    qaPairs: 0,
                    formsProcessed: 0,
                    successfulSubmissions: 0
                });
                console.log('User document created in Firestore');
                
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify({
                    uid: user.uid,
                    email: user.email
                }));
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Registration error:', error);
                registerError.textContent = getErrorMessage(error.code);
            }
        });

        // Check if user is already logged in
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('User already logged in:', user.email);
                // Only redirect if we're on the login page
                if (window.location.pathname.endsWith('login.html')) {
                    window.location.href = 'dashboard.html';
                }
            } else {
                console.log('No user logged in');
                // Clear any stored user data
                localStorage.removeItem('user');
            }
        });

        console.log('Auth initialization complete');
    } catch (error) {
        console.error('Auth initialization error:', error);
        // Show error to user
        const errorElement = document.createElement('div');
        errorElement.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ef4444; color: white; padding: 1rem; text-align: center; z-index: 9999;';
        errorElement.textContent = 'Error initializing authentication. Please refresh the page.';
        document.body.appendChild(errorElement);
    }
}

// Helper function to get user-friendly error messages
function getErrorMessage(errorCode) {
    console.log('Getting error message for code:', errorCode);
    switch (errorCode) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid email or password';
        case 'auth/email-already-in-use':
            return 'Email is already registered';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        default:
            console.error('Unknown error code:', errorCode);
            return 'An error occurred. Please try again.';
    }
}

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth...');
    initializeAuth();
}); 